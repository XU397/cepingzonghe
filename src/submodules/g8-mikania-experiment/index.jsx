/**
 * 薇甘菊防治实验子模块定义
 *
 * SubmoduleDefinition for g8-mikania-experiment
 */

import Component from './Component';
import { clearModuleStorage } from './Component';
import {
  getNavigationMode,
  getTotalSteps,
  getDefaultTimers,
  getInitialPage,
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
  return getInitialPage(modulePageNum);
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
