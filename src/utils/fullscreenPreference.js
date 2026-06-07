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
  return parseBooleanFlag(flag, false);
};

/**
 * Determines whether fullscreen enforcement should run.
 * - Production: always enforce
 * - Development: disabled by default, unless explicitly overridden
 */
export const shouldEnforceFullscreen = () => {
  if (!isFullscreenFeatureEnabled()) {
    return false;
  }

  if (!isDevEnvironment) {
    return true;
  }

  const forceInDev = shouldForceFullscreenInDev();

  if (forceInDev) {
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
export const onFullscreenPreferenceChange = callback => {
  if (!isDevEnvironment) {
    return () => {};
  }
  return subscribeToFullscreenPreference(callback);
};
