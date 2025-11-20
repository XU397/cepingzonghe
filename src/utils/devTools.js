/**
 * 开发工具配置和工具函数
 * 用于管理开发环境下的偏好设置
 */

// 开发工具存储键
export const DEV_TOOLS_STORAGE_KEYS = {
  mock: 'devtools.mock',
  fullscreen: 'devtools.fullscreen',
};

// 开发工具默认值
export const DEV_TOOLS_DEFAULTS = {
  mock: true,
  fullscreen: true,
};

/**
 * 读取布尔类型的开发偏好设置
 * @param {string} key - 存储键
 * @param {boolean} defaultValue - 默认值
 * @returns {boolean}
 */
export function readDevBooleanPreference(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return defaultValue;
    }
    return stored === 'true' || stored === '1';
  } catch {
    return defaultValue;
  }
}

/**
 * 写入布尔类型的开发偏好设置
 * @param {string} key - 存储键
 * @param {boolean} value - 值
 */
export function writeDevBooleanPreference(key, value) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
    // 触发存储事件以便其他组件可以响应
    window.dispatchEvent(new StorageEvent('storage', {
      key,
      newValue: value ? 'true' : 'false',
    }));
  } catch (e) {
    console.warn('[devTools] Failed to write preference:', e);
  }
}

/**
 * 订阅全屏偏好设置变化
 * @param {function} callback - 回调函数
 * @returns {function} 取消订阅函数
 */
export function subscribeToFullscreenPreference(callback) {
  const handler = (event) => {
    if (event.key === DEV_TOOLS_STORAGE_KEYS.fullscreen) {
      const enabled = event.newValue === 'true' || event.newValue === '1';
      callback(enabled);
    }
  };

  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('storage', handler);
  };
}

/**
 * 订阅 Mock 偏好设置变化
 * @param {function} callback - 回调函数
 * @returns {function} 取消订阅函数
 */
export function subscribeToMockPreference(callback) {
  const handler = (event) => {
    if (event.key === DEV_TOOLS_STORAGE_KEYS.mock) {
      const enabled = event.newValue === 'true' || event.newValue === '1';
      callback(enabled);
    }
  };

  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener('storage', handler);
  };
}
