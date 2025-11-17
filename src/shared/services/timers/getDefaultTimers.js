/**
 * 获取默认计时器配置
 *
 * 用于 Flow/CMI 子模块，提供标准的计时配置
 *
 * 使用示例:
 * ```js
 * import { getDefaultTimers } from '@shared/services/timers/getDefaultTimers';
 *
 * // 在子模块定义中
 * export const MySubmodule = {
 *   submoduleId: 'g7-experiment',
 *   ...
 *   getDefaultTimers() {
 *     return getDefaultTimers('experiment');
 *   }
 * };
 * ```
 */

/**
 * 默认时长配置 (秒)
 */
const DEFAULT_DURATIONS = {
  // 主任务计时器
  task: {
    duration: 40 * 60, // 40 分钟
    warningThreshold: 5 * 60, // 5 分钟
    criticalThreshold: 60, // 1 分钟
  },

  // 问卷计时器
  questionnaire: {
    duration: 10 * 60, // 10 分钟
    warningThreshold: 3 * 60, // 3 分钟
    criticalThreshold: 60, // 1 分钟
  },

  // 注意事项计时器
  notice: {
    duration: 40, // 40 秒
    warningThreshold: 20, // 20 秒
    criticalThreshold: 10, // 10 秒
  },
};

/**
 * 子模块类型到计时器类型的映射
 */
const SUBMODULE_TYPE_MAPPING = {
  experiment: 'task',
  questionnaire: 'questionnaire',
  notice: 'notice',
  'experiment-intro': 'notice',
  'questionnaire-intro': 'notice',
};

/**
 * 获取默认计时器配置
 *
 * @param {string} submoduleType - 子模块类型: 'experiment' | 'questionnaire' | 'notice' | 'experiment-intro' | 'questionnaire-intro'
 * @param {Object} overrides - 覆写配置 (可选)
 * @param {number} [overrides.duration] - 覆写时长
 * @param {number} [overrides.warningThreshold] - 覆写警告阈值
 * @param {number} [overrides.criticalThreshold] - 覆写严重阈值
 * @returns {Object} 计时器配置
 */
export function getDefaultTimers(submoduleType, overrides = {}) {
  const timerType = SUBMODULE_TYPE_MAPPING[submoduleType] || 'task';
  const defaults = DEFAULT_DURATIONS[timerType];

  if (!defaults) {
    console.warn(`[getDefaultTimers] Unknown submoduleType: ${submoduleType}, using task defaults`);
    return { ...DEFAULT_DURATIONS.task, ...overrides };
  }

  return {
    ...defaults,
    ...overrides,
  };
}

/**
 * 获取特定模块的计时器配置
 *
 * @param {string} moduleId - 模块ID
 * @returns {Object} 计时器配置
 */
export function getTimerConfigForModule(moduleId) {
  // 根据模块ID返回特定配置
  const configs = {
    'grade-4': {
      task: { duration: 45 * 60, warningThreshold: 5 * 60, criticalThreshold: 60 },
    },
    'grade-7': {
      task: { duration: 40 * 60, warningThreshold: 5 * 60, criticalThreshold: 60 },
      questionnaire: { duration: 10 * 60, warningThreshold: 3 * 60, criticalThreshold: 60 },
    },
    'grade-7-tracking': {
      task: { duration: 40 * 60, warningThreshold: 5 * 60, criticalThreshold: 60 },
      questionnaire: { duration: 10 * 60, warningThreshold: 3 * 60, criticalThreshold: 60 },
    },

    // 子模块配置
    'g7-experiment': {
      task: { duration: 30 * 60, warningThreshold: 5 * 60, criticalThreshold: 60 },
    },
    'g7-questionnaire': {
      questionnaire: { duration: 10 * 60, warningThreshold: 3 * 60, criticalThreshold: 60 },
    },
    'g7-tracking-experiment': {
      task: { duration: 30 * 60, warningThreshold: 5 * 60, criticalThreshold: 60 },
    },
    'g7-tracking-questionnaire': {
      questionnaire: { duration: 8 * 60, warningThreshold: 2 * 60, criticalThreshold: 60 },
    },
    'g4-experiment': {
      task: { duration: 45 * 60, warningThreshold: 5 * 60, criticalThreshold: 60 },
    },
  };

  return configs[moduleId] || {
    task: DEFAULT_DURATIONS.task,
    questionnaire: DEFAULT_DURATIONS.questionnaire,
    notice: DEFAULT_DURATIONS.notice,
  };
}

/**
 * 计算剩余时间百分比
 *
 * @param {number} remaining - 剩余秒数
 * @param {number} duration - 总时长
 * @returns {number} 百分比 (0-100)
 */
export function calculateProgress(remaining, duration) {
  if (!duration || duration <= 0) return 0;
  const elapsed = duration - remaining;
  return Math.min(100, Math.max(0, (elapsed / duration) * 100));
}

/**
 * 判断是否应该显示警告
 *
 * @param {number} remaining - 剩余秒数
 * @param {number} warningThreshold - 警告阈值
 * @param {number} criticalThreshold - 严重阈值
 * @returns {string} 'normal' | 'warning' | 'critical' | 'complete'
 */
export function getTimerState(remaining, warningThreshold, criticalThreshold) {
  if (remaining === 0) return 'complete';
  if (remaining <= criticalThreshold) return 'critical';
  if (remaining < warningThreshold) return 'warning';
  return 'normal';
}

export const NOTICE_DEFAULT_DURATION = DEFAULT_DURATIONS.notice.duration;

export default getDefaultTimers;
