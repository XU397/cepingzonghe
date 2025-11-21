// import {
//   DEV_TOOLS_STORAGE_KEYS,
//   DEV_TOOLS_DEFAULTS,
//   readDevBooleanPreference
// } from '../utils/devTools';  // 文件不存在，暂时注释

/**
 * API配置文件
 * 根据运行环境动态配置API基础URL
 */

/**
 * 判断当前是否为开发环境
 */
const isDevelopment = import.meta.env.DEV;

/**
 * 判断当前是否为生产环境
 */
const isProduction = import.meta.env.PROD;

const envMockDefault = (() => {
  const rawValue = import.meta.env?.VITE_USE_MOCK;
  if (rawValue === undefined || rawValue === null) {
    return true; // 默认启用mock模式
  }
  const normalized = String(rawValue).toLowerCase();
  return normalized === 'true' || normalized === '1';
})();

const resolveMockPreference = () => {
  // 简化版本：直接使用环境变量配置
  return envMockDefault;
};

const useMock = resolveMockPreference();

const buildDevApiBaseUrl = () => {
  if (useMock) {
    return '/stu';
  }
  const target = import.meta.env?.VITE_API_TARGET;
  if (!target) {
    return '/stu';
  }
  const trimmed = target.endsWith('/') ? target.slice(0, -1) : target;
  return trimmed.endsWith('/stu') ? trimmed : `${trimmed}/stu`;
};

/**
 * 获取当前域名和端口
 */
const getCurrentHost = () => {
  return window.location.origin;
};

/**
 * 生产环境配置选项
 */
const PRODUCTION_CONFIG_OPTIONS = {
  // 选项1: 直接请求（可能遇到CORS问题）
  direct: {
    baseURL: 'http://117.72.14.166:9002/stu',
    corsMode: 'cors',
    credentials: 'omit'
  },
  
  // 选项2: 使用代理服务器（如果部署了代理）
  proxy: {
    baseURL: '/api/stu', // 假设有代理服务器处理 /api/* 路径
    corsMode: 'cors',
    credentials: 'include'
  },
  
  // 选项3: 使用同源代理（如果后端API部署在同一服务器）
  sameOrigin: {
    baseURL: '/stu', // 同源路径
    corsMode: 'same-origin',
    credentials: 'include'
  }
};

/**
 * 获取生产环境API URL
 * 根据当前访问的域名判断后端API地址
 */
function getProductionApiUrl() {
  const currentHost = getCurrentHost();
  
  // 根据不同的部署环境返回对应的API地址
  if (currentHost.includes('47.109.54.16:8080')) {
    // 部署在47.109.54.16:8080的环境
    
    // 首先检查是否有查询参数指定使用哪种配置
    const urlParams = new URLSearchParams(window.location.search);
    const apiMode = urlParams.get('apiMode');
    
    if (apiMode && PRODUCTION_CONFIG_OPTIONS[apiMode]) {
      console.log(`[API Config] 使用指定的API模式: ${apiMode}`);
      return PRODUCTION_CONFIG_OPTIONS[apiMode];
    }
    
    // 默认使用同源模式（测试显示这个模式工作正常）
    console.log('[API Config] 使用默认的同源模式（测试验证可用）');
    return PRODUCTION_CONFIG_OPTIONS.sameOrigin;
  } else if (currentHost.includes('localhost') || currentHost.includes('127.0.0.1')) {
    // 本地测试环境
    return {
      baseURL: '/stu',
      corsMode: 'cors',
      credentials: 'include'
    };
  } else {
    // 其他环境，优先尝试同源模式
    console.log('[API Config] 其他环境，尝试同源模式');
    return PRODUCTION_CONFIG_OPTIONS.sameOrigin;
  }
}

/**
 * API配置
 */
const API_CONFIG = {
  // 开发环境配置
  development: {
    baseURL: buildDevApiBaseUrl(),
    timeout: 10000,
    corsMode: 'cors',
    credentials: 'include',
    useMock
  },
  // 生产环境配置
  production: (() => {
    const config = getProductionApiUrl();
    return {
      ...config,
      timeout: 15000,
    };
  })()
};

// 防止重复打印日志
let hasLoggedConfig = false;

/**
 * 获取当前环境的API配置
 */
export const getApiConfig = () => {
  const env = isDevelopment ? 'development' : 'production';
  const config = API_CONFIG[env];
  
  // 只在第一次调用时打印配置信息
  if (!hasLoggedConfig) {
    console.log(`[API Config] 当前环境: ${env}`);
    console.log(`[API Config] API基础URL: ${config.baseURL}`);
    console.log(`[API Config] CORS模式: ${config.corsMode}`);
    console.log(`[API Config] 凭证模式: ${config.credentials}`);
    console.log(`[API Config] 当前域名: ${getCurrentHost()}`);
    if (env === 'development') {
      console.log(`[API Config] Mock 模式: ${useMock ? '启用' : '禁用'}`);
    }
    hasLoggedConfig = true;
  }
  
  return config;
};

/**
 * 获取API基础URL
 */
export const getApiBaseUrl = () => {
  return getApiConfig().baseURL;
};

/**
 * 获取请求超时时间
 */
export const getApiTimeout = () => {
  return getApiConfig().timeout;
};

/**
 * 获取CORS模式
 */
export const getCorsMode = () => {
  return getApiConfig().corsMode || 'cors';
};

/**
 * 获取凭证模式
 */
export const getCredentialsMode = () => {
  return getApiConfig().credentials || 'include';
};

/**
 * 构建完整的API URL
 * @param {string} endpoint - API端点（如 '/login', '/saveHcMark'）
 * @returns {string} 完整的API URL
 */
export const buildApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // 确保endpoint以/开头
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

/**
 * 获取推荐的fetch配置
 * @param {Object} customOptions - 自定义选项
 * @returns {Object} fetch配置对象
 */
export const getFetchOptions = (customOptions = {}) => {
  const config = getApiConfig();
  
  const defaultOptions = {
    mode: config.corsMode,
    credentials: config.credentials,
    headers: {
      'Accept': 'application/json',
    }
  };
  
  // 在某些CORS情况下，移除可能触发预检的头
  if (config.corsMode === 'cors' && config.credentials === 'omit') {
    console.log('[API Config] 使用简化CORS配置，移除Content-Type头');
    // 不设置Content-Type头，避免预检请求
  } else {
    defaultOptions.headers['Content-Type'] = 'application/json';
  }
  
  return {
    ...defaultOptions,
    ...customOptions,
    headers: {
      ...defaultOptions.headers,
      ...(customOptions.headers || {})
    }
  };
};

export const isMockApiEnabled = () => useMock;

export default {
  getApiConfig,
  getApiBaseUrl,
  getApiTimeout,
  getCorsMode,
  getCredentialsMode,
  buildApiUrl,
  getFetchOptions,
  isMockApiEnabled
};
