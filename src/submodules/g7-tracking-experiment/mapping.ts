import { PAGE_MAPPING, EXPERIMENT_DURATION } from '@/modules/grade-7-tracking/config';

const EXPERIMENT_MIN_PAGE = 1;
const EXPERIMENT_MAX_PAGE = 13;

const DEFAULT_EXPERIMENT_PAGE_ID = PAGE_MAPPING[EXPERIMENT_MIN_PAGE]?.pageId || 'Page_01_Intro';

export function getInitialPage(subPageNum: string): string {
  const parsed = parseInt(subPageNum, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_EXPERIMENT_PAGE_ID;
  }

  const bounded = Math.min(Math.max(parsed, EXPERIMENT_MIN_PAGE), EXPERIMENT_MAX_PAGE);
  return PAGE_MAPPING[bounded]?.pageId || DEFAULT_EXPERIMENT_PAGE_ID;
}

export function getTotalSteps(): number {
  return EXPERIMENT_MAX_PAGE - EXPERIMENT_MIN_PAGE + 1;
}

export function getNavigationMode(): 'experiment' {
  return 'experiment';
}

export function getDefaultTimers(): { task: number } {
  return {
    task: EXPERIMENT_DURATION,
  };
}

export function getPageNumByPageId(pageId: string | null | undefined): string | null {
  if (!pageId) {
    return String(EXPERIMENT_MIN_PAGE);
  }

  const entry = Object.entries(PAGE_MAPPING).find(
    ([key, info]) =>
      info.pageId === pageId &&
      Number(key) >= EXPERIMENT_MIN_PAGE &&
      Number(key) <= EXPERIMENT_MAX_PAGE,
  );

  if (!entry) {
    return String(EXPERIMENT_MIN_PAGE);
  }

  return String(entry[0]);
}
