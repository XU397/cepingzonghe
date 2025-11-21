import { PageNumberMapping } from './types';

export const PAGE_MAPPING: PageNumberMapping = {
  'page01b-task-cover': {
    pageNumber: 'H.1b',
    pageDesc: '任务C：光伏治沙封面',
    mode: 'hidden'
  },
  'page03-background': {
    pageNumber: 'H.3',
    pageDesc: '背景引入页',
    mode: 'hidden'
  },
  'page04-experiment-design': {
    pageNumber: '1.4',
    pageDesc: '实验方案设计',
    mode: 'experiment'
  },
  'page05-tutorial': {
    pageNumber: '2.5',
    pageDesc: '操作指引试玩',
    mode: 'experiment'
  },
  'page06-experiment1': {
    pageNumber: '3.6',
    pageDesc: '实验1：50cm高度对比',
    mode: 'experiment'
  },
  'page07-experiment2': {
    pageNumber: '3.7',
    pageDesc: '实验2：多高度对比',
    mode: 'experiment'
  },
  'page08-conclusion': {
    pageNumber: '4.8',
    pageDesc: '实验结论分析',
    mode: 'experiment'
  }
};

export const getPageInfo = (pageId: string) => {
  return PAGE_MAPPING[pageId] || null;
};

export const getInitialPageId = (pageNum?: number): string => {
  if (!pageNum || pageNum <= 1) {
    return 'page01b-task-cover';
  }
  
  const pageIds = Object.keys(PAGE_MAPPING);
  const targetIndex = Math.min(Math.floor(pageNum) - 1, pageIds.length - 1);
  return pageIds[targetIndex];
};

export const getTotalSteps = (): number => {
  return Object.values(PAGE_MAPPING).filter(page => page.mode === 'experiment').length;
};

export const getNavigationMode = (pageId: string): 'hidden' | 'experiment' => {
  const pageInfo = getPageInfo(pageId);
  return pageInfo?.mode || 'experiment';
};

export const formatPageDesc = (pageId: string, flowContext?: { flowId: string; stepIndex: number }): string => {
  const pageInfo = getPageInfo(pageId);
  if (!pageInfo) return String(pageId);
  
  if (flowContext) {
    return `[${flowContext.flowId}/g8-pv-sand-experiment/${flowContext.stepIndex}] ${pageInfo.pageDesc}`;
  }
  
  return pageInfo.pageDesc;
};

const PAGE_ORDER: string[] = [
  'page01b-task-cover',
  'page03-background',
  'page04-experiment-design',
  'page05-tutorial',
  'page06-experiment1',
  'page07-experiment2',
  'page08-conclusion'
];

export const getAllPageIds = (): string[] => {
  return PAGE_ORDER;
};

export const getNextPageId = (currentPageId: string): string | null => {
  const pageIds = getAllPageIds();
  const currentIndex = pageIds.indexOf(currentPageId);
  
  if (currentIndex === -1 || currentIndex >= pageIds.length - 1) {
    return null;
  }
  
  return pageIds[currentIndex + 1];
};

export const getPreviousPageId = (currentPageId: string): string | null => {
  const pageIds = getAllPageIds();
  const currentIndex = pageIds.indexOf(currentPageId);
  
  if (currentIndex <= 0) {
    return null;
  }
  
  return pageIds[currentIndex - 1];
};