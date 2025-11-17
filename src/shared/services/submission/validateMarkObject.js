import EventTypes, { EventTypeValues } from './eventTypes.js';

const REQUIRED_STRING_FIELDS = ['pageNumber', 'pageDesc', 'beginTime', 'endTime'];
const EVENT_TYPE_SET = new Set(EventTypeValues);

const isString = (value) => typeof value === 'string' && value.trim().length > 0;

const hasEventType = (operation) => {
  if (!operation || typeof operation !== 'object') return false;
  const eventType = operation.eventType;
  return typeof eventType === 'string' && eventType.trim().length > 0;
};

const ensureSequentialCode = (collectionName, item, index) => {
  const expectedCode = index + 1;
  if (item.code === undefined || item.code === null) {
    item.code = expectedCode;
    return;
  }
  if (item.code !== expectedCode) {
    throw new Error(
      `[validateMarkObject] ${collectionName}[${index}].code 必须为 ${expectedCode}`,
    );
  }
};

/**
 * 校验 MarkObject 是否满足数据格式规范的最小要求。
 * 若检测到问题会抛出错误，便于在调用链路中捕获。
 *
 * @param {import('../../types/mark.js').MarkObject} mark
 */
export function validateMarkObject(mark) {
  if (!mark || typeof mark !== 'object') {
    throw new Error('[validateMarkObject] mark 不能为空且必须为对象');
  }

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isString(mark[field])) {
      throw new Error(`[validateMarkObject] 字段 ${field} 必须为非空字符串`);
    }
  }

  if (!Array.isArray(mark.operationList)) {
    throw new Error('[validateMarkObject] operationList 必须为数组');
  }

  mark.operationList.forEach((operation, index) => {
    if (!hasEventType(operation)) {
      throw new Error(`[validateMarkObject] operationList[${index}] 缺少合法的 eventType`);
    }

    if (!EVENT_TYPE_SET.has(operation.eventType)) {
      throw new Error(
        `[validateMarkObject] operationList[${index}].eventType (${operation.eventType}) 非标准事件类型`,
      );
    }

    if (!isString(operation.time)) {
      throw new Error(`[validateMarkObject] operationList[${index}].time 必须为非空字符串`);
    }

    ensureSequentialCode('operationList', operation, index);

    if (
      operation.eventType === EventTypes.FLOW_CONTEXT &&
      operation.value && typeof operation.value !== 'object'
    ) {
      console.log('[validateMarkObject] invalid flow_context operation detected:', operation);
      throw new Error('[validateMarkObject] flow_context 事件的 value 必须为对象');
    }
  });

  if (!Array.isArray(mark.answerList)) {
    throw new Error('[validateMarkObject] answerList 必须为数组');
  }

  mark.answerList.forEach((answer, index) => {
    if (!answer || typeof answer !== 'object') {
      throw new Error(`[validateMarkObject] answerList[${index}] 必须为对象`);
    }
    ensureSequentialCode('answerList', answer, index);
    answer.value = 'value' in answer ? String(answer.value ?? '') : '';
  });
}

export default validateMarkObject;
