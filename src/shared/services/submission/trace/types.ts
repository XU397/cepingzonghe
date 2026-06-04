export type SubmissionLifecycleMode = 'legacy' | 'l2-trace';

export type L2TraceEventType =
  | 'START_PAGE'
  | 'PAGE_HIDDEN'
  | 'PAGE_VISIBLE'
  | 'SUBMIT_ATTEMPT'
  | 'TASK_FINISH'
  | 'CONTENT_EXPOSE'
  | 'CONTENT_ACTIVATE'
  | 'CONTENT_VIEW'
  | 'CHAT_SCROLL'
  | 'CHAT_VIEWPORT_ENTER'
  | 'CHAT_VIEWPORT_LEAVE'
  | 'OPEN_MODAL'
  | 'CLOSE_MODAL'
  | 'CHART_HOVER'
  | 'TEXT_FOCUS'
  | 'TEXT_CHANGE'
  | 'TEXT_BLUR'
  | 'CHECKBOX_TOGGLE'
  | 'SELECT_ANSWER'
  | 'SET_EXP_PARAM'
  | 'EXECUTE_EXP'
  | 'RESET_EXP'
  | 'ADD_ROW'
  | 'DELETE_ROW'
  | 'SET_PLAN_PARAM'
  | 'SELECT_BEST'
  | 'TIMER_COMPLETE';

export type L2PageType =
  | 'A1_FLOW'
  | 'B1_TEXT_SINGLE'
  | 'B2_TEXT_MULTI_PARALLEL'
  | 'B3_TEXT_MATRIX_EVALUATION'
  | 'C1_INFO_SELECTION'
  | 'D1_SIMULATION_ONLY'
  | 'D2_SIMULATION_QUESTION'
  | 'E1_CHART_PLAN_DECISION';

export type TraceTargetType =
  | 'page'
  | 'button'
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'modal'
  | 'experiment'
  | 'chart'
  | 'table'
  | 'content'
  | 'timer';

export interface TracePageLike {
  legacyPageId: string;
  standardPageId: string;
  pageIndex: number;
  pageType: L2PageType;
  lifecycleMode: 'l2-trace';
  requiredFields: string[];
}

export interface TraceFlowContext {
  flowId?: string;
  submoduleId?: string;
  stepIndex?: number;
  moduleName?: string;
  pageId?: string;
}

export interface TraceEventValue {
  trace_id: string;
  page_id: string;
  page_type: L2PageType;
  target_id?: string;
  target_type: TraceTargetType;
  field_id?: string;
  content_id?: string;
  question_id?: string;
  option_id?: string;
  row_id?: string;
  param_id?: string;
  param_name?: string;
  chart_id?: string;
  point_id?: string;
  exp_run_id?: string;
  submit_attempt_id?: string;
  value_before?: unknown;
  value_after?: unknown;
  validation_status?: 'success' | 'blocked' | 'auto' | 'timeout' | 'none';
  metadata: Record<string, unknown>;
}

export interface TraceOperationDraft {
  targetElement: string;
  eventType: L2TraceEventType;
  value: TraceEventValue;
  time: string;
  pageId?: string;
}

export interface TraceIdFactory {
  traceId(): string;
  submitAttemptId(): string;
  expRunId(_pageId: string, _runSeq: number): string;
  rowId(_pageId: string, _rowSeq: number): string;
}
