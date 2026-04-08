import type { SubmoduleMappingConfig } from '@shared/services/submission/submoduleAdapter';
import {
  DEFAULT_PAGE_ID,
  EXPERIMENT_DURATION_SECONDS,
  MAX_PAGE,
  MIN_PAGE,
  PAGE_CONFIG_MAP,
  PAGE_ID_MAP,
  VISIBLE_PAGE_COUNT,
  PAGE_CONFIGS,
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

type LocalPageConfig = {
  pageId: PageId;
  subPageNum: number;
  mode: NavigationMode;
  description: string;
};

const PAGE_CONFIGS_TYPED = PAGE_CONFIGS as LocalPageConfig[];
const PAGE_CONFIG_MAP_TYPED = PAGE_CONFIG_MAP as Record<number, LocalPageConfig | undefined>;
const PAGE_ID_MAP_TYPED = PAGE_ID_MAP as Record<string, LocalPageConfig | undefined>;

// ========================================
// Question Mapping (FR-071)
// ========================================

/**
 * 问题编号映射：问题标识符 → 数字编号
 */
export const QUESTION_CODE_MAP: Record<string, number> = {
  Q1: 1, // 问题识别
  Q2: 2, // 因素分析
  Q3a: 3, // 路线1总时长
  Q3b: 4, // 路线5总时长
  Q4a: 5, // 推荐出发站
  Q4b: 6, // 推荐理由
  Q5a: 7, // 方案一
  Q5b: 8, // 方案二
  Q6a: 9, // 方案是否最优
  Q6b: 10, // 改进方案
  Q7: 11, // 选中车次
  Q8a: 12, // 推荐车次
  Q8b: 13, // 推荐理由
  Q8c: 14, // 计算过程
  Q8d: 15, // 总票价
};

/**
 * 问题文本映射：问题标识符 → 完整问题描述
 */
export const QUESTION_TEXT_MAP: Record<string, string> = {
  Q1: '问题1：根据对话，请写出小明接下来要探究的科学问题。',
  Q2: '问题2：购买火车票时需要考虑哪些因素？（可多选）',
  Q3a: '问题3a：请填写路线1的总路程（单位：千米）。',
  Q3b: '问题3b：请填写路线5的总路程（单位：千米）。',
  Q4a: '问题4a：根据路线信息，你推荐小明从哪个车站出发？',
  Q4b: '问题4b：请说明你推荐该出发站的理由。',
  Q5a: '问题5a：请给出方案一的任务安排及总用时。',
  Q5b: '问题5b：请给出方案二的任务安排及总用时。',
  Q6a: '问题6a：小明的方案是否为用时最短方案？',
  Q6b: '问题6b：若不是最优方案，请给出你的改进方案。',
  Q7: '问题7：请筛选并填写符合妈妈要求的车次。',
  Q8a: '问题8a：请推荐一个最合适的车次。',
  Q8b: '问题8b：请说明你推荐该车次的理由。',
  Q8c: '问题8c：请填写三人总票价的计算过程。',
  Q8d: '问题8d：请填写三人总票价（单位：元）。',
};

export const QUESTION_OPTIONS_MAP: Record<string, Record<string, string>> = {
  Q2: {
    A: '小明家到出发站的路程',
    B: '火车车厢数',
    C: '成都东站到舅舅家的路程',
    D: '火车到达时间',
    E: '剩余车票数',
    F: '火车发展历史',
    'departure-distance': '小明家到出发站的路程',
    'carriage-count': '火车车厢数',
    'arrival-distance': '成都东站到舅舅家的路程',
    'arrival-time': '火车到达时间',
    'remaining-tickets': '剩余车票数',
    'train-history': '火车发展历史',
  },
  Q4a: {
    A: '南充北站',
    B: '南充站',
    南充北站: '南充北站',
    南充站: '南充站',
  },
  Q6a: {
    A: '是',
    B: '否',
    是: '是',
    否: '否',
    yes: '是',
    no: '否',
    true: '是',
    false: '否',
  },
  Q7: {
    A: 'C769',
    B: 'D175',
    C: 'C751',
    D: 'C757',
    E: 'D163',
    C769: 'C769',
    D175: 'D175',
    C751: 'C751',
    C757: 'C757',
    D163: 'D163',
  },
  Q8a: {
    A: 'D175',
    B: 'C751',
    D175: 'D175',
    C751: 'C751',
  },
};

export const INTERNAL_TO_STANDARD_KEY: Record<string, string> = {
  problemAnswer: '问题输入框',
  selectedFactors: '选中因素',
  route1: 'route1_total',
  route5: 'route5_total',
  selectedStation: '推荐出发站',
  stationReason: '推荐理由_站点',
  solution1: '方案一',
  solution2: '方案二',
  isOptimal: '方案最优',
  improvedSolution: '改进方案',
  selectedTrains: '选中车次',
  recommendedTrain: '推荐车次',
  recommendReason: '推荐理由',
  calculationProcess: '计算过程',
  totalPrice: '总票价',
};

/**
 * 答案键名 → 问题标识符映射
 */
export const ANSWER_KEY_TO_QUESTION: Record<string, string> = {
  问题输入框: 'Q1',
  选中因素: 'Q2',
  route1_total: 'Q3a',
  route5_total: 'Q3b',
  推荐出发站: 'Q4a',
  推荐理由_站点: 'Q4b',
  方案一: 'Q5a',
  方案二: 'Q5b',
  方案最优: 'Q6a',
  改进方案: 'Q6b',
  选中车次: 'Q7',
  推荐车次: 'Q8a',
  推荐理由: 'Q8b',
  计算过程: 'Q8c',
  总票价: 'Q8d',
};

/**
 * 页面描述映射
 */
export const PAGE_DESC_MAP: Record<string, string> = {
  notices: '注意事项',
  'scenario-intro': '情景导入',
  'problem-identification': '问题识别',
  'factor-analysis': '因素分析',
  'route-analysis': '路线分析',
  'station-recommendation': '出发站推荐',
  'timeline-planning-tutorial': '时间规划演示',
  'user-solution-design': '方案设计',
  'plan-optimization': '方案优化',
  'ticket-filter': '车次筛选',
  'ticket-pricing': '票价计算',
  'task-completion': '完成页',
};

/**
 * 每个页面包含的问题键
 */
export const PAGE_QUESTIONS: Record<PageId, string[]> = {
  notices: [],
  'scenario-intro': [],
  'problem-identification': ['问题输入框'],
  'factor-analysis': ['选中因素'],
  'route-analysis': ['route1_total', 'route5_total'],
  'station-recommendation': ['推荐出发站', '推荐理由_站点'],
  'timeline-planning-tutorial': [],
  'user-solution-design': ['方案一', '方案二'],
  'plan-optimization': ['方案最优', '改进方案'],
  'ticket-filter': ['选中车次'],
  'ticket-pricing': ['推荐车次', '推荐理由', '计算过程', '总票价'],
  'task-completion': [],
};

const SUBMISSION_PAGE_CONFIGS = PAGE_CONFIGS_TYPED.map(config => ({
  pageId: config.pageId,
  subPageNum: config.subPageNum,
  title: PAGE_DESC_MAP[config.pageId] || config.description,
  questionKeys: PAGE_QUESTIONS[config.pageId] || [],
  mode: config.mode,
  description: config.description,
}));

const formatSingleOptionValue = (options: Record<string, string>, raw: string): string => {
  if (['A', 'B', 'C', 'D', 'E', 'F'].includes(raw) && options[raw]) {
    return `${raw}. ${options[raw]}`;
  }

  if (options[raw]) {
    const optionText = options[raw];
    const optionLabel = Object.entries(options).find(
      ([key, value]) => key.length === 1 && value === optionText
    )?.[0];

    if (optionLabel) {
      return `${optionLabel}. ${optionText}`;
    }

    return optionText;
  }

  const matched = Object.entries(options).find(([, value]) => value === raw)?.[0];
  if (matched && matched.length === 1) {
    return `${matched}. ${raw}`;
  }

  return raw;
};

const formatAnswerValue = (questionId: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return '';

  const options = QUESTION_OPTIONS_MAP[questionId];
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    if (!options) return value.join(', ');
    return value
      .map(item => formatSingleOptionValue(options, String(item)))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  const stringValue = String(value).trim();
  if (!stringValue) return '';

  if (!options) {
    return stringValue;
  }

  return formatSingleOptionValue(options, stringValue);
};

/**
 * 子模块映射配置（供 submoduleAdapter 使用）
 */
export const SUBMODULE_MAPPING_CONFIG: SubmoduleMappingConfig = {
  PAGE_CONFIGS: SUBMISSION_PAGE_CONFIGS,
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  QUESTION_OPTIONS_MAP,
  INTERNAL_TO_STANDARD_KEY,
  getSubPageNumByPageId,
  getPageConfig: pageId => SUBMISSION_PAGE_CONFIGS.find(config => config.pageId === pageId),
  formatAnswer: formatAnswerValue,
};

/**
 * 验证映射配置的完整性 (FR-077)
 */
export function validateMappingConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 检查 QUESTION_CODE_MAP 的值是否唯一
  const codes = Object.values(QUESTION_CODE_MAP);
  const uniqueCodes = new Set(codes);
  if (codes.length !== uniqueCodes.size) {
    errors.push('QUESTION_CODE_MAP contains duplicate codes');
  }

  // 检查 QUESTION_TEXT_MAP 是否覆盖所有 QUESTION_CODE_MAP 的键
  for (const key of Object.keys(QUESTION_CODE_MAP)) {
    if (!QUESTION_TEXT_MAP[key]) {
      errors.push(`QUESTION_TEXT_MAP missing key: ${key}`);
    }
  }

  // 检查 ANSWER_KEY_TO_QUESTION 的值是否都在 QUESTION_CODE_MAP 中
  for (const [answerKey, questionId] of Object.entries(ANSWER_KEY_TO_QUESTION)) {
    if (!QUESTION_CODE_MAP[questionId]) {
      errors.push(
        `ANSWER_KEY_TO_QUESTION: "${answerKey}" maps to unknown question "${questionId}"`
      );
    }
  }

  // 检查 PAGE_DESC_MAP 是否覆盖所有页面
  for (const pageId of Object.keys(PAGE_ID_MAP_TYPED)) {
    if (!PAGE_DESC_MAP[pageId]) {
      errors.push(`PAGE_DESC_MAP missing page: ${pageId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getInitialPage(subPageNum: string): string {
  const parsed = parseInt(subPageNum, 10);
  if (Number.isNaN(parsed)) {
    console.warn(
      `[g4-experiment] Invalid subPageNum "${subPageNum}", falling back to default page`
    );
    return DEFAULT_PAGE_ID;
  }
  if (parsed < MIN_PAGE || parsed > MAX_PAGE) {
    console.warn(
      `[g4-experiment] subPageNum ${parsed} out of range [${MIN_PAGE}, ${MAX_PAGE}], falling back to default page`
    );
    return DEFAULT_PAGE_ID;
  }
  const pageId = PAGE_CONFIG_MAP_TYPED[parsed]?.pageId;
  if (!pageId) {
    console.warn(
      `[g4-experiment] No page config for subPageNum ${parsed}, falling back to default page`
    );
    return DEFAULT_PAGE_ID;
  }
  return pageId;
}

export function getTotalSteps(): number {
  return VISIBLE_PAGE_COUNT;
}

export function getNavigationMode(pageId: string): NavigationMode {
  const entry = PAGE_ID_MAP_TYPED[pageId];
  if (!entry) {
    return 'experiment';
  }
  return entry.mode === 'hidden' ? 'hidden' : 'experiment';
}

export function getSubPageNumByPageId(pageId: string | null | undefined): number {
  if (!pageId) {
    return MIN_PAGE;
  }
  const entry = PAGE_ID_MAP_TYPED[pageId];
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
  const entry = PAGE_ID_MAP_TYPED[pageId];
  if (!entry || entry.mode === 'hidden') {
    return 0;
  }

  let visibleIndex = 0;
  const currentSubPageNum = entry.subPageNum;
  for (let pageNum = MIN_PAGE; pageNum <= currentSubPageNum; pageNum += 1) {
    const config = PAGE_CONFIG_MAP_TYPED[pageNum];
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
  const entry = PAGE_ID_MAP_TYPED[pageId];
  if (!entry) {
    return null;
  }

  const nextSubPageNum = entry.subPageNum + 1;
  if (nextSubPageNum > MAX_PAGE) {
    return null;
  }

  const nextConfig = PAGE_CONFIG_MAP_TYPED[nextSubPageNum];
  return nextConfig?.pageId || null;
}

export function getDefaultTimers(): { task: number } {
  return { task: EXPERIMENT_DURATION_SECONDS };
}

export function getPageNumByPageId(pageId: string | null | undefined): string | null {
  if (!pageId) {
    return String(MIN_PAGE);
  }
  const entry = PAGE_ID_MAP_TYPED[pageId];
  if (!entry) {
    return String(MIN_PAGE);
  }
  return String(entry.subPageNum);
}

export const getPageConfigById = (pageId: string | null | undefined) => {
  if (!pageId) return null;
  return PAGE_ID_MAP_TYPED[pageId] || null;
};
