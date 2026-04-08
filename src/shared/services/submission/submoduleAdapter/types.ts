/**
 * Type definitions for the submodule submission adapter.
 * Mirrors the contracts for standardized mark logging, validation, and mapping.
 */

export interface Operation {
  code: number;
  targetElement: string;
  eventType: string;
  value: string;
  time: string;
}

export interface AnswerEntry {
  code: number;
  targetElement: string;
  value: string;
}

export interface MarkObject {
  pageNumber: string;
  pageDesc: string;
  beginTime: string;
  endTime: string;
  operationList: Operation[];
  answerList: AnswerEntry[];
  imgList?: string[];
}

export interface PageMetaResult {
  pageNumber: string;
  targetPrefix: string;
  // eslint-disable-next-line no-unused-vars
  prefixTarget: (_elementId: string) => string;
}

export interface OperationLoggerOptions {
  pageNumber: string;
  targetPrefix: string;
  flowContext?: FlowContext | null;
}

export interface OperationLoggerResult {
  operations: Operation[];
  // eslint-disable-next-line no-unused-vars
  logOperation: (_params: LogOperationParams) => void;
  clearOperations: () => void;
  currentCode: number;
}

export interface LogOperationParams {
  targetElement: string;
  eventType: string;
  value: string;
  time?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  value?: unknown;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
}

/* eslint-disable no-unused-vars */ // Enum values used via string literals in tests
export enum ValidationErrorCode {
  INVALID_PAGE_NUMBER = 'INVALID_PAGE_NUMBER',
  MISSING_PREFIX = 'MISSING_PREFIX',
  MISMATCHED_PREFIX = 'MISMATCHED_PREFIX', // 前缀与当前页 pageNumber 不匹配
  CODE_DISCONTINUITY = 'CODE_DISCONTINUITY',
  CODE_NOT_FROM_ONE = 'CODE_NOT_FROM_ONE',
  MISSING_REQUIRED_EVENT = 'MISSING_REQUIRED_EVENT',
  MISSING_FLOW_CONTEXT = 'MISSING_FLOW_CONTEXT',
  INVALID_TIME_FORMAT = 'INVALID_TIME_FORMAT',
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
}
/* eslint-enable no-unused-vars */

export interface FlowContext {
  flowId: string;
  stepIndex: number;
  submoduleId: string;
  moduleName?: string; // 可选，规范推荐填写，为兼容旧代码设为可选
  pageId?: string;
  // 以下为可选扩展字段，供 Flow 运行态使用
  totalSteps?: number;
  flowStartTime?: string;
}

export interface ExperimentHistoryEntry {
  action: string;
  data?: Record<string, unknown>;
  time?: string;
}

export interface MappingConfigValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export interface PageConfig {
  pageId: string;
  title: string;
  subPageNum: number;
  questionKeys?: string[];
  isExperimentPage?: boolean;
}

export interface QuestionMapping {
  questionId: string;
  code: number;
  fullText: string;
  type: QuestionType;
  options?: Record<string, string>;
}

/* eslint-disable no-unused-vars */ // Enum values available for future use
export enum QuestionType {
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  TEXT = 'text',
  TEXTAREA = 'textarea',
  EXPERIMENT = 'experiment',
  OTHER = 'other',
}
/* eslint-enable no-unused-vars */

export interface SubmoduleMappingConfig {
  PAGE_CONFIGS: PageConfig[];
  PAGE_DESC_MAP: Record<string, string>;
  PAGE_QUESTIONS: Record<string, string[]>;
  QUESTION_CODE_MAP: Record<string, number>;
  QUESTION_TEXT_MAP: Record<string, string>;
  ANSWER_KEY_TO_QUESTION: Record<string, string>;
  // eslint-disable-next-line no-unused-vars
  getSubPageNumByPageId: (_pageId: string) => number;
  QUESTION_OPTIONS_MAP?: Record<string, Record<string, string>>;
  INTERNAL_TO_STANDARD_KEY?: Record<string, string>;
  HISTORY_CODE_BASE?: number;
  // eslint-disable-next-line no-unused-vars
  getPageConfig?: (_pageId: string) => PageConfig | undefined;
  // eslint-disable-next-line no-unused-vars
  formatAnswer?: (_questionId: string, _rawValue: unknown) => string;
}
