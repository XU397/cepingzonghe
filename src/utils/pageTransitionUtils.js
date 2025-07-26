/**
 * 页面切换工具函数
 * 专门处理页面切换时的滚动重置和其他过渡效果
 */

/**
 * 强制重置所有滚动位置到顶部
 * 这个函数会查找并重置页面中所有可能的滚动容器
 */
export const forceScrollToTop = () => {
  console.log('[PageTransition] 开始强制滚动到顶部');
  
  // 方法1: 重置主要的滚动元素
  const mainScrollElements = [
    window,
    document.documentElement,
    document.body
  ];
  
  mainScrollElements.forEach(element => {
    if (element === window) {
      element.scrollTo(0, 0);
    } else if (element && typeof element.scrollTop !== 'undefined') {
      element.scrollTop = 0;
    }
  });
  
  // 方法2: 查找所有具有滚动的元素
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    if (element.scrollTop > 0) {
      element.scrollTop = 0;
    }
    if (element.scrollLeft > 0) {
      element.scrollLeft = 0;
    }
  });
  
  // 方法3: 特别处理常见的滚动容器类名
  const commonScrollSelectors = [
    '.page-content',
    '.page-container',
    '.pageContainer',
    '.questionnaire-content',
    '.questionnaireContent',
    '.main-content',
    '.content-wrapper',
    '.scroll-container',
    '[data-scroll]',
    'main',
    'section',
    'article',
    '.container'
  ];
  
  commonScrollSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element) {
        element.scrollTop = 0;
        element.scrollLeft = 0;
      }
    });
  });
  
  console.log('[PageTransition] 滚动重置完成');
};

/**
 * 使用多种方法确保页面滚动到顶部
 * 包括立即执行、requestAnimationFrame和延迟执行
 */
export const ensureScrollToTop = () => {
  console.log('[PageTransition] 开始确保滚动到顶部');
  
  // 立即执行
  forceScrollToTop();
  
  // 在下一帧执行
  requestAnimationFrame(() => {
    forceScrollToTop();
    
    // 使用现代API
    if ('scrollTo' in window) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto'
      });
    }
    
    // 延迟执行，确保DOM完全更新
    setTimeout(() => {
      forceScrollToTop();
      
      // 最后一次确保
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      console.log('[PageTransition] 最终滚动位置:', {
        windowScrollY: window.scrollY,
        documentScrollTop: document.documentElement.scrollTop,
        bodyScrollTop: document.body.scrollTop
      });
    }, 300);
  });
};

/**
 * 页面切换时的完整处理
 * 包括滚动重置和其他可能需要的过渡效果
 */
export const handlePageTransition = () => {
  console.log('[PageTransition] 开始页面切换处理');
  
  // 重置滚动
  ensureScrollToTop();
  
  // 可以在这里添加其他页面切换时需要的处理
  // 比如重置焦点、清除选择等
  
  // 重置焦点到body
  if (document.activeElement && document.activeElement !== document.body) {
    document.activeElement.blur();
  }
  
  // 清除文本选择
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
  
  console.log('[PageTransition] 页面切换处理完成');
};