import type {
  PageConfig as BasePageConfig,
  SubmoduleMappingConfig,
} from '@/shared/services/submission/submoduleAdapter';

export type PageId =
  | 'page_00_notice'
  | 'page_01_intro'
  | 'page_02_step_q1'
  | 'page_03_sim_exp'
  | 'page_04_q2_data'
  | 'page_05_q3_trend'
  | 'page_06_q4_conc';

export type NavigationMode = 'hidden' | 'experiment' | 'questionnaire';

export type PageConfig = BasePageConfig & {
  pageId: PageId;
  navigationMode: NavigationMode;
  stepIndex: number;
  type: 'notice' | 'experiment';
};

export const HISTORY_CODE_BASE = 100;

// 默认计时配置 (20分钟)
export const TASK_DURATION = 20 * 60; // 1200秒

// 页面描述映射
export const PAGE_DESC_MAP: Record<PageId, string> = {
  page_00_notice: '注意事项',
  page_01_intro: '任务背景',
  page_02_step_q1: '实验步骤',
  page_03_sim_exp: '模拟实验',
  page_04_q2_data: '数据分析',
  page_05_q3_trend: '趋势分析',
  page_06_q4_conc: '结论验证',
};

// 页面涉及的问题键
export const PAGE_QUESTIONS: Record<PageId, string[]> = {
  page_00_notice: [],
  page_01_intro: [],
  page_02_step_q1: ['Q1_控制变量原因'],
  page_03_sim_exp: [],
  page_04_q2_data: ['Q2_抑制作用浓度'],
  page_05_q3_trend: ['Q3_发芽率趋势'],
  page_06_q4_conc: ['Q4a_菟丝子有效性', 'Q4b_结论理由'],
};

// 问题编码映射 (Q1 -> 1, Q2 -> 2, 等)
export const QUESTION_CODE_MAP: Record<string, number> = {
  Q1: 1,
  Q2: 2,
  Q3: 3,
  Q4a: 4,
  Q4b: 5,
};

// 问题文本映射
export const QUESTION_TEXT_MAP: Record<string, string> = {
  Q1: '问题1：为什么在每组实验中，都要确保其他条件一致？',
  Q2: '问题2：根据实验结果，哪种浓度的菟丝子提取液对薇甘菊种子萌发抑制作用最强？',
  Q3: '问题3：随着菟丝子提取液浓度的增加，薇甘菊种子发芽率呈现出怎样的变化趋势？',
  Q4a: '问题4a：菟丝子能否有效防治薇甘菊？',
  Q4b: '问题4b：请说明你的理由',
};

// 问题选项映射
export const QUESTION_OPTIONS_MAP: Record<string, Record<string, string>> = {
  Q2: { A: '0mg/ml', B: '5mg/ml', C: '10mg/ml' },
  Q3: { A: '逐渐升高', B: '逐渐降低', C: '保持不变' },
  Q4a: { A: '是', B: '否' },
};

// 答案键到问题ID的映射
export const ANSWER_KEY_TO_QUESTION: Record<string, string> = {
  Q1_控制变量原因: 'Q1',
  Q2_抑制作用浓度: 'Q2',
  Q3_发芽率趋势: 'Q3',
  Q4a_菟丝子有效性: 'Q4a',
  Q4b_结论理由: 'Q4b',
};

const PAGE_CONFIG_BASE: Array<Pick<PageConfig, 'pageId' | 'subPageNum' | 'navigationMode' | 'stepIndex' | 'type'>> =
  [
    {
      pageId: 'page_00_notice',
      subPageNum: 1,
      navigationMode: 'hidden',
      stepIndex: 0,
      type: 'notice',
    },
    {
      pageId: 'page_01_intro',
      subPageNum: 2,
      navigationMode: 'experiment',
      stepIndex: 1,
      type: 'experiment',
    },
    {
      pageId: 'page_02_step_q1',
      subPageNum: 3,
      navigationMode: 'experiment',
      stepIndex: 2,
      type: 'experiment',
    },
    {
      pageId: 'page_03_sim_exp',
      subPageNum: 4,
      navigationMode: 'experiment',
      stepIndex: 3,
      type: 'experiment',
    },
    {
      pageId: 'page_04_q2_data',
      subPageNum: 5,
      navigationMode: 'experiment',
      stepIndex: 4,
      type: 'experiment',
    },
    {
      pageId: 'page_05_q3_trend',
      subPageNum: 6,
      navigationMode: 'experiment',
      stepIndex: 5,
      type: 'experiment',
    },
    {
      pageId: 'page_06_q4_conc',
      subPageNum: 7,
      navigationMode: 'experiment',
      stepIndex: 6,
      type: 'experiment',
    },
  ];

export const PAGE_CONFIGS: PageConfig[] = PAGE_CONFIG_BASE.map((config) => ({
  ...config,
  title: PAGE_DESC_MAP[config.pageId],
  questionKeys: PAGE_QUESTIONS[config.pageId],
  isExperimentPage: config.navigationMode !== 'hidden',
}));

export const PAGE_ORDER: PageId[] = PAGE_CONFIGS.map((config) => config.pageId);

const DEFAULT_PAGE_ID: PageId = PAGE_ORDER[0];

export function getPageConfig(pageId: PageId): PageConfig | undefined {
  return PAGE_CONFIGS.find((config) => config.pageId === pageId);
}

export function getPageIdBySubPageNum(subPageNum: number): PageId {
  const config = PAGE_CONFIGS.find((item) => item.subPageNum === subPageNum);
  return config?.pageId ?? DEFAULT_PAGE_ID;
}

export function getSubPageNumByPageId(pageId: PageId): number {
  const config = getPageConfig(pageId);
  return config?.subPageNum ?? PAGE_CONFIGS[0].subPageNum;
}

export function getNavigationMode(pageId: PageId): NavigationMode {
  const config = getPageConfig(pageId);
  return config?.navigationMode ?? 'experiment';
}

export function getNextPageId(pageId: PageId): PageId | null {
  const currentIndex = PAGE_ORDER.indexOf(pageId);
  if (currentIndex === -1 || currentIndex >= PAGE_ORDER.length - 1) {
    return null;
  }
  return PAGE_ORDER[currentIndex + 1];
}

export function getStepIndex(pageId: PageId): number {
  const config = getPageConfig(pageId);
  return config?.stepIndex ?? 0;
}

export function getPageSubNum(pageId?: PageId): string {
  if (!pageId) {
    return String(PAGE_CONFIGS[0].subPageNum);
  }
  return String(getSubPageNumByPageId(pageId));
}

export function getTotalSteps(): number {
  return PAGE_CONFIGS.filter((config) => config.navigationMode !== 'hidden').length;
}

export function isLastPage(pageId: PageId): boolean {
  return pageId === PAGE_ORDER[PAGE_ORDER.length - 1];
}

export function isFirstPage(pageId: PageId): boolean {
  return pageId === PAGE_ORDER[0];
}

export function getDefaultTimers() {
  return {
    task: TASK_DURATION,
  };
}

export function resolvePageNum(
  subPageNum: string | number | null | undefined,
): PageId {
  if (subPageNum == null) {
    return DEFAULT_PAGE_ID;
  }

  if (typeof subPageNum === 'string' && subPageNum.startsWith('page_')) {
    return subPageNum as PageId;
  }

  const parsed = Number(subPageNum);
  if (Number.isNaN(parsed)) {
    console.warn(`[g8-mikania-experiment] Invalid subPageNum: ${subPageNum}, fallback to ${DEFAULT_PAGE_ID}`);
    return DEFAULT_PAGE_ID;
  }

  const config = PAGE_CONFIGS.find((item) => item.subPageNum === parsed);
  if (!config) {
    console.warn(`[g8-mikania-experiment] Invalid subPageNum: ${subPageNum}, fallback to ${DEFAULT_PAGE_ID}`);
    return DEFAULT_PAGE_ID;
  }

  return config.pageId;
}

export function getInitialPage(subPageNum?: string | number | PageId | null): PageId {
  if (subPageNum == null) {
    console.warn(`[g8-mikania-experiment] Invalid subPageNum: ${subPageNum}, fallback to ${DEFAULT_PAGE_ID}`);
    return DEFAULT_PAGE_ID;
  }

  if (typeof subPageNum === 'string' && subPageNum.startsWith('page_')) {
    return subPageNum as PageId;
  }

  return resolvePageNum(subPageNum);
}

const formatAnswerValue = (questionId: string, rawValue: unknown): string => {
  if (rawValue == null) {
    return '';
  }

  const options = QUESTION_OPTIONS_MAP[questionId];

  if (!options) {
    return typeof rawValue === 'string' ? rawValue : String(rawValue);
  }

  const stringValue = typeof rawValue === 'string' ? rawValue : String(rawValue);
  let optionLabel: string | undefined = options[stringValue] ? stringValue : undefined;

  if (!optionLabel) {
    const matched = Object.entries(options).find(([, optionText]) => optionText === stringValue);
    if (matched) {
      optionLabel = matched[0];
    }
  }

  if (optionLabel) {
    return `${optionLabel}. ${options[optionLabel]}`;
  }

  return stringValue;
};

export const SUBMODULE_MAPPING_CONFIG: SubmoduleMappingConfig = {
  PAGE_CONFIGS,
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  QUESTION_OPTIONS_MAP,
  getSubPageNumByPageId,
  getPageConfig: (pageId: string) => getPageConfig(pageId as PageId),
  HISTORY_CODE_BASE,
  formatAnswer: formatAnswerValue,
};
