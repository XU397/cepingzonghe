import type { LoginPageConfig } from './types';

const CACHE_KEY = 'hci-login-page-config';

interface CacheEntry {
  cacheVersion?: string;
  config: LoginPageConfig;
  cachedAt: string;
}

export function writeConfigCache(config: LoginPageConfig): void {
  try {
    const entry: CacheEntry = {
      cacheVersion: config.cacheVersion,
      config,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage unavailable or full — non-critical
  }
}

export function readConfigCache(): LoginPageConfig | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    return entry?.config ?? null;
  } catch {
    return null;
  }
}
