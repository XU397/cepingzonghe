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
} from './mapping';

/**
 * Get initial page ID from modulePageNum
 * Handles edge cases for null/undefined/invalid values
 *
 * @param {string|number|null|undefined} modulePageNum - Page number from flow context
 * @returns {string} Page ID to start from
 */
function getInitialPageFromNum(modulePageNum) {
  // Handle null/undefined
  if (modulePageNum == null || modulePageNum === undefined) {
    console.log('[g8-mikania-experiment] No modulePageNum provided, starting from page_00_notice');
    return 'page_00_notice';
  }

  // Convert to number for validation
  const pageNum = Number(modulePageNum);

  // Handle invalid numbers (NaN, negative, zero, or out of range)
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 7) {
    console.warn(`[g8-mikania-experiment] Invalid modulePageNum: ${modulePageNum}, starting from page_00_notice`);
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
