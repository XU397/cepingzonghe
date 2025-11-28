/**
 * 允许的埋点事件类型。此列表仅涵盖本目录封装组件实际使用的事件。
 */
export type TrackingEventType =
  | 'input_focus'
  | 'input_change'
  | 'input_blur'
  | 'input_delete'
  | 'select_change'
  | 'click'
  | 'click_blocked';

/**
 * 支持记录到埋点系统的 value 类型。
 */
export type TrackingOperationValue =
  | string
  | number
  | boolean
  | null
  | Record<string, unknown>;

/**
 * 标准化的操作记录 payload。
 */
export interface TrackingOperation<TValue = TrackingOperationValue> {
  targetElement: string;
  eventType: TrackingEventType | string;
  value?: TValue;
  time: string;
  pageId?: string;
}

/**
 * 标准 logOperation 函数签名。
 */
export type LogOperationHandler<TValue = TrackingOperationValue> = (
  operation: TrackingOperation<TValue>,
) => void;

/**
 * 组件通用必填 Props（追踪相关）。
 */
export interface TrackingInfoProps {
  name: string;
  pageNumber: string | number;
  logOperation: LogOperationHandler;
}

/**
 * 自定义必填字段状态信息。
 */
export interface RequiredFieldState<TValue = unknown> {
  name: string;
  value: TValue;
  validator?: (value: TValue) => boolean;
}
