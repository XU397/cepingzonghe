import type { SubmoduleMappingConfig, PageConfig as SharedPageConfig } from '@shared/services/submission/submoduleAdapter';

export type PageId =
  | 'instructions_cover'
  | 'background_notice'
  | 'experiment_design'
  | 'tutorial_simulation'
  | 'experiment_task1'
  | 'experiment_task2'
  | 'conclusion_analysis';

export type NavigationMode = 'hidden' | 'experiment' | 'questionnaire';

export const HISTORY_CODE_BASE = 100;

// ========================================
// 规范化常量 - 符合 submodule-submission-guidelines.md
// ========================================

/**
 * 页面描述映射
 */
export const PAGE_DESC_MAP: Record<PageId, string> = {
  instructions_cover: '任务C：光伏治沙封面',
  background_notice: '背景引入说明',
  experiment_design: '实验方案设计',
  tutorial_simulation: '模拟实验操作指引',
  experiment_task1: '实验探究-1',
  experiment_task2: '实验探究-2',
  conclusion_analysis: '结论分析',
};

/**
 * 每个页面的问题列表 (答案键名)
 */
export const PAGE_QUESTIONS: Record<PageId, string[]> = {
  instructions_cover: [],
  background_notice: [],
  experiment_design: ['Q1_实验设计原因'],
  tutorial_simulation: [],
  experiment_task1: ['Q2_50cm风速区域'],
  experiment_task2: ['Q3_风速分析'],
  conclusion_analysis: ['Q4a_光伏板有效性', 'Q4b_结论理由'],
};

/**
 * 问题编码映射 (用于 answerList 的 code 字段)
 */
export const QUESTION_CODE_MAP: Record<string, number> = {
  Q1: 1,
  Q2: 2,
  Q3: 3,
  Q4a: 4,
  Q4b: 5,
};

/**
 * 答案键到问题ID的映射
 */
export const ANSWER_KEY_TO_QUESTION: Record<string, string> = {
  'Q1_实验设计原因': 'Q1',
  'Q2_50cm风速区域': 'Q2',
  'Q3_风速分析': 'Q3',
  'Q4a_光伏板有效性': 'Q4a',
  'Q4b_结论理由': 'Q4b',
};

/**
 * 问题完整文本映射 (用于 answerList 的 targetElement 字段)
 * 规范要求：answerList.targetElement 必须使用完整问题文本
 */
export const QUESTION_TEXT_MAP: Record<string, string> = {
  Q1: '问题1：为什么要在无板区和有板区分别放置两套相同的测量仪器？请写出原因。',
  Q2: '问题2：根据模拟实验，在50厘米高度，哪个区域的风速更低？',
  Q3: '问题3：根据实验数据，请分析不同高度的风速变化规律。',
  Q4a: '问题4：右图展示了不同高度的风速测量数据。请问光伏板是否能够有效改变近地表的风速环境？',
  Q4b: '请结合图中数据说明理由。',
};

/**
 * 选项文本映射 (用于格式化单选题答案为 "A. 选项文本" 格式)
 */
export const QUESTION_OPTIONS_MAP: Record<string, Record<string, string>> = {
  Q2: {
    A: '有板区',
    B: '无板区',
    withPanel: '有板区',  // 兼容原始值
    noPanel: '无板区',
  },
  Q4a: {
    A: '是',
    B: '否',
    是: '是',  // 兼容原始值
    否: '否',
  },
};

/**
 * 内部答案键到规范化答案键的映射
 * 用于将页面收集的答案键转换为规范化格式
 */
export const INTERNAL_TO_STANDARD_KEY: Record<string, string> = {
  designReason: 'Q1_实验设计原因',
  experiment1Choice: 'Q2_50cm风速区域',
  experiment2Analysis: 'Q3_风速分析',
  selectedOption: 'Q4a_光伏板有效性',
  reason: 'Q4b_结论理由',
};

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

/**
 * 格式化答案值
 * - 使用 QUESTION_OPTIONS_MAP 将原始值转换为 "A. 选项文本" 格式
 */
export function formatAnswerValue(questionId: string, rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '';
  }
  const value = String(rawValue);
  const options = QUESTION_OPTIONS_MAP[questionId];

  if (!options) {
    return value;
  }

  // 处理原始值映射（如 withPanel -> A. 有板区）
  if (value === 'withPanel') return 'A. 有板区';
  if (value === 'noPanel') return 'B. 无板区';
  if (value === '是') return 'A. 是';
  if (value === '否') return 'B. 否';

  // 处理选项标签（如 A -> A. 有板区）
  if (options[value] && ['A', 'B', 'C', 'D'].includes(value)) {
    return `${value}. ${options[value]}`;
  }

  return value;
}

export const SUBMODULE_MAPPING_CONFIG: SubmoduleMappingConfig = {
  // 完整 PageConfig 字段，符合规范 §3.1
  PAGE_CONFIGS: PAGE_CONFIGS.map((config) => ({
    pageId: config.pageId,
    subPageNum: config.subPageNum,
    title: PAGE_DESC_MAP[config.pageId] || config.pageId,
    questionKeys: PAGE_QUESTIONS[config.pageId] || [],
    // 以下为规范 §3.1 要求的完整字段（转换为扩展属性）
    type: config.type,
    navigationMode: config.navigationMode,
    stepIndex: config.stepIndex,
    pageDesc: config.pageDesc,
  } as SharedPageConfig & { type: string; navigationMode: string; stepIndex: number; pageDesc: string })),
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  getSubPageNumByPageId,
  // 可选配置
  QUESTION_OPTIONS_MAP,
  INTERNAL_TO_STANDARD_KEY,
  HISTORY_CODE_BASE,
  getPageConfig: getPageConfig as (pageId: string) => SharedPageConfig | undefined,
  formatAnswer: formatAnswerValue,
};
