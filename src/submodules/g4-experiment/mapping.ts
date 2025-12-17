import {
  DEFAULT_PAGE_ID,
  EXPERIMENT_DURATION_SECONDS,
  MAX_PAGE,
  MIN_PAGE,
  PAGE_CONFIG_MAP,
  PAGE_ID_MAP,
  VISIBLE_PAGE_COUNT,
} from './constants/pageConfig';

export type NavigationMode = 'hidden' | 'experiment';

export type PageId =
  | 'notices'
  | 'scenario-intro'
  | 'problem-identification'
  | 'factor-analysis'
  | 'route-analysis'
  | 'station-recommendation'
  | 'timeline-planning-tutorial'
  | 'user-solution-design'
  | 'plan-optimization'
  | 'ticket-filter'
  | 'ticket-pricing'
  | 'task-completion';

const clampPageNum = (value: number): number => Math.min(Math.max(value, MIN_PAGE), MAX_PAGE);

export function getInitialPage(subPageNum: string): string {
  const parsed = parseInt(subPageNum, 10);
  if (Number.isNaN(parsed)) {
    console.warn(`[g4-experiment] Invalid subPageNum "${subPageNum}", falling back to default page`);
    return DEFAULT_PAGE_ID;
  }
  const bounded = clampPageNum(parsed);
  if (parsed !== bounded) {
    console.warn(`[g4-experiment] subPageNum ${parsed} out of range [${MIN_PAGE}, ${MAX_PAGE}], clamped to ${bounded}`);
  }
  const pageId = PAGE_CONFIG_MAP[bounded]?.pageId;
  if (!pageId) {
    console.warn(`[g4-experiment] No page config for subPageNum ${bounded}, falling back to default page`);
    return DEFAULT_PAGE_ID;
  }
  return pageId;
}

export function getTotalSteps(): number {
  return VISIBLE_PAGE_COUNT;
}

export function getNavigationMode(pageId: string): NavigationMode {
  const entry = PAGE_ID_MAP[pageId];
  if (!entry) {
    return 'experiment';
  }
  return entry.mode === 'hidden' ? 'hidden' : 'experiment';
}

export function getSubPageNumByPageId(pageId: string | null | undefined): number {
  if (!pageId) {
    return MIN_PAGE;
  }
  const entry = PAGE_ID_MAP[pageId];
  if (!entry) {
    return MIN_PAGE;
  }
  return entry.subPageNum;
}

/**
 * 返回当前页面对应的可见步骤索引（用于左侧导航高亮）。
 * - hidden 页面返回 0
 * - experiment 页面从 1 开始递增
 */
export function getStepIndex(pageId: string | null | undefined): number {
  if (!pageId) {
    return 0;
  }
  const entry = PAGE_ID_MAP[pageId];
  if (!entry || entry.mode === 'hidden') {
    return 0;
  }

  let visibleIndex = 0;
  const currentSubPageNum = entry.subPageNum;
  for (let pageNum = MIN_PAGE; pageNum <= currentSubPageNum; pageNum += 1) {
    const config = PAGE_CONFIG_MAP[pageNum];
    if (config && config.mode !== 'hidden') {
      visibleIndex += 1;
    }
  }
  return visibleIndex;
}

export function getNextPageId(pageId: string | null | undefined): string | null {
  if (!pageId) {
    return null;
  }
  const entry = PAGE_ID_MAP[pageId];
  if (!entry) {
    return null;
  }

  const nextSubPageNum = entry.subPageNum + 1;
  if (nextSubPageNum > MAX_PAGE) {
    return null;
  }

  const nextConfig = PAGE_CONFIG_MAP[nextSubPageNum];
  return nextConfig?.pageId || null;
}

export function getDefaultTimers(): { task: number } {
  return { task: EXPERIMENT_DURATION_SECONDS };
}

export function getPageNumByPageId(pageId: string | null | undefined): string | null {
  if (!pageId) {
    return String(MIN_PAGE);
  }
  const entry = PAGE_ID_MAP[pageId];
  if (!entry) {
    return String(MIN_PAGE);
  }
  return String(entry.subPageNum);
}

export const getPageConfigById = (pageId: string | null | undefined) => {
  if (!pageId) return null;
  return PAGE_ID_MAP[pageId] || null;
};
