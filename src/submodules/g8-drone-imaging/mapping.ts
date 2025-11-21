export type PageId =
  | 'cover'
  | 'background'
  | 'hypothesis'
  | 'experiment_free'
  | 'focal_analysis'
  | 'height_analysis'
  | 'conclusion';

export type NavigationMode = 'hidden' | 'experiment' | 'questionnaire';

export interface PageConfig {
  subPageNum: number;
  pageId: PageId;
  type: 'notice' | 'experiment';
  navigationMode: NavigationMode;
  stepIndex: number;
}

export const PAGE_CONFIGS: PageConfig[] = [
  { subPageNum: 1, pageId: 'cover', type: 'notice', navigationMode: 'hidden', stepIndex: 0 },
  { subPageNum: 2, pageId: 'background', type: 'experiment', navigationMode: 'experiment', stepIndex: 1 },
  { subPageNum: 3, pageId: 'hypothesis', type: 'experiment', navigationMode: 'experiment', stepIndex: 2 },
  { subPageNum: 4, pageId: 'experiment_free', type: 'experiment', navigationMode: 'experiment', stepIndex: 3 },
  { subPageNum: 5, pageId: 'focal_analysis', type: 'experiment', navigationMode: 'experiment', stepIndex: 4 },
  { subPageNum: 6, pageId: 'height_analysis', type: 'experiment', navigationMode: 'experiment', stepIndex: 5 },
  { subPageNum: 7, pageId: 'conclusion', type: 'experiment', navigationMode: 'experiment', stepIndex: 6 },
];

// 根据 subPageNum 获取 pageId
export function getPageIdBySubPageNum(subPageNum: number): PageId {
  const config = PAGE_CONFIGS.find(c => c.subPageNum === subPageNum);
  return config?.pageId ?? 'cover';
}

// 根据 pageId 获取 subPageNum
export function getSubPageNumByPageId(pageId: PageId): number {
  const config = PAGE_CONFIGS.find(c => c.pageId === pageId);
  return config?.subPageNum ?? 1;
}

// 根据 pageId 获取配置
export function getPageConfig(pageId: PageId): PageConfig | undefined {
  return PAGE_CONFIGS.find(c => c.pageId === pageId);
}
