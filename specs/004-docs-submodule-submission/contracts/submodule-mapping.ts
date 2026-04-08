/**
 * Submodule Mapping Configuration Contracts
 *
 * 子模块映射配置接口定义
 * Feature: 004-docs-submodule-submission
 * Date: 2025-12-04
 */

// ============================================================
// Page Configuration
// ============================================================

/**
 * 页面配置
 */
export interface PageConfig {
  /** 页面唯一标识 */
  pageId: string;
  /** 页面标题（用于 pageDesc） */
  title: string;
  /** 子页面序号（用于 pageNumber 编码） */
  subPageNum: number;
  /** 页面包含的问题键列表 */
  questionKeys?: string[];
  /** 是否为实验页面（影响 answerList 构建） */
  isExperimentPage?: boolean;
}

// ============================================================
// Question Mapping
// ============================================================

/**
 * 问题映射配置
 */
export interface QuestionMapping {
  /** 问题唯一标识（内部使用） */
  questionId: string;
  /** 答案 code（提交时使用） */
  code: number;
  /** 完整题干文本（用于 targetElement） */
  fullText: string;
  /** 问题类型 */
  type: QuestionType;
  /** 选项映射（单选/多选题） */
  options?: Record<string, string>;
}

/**
 * 问题类型枚举
 */
export enum QuestionType {
  /** 单选题 */
  RADIO = 'radio',
  /** 多选题 */
  CHECKBOX = 'checkbox',
  /** 文本输入 */
  TEXT = 'text',
  /** 文本区域 */
  TEXTAREA = 'textarea',
  /** 实验操作记录 */
  EXPERIMENT = 'experiment',
  /** 其他 */
  OTHER = 'other',
}

// ============================================================
// Submodule Mapping Config Interface
// ============================================================

/**
 * 子模块映射配置接口
 *
 * 每个子模块必须提供此配置以接入共享适配器
 */
export interface SubmoduleMappingConfig {
  // ========== 必需配置 ==========

  /**
   * 页面配置列表
   * 定义模块内所有页面的元数据
   */
  PAGE_CONFIGS: PageConfig[];

  /**
   * 页面描述映射
   * pageId → 页面描述文本
   * @example { "experiment_design": "实验设计" }
   */
  PAGE_DESC_MAP: Record<string, string>;

  /**
   * 每页的问题键列表
   * pageId → questionKey[]
   * @example { "page_02": ["q1", "q2"] }
   */
  PAGE_QUESTIONS: Record<string, string[]>;

  /**
   * 问题 ID → code 映射
   * @example { "q1_choice": 1, "q2_reason": 2 }
   */
  QUESTION_CODE_MAP: Record<string, number>;

  /**
   * 问题 ID → 完整题干映射
   * @example { "q1_choice": "第一题：请选择正确答案" }
   */
  QUESTION_TEXT_MAP: Record<string, string>;

  /**
   * 答案键 → 问题 ID 映射
   * 用于从原始答案对象提取数据
   * @example { "selectedOption": "q1_choice" }
   */
  ANSWER_KEY_TO_QUESTION: Record<string, string>;

  /**
   * 根据页面 ID 获取子页面序号
   * @param pageId - 页面 ID
   * @returns 子页面序号（用于 pageNumber 编码）
   */
  getSubPageNumByPageId: (pageId: string) => number;

  // ========== 可选配置 ==========

  /**
   * 单选题选项映射
   * questionId → { optionValue → displayText }
   * @example { "q1_choice": { "A": "A. 选项一", "B": "B. 选项二" } }
   */
  QUESTION_OPTIONS_MAP?: Record<string, Record<string, string>>;

  /**
   * 内部键 → 标准键转换
   * 用于统一不同命名风格
   * @example { "user_answer": "userAnswer" }
   */
  INTERNAL_TO_STANDARD_KEY?: Record<string, string>;

  /**
   * 实验历史 code 基数
   * 实验记录使用 HISTORY_CODE_BASE + index 作为 code
   * @default 100
   */
  HISTORY_CODE_BASE?: number;

  /**
   * 获取页面配置
   * @param pageId - 页面 ID
   * @returns PageConfig 或 undefined
   */
  getPageConfig?: (pageId: string) => PageConfig | undefined;

  /**
   * 自定义答案格式化器
   * @param questionId - 问题 ID
   * @param rawValue - 原始答案值
   * @returns 格式化后的答案字符串
   */
  formatAnswer?: (questionId: string, rawValue: unknown) => string;
}

// ============================================================
// Reserved Elements
// ============================================================

/**
 * 保留元素集合
 * 这些元素在 targetElement 校验时豁免 P${pageNumber}_ 前缀检查
 */
export const RESERVED_ELEMENTS = new Set<string>([
  'page',           // page_enter, page_exit 的目标
  'next_button',    // 导航按钮
  'prev_button',    // 返回按钮（如有）
  'module',         // 模块级事件
  'flow_context',   // Flow 上下文信息（自动注入）
  'task_timer',     // 任务计时器
  'countdown',      // 倒计时
]);

/**
 * 检查元素是否为保留元素
 */
export function isReservedElement(element: string): boolean {
  return RESERVED_ELEMENTS.has(element);
}

// ============================================================
// Event Types (Reference)
// ============================================================

/**
 * 事件类型枚举（常用值）
 * 完整列表参见 @shared/services/submission/eventTypes.js
 */
export enum EventTypes {
  PAGE_ENTER = 'page_enter',
  PAGE_EXIT = 'page_exit',
  CLICK = 'click',
  INPUT_CHANGE = 'input_change',
  INPUT_FOCUS = 'input_focus',
  INPUT_BLUR = 'input_blur',
  RADIO_SELECT = 'radio_select',
  CHECKBOX_CHECK = 'checkbox_check',
  CHECKBOX_UNCHECK = 'checkbox_uncheck',
  NEXT_CLICK = 'next_click',
  TIMER_START = 'timer_start',
  TIMER_STOP = 'timer_stop',
  FLOW_CONTEXT = 'flow_context',
  SIMULATION_OPERATION = 'simulation_operation',
}

// ============================================================
// Default Values
// ============================================================

/**
 * 默认配置值
 */
export const DEFAULTS = {
  /** 实验历史 code 基数 */
  HISTORY_CODE_BASE: 100,
  /** 时间格式 */
  TIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  /** pageNumber 正则 */
  PAGE_NUMBER_REGEX: /^[1-9]\d*\.\d{2}$/,
  /** targetElement 前缀正则 */
  TARGET_PREFIX_REGEX: /^P\d+\.\d{2}_/,
} as const;

// ============================================================
// Factory Functions
// ============================================================

/**
 * 创建子模块映射配置的工厂函数
 *
 * @param config - 部分配置
 * @returns 完整的 SubmoduleMappingConfig
 */
export function createSubmoduleMappingConfig(
  config: Omit<SubmoduleMappingConfig, 'getSubPageNumByPageId' | 'getPageConfig'> & {
    PAGE_CONFIGS: PageConfig[];
  }
): SubmoduleMappingConfig {
  const pageConfigMap = new Map(
    config.PAGE_CONFIGS.map((pc) => [pc.pageId, pc])
  );

  return {
    ...config,
    HISTORY_CODE_BASE: config.HISTORY_CODE_BASE ?? DEFAULTS.HISTORY_CODE_BASE,
    getSubPageNumByPageId: (pageId: string) => {
      const pc = pageConfigMap.get(pageId);
      if (!pc) {
        throw new Error(`Unknown pageId: ${pageId}`);
      }
      return pc.subPageNum;
    },
    getPageConfig: (pageId: string) => pageConfigMap.get(pageId),
  };
}
