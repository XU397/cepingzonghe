import {
  PageMapping,
  getTargetPageIdFromPageNum,
  getTotalPages,
  getPageNumFromPageId,
} from '@/shared/utils/pageMapping';

/**
 * 7年级蒸馒头问卷 - 子页码映射
 * Flow 子模块内部使用 1-based 页码，映射到真实页面 ID
 */
export const PAGE_MAPPING: PageMapping = {
  default: 'Page_20_Questionnaire_Intro',
  '1': 'Page_20_Questionnaire_Intro',
  '2': 'Page_21_Curiosity_Questions',
  '3': 'Page_22_Creativity_Questions',
  '4': 'Page_23_Imagination_Questions',
  '5': 'Page_24_Science_Efficacy_Questions',
  '6': 'Page_25_Environment_Questions',
  '7': 'Page_26_School_Activities',
  '8': 'Page_27_Outschool_Activities',
  '9': 'Page_28_Effort_Submit',
};

export function getInitialPage(subPageNum: string): string {
  return getTargetPageIdFromPageNum(subPageNum, PAGE_MAPPING);
}

export function getTotalSteps(): number {
  return getTotalPages(PAGE_MAPPING);
}

export function getNavigationMode(pageId: string): 'experiment' | 'questionnaire' {
  return 'questionnaire';
}

export function getDefaultTimers(): { task?: number; questionnaire?: number } {
  return {
    questionnaire: 10 * 60, // 10分钟
  };
}

export function getPageNumByPageId(pageId: string | null | undefined): string | null {
  if (!pageId) {
    return null;
  }
  return getPageNumFromPageId(pageId, PAGE_MAPPING);
}
