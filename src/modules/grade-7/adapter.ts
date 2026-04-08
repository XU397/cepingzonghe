import { formatTimestamp } from '@shared/services/dataLogger.js';
import EventTypes from '@shared/services/submission/eventTypes.js';
import {
  buildPageDesc as buildSharedPageDesc,
  collectAnswers,
  usePageMeta,
} from '@shared/services/submission/submoduleAdapter';
import { isReservedElement } from '@shared/services/submission/submoduleAdapter/constants';
import { G7_SUBMODULE_MAPPING, PAGE_DESC_MAP, getSubPageNumByPageId } from './mapping';

const FLOW_EVENT_TYPES = new Set([EventTypes.FLOW_CONTEXT, 'flow_context']);
const DISPLAY_NAME = '蒸馒头实验';

const normalizeTargetElement = (targetElement: unknown, prefix: string): string => {
  const raw = typeof targetElement === 'string' ? targetElement : '';
  if (!raw) return '';
  if (raw.startsWith('P')) return raw;
  if (isReservedElement(raw)) return raw;
  if (!prefix) return raw;
  return `${prefix}${raw}`;
};

const toAnswersRecord = (
  rawList: Array<{ targetElement?: unknown; value?: unknown }> | null | undefined,
  keyMapping?: Record<string, string>,
) => {
  const record: Record<string, unknown> = {};
  if (!Array.isArray(rawList)) {
    return record;
  }

  rawList.forEach((entry) => {
    const key = typeof entry?.targetElement === 'string' ? entry.targetElement : '';
    if (!key) return;
    const normalizedKey = keyMapping?.[key] || key;
    record[normalizedKey] = entry?.value;
  });

  return record;
};

export function buildPageDesc(
  pageId: string,
  flowContext?: { flowId?: string; submoduleId?: string; stepIndex?: number } | null,
  fallbackDesc?: string,
): string {
  const baseDesc = PAGE_DESC_MAP[pageId] || fallbackDesc || pageId || '未命名页面';
  return buildSharedPageDesc(baseDesc, flowContext);
}

export function useGrade7PageMeta(
  currentPageId: string,
  flowContext?: { stepIndex?: number } | null,
  fallbackStepIndex = 0,
  fallbackSubPageNum = 1,
) {
  const subPageNum = getSubPageNumByPageId(currentPageId) || fallbackSubPageNum;
  const baseStepIndex =
    typeof flowContext?.stepIndex === 'number' ? flowContext.stepIndex : fallbackStepIndex;
  const { pageNumber, targetPrefix, prefixTarget } = usePageMeta(baseStepIndex + 1, subPageNum);

  return {
    pageNumber,
    targetPrefix,
    prefixTarget,
    subPageNum,
    stepIndex: baseStepIndex,
  };
}

export function normalizeOperationsForSubmission(
  rawOperations: Array<{ targetElement?: unknown; eventType?: unknown }> | null | undefined,
  options: { targetPrefix?: string; flowContext?: any; pageId?: string } = {},
) {
  const { targetPrefix = '', flowContext, pageId } = options;
  const operations = Array.isArray(rawOperations)
    ? rawOperations.map((operation) => ({
        ...operation,
        targetElement: normalizeTargetElement(operation?.targetElement, targetPrefix),
      }))
    : [];

  const hasFlowContextEvent = operations.some((operation) =>
    FLOW_EVENT_TYPES.has(String(operation?.eventType || '')),
  );

  if (flowContext && !hasFlowContextEvent) {
    const pageEnterIndex = operations.findIndex(
      (op) => op.eventType === EventTypes.PAGE_ENTER || op.eventType === 'page_enter',
    );
    const pageEnterOp = pageEnterIndex >= 0 ? operations[pageEnterIndex] : undefined;
    const parseTimeValue = (value: unknown): Date | null => {
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }
      if (typeof value === 'string') {
        const directDate = new Date(value);
        if (!Number.isNaN(directDate.getTime())) {
          return directDate;
        }
        const isoLikeDate = new Date(value.replace(' ', 'T'));
        if (!Number.isNaN(isoLikeDate.getTime())) {
          return isoLikeDate;
        }
      }
      return null;
    };
    const pageEnterTime = parseTimeValue(pageEnterOp?.time);
    const flowContextTime = pageEnterTime
      ? formatTimestamp(new Date(pageEnterTime.getTime() + 1000))
      : typeof pageEnterOp?.time === 'string' && pageEnterOp.time.trim()
        ? pageEnterOp.time
        : formatTimestamp(new Date());

    const flowContextOp = {
      code: 0,
      targetElement: 'flow_context',
      eventType: EventTypes.FLOW_CONTEXT,
      value: JSON.stringify({
        flowId: flowContext.flowId || '',
        submoduleId: flowContext.submoduleId || '',
        stepIndex: flowContext.stepIndex ?? 0,
        moduleName: flowContext?.moduleName || DISPLAY_NAME,
        pageId: flowContext.pageId || pageId || '',
      }),
      time: flowContextTime,
      pageId,
    };

    if (pageEnterIndex !== -1) {
      operations.splice(pageEnterIndex + 1, 0, flowContextOp);
    } else {
      operations.unshift(flowContextOp);
    }

    operations.forEach((op, idx) => {
      (op as any).code = idx + 1;
    });
  }

  return operations;
}

export function normalizeAnswersForSubmission(
  pageId: string,
  rawAnswerList: Array<{ targetElement?: unknown; value?: unknown; code?: unknown }> | null | undefined,
  targetPrefix = '',
) {
  const answersObject = toAnswersRecord(rawAnswerList, G7_SUBMODULE_MAPPING.INTERNAL_TO_STANDARD_KEY);
  const mappedAnswers = collectAnswers(pageId, answersObject, G7_SUBMODULE_MAPPING);

  const baseList =
    mappedAnswers.length > 0
      ? mappedAnswers
      : Array.isArray(rawAnswerList)
        ? rawAnswerList.map((entry, index) => ({
            code: typeof entry?.code === 'number' ? entry.code : index + 1,
            targetElement: typeof entry?.targetElement === 'string' ? entry.targetElement : '',
            value: entry?.value ?? '',
          }))
        : [];

  return baseList.map((answer, index) => ({
    ...answer,
    code: typeof answer.code === 'number' ? answer.code : index + 1,
    targetElement: normalizeTargetElement(answer.targetElement, targetPrefix),
    value: answer?.value ?? '',
  }));
}
