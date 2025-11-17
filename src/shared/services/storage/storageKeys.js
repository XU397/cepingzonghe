/**
 * 统一本地存储键名管理
 *
 * 命名规范:
 * - core.* : 平台级状态 (认证、会话等)
 * - module.<id>.* : 模块级状态
 * - flow.<id>.* : Flow编排状态
 * - timer.* : 计时器状态
 *
 * 迁移策略:
 * - 兼容读取旧键名
 * - 优先写入新键名
 * - 清理时两套键名都清除
 */

// ============ 核心平台键名 ============
export const STORAGE_KEYS = {
  // 认证相关
  CORE_AUTH: 'core.isAuthenticated',
  CORE_AUTH_TOKEN: 'core.authToken',
  CORE_USER: 'core.currentUser',
  CORE_BATCH_CODE: 'core.batchCode',
  CORE_EXAM_NO: 'core.examNo',

  // 模块路由
  CORE_MODULE_URL: 'core.module/url',
  CORE_PAGE_NUM: 'core.page/pageNum',
  CORE_CURRENT_PAGE_ID: 'core.page/currentPageId',

  // 会话管理
  CORE_LAST_SESSION_END: 'core.lastSessionEndTime',
  CORE_SHOULD_CLEAR_CACHE: 'core.shouldClearOnNextSession',
  CORE_CACHE_CLEARED: 'core.cacheCleared',

  // 任务状态
  CORE_TASK_FINISHED: 'core.isTaskFinished',
  CORE_QUESTIONNAIRE_COMPLETED: 'core.isQuestionnaireCompleted',
  CORE_QUESTIONNAIRE_STARTED: 'core.isQuestionnaireStarted',

  // 计时器 - 主任务
  TIMER_TASK_START: 'timer.task.startTime',
  TIMER_TASK_REMAINING: 'timer.task.remaining',
  TIMER_TASK_DURATION: 'timer.task.duration',
  TIMER_TASK_PAUSED: 'timer.task.paused',
  TIMER_TASK_TIMEOUT_HANDLED: 'timer.task.timeoutHandled',
  TIMER_TASK_SCOPE: 'timer.task.scope',

  // 计时器 - 问卷
  TIMER_QUESTIONNAIRE_START: 'timer.questionnaire.startTime',
  TIMER_QUESTIONNAIRE_REMAINING: 'timer.questionnaire.remaining',
  TIMER_QUESTIONNAIRE_DURATION: 'timer.questionnaire.duration',
  TIMER_QUESTIONNAIRE_PAUSED: 'timer.questionnaire.paused',
  TIMER_QUESTIONNAIRE_TIMEOUT_HANDLED: 'timer.questionnaire.timeoutHandled',
  TIMER_QUESTIONNAIRE_SCOPE: 'timer.questionnaire.scope',

  // 计时器 - 注意事项
  TIMER_NOTICE_START: 'timer.notice.startTime',
  TIMER_NOTICE_REMAINING: 'timer.notice.remaining',
  TIMER_NOTICE_DURATION: 'timer.notice.duration',
  TIMER_NOTICE_PAUSED: 'timer.notice.paused',
  TIMER_NOTICE_TIMEOUT_HANDLED: 'timer.notice.timeoutHandled',
  TIMER_NOTICE_SCOPE: 'timer.notice.scope',
};

// ============ 旧键名映射 (兼容读取) ============
export const LEGACY_KEYS = {
  // 旧的认证相关
  isAuthenticated: STORAGE_KEYS.CORE_AUTH,
  authToken: STORAGE_KEYS.CORE_AUTH_TOKEN,
  currentUser: STORAGE_KEYS.CORE_USER,
  batchCode: STORAGE_KEYS.CORE_BATCH_CODE,
  examNo: STORAGE_KEYS.CORE_EXAM_NO,

  // 旧的模块路由
  moduleUrl: STORAGE_KEYS.CORE_MODULE_URL,
  'core.moduleUrl': STORAGE_KEYS.CORE_MODULE_URL,
  pageNum: STORAGE_KEYS.CORE_PAGE_NUM,
  'core.pageNum': STORAGE_KEYS.CORE_PAGE_NUM,
  modulePageNum: STORAGE_KEYS.CORE_PAGE_NUM, // 别名
  currentPageId: STORAGE_KEYS.CORE_CURRENT_PAGE_ID,
  'core.currentPageId': STORAGE_KEYS.CORE_CURRENT_PAGE_ID,

  // 旧的会话管理
  lastSessionEndTime: STORAGE_KEYS.CORE_LAST_SESSION_END,
  shouldClearOnNextSession: STORAGE_KEYS.CORE_SHOULD_CLEAR_CACHE,
  cacheCleared: STORAGE_KEYS.CORE_CACHE_CLEARED,

  // 旧的任务状态
  isTaskFinished: STORAGE_KEYS.CORE_TASK_FINISHED,
  isQuestionnaireCompleted: STORAGE_KEYS.CORE_QUESTIONNAIRE_COMPLETED,
  isQuestionnaireStarted: STORAGE_KEYS.CORE_QUESTIONNAIRE_STARTED,

  // 旧的计时器键名
  taskStartTime: STORAGE_KEYS.TIMER_TASK_START,
  remainingTime: STORAGE_KEYS.TIMER_TASK_REMAINING,
  questionnaireStartTime: STORAGE_KEYS.TIMER_QUESTIONNAIRE_START,
  questionnaireRemainingTime: STORAGE_KEYS.TIMER_QUESTIONNAIRE_REMAINING,
};

// ============ 工具函数 ============

/**
 * 获取存储值 (兼容旧键名)
 * @param {string} key - 新键名 (STORAGE_KEYS 中的值)
 * @returns {string | null}
 */
export function getStorageItem(key) {
  // 优先读取新键名
  let value = localStorage.getItem(key);
  if (value !== null) {
    return value;
  }

  // 兼容读取旧键名
  const legacyKey = Object.keys(LEGACY_KEYS).find(k => LEGACY_KEYS[k] === key);
  if (legacyKey) {
    value = localStorage.getItem(legacyKey);
  }

  return value;
}

/**
 * 设置存储值 (写入新键名, 迁移期可选择双写)
 * @param {string} key - 新键名 (STORAGE_KEYS 中的值)
 * @param {string} value - 值
 * @param {boolean} dualWrite - 是否同时写入旧键名 (迁移期使用)
 */
export function setStorageItem(key, value, dualWrite = false) {
  localStorage.setItem(key, value);

  if (dualWrite) {
    const legacyKey = Object.keys(LEGACY_KEYS).find(k => LEGACY_KEYS[k] === key);
    if (legacyKey) {
      localStorage.setItem(legacyKey, value);
    }
  }
}

/**
 * 删除存储值 (清理新旧两套键名)
 * @param {string} key - 新键名 (STORAGE_KEYS 中的值)
 */
export function removeStorageItem(key) {
  localStorage.removeItem(key);

  // 清理对应的旧键名
  const legacyKey = Object.keys(LEGACY_KEYS).find(k => LEGACY_KEYS[k] === key);
  if (legacyKey) {
    localStorage.removeItem(legacyKey);
  }
}

/**
 * 清除所有平台相关的存储
 */
export function clearAllStorage() {
  // 清除新键名
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });

  // 清除旧键名
  Object.keys(LEGACY_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * 清除计时器相关存储
 * @param {string} timerType - 'task' | 'questionnaire' | 'notice' | 'all'
 */
export function clearTimerStorage(timerType = 'all') {
  const timerKeys = Object.entries(STORAGE_KEYS)
    .filter(([key]) => key.startsWith('TIMER_'))
    .map(([, value]) => value);

  if (timerType === 'all') {
    timerKeys.forEach(key => removeStorageItem(key));
  } else {
    const prefix = `timer.${timerType}.`;
    timerKeys
      .filter(key => key.startsWith(prefix))
      .forEach(key => removeStorageItem(key));
  }
}

/**
 * 生成模块专用键名
 * @param {string} moduleId - 模块ID
 * @param {string} key - 键名
 * @returns {string}
 */
export function getModuleKey(moduleId, key) {
  return `module.${moduleId}.${key}`;
}

/**
 * 生成Flow专用键名
 * @param {string} flowId - Flow ID
 * @param {string} key - 键名
 * @returns {string}
 */
export function getFlowKey(flowId, key) {
  return `flow.${flowId}.${key}`;
}

/**
 * 生成一次性超时标记键名
 * @param {string} scope - 去重作用域
 * @returns {string}
 */
export function getTimeoutScopeKey(scope) {
  if (!scope) {
    throw new Error('[storageKeys] scope 不能为空');
  }
  const normalized = String(scope).trim().replace(/\s+/g, '-');
  if (!normalized) {
    throw new Error('[storageKeys] scope 不能为空字符串');
  }
  return `core.timer/timeoutFired.${normalized}`;
}

/**
 * 标记 scope 已触发超时
 * @param {string} scope
 */
export function markTimeoutScopeHandled(scope) {
  const key = getTimeoutScopeKey(scope);
  setStorageItem(key, 'true');
}

/**
 * 判断 scope 是否已触发超时
 * @param {string} scope
 * @returns {boolean}
 */
export function isTimeoutScopeHandled(scope) {
  const key = getTimeoutScopeKey(scope);
  return getStorageItem(key) === 'true';
}

/**
 * 清理 scope 的超时标记
 * @param {string} scope
 */
export function clearTimeoutScope(scope) {
  const key = getTimeoutScopeKey(scope);
  removeStorageItem(key);
}

/**
 * 清除模块专用存储
 * @param {string} moduleId - 模块ID
 */
export function clearModuleStorage(moduleId) {
  const prefix = `module.${moduleId}.`;
  Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .forEach(key => localStorage.removeItem(key));
}

/**
 * 清除Flow专用存储
 * @param {string} flowId - Flow ID
 */
export function clearFlowStorage(flowId) {
  const prefix = `flow.${flowId}.`;
  Object.keys(localStorage)
    .filter(key => key.startsWith(prefix))
    .forEach(key => localStorage.removeItem(key));
}

export default STORAGE_KEYS;
