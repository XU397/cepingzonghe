import { PAGE_MAPPING, QUESTIONNAIRE_DURATION } from '@/modules/grade-7-tracking/config';

const QUESTIONNAIRE_PAGE_NUMBERS = [14, 15, 16, 17, 18, 19, 20, 21];
const DEFAULT_QUESTIONNAIRE_PAGE_ID = PAGE_MAPPING[QUESTIONNAIRE_PAGE_NUMBERS[0]]?.pageId || 'Questionnaire_01';

export function getInitialPage(subPageNum: string): string {
  const index = parseInt(subPageNum, 10);
  if (Number.isNaN(index) || index < 1) {
    return DEFAULT_QUESTIONNAIRE_PAGE_ID;
  }

  const boundedIndex = Math.min(index, QUESTIONNAIRE_PAGE_NUMBERS.length);
  const pageNumber = QUESTIONNAIRE_PAGE_NUMBERS[boundedIndex - 1];
  return PAGE_MAPPING[pageNumber]?.pageId || DEFAULT_QUESTIONNAIRE_PAGE_ID;
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
    return '1';
  }

  const entry = Object.entries(PAGE_MAPPING).find(
    ([key, info]) =>
      info.pageId === pageId &&
      QUESTIONNAIRE_PAGE_NUMBERS.includes(Number(key)),
  );

  if (!entry) {
    return '1';
  }

  const numericPage = QuestionPageIndex(Number(entry[0]));
  return String(numericPage);
}

function QuestionPageIndex(pageNumber: number): number {
  const idx = QUESTIONNAIRE_PAGE_NUMBERS.indexOf(pageNumber);
  return idx === -1 ? 1 : idx + 1;
}
