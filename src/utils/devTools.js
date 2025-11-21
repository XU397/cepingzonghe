const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const DEV_TOOLS_STORAGE_KEYS = {
  mock: 'dev-mock-enabled',
  fullscreen: 'dev-fullscreen-check-enabled'
};

export const DEV_TOOLS_DEFAULTS = {
  mock: true,
  fullscreen: false
};

export const DEV_TOOLS_EVENTS = {
  fullscreenChange: 'devtools:fullscreen-check-changed'
};

export const readDevBooleanPreference = (key, defaultValue = false) => {
  if (!isBrowser()) {
    return defaultValue;
  }
  const storedValue = window.localStorage.getItem(key);
  if (storedValue === null) {
    return defaultValue;
  }
  return storedValue === 'true';
};

export const writeDevBooleanPreference = (key, value) => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(key, value ? 'true' : 'false');
};

export const notifyFullscreenPreferenceChange = (enabled) => {
  if (!isBrowser()) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent(DEV_TOOLS_EVENTS.fullscreenChange, {
      detail: { enabled }
    })
  );
};

export const subscribeToFullscreenPreference = (callback) => {
  if (!isBrowser()) {
    return () => {};
  }

  const handleCustomEvent = (event) => {
    if (typeof callback !== 'function') {
      return;
    }
    if (typeof event.detail?.enabled === 'boolean') {
      callback(event.detail.enabled);
      return;
    }
    callback(
      readDevBooleanPreference(
        DEV_TOOLS_STORAGE_KEYS.fullscreen,
        DEV_TOOLS_DEFAULTS.fullscreen
      )
    );
  };

  const handleStorageEvent = (event) => {
    if (event.key && event.key !== DEV_TOOLS_STORAGE_KEYS.fullscreen) {
      return;
    }
    callback(
      readDevBooleanPreference(
        DEV_TOOLS_STORAGE_KEYS.fullscreen,
        DEV_TOOLS_DEFAULTS.fullscreen
      )
    );
  };

  window.addEventListener(DEV_TOOLS_EVENTS.fullscreenChange, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(DEV_TOOLS_EVENTS.fullscreenChange, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
};
