export const EventTypes = Object.freeze({
  PAGE_ENTER: 'page_enter',
  PAGE_EXIT: 'page_exit',
  PAGE_SUBMIT_SUCCESS: 'page_submit_success',
  PAGE_SUBMIT_FAILED: 'page_submit_failed',
  FLOW_CONTEXT: 'flow_context',
  CLICK: 'click',
  INPUT: 'input',
  INPUT_BLUR: 'input_blur',
  RADIO_SELECT: 'radio_select',
  CHECKBOX_CHECK: 'checkbox_check',
  CHECKBOX_UNCHECK: 'checkbox_uncheck',
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  VIEW_MATERIAL: 'view_material',
  TIMER_START: 'timer_start',
  TIMER_STOP: 'timer_stop',
  SIMULATION_TIMING_STARTED: 'simulation_timing_started',
  SIMULATION_RUN_RESULT: 'simulation_run_result',
  SIMULATION_OPERATION: 'simulation_operation',
  QUESTIONNAIRE_ANSWER: 'questionnaire_answer',
  SESSION_EXPIRED: 'session_expired',
  NETWORK_ERROR: 'network_error',
});

export const EventTypeValues = Object.freeze(Object.values(EventTypes));

export default EventTypes;
