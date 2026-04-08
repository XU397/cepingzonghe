import {
  isQuestionnairePage,
  pageInfoMapping,
  getQuestionnaireStepNumber,
} from '../../utils/pageMappings';
import type {
  SubmoduleMappingConfig,
  PageConfig as AdapterPageConfig,
} from '@shared/services/submission/submoduleAdapter';

type PageId = string;

const toNumber = (value: unknown, fallback = 1): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};

/**
 * 各页面的题目键列表（仅包含交互测评部分）
 */
export const PAGE_QUESTIONS: Record<PageId, string[]> = {
  Page_01_Precautions: ['确认：已阅读并同意注意事项？', 'reading_duration'],
  Page_03_Dialogue_Question: ['scientific_question'],
  Page_04_Material_Reading_Factor_Selection: [
    '影响因素选择:发酵时长',
    '影响因素选择:酵母用量',
    '影响因素选择:发酵温度',
    '影响因素选择:白糖用量',
    '影响因素选择:揉面力度',
    '影响因素选择:食用油用量',
  ],
  Page_11_Solution_Design_Measurement_Ideas: [
    'measurement_idea_1',
    'measurement_idea_2',
    'measurement_idea_3',
  ],
  Page_12_Solution_Evaluation_Measurement_Critique: [
    'measurement_method_1_advantage',
    'measurement_method_1_disadvantage',
    'measurement_method_2_advantage',
    'measurement_method_2_disadvantage',
    'measurement_method_3_advantage',
    'measurement_method_3_disadvantage',
  ],
  Page_14_Simulation_Intro_Exploration: ['模拟发酵时长选择'],
  Page_15_Simulation_Question_1: ['发酵3小时后体积最大的温度', '模拟发酵时长选择_Q1'],
  Page_16_Simulation_Question_2: ['35°C时发酵到95ml所需时间', '模拟发酵时长选择_Q2'],
  Page_17_Simulation_Question_3: ['发酵缓慢的温度', '模拟发酵时长选择_Q3'],
  Page_18_Solution_Selection: ['solution_combinations', 'best_solutions', 'solution_reason'],
};

/**
 * 题目标识到编码的映射（用于 answerList.code）
 */
export const QUESTION_CODE_MAP: Record<string, number> = {
  Q1_precautions_ack: 1,
  Q1_reading_duration: 2,
  Q2_scientific_question: 3,
  Q3_factor_time: 4,
  Q3_factor_yeast: 5,
  Q3_factor_temp: 6,
  Q3_factor_sugar: 7,
  Q3_factor_kneading: 8,
  Q3_factor_oil: 9,
  Q4_measurement_idea_1: 10,
  Q4_measurement_idea_2: 11,
  Q4_measurement_idea_3: 12,
  Q5_method1_advantage: 13,
  Q5_method1_disadvantage: 14,
  Q5_method2_advantage: 15,
  Q5_method2_disadvantage: 16,
  Q5_method3_advantage: 17,
  Q5_method3_disadvantage: 18,
  Q6_sim_intro_duration: 19,
  Q7_sim_q1_temperature: 20,
  Q7_sim_q1_duration: 21,
  Q8_sim_q2_time: 22,
  Q8_sim_q2_duration: 23,
  Q9_sim_q3_temperature: 24,
  Q9_sim_q3_duration: 25,
  Q10_solution_combinations: 26,
  Q10_solution_best: 27,
  Q10_solution_reason: 28,
};

/**
 * 题目编号到完整题干的映射
 */
export const QUESTION_TEXT_MAP: Record<string, string> = {
  Q1_precautions_ack: '确认：已阅读并同意注意事项？',
  Q1_reading_duration: '阅读注意事项所用时长（秒）',
  Q2_scientific_question: '根据左侧对话，请写出接下来小明要探究的科学问题？',
  Q3_factor_time: '面团过度发酵可能与哪些因素有关？选项：发酵时长',
  Q3_factor_yeast: '面团过度发酵可能与哪些因素有关？选项：酵母用量',
  Q3_factor_temp: '面团过度发酵可能与哪些因素有关？选项：发酵温度',
  Q3_factor_sugar: '面团过度发酵可能与哪些因素有关？选项：白糖用量',
  Q3_factor_kneading: '面团过度发酵可能与哪些因素有关？选项：揉面力度',
  Q3_factor_oil: '面团过度发酵可能与哪些因素有关？选项：食用油用量',
  Q4_measurement_idea_1: '测量面团发酵后体积的方法构思1',
  Q4_measurement_idea_2: '测量面团发酵后体积的方法构思2',
  Q4_measurement_idea_3: '测量面团发酵后体积的方法构思3',
  Q5_method1_advantage: '方法一（标记法）的优点',
  Q5_method1_disadvantage: '方法一（标记法）的缺点',
  Q5_method2_advantage: '方法二（排水法）的优点',
  Q5_method2_disadvantage: '方法二（排水法）的缺点',
  Q5_method3_advantage: '方法三（烧杯法）的优点',
  Q5_method3_disadvantage: '方法三（烧杯法）的缺点',
  Q6_sim_intro_duration: '模拟实验体验中选择的发酵时长',
  Q7_sim_q1_temperature: '问题1：发酵3小时后体积最大对应的温度',
  Q7_sim_q1_duration: '问题1：提交时的发酵时长选择',
  Q8_sim_q2_time: '问题2：35°C 时发酵到 95ml 需要的时间',
  Q8_sim_q2_duration: '问题2：提交时的发酵时长选择',
  Q9_sim_q3_temperature: '问题3：发酵持续但缓慢的温度',
  Q9_sim_q3_duration: '问题3：提交时的发酵时长选择',
  Q10_solution_combinations: '面团膨胀到1.5倍时的温度-时间组合',
  Q10_solution_best: '标记的最优温度-时间组合',
  Q10_solution_reason: '选择最佳组合的理由',
};

/**
 * 答案键到题目编号的映射
 */
export const ANSWER_KEY_TO_QUESTION: Record<string, string> = {
  '确认：已阅读并同意注意事项？': 'Q1_precautions_ack',
  reading_duration: 'Q1_reading_duration',
  scientific_question: 'Q2_scientific_question',
  '影响因素选择:发酵时长': 'Q3_factor_time',
  '影响因素选择:酵母用量': 'Q3_factor_yeast',
  '影响因素选择:发酵温度': 'Q3_factor_temp',
  '影响因素选择:白糖用量': 'Q3_factor_sugar',
  '影响因素选择:揉面力度': 'Q3_factor_kneading',
  '影响因素选择:食用油用量': 'Q3_factor_oil',
  measurement_idea_1: 'Q4_measurement_idea_1',
  measurement_idea_2: 'Q4_measurement_idea_2',
  measurement_idea_3: 'Q4_measurement_idea_3',
  measurement_method_1_advantage: 'Q5_method1_advantage',
  measurement_method_1_disadvantage: 'Q5_method1_disadvantage',
  measurement_method_2_advantage: 'Q5_method2_advantage',
  measurement_method_2_disadvantage: 'Q5_method2_disadvantage',
  measurement_method_3_advantage: 'Q5_method3_advantage',
  measurement_method_3_disadvantage: 'Q5_method3_disadvantage',
  模拟发酵时长选择: 'Q6_sim_intro_duration',
  发酵3小时后体积最大的温度: 'Q7_sim_q1_temperature',
  模拟发酵时长选择_Q1: 'Q7_sim_q1_duration',
  '35°C时发酵到95ml所需时间': 'Q8_sim_q2_time',
  模拟发酵时长选择_Q2: 'Q8_sim_q2_duration',
  发酵缓慢的温度: 'Q9_sim_q3_temperature',
  模拟发酵时长选择_Q3: 'Q9_sim_q3_duration',
  solution_combinations: 'Q10_solution_combinations',
  best_solutions: 'Q10_solution_best',
  solution_reason: 'Q10_solution_reason',
};

const formatAnswerValue = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

/**
 * 页面配置列表（从现有 AppContext 元数据派生）
 */
export const PAGE_CONFIGS: AdapterPageConfig[] = Object.entries(pageInfoMapping).map(
  ([pageId, meta]) => ({
    pageId,
    title: meta?.desc || pageId,
    subPageNum: isQuestionnairePage(pageId)
      ? getQuestionnaireStepNumber(pageId) || 1
      : toNumber(meta?.number, 1),
    questionKeys: PAGE_QUESTIONS[pageId] || [],
    isExperimentPage: !isQuestionnairePage(pageId),
  })
);

/**
 * 页面描述映射
 */
export const PAGE_DESC_MAP: Record<PageId, string> = Object.entries(pageInfoMapping).reduce(
  (acc, [pageId, meta]) => {
    acc[pageId] = meta?.desc || pageId;
    return acc;
  },
  {} as Record<PageId, string>
);

export function getPageConfig(pageId: string): AdapterPageConfig | undefined {
  return PAGE_CONFIGS.find(item => item.pageId === pageId);
}

export function getSubPageNumByPageId(pageId: string): number {
  if (isQuestionnairePage(pageId)) {
    return getQuestionnaireStepNumber(pageId) || 1;
  }
  const config = getPageConfig(pageId);
  if (config && typeof config.subPageNum !== 'undefined') {
    return toNumber(config.subPageNum, 1);
  }
  return 1;
}

/**
 * g7 子模块的标准映射配置（供共享适配器使用）
 */
export const G7_SUBMODULE_MAPPING: SubmoduleMappingConfig = {
  PAGE_CONFIGS,
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  getSubPageNumByPageId,
  getPageConfig,
  formatAnswer: (_questionId, rawValue) => formatAnswerValue(rawValue),
};
