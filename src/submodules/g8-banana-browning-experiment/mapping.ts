import type {
  SubmoduleMappingConfig,
  PageConfig as SharedPageConfig,
} from '@shared/services/submission/submoduleAdapter';

export type PageId =
  | 'intro_notice'
  | 'page_02_banana_browning'
  | 'banana_mystery'
  | 'banana_browning_reading'
  | 'page_05_banana_browning'
  | 'banana_browning_design'
  | 'banana_browning_evaluation'
  | 'page_08_banana_browning'
  | 'banana_browning_simulation_main'
  | 'simulation_question_1'
  | 'simulation_question_2'
  | 'simulation_question_3'
  | 'solution_selection'
  | 'task_completion';

export type NavigationMode = 'hidden' | 'experiment' | 'questionnaire';

export interface PageConfig {
  subPageNum: number;
  pageId: PageId;
  type: 'notice' | 'experiment';
  navigationMode: NavigationMode;
  stepIndex: number;
  pageDesc: string;
}

export const PAGE_DESC_MAP: Record<PageId, string> = {
  intro_notice: '注意事项',
  page_02_banana_browning: '香蕉变黑',
  banana_mystery: '香蕉的奥秘',
  banana_browning_reading: '香蕉变黑：资料阅读',
  page_05_banana_browning: '香蕉变黑',
  banana_browning_design: '香蕉变黑：方案设计',
  banana_browning_evaluation: '香蕉变黑：方案评估',
  page_08_banana_browning: '香蕉变黑',
  banana_browning_simulation_main: '香蕉变黑：模拟实验（主界面）',
  simulation_question_1: '模拟实验 + 问题1',
  simulation_question_2: '模拟实验 + 问题2',
  simulation_question_3: '模拟实验 + 问题3',
  solution_selection: '方案选择',
  task_completion: '任务完成',
};

export const PAGE_QUESTIONS: Record<PageId, string[]> = {
  intro_notice: [],
  page_02_banana_browning: [],
  banana_mystery: ['Q1_科学问题'],
  banana_browning_reading: ['Q2_影响因素'],
  page_05_banana_browning: [],
  banana_browning_design: ['Q3a_想法1', 'Q3b_想法2', 'Q3c_想法3'],
  banana_browning_evaluation: [
    'Q4a_图像法优点',
    'Q4b_图像法缺点',
    'Q4c_网格法优点',
    'Q4d_网格法缺点',
    'Q4e_称重法优点',
    'Q4f_称重法缺点',
  ],
  page_08_banana_browning: [],
  banana_browning_simulation_main: [],
  simulation_question_1: ['Q5_海南香蕉变黑时间'],
  simulation_question_2: ['Q6_常温储存品种'],
  simulation_question_3: ['Q7_平缓温度'],
  solution_selection: ['Q8_方案表格', 'Q8_最优方案', 'Q8_理由'],
  task_completion: [],
};

export const QUESTION_CODE_MAP: Record<string, number> = {
  Q1: 1,
  Q2: 2,
  Q3a: 3,
  Q3b: 4,
  Q3c: 5,
  Q4a: 6,
  Q4b: 7,
  Q4c: 8,
  Q4d: 9,
  Q4e: 10,
  Q4f: 11,
  Q5: 12,
  Q6: 13,
  Q7: 14,
  Q8_方案表格: 15,
  Q8_最优方案: 16,
  Q8_理由: 17,
};

export const ANSWER_KEY_TO_QUESTION: Record<string, string> = {
  Q1_科学问题: 'Q1',
  Q2_影响因素: 'Q2',
  Q3a_想法1: 'Q3a',
  Q3b_想法2: 'Q3b',
  Q3c_想法3: 'Q3c',
  Q4a_图像法优点: 'Q4a',
  Q4b_图像法缺点: 'Q4b',
  Q4c_网格法优点: 'Q4c',
  Q4d_网格法缺点: 'Q4d',
  Q4e_称重法优点: 'Q4e',
  Q4f_称重法缺点: 'Q4f',
  Q5_海南香蕉变黑时间: 'Q5',
  Q6_常温储存品种: 'Q6',
  Q7_平缓温度: 'Q7',
  Q8_方案表格: 'Q8_方案表格',
  Q8_最优方案: 'Q8_最优方案',
  Q8_理由: 'Q8_理由',
};

export const QUESTION_TEXT_MAP: Record<string, string> = {
  Q1: '根据左侧对话，请写出接下来小明要探究的科学问题？',
  Q2: '香蕉变黑可能与以下哪些因素有关？',
  Q3a: '请提出测量黑变比例的想法1',
  Q3b: '请提出测量黑变比例的想法2',
  Q3c: '请提出测量黑变比例的想法3',
  Q4a: '图像法的优点',
  Q4b: '图像法的缺点',
  Q4c: '网格法的优点',
  Q4d: '网格法的缺点',
  Q4e: '称重法的优点',
  Q4f: '称重法的缺点',
  Q5: '在模拟实验中，2℃条件下储存的海南香蕉，从开始到完全变黑需要多长时间？',
  Q6: '模拟实验表明，哪个品种的香蕉更适合在常温下储存？',
  Q7: '在模拟实验中，菲律宾香蕉在不同温度下储存时，黑变速度变化最平缓的是哪种温度条件？',
  Q8_方案表格: '方案选择表格',
  Q8_最优方案: '最优方案',
  Q8_理由: '请说明理由',
};

export const QUESTION_OPTIONS_MAP: Record<string, Record<string, string>> = {
  Q5: {
    A: '3天',
    B: '6天',
    C: '9天',
    D: '12天',
    E: '15天',
  },
  Q6: {
    A: '海南香蕉',
    B: '菲律宾香蕉',
  },
  Q7: {
    A: '2℃',
    B: '10℃',
    C: '18℃',
  },
};

export const PAGE_CONFIGS: PageConfig[] = [
  {
    subPageNum: 1,
    pageId: 'intro_notice',
    type: 'notice',
    navigationMode: 'hidden',
    stepIndex: 0,
    pageDesc: '注意事项',
  },
  {
    subPageNum: 2,
    pageId: 'page_02_banana_browning',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 1,
    pageDesc: '香蕉变黑',
  },
  {
    subPageNum: 3,
    pageId: 'banana_mystery',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 2,
    pageDesc: '香蕉的奥秘',
  },
  {
    subPageNum: 4,
    pageId: 'banana_browning_reading',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 3,
    pageDesc: '香蕉变黑：资料阅读',
  },
  {
    subPageNum: 5,
    pageId: 'page_05_banana_browning',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 4,
    pageDesc: '香蕉变黑',
  },
  {
    subPageNum: 6,
    pageId: 'banana_browning_design',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 5,
    pageDesc: '香蕉变黑：方案设计',
  },
  {
    subPageNum: 7,
    pageId: 'banana_browning_evaluation',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 6,
    pageDesc: '香蕉变黑：方案评估',
  },
  {
    subPageNum: 8,
    pageId: 'page_08_banana_browning',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 7,
    pageDesc: '香蕉变黑',
  },
  {
    subPageNum: 9,
    pageId: 'banana_browning_simulation_main',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 8,
    pageDesc: '香蕉变黑：模拟实验（主界面）',
  },
  {
    subPageNum: 10,
    pageId: 'simulation_question_1',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 9,
    pageDesc: '模拟实验 + 问题1',
  },
  {
    subPageNum: 11,
    pageId: 'simulation_question_2',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 10,
    pageDesc: '模拟实验 + 问题2',
  },
  {
    subPageNum: 12,
    pageId: 'simulation_question_3',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 11,
    pageDesc: '模拟实验 + 问题3',
  },
  {
    subPageNum: 13,
    pageId: 'solution_selection',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 12,
    pageDesc: '方案选择',
  },
  {
    subPageNum: 14,
    pageId: 'task_completion',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 13,
    pageDesc: '任务完成',
  },
];

export function getPageIdBySubPageNum(subPageNum: number): PageId {
  const config = PAGE_CONFIGS.find(item => item.subPageNum === subPageNum);
  return config?.pageId ?? PAGE_CONFIGS[0].pageId;
}

export function getSubPageNumByPageId(pageId: string): number {
  const config = PAGE_CONFIGS.find(item => item.pageId === pageId);
  return config?.subPageNum ?? 1;
}

export function getPageConfig(pageId: PageId): PageConfig | undefined {
  return PAGE_CONFIGS.find(item => item.pageId === pageId);
}

export function getAllPageIds(): PageId[] {
  return PAGE_CONFIGS.map(item => item.pageId);
}

export function getInitialPageId(subPageNum?: number): PageId {
  if (subPageNum === undefined || subPageNum <= 1) {
    return PAGE_CONFIGS[0].pageId;
  }

  const pageNum = Math.floor(subPageNum);
  const config = PAGE_CONFIGS.find(item => item.subPageNum === pageNum);
  return config?.pageId ?? PAGE_CONFIGS[PAGE_CONFIGS.length - 1].pageId;
}

export const formatAnswerValue = (questionId: string, rawValue: unknown): string => {
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
  PAGE_CONFIGS: PAGE_CONFIGS.map(
    config =>
      ({
        pageId: config.pageId,
        subPageNum: config.subPageNum,
        title: PAGE_DESC_MAP[config.pageId] || config.pageId,
        questionKeys: PAGE_QUESTIONS[config.pageId] || [],
        type: config.type,
        navigationMode: config.navigationMode,
        stepIndex: config.stepIndex,
        pageDesc: config.pageDesc,
      }) as SharedPageConfig & {
        type: string;
        navigationMode: string;
        stepIndex: number;
        pageDesc: string;
      }
  ),
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  QUESTION_OPTIONS_MAP,
  getSubPageNumByPageId,
  getPageConfig: getPageConfig as (pageId: string) => SharedPageConfig | undefined,
  formatAnswer: formatAnswerValue,
};
