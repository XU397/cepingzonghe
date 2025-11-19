import {
  PageMapping,
  getTargetPageIdFromPageNum,
  getTotalPages,
  getPageNumFromPageId,
} from '@/shared/utils/pageMapping';

/**
 * 7年级蒸馒头实验 - 页码映射
 * 将子页码映射到页面 ID
 */

/**
 * 页码映射表
 * 子页码（后端返回）=> 页面 ID（内部使用）
 * 使用共享工具时务必提供 default，确保越界/缺失回落到注意事项页
 */
export const PAGE_MAPPING: PageMapping = {
  default: 'Page_01_Precautions',
  '1': 'Page_01_Precautions', // 注意事项
  '2': 'Page_02_Introduction',
  '3': 'Page_03_Dialogue_Question',
  '4': 'Page_04_Material_Reading_Factor_Selection',
  '5': 'Page_10_Hypothesis_Focus',
  '6': 'Page_11_Solution_Design_Measurement_Ideas',
  '7': 'Page_12_Solution_Evaluation_Measurement_Critique',
  '8': 'Page_13_Transition_To_Simulation',
  '9': 'Page_14_Simulation_Intro_Exploration',
  '10': 'Page_15_Simulation_Question_1',
  '11': 'Page_16_Simulation_Question_2',
  '12': 'Page_17_Simulation_Question_3',
  '13': 'Page_18_Solution_Selection',
  '14': 'Page_19_Task_Completion',
};

/**
 * 根据子页码获取初始页面 ID
 */
export function getInitialPage(subPageNum: string): string {
  return getTargetPageIdFromPageNum(subPageNum, PAGE_MAPPING);
}

/**
 * 获取总步数
 */
export function getTotalSteps(): number {
  return getTotalPages(PAGE_MAPPING);
}

/**
 * 获取导航模式
 * - 注意事项页（Page_01_Precautions）为导航隐藏模式 hidden
 * - 其他页面均为 experiment 模式
 */
export function getNavigationMode(pageId: string): 'experiment' | 'questionnaire' | 'hidden' {
  if (pageId === 'Page_01_Precautions') {
    return 'hidden';
  }
  return 'experiment';
}

/**
 * 获取默认计时器配置
 */
export function getDefaultTimers(): { task?: number; questionnaire?: number } {
  return {
    task: 40 * 60, // 40分钟
  };
}

/**
 * 根据页面ID获取对应的子页码
 */
export function getPageNumByPageId(pageId: string | null | undefined): string | null {
  if (!pageId) {
    return null;
  }
  return getPageNumFromPageId(pageId, PAGE_MAPPING);
}
