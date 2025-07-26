/**
 * 滚动工具函数
 * 提供可靠的页面滚动功能
 */

/**
 * 确保页面滚动到顶部
 * 使用多种方法确保在不同浏览器和情况下都能正常工作
 * @param {boolean} smooth - 是否使用平滑滚动，默认为true
 */
export const scrollToTop = (smooth = false) => {
  // 方法1: 立即滚动到顶部
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  
  // 方法2: 使用requestAnimationFrame确保在下一帧执行
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // 方法3: 使用现代API
    if ('scrollTo' in window) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
    
    // 方法4: 延迟执行，确保DOM完全更新
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // 查找所有可能的滚动容器并重置
      const scrollableElements = document.querySelectorAll('*');
      scrollableElements.forEach(element => {
        if (element && element.scrollTop > 0) {
          element.scrollTop = 0;
        }
      });
      
      // 特别处理一些常见的滚动容器
      const commonScrollContainers = [
        '.page-container',
        '.questionnaire-content',
        '.pageContainer',
        '[data-scroll-container]',
        'main',
        'section'
      ];
      
      commonScrollContainers.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element && element.scrollTop > 0) {
            element.scrollTop = 0;
          }
        });
      });
    }, 150);
  });
};

/**
 * 滚动到指定元素
 * @param {string|Element} target - 目标元素的选择器或元素本身
 * @param {boolean} smooth - 是否使用平滑滚动，默认为true
 */
export const scrollToElement = (target, smooth = true) => {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  
  if (element) {
    const behavior = smooth ? 'smooth' : 'auto';
    element.scrollIntoView({ behavior, block: 'start' });
  }
};

/**
 * 检查元素是否在视口中
 * @param {Element} element - 要检查的元素
 * @returns {boolean} 元素是否在视口中
 */
export const isElementInViewport = (element) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};