/**
 * 薇甘菊防治实验子模块页面映射
 *
 * 本模块共7个页面:
 * - Page 00 (注意事项) - hidden
 * - Page 01-06 (实验流程) - experiment (6步导航)
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
  'page_01_intro': 1,        // 导航第 1 步（任务背景）
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

/**
 * 根据子页码获取初始页面 ID
 * @param {string} subPageNum - 子模块内页码
 * @returns {string} 页面 ID
 */
export function getInitialPage(subPageNum) {
  if (!subPageNum || !PAGE_MAP[subPageNum]) {
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
