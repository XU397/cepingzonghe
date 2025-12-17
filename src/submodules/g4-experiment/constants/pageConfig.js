// 页面配置：g4-experiment
// 12 个页面，notices 为隐藏导航，其余为实验模式

export const DEFAULT_PAGE_ID = 'notices';
export const MIN_PAGE = 1;
export const MAX_PAGE = 12;
export const EXPERIMENT_DURATION_SECONDS = 40 * 60; // 2400 秒

export const PAGE_CONFIGS = [
  { pageId: 'notices', subPageNum: 1, mode: 'hidden', description: '注意事项' },
  { pageId: 'scenario-intro', subPageNum: 2, mode: 'experiment', description: '情景介绍' },
  { pageId: 'problem-identification', subPageNum: 3, mode: 'experiment', description: '问题识别' },
  { pageId: 'factor-analysis', subPageNum: 4, mode: 'experiment', description: '因素分析' },
  { pageId: 'route-analysis', subPageNum: 5, mode: 'experiment', description: '出发站交互' },
  { pageId: 'station-recommendation', subPageNum: 6, mode: 'experiment', description: '出发站结论' },
  { pageId: 'timeline-planning-tutorial', subPageNum: 7, mode: 'experiment', description: '拖拽演示' },
  { pageId: 'user-solution-design', subPageNum: 8, mode: 'experiment', description: '方案设计' },
  { pageId: 'plan-optimization', subPageNum: 9, mode: 'experiment', description: '方案评估' },
  { pageId: 'ticket-filter', subPageNum: 10, mode: 'experiment', description: '车票筛选' },
  { pageId: 'ticket-pricing', subPageNum: 11, mode: 'experiment', description: '车票计价' },
  { pageId: 'task-completion', subPageNum: 12, mode: 'experiment', description: '完成页' },
];

export const PAGE_CONFIG_MAP = PAGE_CONFIGS.reduce((map, config) => {
  map[config.subPageNum] = config;
  return map;
}, {});

export const PAGE_ID_MAP = PAGE_CONFIGS.reduce((map, config) => {
  map[config.pageId] = config;
  return map;
}, {});

export const VISIBLE_PAGE_COUNT = PAGE_CONFIGS.filter(
  (config) => config.mode !== 'hidden'
).length;
