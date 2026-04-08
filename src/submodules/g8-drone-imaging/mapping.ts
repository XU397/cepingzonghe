import type {
  SubmoduleMappingConfig,
  PageConfig as SharedPageConfig,
} from '@shared/services/submission/submoduleAdapter';

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

export const HISTORY_CODE_BASE = 100;

export const PAGE_DESC_MAP: Record<PageId, string> = {
  cover: '任务封面',
  background: '背景介绍',
  hypothesis: '假设问题',
  experiment_free: '自由实验',
  focal_analysis: '焦距分析',
  height_analysis: '高度分析',
  conclusion: '结论',
};

export const PAGE_QUESTIONS: Record<PageId, string[]> = {
  cover: ['confirmRead'],
  background: [],
  hypothesis: ['controlVariableReason'],
  experiment_free: [],
  focal_analysis: ['minGsdFocal'],
  height_analysis: ['gsdTrend'],
  conclusion: ['priorityFactor', 'priorityReason'],
};

export const QUESTION_CODE_MAP: Record<string, number> = {
  confirmRead: 1,
  controlVariableReason: 2,
  minGsdFocal: 3,
  gsdTrend: 4,
  priorityFactor: 5,
  priorityReason: 6,
};

export const QUESTION_TEXT_MAP: Record<string, string> = {
  confirmRead: '我已阅读并理解以上注意事项',
  controlVariableReason:
    '问题1：为什么在每次航拍时，都需要确保相机分辨率和天气条件等一致？请写出原因。',
  minGsdFocal:
    '问题2：根据模拟实验，当飞行高度为100米时，使用何种焦距可以使地面采样距离（GSD）达到最小？',
  gsdTrend: '问题3：根据模拟实验，随着飞行高度的增加，地面采样距离（GSD）呈现出怎样的变化趋势？',
  priorityFactor:
    '问题4：右图展示了飞行高度、镜头焦距与地面采样距离（GSD）的关系曲线。请问在航拍中，为获取更高精度的影像，应优先考虑降低飞行高度还是调整镜头焦距？',
  priorityReason: '请说明你的理由：',
};

export const ANSWER_KEY_TO_QUESTION: Record<string, string> = {
  confirmRead: 'confirmRead',
  controlVariableReason: 'controlVariableReason',
  minGsdFocal: 'minGsdFocal',
  gsdTrend: 'gsdTrend',
  priorityFactor: 'priorityFactor',
  priorityReason: 'priorityReason',
};

export const QUESTION_OPTIONS_MAP: Record<string, Record<string, string>> = {
  minGsdFocal: {
    A: '8毫米',
    B: '24毫米',
    C: '50毫米',
  },
  gsdTrend: {
    A: '逐渐变小',
    B: '逐渐变大',
    C: '保持不变',
  },
  priorityFactor: {
    A: '降低飞行高度',
    B: '调整镜头焦距',
  },
};

export const PAGE_CONFIGS: PageConfig[] = [
  { subPageNum: 1, pageId: 'cover', type: 'notice', navigationMode: 'hidden', stepIndex: 0 },
  {
    subPageNum: 2,
    pageId: 'background',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 1,
  },
  {
    subPageNum: 3,
    pageId: 'hypothesis',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 2,
  },
  {
    subPageNum: 4,
    pageId: 'experiment_free',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 3,
  },
  {
    subPageNum: 5,
    pageId: 'focal_analysis',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 4,
  },
  {
    subPageNum: 6,
    pageId: 'height_analysis',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 5,
  },
  {
    subPageNum: 7,
    pageId: 'conclusion',
    type: 'experiment',
    navigationMode: 'experiment',
    stepIndex: 6,
  },
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

export function formatAnswerValue(questionId: string, rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '';
  }

  const value =
    typeof rawValue === 'object' && rawValue !== null && 'value' in rawValue
      ? String((rawValue as { value?: unknown }).value ?? '')
      : String(rawValue);
  const options = QUESTION_OPTIONS_MAP[questionId];

  if (!options) {
    return value;
  }

  if (options[value] && ['A', 'B', 'C', 'D'].includes(value)) {
    return `${value}. ${options[value]}`;
  }

  const matched = Object.entries(options).find(([, optionText]) => optionText === value);
  if (matched) {
    return `${matched[0]}. ${matched[1]}`;
  }

  return value;
}

export const SUBMODULE_MAPPING_CONFIG: SubmoduleMappingConfig = {
  PAGE_CONFIGS: PAGE_CONFIGS.map(
    config =>
      ({
        pageId: config.pageId,
        subPageNum: config.subPageNum,
        title: PAGE_DESC_MAP[config.pageId],
        questionKeys: PAGE_QUESTIONS[config.pageId] || [],
        type: config.type,
        navigationMode: config.navigationMode,
        stepIndex: config.stepIndex,
      }) as SharedPageConfig & {
        type: string;
        navigationMode: string;
        stepIndex: number;
      }
  ),
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  getSubPageNumByPageId: (pageId: string) => getSubPageNumByPageId(pageId as PageId),
  QUESTION_OPTIONS_MAP,
  getPageConfig: (pageId: string) => {
    const config = getPageConfig(pageId as PageId);
    if (!config) {
      return undefined;
    }
    return {
      pageId: config.pageId,
      title: PAGE_DESC_MAP[config.pageId],
      subPageNum: config.subPageNum,
      questionKeys: PAGE_QUESTIONS[config.pageId] || [],
    };
  },
  HISTORY_CODE_BASE,
  formatAnswer: formatAnswerValue,
};
