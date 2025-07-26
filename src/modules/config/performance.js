/**
 * 模块系统性能优化配置
 * 
 * 定义模块系统的性能优化策略和配置参数
 */

/**
 * 模块加载性能配置
 */
export const MODULE_PERFORMANCE_CONFIG = {
  // 模块预加载策略
  PRELOAD_STRATEGY: {
    // 是否启用模块预加载
    ENABLED: true,
    
    // 预加载延迟（毫秒）
    DELAY_MS: 100,
    
    // 预加载的模块数量限制
    MAX_PRELOAD_MODULES: 2
  },

  // 模块缓存策略
  CACHE_STRATEGY: {
    // 是否启用模块缓存
    ENABLED: true,
    
    // 缓存过期时间（毫秒）
    EXPIRY_MS: 5 * 60 * 1000, // 5分钟
    
    // 最大缓存模块数量
    MAX_CACHED_MODULES: 5
  },

  // 模块初始化优化
  INITIALIZATION: {
    // 是否启用并行初始化
    PARALLEL_INIT: true,
    
    // 初始化超时时间（毫秒）
    TIMEOUT_MS: 10000,
    
    // 重试次数
    MAX_RETRIES: 3
  },

  // 内存管理
  MEMORY_MANAGEMENT: {
    // 是否启用自动内存清理
    AUTO_CLEANUP: true,
    
    // 清理间隔（毫秒）
    CLEANUP_INTERVAL_MS: 30000,
    
    // 内存使用阈值（MB）
    MEMORY_THRESHOLD_MB: 100
  }
};

/**
 * 用户上下文构造优化配置
 */
export const CONTEXT_OPTIMIZATION_CONFIG = {
  // 上下文缓存
  CONTEXT_CACHE: {
    // 是否启用上下文缓存
    ENABLED: true,
    
    // 缓存键生成策略
    CACHE_KEY_STRATEGY: 'examNo_batchCode',
    
    // 缓存过期时间（毫秒）
    EXPIRY_MS: 2 * 60 * 1000 // 2分钟
  },

  // 上下文字段优化
  FIELD_OPTIMIZATION: {
    // 是否启用字段过滤（只传递必要字段）
    FIELD_FILTERING: true,
    
    // 必要字段列表
    REQUIRED_FIELDS: [
      'examNo',
      'batchCode',
      'url',
      'pageNum',
      'currentPageId',
      'remainingTime',
      'isAuthenticated',
      'logOperation',
      'collectAnswer'
    ],
    
    // 可选字段列表
    OPTIONAL_FIELDS: [
      'taskStartTime',
      'pageEnterTime',
      'currentUser',
      'authToken',
      'questionnaireData'
    ]
  }
};

/**
 * 错误处理优化配置
 */
export const ERROR_HANDLING_CONFIG = {
  // 错误重试策略
  RETRY_STRATEGY: {
    // 是否启用自动重试
    AUTO_RETRY: true,
    
    // 最大重试次数
    MAX_RETRIES: 3,
    
    // 重试延迟（毫秒）
    RETRY_DELAY_MS: 1000,
    
    // 重试延迟递增因子
    RETRY_BACKOFF_FACTOR: 2
  },

  // 错误降级策略
  FALLBACK_STRATEGY: {
    // 是否启用自动降级
    AUTO_FALLBACK: true,
    
    // 降级到传统模式的条件
    FALLBACK_CONDITIONS: [
      'MODULE_LOAD_FAILED',
      'INITIALIZATION_TIMEOUT',
      'CRITICAL_ERROR'
    ],
    
    // 降级延迟（毫秒）
    FALLBACK_DELAY_MS: 2000
  }
};

/**
 * 开发环境调试配置
 */
export const DEBUG_CONFIG = {
  // 性能监控
  PERFORMANCE_MONITORING: {
    // 是否启用性能监控
    ENABLED: import.meta.env.DEV,
    
    // 监控指标
    METRICS: [
      'module_load_time',
      'context_construction_time',
      'initialization_time',
      'memory_usage'
    ],
    
    // 性能警告阈值
    WARNING_THRESHOLDS: {
      MODULE_LOAD_TIME_MS: 2000,
      CONTEXT_CONSTRUCTION_TIME_MS: 100,
      INITIALIZATION_TIME_MS: 5000,
      MEMORY_USAGE_MB: 50
    }
  },

  // 日志配置
  LOGGING: {
    // 日志级别
    LEVEL: import.meta.env.DEV ? 'debug' : 'warn',
    
    // 是否启用详细日志
    VERBOSE: import.meta.env.DEV,
    
    // 日志前缀
    PREFIX: '[ModuleRouter]'
  }
};

/**
 * 获取性能优化配置
 * @param {string} category - 配置类别
 * @returns {Object} 配置对象
 */
export const getPerformanceConfig = (category) => {
  const configs = {
    performance: MODULE_PERFORMANCE_CONFIG,
    context: CONTEXT_OPTIMIZATION_CONFIG,
    error: ERROR_HANDLING_CONFIG,
    debug: DEBUG_CONFIG
  };
  
  return configs[category] || {};
};

/**
 * 性能监控工具
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.enabled = DEBUG_CONFIG.PERFORMANCE_MONITORING.ENABLED;
  }

  /**
   * 开始性能测量
   * @param {string} name - 测量名称
   */
  start(name) {
    if (!this.enabled) return;
    
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  /**
   * 结束性能测量
   * @param {string} name - 测量名称
   * @returns {number} 持续时间（毫秒）
   */
  end(name) {
    if (!this.enabled) return 0;
    
    const metric = this.metrics.get(name);
    if (!metric) return 0;
    
    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    // 检查是否超过警告阈值
    this.checkWarningThreshold(name, metric.duration);
    
    return metric.duration;
  }

  /**
   * 检查警告阈值
   * @param {string} name - 测量名称
   * @param {number} duration - 持续时间
   */
  checkWarningThreshold(name, duration) {
    const thresholds = DEBUG_CONFIG.PERFORMANCE_MONITORING.WARNING_THRESHOLDS;
    const thresholdKey = name.toUpperCase() + '_MS';
    const threshold = thresholds[thresholdKey];
    
    if (threshold && duration > threshold) {
      console.warn(`[PerformanceMonitor] ⚠️ ${name} 耗时过长: ${duration.toFixed(2)}ms (阈值: ${threshold}ms)`);
    }
  }

  /**
   * 获取所有性能指标
   * @returns {Object} 性能指标对象
   */
  getMetrics() {
    const result = {};
    for (const [name, metric] of this.metrics) {
      result[name] = {
        duration: metric.duration,
        startTime: metric.startTime,
        endTime: metric.endTime
      };
    }
    return result;
  }

  /**
   * 清除所有性能指标
   */
  clear() {
    this.metrics.clear();
  }
}

// 导出全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();