/**
 * 薇甘菊防治实验子模块定义
 *
 * SubmoduleDefinition for g8-mikania-experiment
 */

import Component from './Component';
import { clearModuleStorage } from './Component';
import {
  PAGE_MAP,
  getNavigationMode,
  getTotalSteps,
  getDefaultTimers,
  resolvePageNum,
} from './mapping';

/**
 * Get initial page ID from modulePageNum
 * Handles edge cases for null/undefined/invalid values
 *
 * Supports two input formats:
 * 1. Page ID (string like "page_00_notice") - returns directly
 * 2. Page number (number or numeric string like 1, "1") - looks up in PAGE_MAP
 *
 * @param {string|number|null|undefined} modulePageNum - Page number or page ID from flow context
 * @returns {string} Page ID to start from
 */
function getInitialPageFromNum(modulePageNum) {
  // Handle null/undefined
  if (modulePageNum == null || modulePageNum === undefined) {
    console.log('[g8-mikania-experiment] No modulePageNum provided, starting from page_00_notice');
    return 'page_00_notice';
  }

  // If already a valid pageId (string starting with "page_"), return it directly
  if (typeof modulePageNum === 'string' && modulePageNum.startsWith('page_')) {
    console.log(`[g8-mikania-experiment] Received pageId directly: ${modulePageNum}`);
    return modulePageNum;
  }

  // Convert to number for validation
  const pageNum = Number(modulePageNum);

  // Handle invalid numbers (NaN, negative, zero, or out of range)
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 7) {
    console.warn(`[g8-mikania-experiment] Invalid modulePageNum: ${modulePageNum}, falling back to page_00_notice`);
    return 'page_00_notice';
  }

  // Convert number to string for PAGE_MAP lookup
  const pageNumStr = String(pageNum);

  // Look up in PAGE_MAP
  const pageId = PAGE_MAP[pageNumStr];

  if (!pageId) {
    console.warn(`[g8-mikania-experiment] No page found for pageNum: ${pageNumStr}, starting from page_00_notice`);
    return 'page_00_notice';
  }

  console.log(`[g8-mikania-experiment] Resolved modulePageNum ${modulePageNum} to ${pageId}`);
  return pageId;
}

export const g8MikaniaExperimentSubmodule = {
  // 基本信息
  submoduleId: 'g8-mikania-experiment',
  displayName: '8年级薇甘菊防治-交互实验',
  version: '1.1.0',

  // 主组件
  Component,

  // CMI接口
  getInitialPage: getInitialPageFromNum,
  resolvePageNum, // For Flow persistence/recovery
  getTotalSteps,
  getNavigationMode,

  // 默认计时器配置 (20分钟)
  getDefaultTimers,

  // 生命周期钩子
  onInitialize: () => {
    console.log('[g8-mikania-experiment] Module initialized');
  },

  onDestroy: () => {
    console.log('[g8-mikania-experiment] Module destroyed');
    // Clear localStorage on module destroy
    clearModuleStorage();
  },
};

export default g8MikaniaExperimentSubmodule;
