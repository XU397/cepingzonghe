import { useState, useEffect } from 'react';
import type { LoginPageConfig } from './types';
import { DEFAULT_LOGIN_PAGE_CONFIG } from './defaultConfig';
import { fetchLoginPageConfig } from './api';
import { readConfigCache, writeConfigCache } from './cache';

export type { LoginPageConfig, LogoDisplayType, LogoPosition } from './types';
export { DEFAULT_LOGIN_PAGE_CONFIG } from './defaultConfig';
export { fetchLoginPageConfig } from './api';
export { readConfigCache, writeConfigCache } from './cache';

function mergeWithDefaults(partial: LoginPageConfig): LoginPageConfig {
  return {
    ...DEFAULT_LOGIN_PAGE_CONFIG,
    ...partial,
    logo: { ...DEFAULT_LOGIN_PAGE_CONFIG.logo, ...partial.logo },
    title: { ...DEFAULT_LOGIN_PAGE_CONFIG.title, ...partial.title },
    password: { ...DEFAULT_LOGIN_PAGE_CONFIG.password, ...partial.password },
  };
}

let inFlightConfigRequest: Promise<LoginPageConfig | null> | null = null;

function loadLoginPageConfig(): Promise<LoginPageConfig | null> {
  if (!inFlightConfigRequest) {
    inFlightConfigRequest = fetchLoginPageConfig().finally(() => {
      inFlightConfigRequest = null;
    });
  }
  return inFlightConfigRequest;
}

export function useLoginPageConfig(): LoginPageConfig {
  const [config, setConfig] = useState<LoginPageConfig>(DEFAULT_LOGIN_PAGE_CONFIG);

  useEffect(() => {
    let cancelled = false;

    loadLoginPageConfig()
      .then((remoteConfig) => {
        if (cancelled) return;
        if (remoteConfig) {
          const merged = mergeWithDefaults(remoteConfig);
          writeConfigCache(merged);
          setConfig(merged);
        }
      })
      .catch(() => {
        if (cancelled) return;
        const cached = readConfigCache();
        if (cached) {
          setConfig(mergeWithDefaults(cached));
        }
      });

    return () => { cancelled = true; };
  }, []);

  return config;
}
