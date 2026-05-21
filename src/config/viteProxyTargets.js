export const DEFAULT_API_TARGET = 'http://117.72.14.166:9002';
export const DEFAULT_LOGIN_CONFIG_TARGET = 'http://117.72.14.166:8777';

export function resolveLoginConfigTarget(env = {}) {
  return env.VITE_LOGIN_CONFIG_TARGET || env.VITE_ADMIN_API_TARGET || DEFAULT_LOGIN_CONFIG_TARGET;
}
