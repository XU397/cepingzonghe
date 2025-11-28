import { describe, it, expect } from 'vitest';
import { validateEventType } from '../schema.ts';
import { EventTypeValues } from '../eventTypes.js';
import createSubmissionFixture from './fixtures/submissionFixture.js';

const REQUIRED_EVENT_TYPES = [
  'page_enter',
  'page_exit',
  'page_submit_success',
  'page_submit_failed',
  'flow_context',
  'click',
  'input',
  'input_focus',
  'input_change',
  'input_blur',
  'input_delete',
  'focus',
  'blur',
  'select_change',
  'radio_select',
  'checkbox_check',
  'checkbox_uncheck',
  'timer_start',
  'timer_stop',
  'timer_complete',
  'next_click',
  'click_blocked',
  'auto_submit',
];

const ALLOWED_EVENT_TYPES = Array.from(new Set([...EventTypeValues, ...REQUIRED_EVENT_TYPES])).sort();

const formatEvent = (operation) =>
  `operation #${operation.code} (${operation.targetElement}) eventType=${operation.eventType}`;

const assertAllowedEventTypes = (operations) => {
  const issues = operations
    .filter((operation) => !validateEventType(operation.eventType))
    .map((operation) => formatEvent(operation));

  if (issues.length > 0) {
    throw new Error(
      `${issues.join('\n')} 不在允许列表：${ALLOWED_EVENT_TYPES.join(', ')}`,
    );
  }
};

describe('eventType whitelist guard', () => {
  it('accepts allowed event types exported by submission services', () => {
    const { mark } = createSubmissionFixture();
    expect(() => assertAllowedEventTypes(mark.operationList)).not.toThrow();
  });

  it('highlights typos or unknown events with actionable guidance', () => {
    const { mark } = createSubmissionFixture();
    const mutatedOperations = mark.operationList.map((operation, index) =>
      index === 0
        ? { ...operation, eventType: 'page_entor' }
        : { ...operation },
    );

    const expectedMessage =
      'operation #1 (P0.3_PAGE) eventType=page_entor 不在允许列表：' +
      ALLOWED_EVENT_TYPES.join(', ');

    expect(() => assertAllowedEventTypes(mutatedOperations)).toThrowError(expectedMessage);
  });

  it('documents the allowed eventType enumeration for quick reference', () => {
    expect(ALLOWED_EVENT_TYPES).toMatchInlineSnapshot(`
      [
        "auto_submit",
        "blur",
        "change",
        "checkbox_check",
        "checkbox_uncheck",
        "click",
        "click_blocked",
        "flow_context",
        "focus",
        "input",
        "input_blur",
        "input_change",
        "input_delete",
        "input_focus",
        "modal_close",
        "modal_open",
        "network_error",
        "next_click",
        "page_enter",
        "page_exit",
        "page_submit_failed",
        "page_submit_success",
        "questionnaire_answer",
        "radio_select",
        "reading_complete",
        "select_change",
        "session_expired",
        "simulation_operation",
        "simulation_run_result",
        "simulation_timing_started",
        "timer_complete",
        "timer_start",
        "timer_stop",
        "view_material",
      ]
    `);
  });
});
