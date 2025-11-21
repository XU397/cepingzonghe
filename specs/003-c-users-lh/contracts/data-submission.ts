/**
 * Data Submission Contract for 光伏治沙交互实验子模块
 * 
 * 定义与后端API交互的数据提交合约
 */

/**
 * 标准事件类型 (项目统一规范)
 */
export enum StandardEventTypes {
  PAGE_ENTER = 'page_enter',
  PAGE_EXIT = 'page_exit',
  CLICK = 'click',
  CHANGE = 'change',
  CLICK_BLOCKED = 'click_blocked',
  FLOW_CONTEXT = 'flow_context',
}

/**
 * 操作记录接口
 */
export interface OperationRecord {
  code: number;                    // 操作序号(自增)
  targetElement: string;           // 目标元素标识
  eventType: StandardEventTypes;   // 标准事件类型
  value: string | object;          // 操作值
  time: string;                    // ISO 8601时间格式
  pageId?: string;                 // 页面ID(可选)
}

/**
 * 答案记录接口
 */
export interface AnswerRecord {
  code: number;                    // 答案编号(从1开始自增)
  targetElement: string;           // 问题标识，格式: "P{pageNumber}_{语义ID}"
  value: string;                   // 答案值(使用可读标签，非内部编码)
}

/**
 * MarkObject提交数据结构
 */
export interface MarkObject {
  pageNumber: string;              // 点分隔格式: "H.1", "1.4", "2.5" 等
  pageDesc: string;                // 格式: "[flowId/submoduleId/stepIndex] 页面描述"
  operationList: OperationRecord[]; // 操作记录列表
  answerList: AnswerRecord[];       // 答案记录列表
  beginTime: string;               // 页面开始时间 "YYYY-MM-DD HH:mm:ss"
  endTime: string;                 // 页面结束时间 "YYYY-MM-DD HH:mm:ss"
  imgList: any[];                  // 图片列表(本模块为空数组)
}

/**
 * API提交请求结构
 */
export interface SubmissionRequest {
  batchCode: string;               // 批次代码
  examNo: string;                  // 考试编号
  mark: string;                    // JSON.stringify(MarkObject)
}

/**
 * API提交响应结构
 */
export interface SubmissionResponse {
  code: number;                    // 响应码: 200成功, 401未授权, 500服务器错误
  message?: string;                // 响应消息
  obj?: any;                       // 响应数据(可选)
}

/**
 * 光伏治沙模块的具体事件定义
 */
export namespace PvSandEvents {
  
  /**
   * 页面生命周期事件
   */
  export interface PageLifecycleEvent extends OperationRecord {
    targetElement: '页面';
    eventType: StandardEventTypes.PAGE_ENTER | StandardEventTypes.PAGE_EXIT;
    value: string; // pageId: 'instructions_cover' | 'experiment_design' 等
  }
  
  /**
   * 实验操作事件
   */
  export interface ExperimentOperationEvent extends OperationRecord {
    targetElement: '开始按钮' | '重置按钮' | '高度调节器';
    eventType: StandardEventTypes.CLICK;
    value: string; // '开始实验_高度50cm' | '重置实验' | '调节高度_从50到100cm'
  }
  
  /**
   * 答题输入事件
   */
  export interface AnswerInputEvent extends OperationRecord {
    targetElement: string; // 'P1.4_实验设计问题1' | 'P3.6_风速对比问题'
    eventType: StandardEventTypes.CHANGE;
    value: string; // 用户输入内容或选择值
  }
  
  /**
   * 验证阻断事件
   */
  export interface ValidationBlockEvent extends OperationRecord {
    targetElement: '下一步';
    eventType: StandardEventTypes.CLICK_BLOCKED;
    value: string; // '文本长度不足5字符' | '未完成实验操作'
  }
  
  /**
   * Flow上下文事件
   */
  export interface FlowContextEvent extends OperationRecord {
    targetElement: 'flow_context';
    eventType: StandardEventTypes.FLOW_CONTEXT;
    value: string; // JSON字符串: { flowId, submoduleId, stepIndex, timestamp }
  }
}

/**
 * 光伏治沙模块的答案标识规范
 */
export namespace PvSandAnswerTargets {
  
  // Page 4: 实验方案设计
  export const DESIGN_REASON = 'P1.4_实验设计原因问题';
  
  // Page 6: 实验探究-1
  export const WIND_SPEED_COMPARISON = 'P3.6_风速对比问题';
  
  // Page 7: 实验探究-2  
  export const TREND_ANALYSIS = 'P4.7_趋势分析问题';
  
  // Page 8: 结论分析
  export const CONCLUSION_Q1 = 'P5.8_结论问题1';
  export const CONCLUSION_Q2 = 'P5.8_结论问题2';
  export const CONCLUSION_Q3 = 'P5.8_结论问题3';
}

/**
 * 提交数据构建器
 */
export interface MarkObjectBuilder {
  
  /**
   * 构建页面编号
   */
  buildPageNumber(pageId: string): string;
  
  /**
   * 构建页面描述
   */
  buildPageDesc(pageId: string, flowId: string, stepIndex: number | null): string;
  
  /**
   * 构建MarkObject
   */
  buildMarkObject(params: {
    pageId: string;
    flowId: string;
    stepIndex: number | null;
    operations: OperationRecord[];
    answers: AnswerRecord[];
    beginTime: Date;
    endTime: Date;
  }): MarkObject;
  
  /**
   * 验证MarkObject结构
   */
  validateMarkObject(markObject: MarkObject): {
    isValid: boolean;
    errors: string[];
  };
}

/**
 * usePageSubmission Hook接口
 */
export interface PageSubmissionHook {
  
  /**
   * 提交页面数据
   */
  submit(markOverride?: Partial<MarkObject>): Promise<boolean>;
  
  /**
   * 当前提交状态
   */
  isSubmitting: boolean;
  
  /**
   * 最后一次错误信息
   */
  lastError: string | null;
  
  /**
   * 重试计数器
   */
  retryCount: number;
}

/**
 * 提交钩子配置
 */
export interface PageSubmissionConfig {
  
  /**
   * 获取用户上下文
   */
  getUserContext(): { batchCode: string; examNo: string; };
  
  /**
   * 构建MarkObject
   */
  buildMark(): MarkObject;
  
  /**
   * 获取Flow上下文(用于自动注入flow_context事件)
   */
  getFlowContext?(): {
    flowId: string;
    submoduleId: string;
    stepIndex: number;
    pageId: string;
  } | null;
  
  /**
   * 提交前钩子
   */
  onBefore?(mark: MarkObject): Promise<void> | void;
  
  /**
   * 提交成功后钩子
   */
  onAfter?(result: { response: SubmissionResponse; mark: MarkObject }): void;
  
  /**
   * 提交失败后钩子
   */
  onError?(error: Error, retryCount: number): void;
}

/**
 * API端点定义
 */
export const API_ENDPOINTS = {
  SUBMIT_MARK: '/stu/saveHcMark',           // 数据提交端点
  CHECK_SESSION: '/stu/checkSession',       // 会话检查端点
  LOGIN: '/stu/login',                      // 登录端点
} as const;

/**
 * HTTP状态码
 */
export enum HttpStatusCodes {
  SUCCESS = 200,                            // 成功
  UNAUTHORIZED = 401,                       // 未授权(会话过期)
  INTERNAL_ERROR = 500,                     // 服务器内部错误
}

/**
 * 错误处理策略
 */
export interface ErrorHandlingStrategy {
  
  /**
   * 401错误处理(会话过期)
   */
  handle401(): void; // 重定向到登录页面
  
  /**
   * 网络错误处理
   */
  handleNetworkError(error: Error, retryCount: number): boolean; // 返回是否重试
  
  /**
   * 服务器错误处理  
   */
  handleServerError(response: SubmissionResponse): void; // 显示错误信息
  
  /**
   * 数据验证错误处理
   */
  handleValidationError(errors: string[]): void; // 阻止提交并提示
}

/**
 * 重试策略配置
 */
export interface RetryStrategy {
  maxRetries: 3;                            // 最大重试次数
  retryDelays: [1000, 2000, 4000];         // 重试延迟(指数退避)
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR']; // 可重试的错误类型
  nonRetryableErrors: ['UNAUTHORIZED', 'VALIDATION_ERROR']; // 不可重试的错误
}