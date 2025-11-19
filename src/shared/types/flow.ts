/**
 * Flow 编排运行时类型定义
 * 用于支持拼装式测评流程
 */

import type { ReactElement, ComponentType } from 'react';
import type { CompositePageNum } from '@/shared/utils/pageMapping';
export { parseCompositePageNum } from '@/shared/utils/pageMapping';
export type { CompositePageNum };

/**
 * Flow 定义结构（后端存储）
 */
export interface FlowDefinition {
  /** Flow 唯一标识 */
  flowId: string;
  /** Flow 显示名称 */
  name: string;
  /** Flow 路由路径，格式: /flow/<flowId> */
  url: string;
  /** 描述信息 */
  description?: string;
  /** 状态：draft/published 等 */
  status?: string;
  /** 版本号 */
  version?: string;
  /** 步骤列表 */
  steps: FlowStep[];
}

/**
 * Flow 步骤定义
 */
export interface FlowStep {
  /** 子模块 ID (kebab-case: g7-experiment, g4-experiment) */
  submoduleId: string;
  /** 步骤显示名称 */
  displayName?: string;
  /** 配置覆盖 */
  overrides?: {
    /** 计时器配置覆盖 */
    timers?: {
      /** 任务计时（秒） */
      task?: number;
      /** 问卷计时（秒） */
      questionnaire?: number;
    };
  };
  /** 过渡页配置 */
  transitionPage?: {
    /** 过渡页标题 */
    title?: string;
    /** 过渡页内容 */
    content?: string;
    /** 自动跳转秒数（0表示手动点击） */
    autoNextSeconds?: number;
  };
}

/**
 * Flow 进度结构（后端返回 + 前端持久化）
 */
export interface FlowProgress {
  /** 当前所在步骤索引（从 0 开始） */
  stepIndex: number;
  /** 当前子模块内的页码 */
  modulePageNum: string | null;
  /** 是否已完成 */
  completed?: boolean;
  /** 各步骤完成状态 */
  stepCompleted?: { [stepIndex: number]: boolean };
  /** 最后更新时间 */
  lastUpdated?: string;
}

/**
 * 子模块接口（CMI - Composable Module Interface）
 * 所有子模块包装器必须实现此接口
 */
export interface SubmoduleDefinition {
  /** 子模块唯一标识 (kebab-case) */
  submoduleId: string;
  /** 显示名称 */
  displayName: string;
  /** 版本号 */
  version: string;
  /** 子模块主组件 */
  Component: ComponentType<SubmoduleProps>;
  /** 根据子页码获取初始页面 ID */
  getInitialPage: (subPageNum: string) => string;
  /** 获取总步数 */
  getTotalSteps: () => number;
  /** 获取导航模式 */
  getNavigationMode: (pageId: string) => 'experiment' | 'questionnaire' | 'hidden';
  /** 获取默认计时器配置 */
  getDefaultTimers?: () => {
    task?: number;
    questionnaire?: number;
  };
  /** 初始化钩子 */
  onInitialize?: () => void;
  /** 销毁钩子 */
  onDestroy?: () => void;
  /** 将页面ID解析为子模块内部页码 */
  resolvePageNum?: (pageId: string | null | undefined) => string | null;
}

/**
 * 子模块组件 Props
 */
export interface SubmoduleProps {
  /** 用户上下文（从 AppContext 传递） */
  userContext: {
    user: {
      studentName: string;
      examNo: string;
      batchCode: string;
      [key: string]: any;
    };
    session: {
      pageNum: string;
      moduleUrl: string;
      isAuthenticated: boolean;
      [key: string]: any;
    };
    helpers: {
      logOperation: (operation: any) => void;
      collectAnswer: (answer: any) => void;
      navigateToPage: (pageId: string) => void;
      [key: string]: any;
    };
  };
  /** 初始页面 ID */
  initialPageId: string;
  /** 配置选项（来自 FlowStep.overrides） */
  options?: {
    timers?: {
      task?: number;
      questionnaire?: number;
    };
  };
  /** Flow 上下文（仅在 Flow 模式下存在） */
  flowContext?: {
    flowId: string;
    stepIndex: number;
    submoduleId: string;
    modulePageNum?: string | null;
    onComplete?: () => void;
    onTimeout?: () => void;
    updateModuleProgress?: (modulePageNum: string) => void;
  };
}

/**
 * Flow 存储键名约定
 */
export const FlowStorageKeys = {
  /** 当前步骤索引: flow.<id>.stepIndex */
  stepIndex: (flowId: string) => `flow.${flowId}.stepIndex`,
  /** 当前子模块页码: flow.<id>.modulePageNum */
  modulePageNum: (flowId: string) => `flow.${flowId}.modulePageNum`,
  /** Flow 定义缓存: flow.<id>.definition */
  definition: (flowId: string) => `flow.${flowId}.definition`,
  /** 完成标志: flow.<id>.completed */
  completed: (flowId: string) => `flow.${flowId}.completed`,
  /** 一次性打点标志: flow.<id>.flags.flowContextLogged.<stepIndex> */
  flowContextLogged: (flowId: string, stepIndex: number) =>
    `flow.${flowId}.flags.flowContextLogged.${stepIndex}`,
} as const;

/**
 * 编码复合页码
 */
export function encodeCompositePageNum(stepIndex: number, subPageNum: string): string {
  return `M${stepIndex}:${subPageNum}`;
}

/**
 * Flow 上下文操作日志的值
 */
export interface FlowContextValue {
  flowId: string;
  stepIndex: number;
  submoduleId: string;
  moduleName: string;
}

/**
 * Flow 上下文操作日志
 */
export interface FlowContextOperation {
  targetElement: '页面';
  eventType: 'flow_context';
  value: FlowContextValue;
  time: string;
}

/**
 * 创建 Flow 上下文操作
 */
export function createFlowContextOperation(
  flowId: string,
  stepIndex: number,
  submoduleId: string,
  moduleName: string
): FlowContextOperation {
  return {
    targetElement: '页面',
    eventType: 'flow_context',
    value: {
      flowId,
      stepIndex,
      submoduleId,
      moduleName,
    },
    time: new Date().toISOString(),
  };
}
