export type PageId =
  | 'instructions_cover'
  | 'background_notice'
  | 'experiment_design'
  | 'tutorial_simulation'
  | 'experiment_task1'
  | 'experiment_task2'
  | 'conclusion_analysis';

export type NavigationMode = 'hidden' | 'experiment' | 'questionnaire';

export interface PageConfig {
  subPageNum: number;
  pageId: PageId;
  type: 'notice' | 'experiment';
  navigationMode: NavigationMode;
  stepIndex: number; // 0 for hidden pages
  pageDesc: string;
}

export const PAGE_CONFIGS: PageConfig[] = [
  {
    subPageNum: 1,
    pageId: 'instructions_cover',
    type: 'notice',
    navigationMode: 'hidden',
    stepIndex: 0,
    pageDesc: '任务C：光伏治沙封面'
  },
  {
    subPageNum: 2,
    pageId: 'background_notice',
    type: 'notice',
    navigationMode: 'experiment',
    stepIndex: 1,
    pageDesc: '背景引入说明'
  },
  {
    subPageNum: 3,
    pageId: 'experiment_design',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 2,
    pageDesc: '实验方案设计'
  },
  {
    subPageNum: 4,
    pageId: 'tutorial_simulation',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 3,
    pageDesc: '模拟实验操作指引'
  },
  {
    subPageNum: 5,
    pageId: 'experiment_task1',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 4,
    pageDesc: '实验探究-1'
  },
  {
    subPageNum: 6,
    pageId: 'experiment_task2',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 5,
    pageDesc: '实验探究-2'
  },
  {
    subPageNum: 7,
    pageId: 'conclusion_analysis',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 6,
    pageDesc: '结论分析'
  },
];

// 根据 subPageNum 获取 pageId
export function getPageIdBySubPageNum(subPageNum: number): PageId {
  const config = PAGE_CONFIGS.find(c => c.subPageNum === subPageNum);
  return config?.pageId ?? 'instructions_cover';
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

export const getAllPageIds = (): PageId[] => {
  return PAGE_CONFIGS.map(c => c.pageId);
};

/**
 * 根据 subPageNum 获取初始页面 ID（用于页面恢复）
 * @param subPageNum - 页面编号（可选，支持浮点数）
 * @returns 页面 ID
 *
 * 规则：
 * - 无参数或 <= 1：返回第一页
 * - 在范围内：返回对应页面
 * - 超出范围：返回最后一页
 * - 浮点数：向下取整
 */
export function getInitialPageId(subPageNum?: number): PageId {
  // 无参数或无效值，返回第一页
  if (subPageNum === undefined || subPageNum <= 1) {
    return PAGE_CONFIGS[0].pageId;
  }

  // 浮点数向下取整
  const pageNum = Math.floor(subPageNum);

  // 查找对应的页面配置
  const config = PAGE_CONFIGS.find(c => c.subPageNum === pageNum);

  // 如果找到，返回对应页面；否则返回最后一页
  if (config) {
    return config.pageId;
  }

  // 超出范围，返回最后一页
  return PAGE_CONFIGS[PAGE_CONFIGS.length - 1].pageId;
}