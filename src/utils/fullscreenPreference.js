import {
  DEV_TOOLS_DEFAULTS,
  DEV_TOOLS_STORAGE_KEYS,
  readDevBooleanPreference,
  subscribeToFullscreenPreference,
} from './devTools';

const isDevEnvironment =
  typeof process !== 'undefined'
    ? process.env.NODE_ENV === 'development'
    : Boolean(import.meta.env?.DEV);

const parseBooleanFlag = (value, defaultValue) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }

  return defaultValue;
};

export const isFullscreenFeatureEnabled = () => {
  const flag = import.meta.env?.VITE_FULLSCREEN_ENABLED;
  return parseBooleanFlag(flag, true);
};

const shouldForceFullscreenInDev = () => {
  const flag = import.meta.env?.VITE_REQUIRE_FULLSCREEN_IN_DEV;
  console.log('[fullscreenPreference] 环境变量 VITE_REQUIRE_FULLSCREEN_IN_DEV:', flag);
  return parseBooleanFlag(flag, false);
};

/**
 * Determines whether fullscreen enforcement should run.
 * - Production: always enforce
 * - Development: disabled by default, unless explicitly overridden
 */
export const shouldEnforceFullscreen = () => {
  console.log('[fullscreenPreference] 检查是否强制全屏...');
  if (!isFullscreenFeatureEnabled()) {
    console.log('[fullscreenPreference] VITE_FULLSCREEN_ENABLED=false，禁用全屏强制');
    return false;
  }
  console.log('[fullscreenPreference] 是否开发环境:', isDevEnvironment);
  console.log('[fullscreenPreference] import.meta.env.DEV:', import.meta.env?.DEV);

  if (!isDevEnvironment) {
    console.log('[fullscreenPreference] 生产环境，强制全屏: true');
    return true;
  }

  const forceInDev = shouldForceFullscreenInDev();
  console.log('[fullscreenPreference] 开发环境强制全屏:', forceInDev);

  if (forceInDev) {
    return true;
  }

  const localPref = readDevBooleanPreference(
    DEV_TOOLS_STORAGE_KEYS.fullscreen,
    DEV_TOOLS_DEFAULTS.fullscreen
  );
  console.log('[fullscreenPreference] localStorage 偏好:', localPref);
  console.log('[fullscreenPreference] 最终结果:', localPref);

  return localPref;
};

/**
 * Subscribe to fullscreen preference changes (dev-only).
 * No-op outside development.
 */
export const onFullscreenPreferenceChange = callback => {
  if (!isDevEnvironment) {
    return () => {};
  }
  return subscribeToFullscreenPreference(callback);
};
