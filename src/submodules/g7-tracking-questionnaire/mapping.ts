import { PAGE_MAPPING, QUESTIONNAIRE_DURATION } from '@/modules/grade-7-tracking/config';

const QUESTIONNAIRE_PAGE_NUMBERS = [0.2, 14, 15, 16, 17, 18, 19, 20, 21];
const PAGE_MAPPING_RECORD = PAGE_MAPPING as Record<string, { pageId?: string }>;
const DEFAULT_QUESTIONNAIRE_PAGE_ID =
  PAGE_MAPPING_RECORD[String(QUESTIONNAIRE_PAGE_NUMBERS[0])]?.pageId ||
  'Page_00_2_QuestionnaireIntro';

export function getInitialPage(subPageNum: string): string {
  const index = parseInt(subPageNum, 10);
  if (Number.isNaN(index) || index < 1) {
    return DEFAULT_QUESTIONNAIRE_PAGE_ID;
  }

  const boundedIndex = Math.min(index, QUESTIONNAIRE_PAGE_NUMBERS.length);
  const pageNumber = QUESTIONNAIRE_PAGE_NUMBERS[boundedIndex - 1];
  return PAGE_MAPPING_RECORD[String(pageNumber)]?.pageId || DEFAULT_QUESTIONNAIRE_PAGE_ID;
}

export function getTotalSteps(): number {
  return QUESTIONNAIRE_PAGE_NUMBERS.length;
}

export function getNavigationMode(): 'questionnaire' {
  return 'questionnaire';
}

export function getDefaultTimers(): { questionnaire: number } {
  return {
    questionnaire: QUESTIONNAIRE_DURATION,
  };
}

export function getPageNumByPageId(pageId: string | null | undefined): string | null {
  if (!pageId) {
    return null;
  }

  const entry = Object.entries(PAGE_MAPPING).find(
    ([key, info]) => info.pageId === pageId && QUESTIONNAIRE_PAGE_NUMBERS.includes(Number(key))
  );

  if (!entry) {
    return null;
  }

  const idx = QUESTIONNAIRE_PAGE_NUMBERS.indexOf(Number(entry[0]));
  return String(idx + 1);
}
