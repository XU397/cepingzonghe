/**
 * G4 Experiment Submodule - CMI Interface Contract
 *
 * 本文件定义 g4-experiment 子模块与 FlowOrchestrator 之间的接口契约。
 * 符合 openspec/specs/flow/spec.md 的 CMI 规范。
 *
 * @date 2025-12-17
 * @see spec.md
 */

import type { FC } from 'react';

// ============================================================
// CMI 核心接口
// ============================================================

/**
 * 子模块定义接口 - 必须由 index.jsx 导出
 */
export interface SubmoduleDefinition {
  /** 子模块唯一标识 */
  submoduleId: 'g4-experiment';

  /** 显示名称 */
  displayName: string;

  /** 语义化版本 */
  version: string;

  /** 子模块主组件 */
  Component: FC<SubmoduleComponentProps>;

  /**
   * 根据后端返回的 subPageNum 获取初始页面ID
   * @param subPageNum 后端返回的页码（字符串 "1"-"12"）
   * @returns pageId 或默认首页
   */
  getInitialPage: (subPageNum: string) => string;

  /**
   * 获取可见步骤总数（不含 hidden 模式页面）
   * @returns 11（notices 页为 hidden，不计入）
   */
  getTotalSteps: () => number;

  /**
   * 获取指定页面的导航模式
   * @param pageId 页面ID
   * @returns 'hidden' | 'experiment'
   */
  getNavigationMode: (pageId: string) => NavigationMode;

  /**
   * 获取默认计时器配置
   * @returns { task: 2400 } (40分钟)
   */
  getDefaultTimers: () => TimerConfig;

  /**
   * 可选：根据 pageId 反查 subPageNum
   * @param pageId 页面ID
   * @returns subPageNum 字符串或 null
   */
  resolvePageNum?: (pageId: string | null | undefined) => string | null;
}

// ============================================================
// 组件 Props
// ============================================================

/**
 * 子模块主组件 Props
 */
export interface SubmoduleComponentProps {
  /** 用户上下文（包含 batchCode, examNo 等） */
  userContext: UserContext;

  /** 初始页面ID */
  initialPageId: string;

  /** 可选配置 */
  options?: SubmoduleOptions;
}

export interface UserContext {
  batchCode: string;
  examNo: string;
  studentName?: string;
  [key: string]: unknown;
}

export interface SubmoduleOptions {
  /** 是否为 Flow 模式 */
  flowMode?: boolean;

  /** Flow 上下文（仅 Flow 模式有效） */
  flowContext?: FlowContext;
}

export interface FlowContext {
  flowId: string;
  stepIndex: number;
  onComplete: () => void;
  onError: (error: Error) => void;
}

// ============================================================
// 类型定义
// ============================================================

export type NavigationMode = 'hidden' | 'experiment';

export interface TimerConfig {
  /** 任务计时器（秒） */
  task: number;

  /** 问卷计时器（秒），本模块不使用 */
  questionnaire?: number;
}

// ============================================================
// 页面配置
// ============================================================

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

export interface PageConfig {
  pageId: PageId;
  subPageNum: number;
  navigationMode: NavigationMode;
  description: string;
}

/**
 * 页面配置映射
 */
export const PAGE_CONFIGS: Record<number, PageConfig> = {
  1: { pageId: 'notices', subPageNum: 1, navigationMode: 'hidden', description: '注意事项' },
  2: { pageId: 'scenario-intro', subPageNum: 2, navigationMode: 'experiment', description: '情景介绍' },
  3: { pageId: 'problem-identification', subPageNum: 3, navigationMode: 'experiment', description: '问题识别' },
  4: { pageId: 'factor-analysis', subPageNum: 4, navigationMode: 'experiment', description: '因素分析' },
  5: { pageId: 'route-analysis', subPageNum: 5, navigationMode: 'experiment', description: '出发站交互' },
  6: { pageId: 'station-recommendation', subPageNum: 6, navigationMode: 'experiment', description: '出发站结论' },
  7: { pageId: 'timeline-planning-tutorial', subPageNum: 7, navigationMode: 'experiment', description: '拖拽演示' },
  8: { pageId: 'user-solution-design', subPageNum: 8, navigationMode: 'experiment', description: '方案设计' },
  9: { pageId: 'plan-optimization', subPageNum: 9, navigationMode: 'experiment', description: '方案评估' },
  10: { pageId: 'ticket-filter', subPageNum: 10, navigationMode: 'experiment', description: '车票筛选' },
  11: { pageId: 'ticket-pricing', subPageNum: 11, navigationMode: 'experiment', description: '车票计价' },
  12: { pageId: 'task-completion', subPageNum: 12, navigationMode: 'experiment', description: '完成页' },
};

// ============================================================
// 数据提交契约
// ============================================================

/**
 * MarkObject - 数据提交对象
 * 符合 openspec/specs/data-format/spec.md
 */
export interface MarkObject {
  /** 复合页码 "X.YY"，如 "1.03" */
  pageNumber: string;

  /** 页面描述，含 Flow 前缀 */
  pageDesc: string;

  /** 操作记录列表 */
  operationList: Operation[];

  /** 答案记录列表 */
  answerList: Answer[];

  /** 页面开始时间 "YYYY-MM-DD HH:mm:ss" */
  beginTime: string;

  /** 页面结束时间 "YYYY-MM-DD HH:mm:ss" */
  endTime: string;

  /** 图片元数据（本模块为空数组） */
  imgList: ImageMeta[];
}

export interface Operation {
  /** 操作序号，从1递增 */
  code: number;

  /** 操作目标，带页码前缀 "P1.03_问题输入框" */
  targetElement: string;

  /** 事件类型，使用 EventTypes 常量值 */
  eventType: string;

  /** 操作值 */
  value: string;

  /** ISO 8601 时间戳 */
  time: string;
}

export interface Answer {
  /** 答案序号，从1递增 */
  code: number;

  /** 答案来源元素 */
  targetElement: string;

  /** 答案值 */
  value: string;
}

export interface ImageMeta {
  /** 图片ID */
  id: string;

  /** 图片描述 */
  description?: string;
}

// ============================================================
// 业务实体
// ============================================================

/**
 * 任务条实体
 */
export interface TaskBlock {
  /** 模板ID "task-1" ~ "task-5" */
  id: string;

  /** 克隆实例ID（放置后生成） */
  cloneId?: string;

  /** 显示名称 */
  label: string;

  /** 时长（分钟） */
  duration: number;

  /** 像素宽度 */
  width: number;

  /** CSS变量引用 */
  color: string;

  /** 放置位置X */
  x?: number;

  /** 放置位置Y（0=主轴, 1=副轴） */
  y?: 0 | 1;
}

/**
 * 方案实体
 */
export interface Solution {
  id: 'solution-1' | 'solution-2' | 'solution-improved';
  tasks: PlacedTask[];
  userInputTime: number | null;
}

export interface PlacedTask extends Required<Pick<TaskBlock, 'id' | 'cloneId' | 'label' | 'duration' | 'width' | 'color' | 'x' | 'y'>> {}

/**
 * 对话消息实体
 */
export interface DialogueMessage {
  role: 'uncle' | 'mom' | 'dad' | 'ming';
  text: string;
}

/**
 * 车次信息实体
 */
export interface TrainSchedule {
  trainNo: string;
  departure: string;
  arrival: string;
  duration: string;
  adultPrice: number;
  adultSeats: number;
  studentPrice: number;
  studentSeats: number;
}

/**
 * 路线信息实体
 */
export interface RouteInfo {
  id: number;
  station: string;
  segments: string[];
  totalDistance: number;
  isEditable: boolean;
}
