/**
 * 示例：子模块页码映射
 *
 * 展示如何使用 shared/utils/pageMapping 工具来实现子模块的页码映射
 */

import {
  PageMapping,
  getTargetPageIdFromPageNum,
  getTotalPages,
  getAllPageIds,
  getNextPageId,
  getPrevPageId,
  getCurrentStep,
  parseCompositePageNum,
  buildCompositePageNum,
} from '@/shared/utils/pageMapping';

// ==================== 页码映射表 ====================

/**
 * 页码到页面ID的映射表
 *
 * 注意：
 * - 页码从 1 开始（与后端协议一致）
 * - "default" 键用于指定默认页（注意事项页或首页）
 */
export const PAGE_MAPPING: PageMapping = {
  // 默认页（当页码无效或缺失时使用）
  default: 'notices',

  // 注意事项页
  '1': 'notices',

  // 介绍页
  '2': 'intro',

  // 问卷须知
  '3': 'questionnaire-notice',

  // 问题页
  '4': 'question-1',
  '5': 'question-2',
  '6': 'question-3',

  // 资源页
  '7': 'resource',

  // 假设页
  '8': 'hypothesis',

  // 设计页
  '9': 'design',

  // 评价页
  '10': 'evaluation',

  // 过渡页
  '11': 'transition',

  // 实验页
  '12': 'experiment',

  // 总结页
  '13': 'summary',

  // 解决方案页
  '14': 'solution',
};

// ==================== CMI 接口实现 ====================

/**
 * 从页码获取初始页面ID
 *
 * CMI 接口要求：getInitialPage(subPageNum: string): string
 */
export function getInitialPage(subPageNum: string | null | undefined): string {
  return getTargetPageIdFromPageNum(subPageNum, PAGE_MAPPING);
}

/**
 * 获取总步数（页数）
 *
 * CMI 接口要求：getTotalSteps(): number
 */
export function getTotalSteps(): number {
  return getTotalPages(PAGE_MAPPING);
}

/**
 * 获取导航模式
 *
 * CMI 接口要求：getNavigationMode(pageId: string): 'experiment' | 'questionnaire'
 */
export function getNavigationMode(pageId: string): 'experiment' | 'questionnaire' {
  // 根据页面ID判断导航模式
  const questionnairePages = ['questionnaire-notice', 'question-1', 'question-2', 'question-3'];

  if (questionnairePages.includes(pageId)) {
    return 'questionnaire';
  }

  return 'experiment';
}

// ==================== 工具函数 ====================

/**
 * 获取下一页的页面ID
 */
export function getNextPage(currentPageId: string): string | null {
  return getNextPageId(currentPageId, PAGE_MAPPING);
}

/**
 * 获取上一页的页面ID
 */
export function getPrevPage(currentPageId: string): string | null {
  return getPrevPageId(currentPageId, PAGE_MAPPING);
}

/**
 * 获取所有页面ID（按顺序）
 */
export function getAllPages(): string[] {
  return getAllPageIds(PAGE_MAPPING);
}

/**
 * 获取当前步骤序号
 */
export function getCurrentStepIndex(pageId: string): number {
  return getCurrentStep(pageId, PAGE_MAPPING);
}

// ==================== Flow 相关工具 ====================

/**
 * 解析 Flow 中的复合页码
 *
 * 示例：
 * - "M1:5" 表示第1步的第5页
 * - "2.10" 表示第2步的第10页
 */
export function parseFlowPageNum(compositePageNum: string) {
  return parseCompositePageNum(compositePageNum);
}

/**
 * 构造 Flow 中的复合页码
 *
 * 示例：
 * - buildFlowPageNum(1, 5) → "M1:5"
 * - buildFlowPageNum(2, 10, 'dot') → "2.10"
 */
export function buildFlowPageNum(
  stepIndex: number,
  subPageNum: number,
  format: 'M' | 'dot' = 'M'
): string {
  return buildCompositePageNum(stepIndex, subPageNum, format);
}

// ==================== 使用示例 ====================

/*
// 在子模块组件中使用：

import { getInitialPage, getTotalSteps, getNavigationMode } from './mapping';

// 1. 获取初始页面（恢复进度）
const initialPageId = getInitialPage(userContext.pageNum);
console.log('Initial page:', initialPageId); // 如果 pageNum 无效，返回 "notices"

// 2. 获取总步数（用于导航组件）
const totalSteps = getTotalSteps();
console.log('Total steps:', totalSteps); // 14

// 3. 获取导航模式（用于 AssessmentPageFrame）
const navMode = getNavigationMode('question-1');
console.log('Nav mode:', navMode); // "questionnaire"

// 4. 解析 Flow 复合页码
const parsed = parseFlowPageNum("M1:5");
console.log('Parsed:', parsed); // { stepIndex: 1, subPageNum: 5 }

// 5. 获取下一页 / 上一页 / 当前步骤
const nextPage = getNextPage('intro');
console.log('Next page:', nextPage); // "questionnaire-notice"

const prevPage = getPrevPage('intro');
console.log('Prev page:', prevPage); // "notices"

const currentStep = getCurrentStepIndex('questionnaire-notice');
console.log('Current step:', currentStep); // 3
*/
