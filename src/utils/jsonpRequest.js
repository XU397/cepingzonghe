/**
 * JSONP请求工具
 * 用于绕过CORS限制进行跨域请求
 */

/**
 * 生成随机回调函数名
 */
const generateCallbackName = () => {
  return `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 使用JSONP发送GET请求
 * @param {string} url - 请求URL
 * @param {Object} params - 查询参数
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<Object>} 响应数据
 */
export const jsonpRequest = (url, params = {}, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const callbackName = generateCallbackName();
    const script = document.createElement('script');
    let timer;

    // 创建全局回调函数
    window[callbackName] = (data) => {
      // 清理
      clearTimeout(timer);
      document.head.removeChild(script);
      delete window[callbackName];
      
      resolve(data);
    };

    // 设置超时
    timer = setTimeout(() => {
      // 清理
      document.head.removeChild(script);
      delete window[callbackName];
      
      reject(new Error('JSONP请求超时'));
    }, timeout);

    // 构建完整URL
    const queryParams = new URLSearchParams({
      ...params,
      callback: callbackName,
      _: Date.now() // 防止缓存
    });

    const fullUrl = `${url}?${queryParams.toString()}`;
    
    // 错误处理
    script.onerror = () => {
      clearTimeout(timer);
      document.head.removeChild(script);
      delete window[callbackName];
      reject(new Error('JSONP请求失败'));
    };

    script.src = fullUrl;
    document.head.appendChild(script);
  });
};

/**
 * 检查URL是否支持JSONP
 * @param {string} url - 要检查的URL
 * @returns {boolean}
 */
export const supportsJsonp = (url) => {
  // 简单检查：如果是不同源的HTTP(S)请求，可能支持JSONP
  try {
    const urlObj = new URL(url);
    const currentOrigin = window.location.origin;
    return urlObj.origin !== currentOrigin;
  } catch {
    return false;
  }
}; 