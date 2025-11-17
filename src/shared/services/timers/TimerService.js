/**
 * 统一计时器服务
 *
 * 功能:
 * - 支持三种计时器类型: task(主任务), questionnaire(问卷), notice(注意事项)
 * - 跨刷新恢复 (离线时间扣减)
 * - 一次性超时触发 (once-only, 并发保护)
 * - 本地持久化 (基于 storageKeys)
 * - pause/resume/reset API
 *
 * 使用示例:
 * ```js
 * import { TimerService } from '@shared/services/timers/TimerService';
 *
 * const timer = TimerService.getInstance('task');
 * timer.start(2400, () => {
 *   console.log('任务超时!');
 *   // 自动跳转逻辑
 * });
 *
 * // 获取剩余时间
 * const remaining = timer.getRemaining();
 *
 * // 暂停/恢复
 * timer.pause();
 * timer.resume();
 *
 * // 重置
 * timer.reset();
 * ```
 */

import STORAGE_KEYS, {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  isTimeoutScopeHandled,
  markTimeoutScopeHandled,
  clearTimeoutScope as clearTimeoutScopeFlag,
} from '../storage/storageKeys.js';

/**
 * 计时器类型配置
 */
const TIMER_TYPES = {
  task: {
    startKey: STORAGE_KEYS.TIMER_TASK_START,
    remainingKey: STORAGE_KEYS.TIMER_TASK_REMAINING,
    durationKey: STORAGE_KEYS.TIMER_TASK_DURATION,
    pausedKey: STORAGE_KEYS.TIMER_TASK_PAUSED,
    timeoutHandledKey: STORAGE_KEYS.TIMER_TASK_TIMEOUT_HANDLED,
    scopeKey: STORAGE_KEYS.TIMER_TASK_SCOPE,
    defaultScope: 'timer.task',
  },
  questionnaire: {
    startKey: STORAGE_KEYS.TIMER_QUESTIONNAIRE_START,
    remainingKey: STORAGE_KEYS.TIMER_QUESTIONNAIRE_REMAINING,
    durationKey: STORAGE_KEYS.TIMER_QUESTIONNAIRE_DURATION,
    pausedKey: STORAGE_KEYS.TIMER_QUESTIONNAIRE_PAUSED,
    timeoutHandledKey: STORAGE_KEYS.TIMER_QUESTIONNAIRE_TIMEOUT_HANDLED,
    scopeKey: STORAGE_KEYS.TIMER_QUESTIONNAIRE_SCOPE,
    defaultScope: 'timer.questionnaire',
  },
  notice: {
    startKey: STORAGE_KEYS.TIMER_NOTICE_START,
    remainingKey: STORAGE_KEYS.TIMER_NOTICE_REMAINING,
    durationKey: STORAGE_KEYS.TIMER_NOTICE_DURATION,
    pausedKey: STORAGE_KEYS.TIMER_NOTICE_PAUSED,
    timeoutHandledKey: STORAGE_KEYS.TIMER_NOTICE_TIMEOUT_HANDLED,
    scopeKey: STORAGE_KEYS.TIMER_NOTICE_SCOPE,
    defaultScope: 'timer.notice',
  },
};

/**
 * 单例计时器管理器
 */
class TimerManager {
  constructor(type) {
    if (!TIMER_TYPES[type]) {
      throw new Error(`Invalid timer type: ${type}. Must be one of: ${Object.keys(TIMER_TYPES).join(', ')}`);
    }

    this.type = type;
    this.config = TIMER_TYPES[type];

    this.intervalId = null;
    this.isRunning = false;
    this.callbacks = new Set();
    this.onTickCallbacks = new Set();
    this.scope = this._resolveScope(
      getStorageItem(this.config.scopeKey) || this.config.defaultScope
    );
    setStorageItem(this.config.scopeKey, this.scope);

    // 尝试从localStorage恢复
    this._restoreFromStorage();

    console.log(`[TimerService:${type}] 初始化完成`, {
      remaining: this.getRemaining(),
      isRunning: this.isRunning,
      startTime: this._getStartTime(),
      scope: this.scope,
    });
  }

  /**
   * 解析 Scope，确保非空并移除多余空白
   * @private
   * @param {string} scopeCandidate
   * @returns {string}
   */
  _resolveScope(scopeCandidate) {
    const fallback = this.config.defaultScope;
    if (!scopeCandidate) {
      return fallback;
    }
    const normalized = String(scopeCandidate).trim();
    if (!normalized) {
      return fallback;
    }
    return normalized.replace(/\s+/g, '-');
  }

  /**
   * 应用新的 Scope，并清理对应标记
   * @private
   * @param {string} scopeCandidate
   */
  _applyScope(scopeCandidate) {
    const nextScope = this._resolveScope(scopeCandidate);
    const previousScope = this.scope;

    if (previousScope && previousScope !== nextScope) {
      try {
        clearTimeoutScopeFlag(previousScope);
      } catch (err) {
        console.warn(`[TimerService:${this.type}] 清理旧 scope 标记失败`, err);
      }
    }

    this.scope = nextScope;
    setStorageItem(this.config.scopeKey, this.scope);

    try {
      clearTimeoutScopeFlag(this.scope);
    } catch (err) {
      console.warn(`[TimerService:${this.type}] 清理当前 scope 标记失败`, err);
    }

    removeStorageItem(this.config.timeoutHandledKey);
  }

  /**
   * 规范化 start 选项
   * @private
   * @param {Function|Object|null} options
   * @returns {{onTimeout: Function|null, force: boolean, scope: string|undefined}}
   */
  _normalizeStartOptions(options) {
    if (typeof options === 'function') {
      return {
        onTimeout: options,
        force: false,
        scope: undefined,
      };
    }

    if (options && typeof options === 'object') {
      return {
        onTimeout: options.onTimeout ?? null,
        force: Boolean(options.force),
        scope: options.scope,
      };
    }

    return {
      onTimeout: null,
      force: false,
      scope: undefined,
    };
  }

  /**
   * 从localStorage恢复计时器状态
   * @private
   */
  _restoreFromStorage() {
    this.scope = this._resolveScope(
      getStorageItem(this.config.scopeKey) || this.scope
    );

    const startTime = getStorageItem(this.config.startKey);
    const savedRemaining = getStorageItem(this.config.remainingKey);
    const duration = getStorageItem(this.config.durationKey);
    const paused = getStorageItem(this.config.pausedKey) === 'true';

    if (startTime && savedRemaining && duration) {
      const startTimestamp = parseInt(startTime, 10);
      const savedRemainingSeconds = parseInt(savedRemaining, 10);
      const durationSeconds = parseInt(duration, 10);

      if (!paused) {
        // 计算离线时间
        const now = Date.now();
        const elapsedSinceStart = Math.floor((now - startTimestamp) / 1000);
        const elapsedBeforePersist = durationSeconds - savedRemainingSeconds;
        const offlineElapsed = Math.max(0, elapsedSinceStart - Math.max(0, elapsedBeforePersist));
        const actualRemaining = Math.max(0, savedRemainingSeconds - offlineElapsed);

        console.log(`[TimerService:${this.type}] 恢复计时器状态`, {
          startTime: new Date(startTimestamp).toISOString(),
          savedRemaining: savedRemainingSeconds,
          elapsed: elapsedSinceStart,
          elapsedBeforePersist,
          offlineElapsed,
          actualRemaining,
        });

        // 更新剩余时间
        setStorageItem(this.config.remainingKey, String(actualRemaining), true);

        // 如果还有剩余时间，自动恢复运行
        if (actualRemaining > 0) {
          this._startTicking();
        } else {
          // 时间已耗尽，触发超时 (如果未处理过)
          this._handleTimeout();
        }
      } else {
        console.log(`[TimerService:${this.type}] 计时器处于暂停状态，remaining=${savedRemainingSeconds}`);
      }
    }
  }

  /**
   * 获取开始时间戳
   * @private
   * @returns {number | null}
   */
  _getStartTime() {
    const value = getStorageItem(this.config.startKey);
    return value ? parseInt(value, 10) : null;
  }

  /**
   * 开始计时器
   * @param {number} durationSeconds - 时长 (秒)
   * @param {Function|Object|null} onTimeoutOrOptions - 兼容旧签名: 可传回调函数或 { onTimeout, scope, force }
   * @param {boolean} forceFlag - 兼容旧签名的强制重启标记
   */
  start(durationSeconds, onTimeoutOrOptions = null, forceFlag = false) {
    const options = this._normalizeStartOptions(onTimeoutOrOptions);
    if (typeof onTimeoutOrOptions === 'function') {
      options.force = options.force || Boolean(forceFlag);
    }

    const onTimeout = options.onTimeout;
    const force = Boolean(options.force);
    const scopeCandidate =
      typeof options.scope === 'undefined'
        ? this.scope || this.config.defaultScope
        : options.scope;

    if (onTimeout) {
      this.callbacks.add(onTimeout);
    }

    if (this.isRunning && !force) {
      console.warn(`[TimerService:${this.type}] 计时器已在运行，忽略重复启动`);
      return;
    }

    this._applyScope(scopeCandidate);

    const now = Date.now();
    setStorageItem(this.config.startKey, String(now), true);
    setStorageItem(this.config.remainingKey, String(durationSeconds), true);
    setStorageItem(this.config.durationKey, String(durationSeconds), true);
    setStorageItem(this.config.pausedKey, 'false', true);

    console.log(`[TimerService:${this.type}] 启动计时器`, {
      duration: durationSeconds,
      startTime: new Date(now).toISOString(),
      scope: this.scope,
      force,
    });

    this._startTicking();
  }

  /**
   * 开始定时器循环
   * @private
   */
  _startTicking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.isRunning = true;

    this.intervalId = setInterval(() => {
      const remaining = this.getRemaining();

      if (remaining <= 0) {
        this._handleTimeout();
        return;
      }

      // 扣减1秒
      const newRemaining = remaining - 1;
      setStorageItem(this.config.remainingKey, String(newRemaining), true);

      // 触发 onTick 回调
      this.onTickCallbacks.forEach(cb => {
        try {
          cb(newRemaining);
        } catch (err) {
          console.error(`[TimerService:${this.type}] onTick回调错误:`, err);
        }
      });
    }, 1000);
  }

  /**
   * 处理超时 (once-only, 并发保护)
   * @private
   */
  _handleTimeout() {
    // 并发保护: 检查是否已处理过
    const scopeHandled = this.scope ? isTimeoutScopeHandled(this.scope) : false;
    const legacyHandled =
      getStorageItem(this.config.timeoutHandledKey) === 'true';

    if (scopeHandled || legacyHandled) {
      console.log(`[TimerService:${this.type}] 超时已处理，跳过重复触发`, {
        scope: this.scope,
      });
      this.stop();
      return;
    }

    console.log(`[TimerService:${this.type}] ⏰ 时间到! 触发超时回调`, {
      scope: this.scope,
    });

    // 标记已处理
    if (this.scope) {
      markTimeoutScopeHandled(this.scope);
    }
    setStorageItem(this.config.timeoutHandledKey, 'true', true);

    // 停止计时器
    this.stop();

    // 触发所有注册的回调 (确保只触发一次)
    this.callbacks.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error(`[TimerService:${this.type}] 超时回调执行错误:`, err);
      }
    });

    // 清空回调列表 (防止内存泄漏)
    this.callbacks.clear();
  }

  /**
   * 停止计时器 (不清除数据)
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log(`[TimerService:${this.type}] 计时器已停止`);
  }

  /**
   * 暂停计时器
   */
  pause() {
    if (!this.isRunning) {
      console.warn(`[TimerService:${this.type}] 计时器未运行，无法暂停`);
      return;
    }

    this.stop();
    setStorageItem(this.config.pausedKey, 'true', true);
    console.log(`[TimerService:${this.type}] 计时器已暂停, remaining=${this.getRemaining()}`);
  }

  /**
   * 恢复计时器
   */
  resume() {
    const paused = getStorageItem(this.config.pausedKey) === 'true';
    if (!paused) {
      console.warn(`[TimerService:${this.type}] 计时器未暂停，无需恢复`);
      return;
    }

    const remaining = this.getRemaining();
    if (remaining <= 0) {
      console.warn(`[TimerService:${this.type}] 剩余时间为0，无法恢复`);
      this._handleTimeout();
      return;
    }

    setStorageItem(this.config.pausedKey, 'false', true);
    setStorageItem(this.config.startKey, String(Date.now()), true); // 更新开始时间
    console.log(`[TimerService:${this.type}] 计时器已恢复, remaining=${remaining}`);

    this._startTicking();
  }

  /**
   * 重置计时器 (清除所有数据和状态)
   */
  reset() {
    this.stop();

    removeStorageItem(this.config.startKey);
    removeStorageItem(this.config.remainingKey);
    removeStorageItem(this.config.durationKey);
    removeStorageItem(this.config.pausedKey);
    removeStorageItem(this.config.timeoutHandledKey);
    removeStorageItem(this.config.scopeKey);

    if (this.scope) {
      try {
        clearTimeoutScopeFlag(this.scope);
      } catch (err) {
        console.warn(`[TimerService:${this.type}] 清理 scope 标记失败`, err);
      }
    }

    this.scope = this._resolveScope(this.config.defaultScope);
    setStorageItem(this.config.scopeKey, this.scope);

    this.callbacks.clear();
    this.onTickCallbacks.clear();

    console.log(`[TimerService:${this.type}] 计时器已重置`, {
      scope: this.scope,
    });
  }

  /**
   * 获取剩余时间 (秒)
   * @returns {number}
   */
  getRemaining() {
    const value = getStorageItem(this.config.remainingKey);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * 获取总时长 (秒)
   * @returns {number}
   */
  getDuration() {
    const value = getStorageItem(this.config.durationKey);
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * 是否暂停
   * @returns {boolean}
   */
  isPaused() {
    return getStorageItem(this.config.pausedKey) === 'true';
  }

  /**
   * 是否已超时
   * @returns {boolean}
   */
  isTimeout() {
    const legacyHandled =
      getStorageItem(this.config.timeoutHandledKey) === 'true';
    const scopeHandled = this.scope
      ? isTimeoutScopeHandled(this.scope)
      : false;
    return legacyHandled || scopeHandled;
  }

  /**
   * 注册超时回调
   * @param {Function} callback
   */
  onTimeout(callback) {
    this.callbacks.add(callback);
  }

  /**
   * 注册每秒回调
   * @param {Function} callback - 接收 remaining (number) 参数
   */
  onTick(callback) {
    this.onTickCallbacks.add(callback);
  }

  /**
   * 移除超时回调
   * @param {Function} callback
   */
  offTimeout(callback) {
    this.callbacks.delete(callback);
  }

  /**
   * 移除每秒回调
   * @param {Function} callback
   */
  offTick(callback) {
    this.onTickCallbacks.delete(callback);
  }

  /**
   * 获取调试信息
   * @returns {Object}
   */
  getDebugInfo() {
    return {
      type: this.type,
      isRunning: this.isRunning,
      isPaused: this.isPaused(),
      isTimeout: this.isTimeout(),
      remaining: this.getRemaining(),
      duration: this.getDuration(),
      startTime: this._getStartTime(),
      callbacks: this.callbacks.size,
      onTickCallbacks: this.onTickCallbacks.size,
      scope: this.scope,
      scopeHandled: this.scope ? isTimeoutScopeHandled(this.scope) : false,
    };
  }
}

/**
 * 单例管理器
 */
const instances = {};

/**
 * TimerService - 统一计时器服务
 */
export const TimerService = {
  /**
   * 获取计时器实例 (单例)
   * @param {string} type - 'task' | 'questionnaire' | 'notice'
   * @returns {TimerManager}
   */
  getInstance(type) {
    if (!instances[type]) {
      instances[type] = new TimerManager(type);
    }
    return instances[type];
  },

  /**
   * 启动主任务计时器
   * @param {number} durationSeconds - 时长 (秒), 默认 2400 (40分钟)
   * @param {Function|Object|null} onTimeoutOrOptions - 回调或配置对象
   * @param {boolean} forceFlag - 兼容旧签名的强制重启
   */
  startTask(durationSeconds = 2400, onTimeoutOrOptions = null, forceFlag = false) {
    const timer = this.getInstance('task');
    timer.start(durationSeconds, onTimeoutOrOptions, forceFlag);
  },

  /**
   * 启动问卷计时器
   * @param {number} durationSeconds - 时长 (秒), 默认 600 (10分钟)
   * @param {Function|Object|null} onTimeoutOrOptions - 回调或配置对象
   * @param {boolean} forceFlag - 兼容旧签名的强制重启
   */
  startQuestionnaire(durationSeconds = 600, onTimeoutOrOptions = null, forceFlag = false) {
    const timer = this.getInstance('questionnaire');
    timer.start(durationSeconds, onTimeoutOrOptions, forceFlag);
  },

  /**
   * 启动注意事项计时器
   * @param {number} durationSeconds - 时长 (秒), 默认 40
   * @param {Function|Object|null} onTimeoutOrOptions - 回调或配置对象
   * @param {boolean} forceFlag - 兼容旧签名的强制重启
   */
  startNotice(durationSeconds = 40, onTimeoutOrOptions = null, forceFlag = false) {
    const timer = this.getInstance('notice');
    timer.start(durationSeconds, onTimeoutOrOptions, forceFlag);
  },

  /**
   * 重置所有计时器
   */
  resetAll() {
    Object.keys(instances).forEach(type => {
      instances[type].reset();
    });
  },

  /**
   * 停止所有计时器
   */
  stopAll() {
    Object.keys(instances).forEach(type => {
      instances[type].stop();
    });
  },

  /**
   * 获取所有计时器的调试信息
   * @returns {Object}
   */
  getDebugInfo() {
    const info = {};
    Object.keys(instances).forEach(type => {
      info[type] = instances[type].getDebugInfo();
    });
    return info;
  },

  /**
   * 清理指定作用域的超时标记
   * @param {string} scope
   */
  clearTimeoutScope(scope) {
    if (!scope) {
      return;
    }
    try {
      clearTimeoutScopeFlag(scope);
    } catch (err) {
      console.warn('[TimerService] 清理 scope 超时标记失败', err);
    }
  },
};

export default TimerService;
