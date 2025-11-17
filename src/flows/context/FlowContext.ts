/**
 * FlowContext 类型定义（Phase 0 骨架）
 * 注意：仅提供接口与选择器签名，不改变现有逻辑
 */

import type { MutableRefObject } from 'react';

export interface FlowProgressLite {
  /** 子模块内部页码（复合页码的子部分） */
  modulePageNum: string | null;
  /** 最近更新时间（可选） */
  lastUpdated?: string;
  /** 是否完成（可选） */
  completed?: boolean;
  /** 步骤完成状态（可选） */
  stepCompleted?: Record<number, boolean>;
}

export interface TimerSnapshot {
  /** 任务剩余时间（秒） */
  remainingTime: number;
  /** 问卷剩余时间（秒） */
  questionnaireRemainingTime: number;
}

export interface UserContextLite {
  /** 考号 */
  examNo: string;
  /** 批次号 */
  batchCode: string;
  /** 当前页面ID（可选） */
  currentPageId?: string;
}

export interface HeartbeatController {
  /** 心跳是否启用（由 Provider 决定） */
  enabled: boolean;
  /** 预留：立即触发一次写入或刷新（Phase 0 可为空实现） */
  flush?: () => Promise<void> | void;
}

/**
 * FlowContext 运行时接口（供 Hooks 返回）
 */
export interface FlowContextValue {
  /** Flow 唯一ID */
  flowId: string;
  /** 当前子模块ID */
  submoduleId: string;
  /** 当前步骤索引（从0开始） */
  stepIndex: number;
  /** 进度（轻量） */
  progress: FlowProgressLite | null;

  /** 编排器实例引用（只读Ref） */
  orchestratorRef: MutableRefObject<any> | null;

  /** 导航到下一步（包装器，稳定引用） */
  navigateToNextStep: () => boolean | void | Promise<boolean | void>;

  /** 提交当前页面（包装器，稳定引用） */
  submitPage: (options?: Record<string, any>) => Promise<boolean>;

  /** 心跳控制器（Phase 0: 仅暴露 enabled） */
  heartbeat: HeartbeatController;

  /** 选择器：获取用户上下文快照（稳定引用） */
  getUserContext: () => UserContextLite;

  /** 选择器：获取计时器快照（稳定引用） */
  getTimerSnapshot: () => TimerSnapshot;

  /** 选择器：获取最小 Flow 上下文（稳定引用） */
  getFlowContext: () => {
    flowId: string;
    submoduleId: string;
    stepIndex: number;
    modulePageNum: string | null;
  };
}

export type { FlowContextValue as DefaultFlowContextValue };

