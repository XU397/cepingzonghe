/**
 * Submodule Adapter Contracts
 *
 * 子模块数据提交适配器接口定义
 * Feature: 004-docs-submodule-submission
 * Date: 2025-12-04
 */

// ============================================================
// Core Types
// ============================================================

/**
 * 操作日志条目
 */
export interface Operation {
  /** 序号，每页从 1 开始递增 */
  code: number;
  /** 目标元素标识符，业务元素需 P${pageNumber}_ 前缀 */
  targetElement: string;
  /** 事件类型，来自 EventTypes 枚举 */
  eventType: string;
  /** 事件值（可为空字符串） */
  value: string;
  /** 事件时间戳，格式 YYYY-MM-DD HH:mm:ss */
  time: string;
}

/**
 * 答案条目
 */
export interface AnswerEntry {
  /** 答案序号，来自 QUESTION_CODE_MAP 映射 */
  code: number;
  /** 问题标识符（完整题干） */
  targetElement: string;
  /** 答案值（格式化后） */
  value: string;
}

/**
 * 提交数据对象（MarkObject）
 */
export interface MarkObject {
  /** 页面编号，格式 <stepIndex>.<subPageNum> 如 "1.03" */
  pageNumber: string;
  /** 页面描述，Flow 模式含 [flowId/submoduleId/stepIndex] 前缀 */
  pageDesc: string;
  /** 进入页面时间，格式 YYYY-MM-DD HH:mm:ss */
  beginTime: string;
  /** 离开页面时间，格式 YYYY-MM-DD HH:mm:ss */
  endTime: string;
  /** 操作日志列表（可为空数组） */
  operationList: Operation[];
  /** 答案列表（可为空数组） */
  answerList: AnswerEntry[];
  /** 图片元数据列表（可选） */
  imgList?: string[];
}

// ============================================================
// Hook Return Types
// ============================================================

/**
 * usePageMeta Hook 返回值
 */
export interface PageMetaResult {
  /** 格式化后的页面编号，如 "1.03" */
  pageNumber: string;
  /** targetElement 前缀，如 "P1.03_" */
  targetPrefix: string;
  /** 带前缀的 targetElement 生成器 */
  prefixTarget: (elementId: string) => string;
}

/**
 * useOperationLogger Hook 参数（options 对象）
 */
export interface OperationLoggerOptions {
  /** 当前页面编号 */
  pageNumber: string;
  /** targetElement 前缀，如 "P1.03_" */
  targetPrefix: string;
  /** 可选的 Flow 上下文（用于自动注入 flow_context） */
  flowContext?: FlowContext | null;
}

/**
 * useOperationLogger Hook 返回值
 */
export interface OperationLoggerResult {
  /** 当前操作列表 */
  operations: Operation[];
  /** 记录操作（自动添加前缀、递增 code） */
  logOperation: (params: LogOperationParams) => void;
  /** 清空操作列表并重置 code（页面导航时调用） */
  clearOperations: () => void;
  /** 当前 code 值（调试用） */
  currentCode: number;
}

/**
 * logOperation 参数
 */
export interface LogOperationParams {
  /** 目标元素 ID（无前缀，除非是保留元素） */
  targetElement: string;
  /** 事件类型 */
  eventType: string;
  /** 事件值 */
  value: string;
  /** 可选：自定义时间戳 */
  time?: string;
}

// ============================================================
// Validation Types
// ============================================================

/**
 * 校验结果
 */
export interface ValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 错误列表 */
  errors: ValidationError[];
  /** 警告列表（不阻止提交） */
  warnings: ValidationWarning[];
}

/**
 * 校验错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 相关字段路径 */
  path: string;
  /** 错误值 */
  value?: unknown;
}

/**
 * 校验警告
 */
export interface ValidationWarning {
  /** 警告代码 */
  code: string;
  /** 警告消息 */
  message: string;
  /** 相关字段路径 */
  path: string;
}

/**
 * 校验错误代码枚举
 */
export enum ValidationErrorCode {
  /** pageNumber 格式错误 */
  INVALID_PAGE_NUMBER = 'INVALID_PAGE_NUMBER',
  /** targetElement 缺少前缀 */
  MISSING_PREFIX = 'MISSING_PREFIX',
  /** code 不连续 */
  CODE_DISCONTINUITY = 'CODE_DISCONTINUITY',
  /** code 不从 1 开始 */
  CODE_NOT_FROM_ONE = 'CODE_NOT_FROM_ONE',
  /** 缺少必需事件 */
  MISSING_REQUIRED_EVENT = 'MISSING_REQUIRED_EVENT',
  /** 缺少 flow_context */
  MISSING_FLOW_CONTEXT = 'MISSING_FLOW_CONTEXT',
  /** 时间格式错误 */
  INVALID_TIME_FORMAT = 'INVALID_TIME_FORMAT',
  /** beginTime >= endTime */
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
}

// ============================================================
// Flow Context Types
// ============================================================

/**
 * Flow 上下文信息
 */
export interface FlowContext {
  /** Flow 唯一标识 */
  flowId: string;
  /** 子模块标识 */
  submoduleId: string;
  /** 当前步骤索引（0-based） */
  stepIndex: number;
  /** 步骤总数 */
  totalSteps: number;
  /** Flow 开始时间 */
  flowStartTime?: string;
}

// ============================================================
// Adapter API
// ============================================================

/**
 * 实验历史条目
 */
export interface ExperimentHistoryEntry {
  /** 实验操作描述 */
  action: string;
  /** 实验参数或结果 */
  data?: Record<string, unknown>;
  /** 操作时间 */
  time?: string;
}

/**
 * 映射配置校验结果
 */
export interface MappingConfigValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 错误列表 */
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * 子模块适配器 API
 */
export interface SubmoduleAdapterAPI {
  /**
   * 获取页面元数据
   * @param stepIndex - 步骤索引（1-based，Flow 模式下为 flowContext.stepIndex + 1）
   * @param subPageNum - 子页面序号（模块内部页面索引）
   */
  usePageMeta: (stepIndex: number, subPageNum: number) => PageMetaResult;

  /**
   * 操作日志管理 Hook
   * @param options - 配置对象，包含 pageNumber、targetPrefix、flowContext
   */
  useOperationLogger: (options: OperationLoggerOptions) => OperationLoggerResult;

  /**
   * 收集答案
   * @param pageId - 页面 ID
   * @param answers - 原始答案数据
   * @param config - 子模块映射配置
   */
  collectAnswers: (
    pageId: string,
    answers: Record<string, unknown>,
    config: import('./submodule-mapping').SubmoduleMappingConfig
  ) => AnswerEntry[];

  /**
   * 构建页面描述
   * @param pageTitle - 页面标题
   * @param flowContext - 可选的 Flow 上下文
   * @returns Flow 模式下返回 "[flowId/submoduleId/stepIndex] pageTitle"，独立模式下返回 pageTitle
   */
  buildPageDesc: (
    pageTitle: string,
    flowContext?: FlowContext | null
  ) => string;

  /**
   * 追加实验历史到答案列表（单条追加）
   * @param answerList - 现有答案列表
   * @param data - 实验历史数据（数组或对象）
   * @param options - 配置对象
   * @param options.targetElement - 由调用方指定的 targetElement（如 "P1.05_实验历史"）
   * @param options.historyCodeBase - 固定的 code 值（如 100）
   * @returns 追加实验历史后的答案列表
   */
  appendExperimentHistory: (
    answerList: AnswerEntry[],
    data: ExperimentHistoryEntry[] | Record<string, unknown>,
    options: {
      targetElement: string;
      historyCodeBase: number;
    }
  ) => AnswerEntry[];

  /**
   * 提交前校验
   * @param mark - 待校验的 MarkObject
   * @param flowContext - 可选的 Flow 上下文（存在时强制校验 flow_context 事件）
   */
  validateMarkBeforeSubmit: (
    mark: MarkObject,
    flowContext?: FlowContext | null
  ) => ValidationResult;

  /**
   * 校验子模块映射配置
   * @param config - 待校验的映射配置
   * @returns 校验结果，包含错误列表
   */
  validateMappingConfig: (
    config: Partial<import('./submodule-mapping').SubmoduleMappingConfig>
  ) => MappingConfigValidationResult;
}
