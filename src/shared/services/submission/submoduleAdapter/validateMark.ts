import EventTypes from '../eventTypes.js';
import { DEFAULTS, isReservedElement } from './constants';
import { FlowContext, MarkObject, ValidationErrorCode, ValidationResult } from './types';

const TIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const parseTimeToTimestamp = (value: string | undefined | null): number | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!TIME_REGEX.test(normalized)) {
    return null;
  }

  const parsed = new Date(normalized.replace(' ', 'T'));
  const timestamp = parsed.getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
};

export function validateMarkBeforeSubmit(
  mark: MarkObject,
  flowContext?: FlowContext | null,
): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  if (!DEFAULTS.PAGE_NUMBER_REGEX.test(mark.pageNumber)) {
    errors.push({
      code: ValidationErrorCode.INVALID_PAGE_NUMBER,
      message: `pageNumber "${mark.pageNumber}" does not match ${DEFAULTS.PAGE_NUMBER_REGEX}`,
      path: 'pageNumber',
      value: mark.pageNumber,
    });
  }

  const operations = Array.isArray(mark.operationList) ? mark.operationList : [];

  // 构建期望的前缀（基于 pageNumber）
  const expectedPrefix = `P${mark.pageNumber}_`;

  operations.forEach((operation, index) => {
    if (!isReservedElement(operation.targetElement)) {
      const hasPrefix = DEFAULTS.TARGET_PREFIX_REGEX.test(operation.targetElement);
      if (!hasPrefix) {
        errors.push({
          code: ValidationErrorCode.MISSING_PREFIX,
          message: `operationList[${index}].targetElement is missing required prefix`,
          path: `operationList[${index}].targetElement`,
          value: operation.targetElement,
        });
      } else {
        // 检查前缀是否与当前页的 pageNumber 匹配
        if (!operation.targetElement.startsWith(expectedPrefix)) {
          const actualPrefix = operation.targetElement.match(/^P[\d.]+_/)?.[0] || '';
          warnings.push({
            code: ValidationErrorCode.MISMATCHED_PREFIX,
            message: `operationList[${index}].targetElement prefix "${actualPrefix}" does not match expected "${expectedPrefix}"`,
            path: `operationList[${index}].targetElement`,
            value: operation.targetElement,
          });
        }
      }
    }
  });

  if (operations.length > 0 && operations[0].code !== 1) {
    errors.push({
      code: ValidationErrorCode.CODE_NOT_FROM_ONE,
      message: 'operationList.code must start from 1',
      path: 'operationList[0].code',
      value: operations[0].code,
    });
  }

  operations.forEach((operation, index) => {
    if (index === 0) {
      return;
    }
    const expectedCode = operations[index - 1].code + 1;
    if (operation.code !== expectedCode) {
      errors.push({
        code: ValidationErrorCode.CODE_DISCONTINUITY,
        message: `operationList[${index}].code should be ${expectedCode}`,
        path: `operationList[${index}].code`,
        value: operation.code,
      });
    }
  });

  const eventTypes = new Set(operations.map((operation) => operation.eventType));

  const requiredEvents = [
    { type: EventTypes.PAGE_ENTER, label: 'page_enter' },
    { type: EventTypes.PAGE_EXIT, label: 'page_exit' },
  ];

  requiredEvents.forEach((event) => {
    if (!eventTypes.has(event.type)) {
      errors.push({
        code: ValidationErrorCode.MISSING_REQUIRED_EVENT,
        message: `operationList must include ${event.label} event`,
        path: 'operationList',
      });
    }
  });

  if (flowContext && !eventTypes.has(EventTypes.FLOW_CONTEXT)) {
    errors.push({
      code: ValidationErrorCode.MISSING_FLOW_CONTEXT,
      message: 'flow_context event is required when flowContext is provided',
      path: 'operationList',
    });
  }

  const beginTimestamp = parseTimeToTimestamp(mark.beginTime);
  if (beginTimestamp === null) {
    errors.push({
      code: ValidationErrorCode.INVALID_TIME_FORMAT,
      message: `beginTime should match format ${DEFAULTS.TIME_FORMAT}`,
      path: 'beginTime',
      value: mark.beginTime,
    });
  }

  const endTimestamp = parseTimeToTimestamp(mark.endTime);
  if (endTimestamp === null) {
    errors.push({
      code: ValidationErrorCode.INVALID_TIME_FORMAT,
      message: `endTime should match format ${DEFAULTS.TIME_FORMAT}`,
      path: 'endTime',
      value: mark.endTime,
    });
  }

  if (
    beginTimestamp !== null &&
    endTimestamp !== null &&
    beginTimestamp >= endTimestamp
  ) {
    errors.push({
      code: ValidationErrorCode.INVALID_TIME_RANGE,
      message: 'beginTime must be earlier than endTime',
      path: 'beginTime',
      value: { beginTime: mark.beginTime, endTime: mark.endTime },
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
