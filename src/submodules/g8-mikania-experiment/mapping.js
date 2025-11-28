/**
 * 薇甘菊防治实验子模块页面映射
 *
 * 本模块共7个页面:
 * - Page 00 (注意事项) - hidden
 * - Page 01 (任务背景) - hidden
 * - Page 02-06 (实验流程) - experiment (5步导航)
 */

// 页面映射表 (subPageNum -> pageId)
export const PAGE_MAP = {
  '1': 'page_00_notice',
  '2': 'page_01_intro',
  '3': 'page_02_step_q1',
  '4': 'page_03_sim_exp',
  '5': 'page_04_q2_data',
  '6': 'page_05_q3_trend',
  '7': 'page_06_q4_conc',
};

// 反向映射 (pageId -> subPageNum)
export const PAGE_TO_NUM = {
  'page_00_notice': '1',
  'page_01_intro': '2',
  'page_02_step_q1': '3',
  'page_03_sim_exp': '4',
  'page_04_q2_data': '5',
  'page_05_q3_trend': '6',
  'page_06_q4_conc': '7',
};

// 页面到导航步骤的映射 (hidden 页面不计入步数)
export const PAGE_TO_STEP = {
  'page_00_notice': 0,       // hidden，不占步数（注意事项页）
  'page_01_intro': 1,        // 导航第 1 步（任务背景页）
  'page_02_step_q1': 2,      // 导航第 2 步
  'page_03_sim_exp': 3,      // 导航第 3 步
  'page_04_q2_data': 4,      // 导航第 4 步
  'page_05_q3_trend': 5,     // 导航第 5 步
  'page_06_q4_conc': 6,      // 导航第 6 步
};

// 导航模式映射
export const PAGE_MODES = {
  'page_00_notice': 'hidden',
  'page_01_intro': 'experiment',
  'page_02_step_q1': 'experiment',
  'page_03_sim_exp': 'experiment',
  'page_04_q2_data': 'experiment',
  'page_05_q3_trend': 'experiment',
  'page_06_q4_conc': 'experiment',
};

// 页面顺序
export const PAGE_ORDER = [
  'page_00_notice',
  'page_01_intro',
  'page_02_step_q1',
  'page_03_sim_exp',
  'page_04_q2_data',
  'page_05_q3_trend',
  'page_06_q4_conc',
];

// 默认计时配置 (20分钟)
export const TASK_DURATION = 20 * 60; // 1200秒

// 页面描述映射
export const PAGE_DESC_MAP = {
  'page_00_notice': '注意事项',
  'page_01_intro': '任务背景',
  'page_02_step_q1': '实验步骤',
  'page_03_sim_exp': '模拟实验',
  'page_04_q2_data': '数据分析',
  'page_05_q3_trend': '趋势分析',
  'page_06_q4_conc': '结论验证',
};

// 问题编码映射 (Q1 -> 1, Q2 -> 2, 等)
export const QUESTION_CODE_MAP = {
  Q1: 1,
  Q2: 2,
  Q3: 3,
  Q4a: 4,
  Q4b: 5,
};

// 答案键到问题ID的映射
export const ANSWER_KEY_TO_QUESTION = {
  'Q1_控制变量原因': 'Q1',
  'Q2_抑制作用浓度': 'Q2',
  'Q3_发芽率趋势': 'Q3',
  'Q4a_菟丝子有效性': 'Q4a',
  'Q4b_结论理由': 'Q4b',
};

/**
 * 根据子页码获取初始页面 ID
 * Supports two input formats:
 * 1. Page ID (string like "page_00_notice") - returns directly
 * 2. Page number (number or numeric string like 1, "1") - looks up in PAGE_MAP
 *
 * @param {string | number} subPageNum - 子模块内页码或页面ID
 * @returns {string} 页面 ID
 */
export function getInitialPage(subPageNum) {
  if (!subPageNum) {
    console.warn(`[g8-mikania-experiment] Invalid subPageNum: ${subPageNum}, fallback to page_00_notice`);
    return 'page_00_notice';
  }

  // If already a valid pageId (string starting with "page_"), return it directly
  if (typeof subPageNum === 'string' && subPageNum.startsWith('page_')) {
    return subPageNum;
  }

  // Otherwise treat as numeric page number and look up in PAGE_MAP
  if (!PAGE_MAP[subPageNum]) {
    console.warn(`[g8-mikania-experiment] Invalid subPageNum: ${subPageNum}, fallback to page_00_notice`);
    return 'page_00_notice';
  }
  return PAGE_MAP[subPageNum];
}

/**
 * 获取导航模式
 * @param {string} pageId - 页面 ID
 * @returns {'experiment' | 'questionnaire' | 'hidden'}
 */
export function getNavigationMode(pageId) {
  return PAGE_MODES[pageId] || 'experiment';
}

/**
 * 获取下一个页面 ID
 * @param {string} currentPageId - 当前页面 ID
 * @returns {string | null} 下一个页面 ID，如果已是最后一页则返回 null
 */
export function getNextPageId(currentPageId) {
  const currentIndex = PAGE_ORDER.indexOf(currentPageId);
  if (currentIndex === -1 || currentIndex >= PAGE_ORDER.length - 1) {
    return null;
  }
  return PAGE_ORDER[currentIndex + 1];
}

/**
 * 根据页面 ID 获取子模块内页码
 * @param {string | null | undefined} pageId - 页面 ID
 * @returns {string} 子模块内页码
 */
export function getPageSubNum(pageId) {
  if (!pageId) {
    return '1';
  }
  return PAGE_TO_NUM[pageId] || '1';
}

/**
 * 获取总步数 (不含 hidden 引导页)
 * @returns {number}
 */
export function getTotalSteps() {
  return 6;
}

/**
 * 获取当前步骤索引 (用于导航显示)
 * @param {string} pageId - 页面 ID
 * @returns {number}
 */
export function getStepIndex(pageId) {
  return PAGE_TO_STEP[pageId] || 0;
}

/**
 * 检查是否是最后一页
 * @param {string} pageId - 页面 ID
 * @returns {boolean}
 */
export function isLastPage(pageId) {
  return pageId === 'page_06_q4_conc';
}

/**
 * 检查是否是第一页
 * @param {string} pageId - 页面 ID
 * @returns {boolean}
 */
export function isFirstPage(pageId) {
  return pageId === 'page_00_notice';
}

/**
 * 获取默认计时器配置
 * @returns {{ task: number }}
 */
export function getDefaultTimers() {
  return {
    task: TASK_DURATION,
  };
}

/**
 * 解析页码为页面ID (供Flow持久化/恢复使用)
 * Supports two input formats:
 * 1. Page ID (string like "page_00_notice") - returns directly
 * 2. Page number (number or numeric string like 1, "1") - looks up in PAGE_MAP
 *
 * @param {string | number | null | undefined} subPageNum - 子模块内页码或页面ID
 * @returns {string} 页面ID
 */
export function resolvePageNum(subPageNum) {
  if (subPageNum == null || subPageNum === undefined) {
    return 'page_00_notice';
  }

  // If already a valid pageId (string starting with "page_"), return it directly
  if (typeof subPageNum === 'string' && subPageNum.startsWith('page_')) {
    return subPageNum;
  }

  const pageNumStr = String(subPageNum);
  const pageId = PAGE_MAP[pageNumStr];

  if (!pageId) {
    console.warn(`[g8-mikania-experiment] Invalid subPageNum: ${subPageNum}, fallback to page_00_notice`);
    return 'page_00_notice';
  }

  return pageId;
}
