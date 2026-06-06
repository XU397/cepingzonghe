import { buildTargetElementPrefix } from '@shared/utils/pageMapping.ts';
import {
  CONTENT_REGISTRY_HASH,
  CONTENT_REGISTRY_VERSION,
  FIELD_REGISTRY_HASH,
  FIELD_REGISTRY_VERSION,
  PAGE_IDLE_THRESHOLD_MS,
  RULE_CONFIG_HASH,
  RULE_CONFIG_VERSION,
  TRACE_SCHEMA_VERSION,
} from './contracts';
import type {
  ChatScrollOptions,
  L2TraceEventType,
  PageIdleOptions,
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
  logOperation: (_operation: TraceOperationDraft) => void;
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
  submitTrigger?: string;
}

export const DEFAULT_TRACE_TIMEZONE_OFFSET_MINUTES = 8 * 60;

export const formatTraceTimestamp = (
  date: Date,
  timezoneOffsetMinutes = DEFAULT_TRACE_TIMEZONE_OFFSET_MINUTES
): string => {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  const offsetSign = timezoneOffsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(timezoneOffsetMinutes);
  const localDate = new Date(date.getTime() + timezoneOffsetMinutes * 60_000);

  return [
    `${localDate.getUTCFullYear()}-${pad(localDate.getUTCMonth() + 1)}-${pad(localDate.getUTCDate())}`,
    `T${pad(localDate.getUTCHours())}:${pad(localDate.getUTCMinutes())}:${pad(localDate.getUTCSeconds())}.${pad(localDate.getUTCMilliseconds(), 3)}`,
    `${offsetSign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`,
  ].join('');
};

const defaultIdFactory: TraceIdFactory = {
  traceId: () => `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  submitAttemptId: () => `submit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  expRunId: (pageId, runSeq) => `${pageId}_exp_run_${runSeq}`,
  rowId: (pageId, rowSeq) => `${pageId}_row_${rowSeq}`,
};

const toTraceText = (value: unknown): string => String(value ?? '');

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
      ...metadata,
      schema_version: TRACE_SCHEMA_VERSION,
      field_registry_version: FIELD_REGISTRY_VERSION,
      field_registry_hash: FIELD_REGISTRY_HASH,
      content_registry_version: CONTENT_REGISTRY_VERSION,
      content_registry_hash: CONTENT_REGISTRY_HASH,
      rule_config_version: RULE_CONFIG_VERSION,
      rule_config_hash: RULE_CONFIG_HASH,
      page_index: options.page.pageIndex,
      legacy_page_id: options.page.legacyPageId,
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
            ...metadata,
            flow_context: options.flowContext || null,
          },
        }
      );
    },
    textFocus(fieldId: string, valueBefore: unknown) {
      const before = toTraceText(valueBefore);
      return emit(
        'TEXT_FOCUS',
        {
          field_id: fieldId,
          value_before: before,
        },
        {
          targetId: fieldId,
          targetType: 'text',
          metadata: { char_count_before: before.length },
        }
      );
    },
    textChange(fieldId: string, valueBefore: unknown, valueAfter: unknown, metadata = {}) {
      const before = toTraceText(valueBefore);
      const after = toTraceText(valueAfter);
      return emit(
        'TEXT_CHANGE',
        {
          field_id: fieldId,
          value_before: before,
          value_after: null,
        },
        {
          targetId: fieldId,
          targetType: 'text',
          metadata: {
            char_count_before: before.length,
            char_count_after: after.length,
            char_delta: after.length - before.length,
            ...metadata,
          },
        }
      );
    },
    textBlur(fieldId: string, valueBefore: unknown, valueAfter: unknown, metadata = {}) {
      const before = toTraceText(valueBefore);
      const after = toTraceText(valueAfter);
      return emit(
        'TEXT_BLUR',
        {
          field_id: fieldId,
          value_before: before,
          value_after: after,
        },
        {
          targetId: fieldId,
          targetType: 'text',
          metadata: {
            char_count_before: before.length,
            char_count_after: after.length,
            char_delta: after.length - before.length,
            ...metadata,
          },
        }
      );
    },
    pageIdle(options: PageIdleOptions) {
      return emit(
        'PAGE_IDLE',
        {},
        {
          targetId: 'page',
          targetType: 'page',
          time: options.time,
          metadata: {
            idle_duration_ms: options.idleDurationMs,
            idle_phase: options.idlePhase,
            page_visible: options.pageVisible,
            window_focused: options.windowFocused,
            threshold_ms: PAGE_IDLE_THRESHOLD_MS,
          },
        }
      );
    },
    chatScroll(options: ChatScrollOptions) {
      return emit(
        'CHAT_SCROLL',
        {},
        {
          targetId: 'chat_window',
          targetType: 'content',
          time: options.time,
          metadata: {
            scroll_delta: options.scrollDelta,
            scroll_direction: options.scrollDirection,
            visible_content_ids_before: [...options.visibleContentIdsBefore],
            visible_content_ids_after: [...options.visibleContentIdsAfter],
            phase: options.phase,
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
      return emit(
        'ADD_ROW',
        { field_id: 'plan_table', row_id: rowId },
        { targetId: rowId, targetType: 'table', metadata }
      );
    },
    deleteRow(rowId: string, metadata = {}) {
      return emit(
        'DELETE_ROW',
        { field_id: 'plan_table', row_id: rowId },
        { targetId: rowId, targetType: 'table', metadata }
      );
    },
    setPlanParam(rowId: string, paramId: string, valueBefore: unknown, valueAfter: unknown, metadata = {}) {
      return emit(
        'SET_PLAN_PARAM',
        {
          field_id: 'plan_table',
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
          field_id: 'plan_table',
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
    chartHover(chartId: string, pointId: string, metadata = {}) {
      return emit(
        'CHART_HOVER',
        {
          chart_id: chartId,
          point_id: pointId,
        },
        {
          targetId: chartId,
          targetType: 'chart',
          metadata,
        }
      );
    },
    submitAttempt(options: SubmitAttemptOptions) {
      const submitTrigger =
        options.submitTrigger ||
        (options.validationStatus === 'timeout'
          ? 'timeout'
          : options.validationStatus === 'auto'
            ? 'auto'
            : options.targetId || 'next_button');
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
            submit_trigger: submitTrigger,
          },
        }
      );
    },
    taskFinish(metadata = {}) {
      return emit('TASK_FINISH', {}, { targetId: 'task_finish', targetType: 'button', metadata });
    },
  };
}
