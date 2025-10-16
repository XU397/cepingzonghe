/**
 * 页面映射工具
 * 处理页码与页面ID、导航模式的映射关系
 */

import { PAGE_MAPPING } from '../config.js';

/**
 * 获取下一页的页码
 *
 * @param {number|string} currentPage - 当前页码(如 0.1, 1, 2, ...)
 * @returns {number|string|null} 下一页页码, 如果是最后一页则返回null
 */
export function getNextPage(currentPage) {
  const pageNum = parseFloat(currentPage);

  // 特殊处理过渡页
  if (pageNum === 0.1) return 1; // 注意事项 → 第1页
  if (pageNum === 0.2) return 14; // 问卷说明 → 第14页

  // 正常页面递增
  if (pageNum >= 1 && pageNum <= 12) return pageNum + 1; // 第1-12页
  if (pageNum === 13) return 0.2; // 第13页 → 问卷说明
  if (pageNum >= 14 && pageNum <= 20) return pageNum + 1; // 第14-20页
  if (pageNum === 21) return 22; // 第21页 → 完成页

  // 完成页(最后一页)
  if (pageNum === 22) return null;

  console.warn(`[pageMapping] 未知页码: ${currentPage}`);
  return null;
}

/**
 * 获取页面描述
 *
 * @param {number|string} pageNum - 页码
 * @returns {string} 页面描述
 */
export function getPageDesc(pageNum) {
  const page = PAGE_MAPPING[parseFloat(pageNum)];
  return page ? page.desc : `未知页面(${pageNum})`;
}

/**
 * 获取页面导航模式
 *
 * @param {number|string} pageNum - 页码
 * @returns {'hidden'|'experiment'|'questionnaire'} 导航模式
 */
export function getNavigationMode(pageNum) {
  const page = PAGE_MAPPING[parseFloat(pageNum)];
  return page ? page.navigationMode : 'hidden';
}

/**
 * 获取页面ID
 *
 * @param {number|string} pageNum - 页码
 * @returns {string} 页面ID
 */
export function getPageId(pageNum) {
  const page = PAGE_MAPPING[parseFloat(pageNum)];
  return page ? page.pageId : 'unknown-page';
}

/**
 * 获取页面在当前部分的相对位置(用于导航显示)
 *
 * @param {number|string} pageNum - 页码
 * @returns {{currentPage: number, totalPages: number}} 相对页码信息
 */
export function getRelativePageInfo(pageNum) {
  const page = PAGE_MAPPING[parseFloat(pageNum)];

  if (!page || page.navigationMode === 'hidden') {
    return { currentPage: 0, totalPages: 0 }; // 无导航
  }

  const num = parseFloat(pageNum);

  if (page.navigationMode === 'experiment') {
    // 人机交互部分: 第1-13页
    return { currentPage: num, totalPages: 13 };
  }

  if (page.navigationMode === 'questionnaire') {
    // 问卷部分: 第14-21页 映射为 第1-8页
    return { currentPage: num - 13, totalPages: 8 };
  }

  return { currentPage: 0, totalPages: 0 };
}

/**
 * 根据后端返回的pageNum获取初始页面ID
 *
 * @param {string|number} pageNum - 后端返回的页码(支持小数, 如 "0.1", "3.5", "14")
 * @returns {string} 页面ID
 */
export function getInitialPage(pageNum) {
  if (!pageNum) {
    return getPageId(0.1); // 默认跳转注意事项页
  }

  const num = parseFloat(pageNum);

  // 处理小数页码(如 "0.1", "0.2", "3.5" 等)
  // 后端存储格式: 页码 × 100 (如 "3.5" 存储为 350)
  // 前端接收到的已经是字符串格式, 直接使用

  if (num === 0.1 || num === 0.2) {
    return getPageId(num); // 过渡页
  }

  if (num >= 1 && num <= 22) {
    return getPageId(Math.floor(num)); // 正式页面(取整)
  }

  console.warn(`[pageMapping] 无效的页码: ${pageNum}, 默认跳转注意事项页`);
  return getPageId(0.1); // 默认
}
