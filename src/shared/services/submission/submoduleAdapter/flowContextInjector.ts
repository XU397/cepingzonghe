import EventTypes from '../eventTypes.js';
import { formatTimestamp } from '../createMarkObject.js';
import type { FlowContext, Operation } from './types';
import { OperationSequence } from './operationSequence';

export interface FlowContextPayload {
  flowId: FlowContext['flowId'];
  stepIndex: FlowContext['stepIndex'];
  submoduleId: FlowContext['submoduleId'];
  moduleName?: FlowContext['moduleName'];  // 可选，规范推荐填写，为兼容旧代码设为可选
  pageId?: FlowContext['pageId'];
}

export interface InjectFlowContextOptions {
  timestamp?: Date;
  allowMissingPageEnter?: boolean;
}

export class MissingPageEnterError extends Error {
  constructor() {
    super('injectFlowContext: operations 中缺少 page_enter 事件。Flow 场景下必须先记录 page_enter。');
    this.name = 'MissingPageEnterError';
  }
}

export function injectFlowContext(
  operations: Operation[],
  flowContext: FlowContextPayload,
  sequence: OperationSequence,
  options: InjectFlowContextOptions = {}
): Operation[] {
  const { timestamp = new Date(), allowMissingPageEnter = false } = options;

  const flowContextOperation: Operation = {
    code: sequence.next(),
    targetElement: 'flow_context',
    eventType: EventTypes.FLOW_CONTEXT,
    value: JSON.stringify(flowContext),
    time: formatTimestamp(timestamp),
  };

  const enterIndex = operations.findIndex((operation) => operation.eventType === EventTypes.PAGE_ENTER);

  if (enterIndex === -1) {
    if (!allowMissingPageEnter) {
      throw new MissingPageEnterError();
    }
    return [flowContextOperation, ...operations];
  }

  const result = [...operations];
  result.splice(enterIndex + 1, 0, flowContextOperation);
  return result;
}

export function shouldInjectFlowContext(
  operations: Operation[],
  flowContext: FlowContextPayload | null | undefined
): boolean {
  if (!flowContext) {
    return false;
  }
  return !operations.some((operation) => operation.eventType === EventTypes.FLOW_CONTEXT);
}
