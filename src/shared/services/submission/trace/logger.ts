import { buildTargetElementPrefix } from '@shared/utils/pageMapping.ts';
import {
  CONTENT_REGISTRY_HASH,
  CONTENT_REGISTRY_VERSION,
  FIELD_REGISTRY_HASH,
  FIELD_REGISTRY_VERSION,
  TRACE_SCHEMA_VERSION,
} from './contracts';
import type {
  L2TraceEventType,
  TraceEventValue,
  TraceFlowContext,
  TraceIdFactory,
  TraceOperationDraft,
  TracePageLike,
  TraceTargetType,
} from './types';

export interface TraceLoggerOptions {
  page: TracePageLike;
  pageNumber: string;
  flowContext?: TraceFlowContext | null;
  logOperation: (operation: TraceOperationDraft) => void;
  now?: () => Date;
  idFactory?: Partial<TraceIdFactory>;
}

export interface TraceEmitOptions {
  targetId: string;
  targetType: TraceTargetType;
  metadata?: Record<string, unknown>;
  time?: Date;
  emit?: boolean;
}

export interface SelectAnswerOptions {
  questionId: string;
  optionId: string;
  optionText?: string;
  valueBefore?: string | null;
  targetId: string;
  questionIndex?: number;
  totalQuestionCount?: number;
}

export interface SubmitAttemptOptions {
  validationStatus: 'success' | 'blocked' | 'auto' | 'timeout';
  missingFields?: string[];
  targetId?: string;
}

export const formatTraceTimestamp = (date: Date): string => {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
    `${offsetSign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`,
  ].join('');
};

const defaultIdFactory: TraceIdFactory = {
  traceId: () => `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  submitAttemptId: () => `submit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  expRunId: (pageId, runSeq) => `${pageId}_exp_run_${runSeq}`,
  rowId: (pageId, rowSeq) => `${pageId}_row_${rowSeq}`,
};

export function createPageTraceLogger(options: TraceLoggerOptions) {
  const idFactory = { ...defaultIdFactory, ...options.idFactory };
  const now = options.now || (() => new Date());
  const targetPrefix = buildTargetElementPrefix(options.pageNumber);

  const createValue = (
    patch: Partial<TraceEventValue>,
    metadata: Record<string, unknown> = {}
  ): TraceEventValue => ({
    trace_id: patch.trace_id || idFactory.traceId(),
    page_id: options.page.standardPageId,
    page_type: options.page.pageType,
    target_id: patch.target_id,
    target_type: patch.target_type || 'page',
    field_id: patch.field_id,
    content_id: patch.content_id,
    question_id: patch.question_id,
    option_id: patch.option_id,
    row_id: patch.row_id,
    param_id: patch.param_id,
    param_name: patch.param_name,
    chart_id: patch.chart_id,
    point_id: patch.point_id,
    exp_run_id: patch.exp_run_id,
    submit_attempt_id: patch.submit_attempt_id,
    value_before: patch.value_before,
    value_after: patch.value_after,
    validation_status: patch.validation_status,
    metadata: {
      schema_version: TRACE_SCHEMA_VERSION,
      field_registry_version: FIELD_REGISTRY_VERSION,
      field_registry_hash: FIELD_REGISTRY_HASH,
      content_registry_version: CONTENT_REGISTRY_VERSION,
      content_registry_hash: CONTENT_REGISTRY_HASH,
      page_index: options.page.pageIndex,
      legacy_page_id: options.page.legacyPageId,
      ...metadata,
    },
  });

  const emit = (
    type: L2TraceEventType,
    patch: Partial<TraceEventValue>,
    emitOptions: TraceEmitOptions
  ): TraceOperationDraft => {
    const value = createValue(
      {
        ...patch,
        target_id: patch.target_id || emitOptions.targetId,
        target_type: patch.target_type || emitOptions.targetType,
      },
      emitOptions.metadata
    );
    const operation: TraceOperationDraft = {
      targetElement: `${targetPrefix}${emitOptions.targetId}`,
      eventType: type,
      value,
      time: formatTraceTimestamp(emitOptions.time || now()),
      pageId: options.page.legacyPageId,
    };
    if (emitOptions.emit !== false) {
      options.logOperation(operation);
    }
    return operation;
  };

  return {
    emit,
    startPage(metadata: Record<string, unknown> = {}) {
      return emit(
        'START_PAGE',
        {},
        {
          targetId: 'page',
          targetType: 'page',
          metadata: {
            flow_context: options.flowContext || null,
            ...metadata,
          },
        }
      );
    },
    textFocus(fieldId: string, valueBefore: string) {
      return emit(
        'TEXT_FOCUS',
        {
          field_id: fieldId,
          value_before: valueBefore,
        },
        {
          targetId: fieldId,
          targetType: 'text',
          metadata: { char_count_before: valueBefore.length },
        }
      );
    },
    textChange(fieldId: string, valueBefore: string, valueAfter: string, metadata = {}) {
      return emit(
        'TEXT_CHANGE',
        {
          field_id: fieldId,
          value_before: valueBefore,
          value_after: null,
        },
        {
          targetId: fieldId,
          targetType: 'text',
          metadata: {
            char_count_before: valueBefore.length,
            char_count_after: valueAfter.length,
            char_delta: valueAfter.length - valueBefore.length,
            ...metadata,
          },
        }
      );
    },
    textBlur(fieldId: string, valueBefore: string, valueAfter: string, metadata = {}) {
      return emit(
        'TEXT_BLUR',
        {
          field_id: fieldId,
          value_before: valueBefore,
          value_after: valueAfter,
        },
        {
          targetId: fieldId,
          targetType: 'text',
          metadata: {
            char_count_before: valueBefore.length,
            char_count_after: valueAfter.length,
            char_delta: valueAfter.length - valueBefore.length,
            ...metadata,
          },
        }
      );
    },
    contentActivate(contentId: string, targetType: TraceTargetType = 'content', metadata = {}) {
      return emit('CONTENT_ACTIVATE', { content_id: contentId }, { targetId: contentId, targetType, metadata });
    },
    openModal(contentId: string, metadata = {}) {
      return emit('OPEN_MODAL', { content_id: contentId }, { targetId: contentId, targetType: 'modal', metadata });
    },
    closeModal(contentId: string, dwellMs: number, metadata = {}) {
      return emit('CLOSE_MODAL', { content_id: contentId }, { targetId: contentId, targetType: 'modal', metadata: { dwell_ms: dwellMs, ...metadata } });
    },
    selectAnswer(options: SelectAnswerOptions) {
      return emit(
        'SELECT_ANSWER',
        {
          question_id: options.questionId,
          option_id: options.optionId,
          value_before: options.valueBefore ?? null,
          value_after: options.optionId,
        },
        {
          targetId: options.targetId,
          targetType: 'radio',
          metadata: {
            option_text: options.optionText,
            question_index: options.questionIndex,
            total_question_count: options.totalQuestionCount,
          },
        }
      );
    },
    setExpParam(paramId: string, paramName: string, valueBefore: unknown, valueAfter: unknown, metadata = {}) {
      return emit(
        'SET_EXP_PARAM',
        {
          param_id: paramId,
          param_name: paramName,
          value_before: valueBefore,
          value_after: valueAfter,
        },
        {
          targetId: paramId,
          targetType: 'experiment',
          metadata,
        }
      );
    },
    executeExp(expRunId: string, metadata = {}) {
      return emit('EXECUTE_EXP', { exp_run_id: expRunId }, { targetId: 'execute_exp', targetType: 'experiment', metadata });
    },
    resetExp(metadata = {}) {
      return emit('RESET_EXP', {}, { targetId: 'reset_exp', targetType: 'experiment', metadata });
    },
    addRow(rowId: string, metadata = {}) {
      return emit('ADD_ROW', { row_id: rowId }, { targetId: rowId, targetType: 'table', metadata });
    },
    deleteRow(rowId: string, metadata = {}) {
      return emit('DELETE_ROW', { row_id: rowId }, { targetId: rowId, targetType: 'table', metadata });
    },
    setPlanParam(rowId: string, paramId: string, valueBefore: unknown, valueAfter: unknown, metadata = {}) {
      return emit(
        'SET_PLAN_PARAM',
        {
          row_id: rowId,
          param_id: paramId,
          value_before: valueBefore,
          value_after: valueAfter,
        },
        {
          targetId: `${rowId}_${paramId}`,
          targetType: 'table',
          metadata,
        }
      );
    },
    selectBest(rowId: string, previousBestRowId: string | null) {
      return emit(
        'SELECT_BEST',
        {
          row_id: rowId,
          value_before: previousBestRowId,
          value_after: rowId,
        },
        {
          targetId: `${rowId}_best`,
          targetType: 'table',
          metadata: {
            previous_best_row_id: previousBestRowId,
            current_best_row_id: rowId,
          },
        }
      );
    },
    submitAttempt(options: SubmitAttemptOptions) {
      return emit(
        'SUBMIT_ATTEMPT',
        {
          submit_attempt_id: idFactory.submitAttemptId(),
          validation_status: options.validationStatus,
        },
        {
          targetId: options.targetId || 'next_button',
          targetType: 'button',
          metadata: {
            missing_fields: options.missingFields || [],
          },
        }
      );
    },
    taskFinish(metadata = {}) {
      return emit('TASK_FINISH', {}, { targetId: 'task_finish', targetType: 'button', metadata });
    },
  };
}
