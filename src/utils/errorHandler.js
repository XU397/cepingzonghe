/**
 * 错误处理工具
 * 用于过滤和处理各种类型的错误
 */

/**
 * 无害错误的匹配模式
 */
const HARMLESS_ERROR_PATTERNS = [
  /can not use with devtools/i,
  /extension context invalidated/i,
  /non-error promise rejection captured/i,
  /script error/i
];

/**
 * 检查是否为无害错误
 * @param {string} message - 错误消息
 * @returns {boolean} 是否为无害错误
 */
export const isHarmlessError = (message) => {
  if (!message || typeof message !== 'string') {
    return false;
  }
  
  return HARMLESS_ERROR_PATTERNS.some(pattern => 
    pattern.test(message)
  );
};

/**
 * 全局错误处理器
 * @param {ErrorEvent} event - 错误事件
 */
export const globalErrorHandler = (event) => {
  const message = event.message || event.error?.message || '';
  
  // 过滤无害错误
  if (isHarmlessError(message)) {
    console.debug('[Filtered] 已过滤无害错误:', message);
    return;
  }
  
  // 记录真正的错误
  console.error('[Global Error]', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
};

/**
 * Promise 拒绝处理器
 * @param {PromiseRejectionEvent} event - Promise拒绝事件
 */
export const unhandledRejectionHandler = (event) => {
  const reason = event.reason;
  const message = reason?.message || reason?.toString() || '';
  
  // 过滤无害错误
  if (isHarmlessError(message)) {
    console.debug('[Filtered] 已过滤无害Promise拒绝:', message);
    event.preventDefault(); // 阻止默认的错误日志
    return;
  }
  
  // 记录真正的错误
  console.error('[Unhandled Promise Rejection]', reason);
};

/**
 * 初始化全局错误处理
 */
export const initGlobalErrorHandling = () => {
  // 仅在生产环境启用错误过滤
  if (import.meta.env.PROD) {
    window.addEventListener('error', globalErrorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    
    console.log('[Error Handler] 全局错误过滤已启用');
  }
};

/**
 * 清理全局错误处理
 */
export const cleanupGlobalErrorHandling = () => {
  window.removeEventListener('error', globalErrorHandler);
  window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
}; 