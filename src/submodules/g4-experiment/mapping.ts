import {
  PageMapping,
  getTargetPageIdFromPageNum,
  getTotalPages,
  getPageNumFromPageId,
} from '@/shared/utils/pageMapping';

export const PAGE_MAPPING: PageMapping = {
  default: 'notices',
  '1': 'notices',
  '2': 'scenario-intro',
  '3': 'problem-identification',
  '4': 'factor-analysis',
  '5': 'route-analysis',
  '6': 'station-recommendation',
  '7': 'timeline-planning-tutorial',
  '8': 'user-solution-design',
  '9': 'plan-optimization',
  '10': 'ticket-filter',
  '11': 'ticket-pricing',
  '12': 'task-completion',
};

export function getInitialPage(subPageNum: string): string {
  return getTargetPageIdFromPageNum(subPageNum, PAGE_MAPPING);
}

export function getTotalSteps(): number {
  return getTotalPages(PAGE_MAPPING);
}

export function getNavigationMode(pageId: string): 'experiment' | 'questionnaire' {
  return 'experiment';
}

export function getDefaultTimers(): { task?: number; questionnaire?: number } {
  return {
    task: 40 * 60,
  };
}

export function getPageNumByPageId(pageId: string | null | undefined): string | null {
  if (!pageId) {
    return null;
  }
  return getPageNumFromPageId(pageId, PAGE_MAPPING);
}
