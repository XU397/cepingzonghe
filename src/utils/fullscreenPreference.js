import {
  DEV_TOOLS_DEFAULTS,
  DEV_TOOLS_STORAGE_KEYS,
  readDevBooleanPreference,
  subscribeToFullscreenPreference
} from './devTools';

const isDevEnvironment = typeof process !== 'undefined'
  ? process.env.NODE_ENV === 'development'
  : Boolean(import.meta.env?.DEV);

const shouldForceFullscreenInDev = () => {
  const flag = import.meta.env?.VITE_REQUIRE_FULLSCREEN_IN_DEV;
  if (typeof flag === 'string') {
    return flag.toLowerCase() === 'true' || flag === '1';
  }
  return Boolean(flag);
};

/**
 * Determines whether fullscreen enforcement should run.
 * - Production: always enforce
 * - Development: disabled by default, unless explicitly overridden
 */
export const shouldEnforceFullscreen = () => {
  if (!isDevEnvironment) {
    return true;
  }
  if (shouldForceFullscreenInDev()) {
    return true;
  }
  return readDevBooleanPreference(
    DEV_TOOLS_STORAGE_KEYS.fullscreen,
    DEV_TOOLS_DEFAULTS.fullscreen
  );
};

/**
 * Subscribe to fullscreen preference changes (dev-only).
 * No-op outside development.
 */
export const onFullscreenPreferenceChange = (callback) => {
  if (!isDevEnvironment) {
    return () => {};
  }
  return subscribeToFullscreenPreference(callback);
};
