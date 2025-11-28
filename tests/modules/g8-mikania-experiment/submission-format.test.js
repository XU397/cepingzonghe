import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const STEP_INDEX = 1;

const allowedEventTypes = new Set([
  'page_enter',
  'page_exit',
  'click',
  'change',
  'input',
  'input_focus',
  'input_change',
  'input_delete',
  'input_blur',
  'select_change',
  'radio_select',
  'checkbox_check',
  'checkbox_uncheck',
  'modal_open',
  'modal_close',
  'view_material',
  'timer_start',
  'timer_stop',
  'timer_complete',
  'simulation_timing_started',
  'simulation_run_result',
  'simulation_operation',
  'questionnaire_answer',
  'flow_context',
  'auto_submit',
  'next_click',
  'page_submit_success',
  'page_submit_failed',
  'click_blocked',
]);

const allowedNonPrefixedTargets = new Set(['页面', '系统', '下一页按钮', '提交按钮']);
const timestampPattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const radioValuePattern = /^[A-Z]\.\s.+/;

const check = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const readSnapshot = (file) =>
  JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, file), 'utf8'));

const derivePageNumberFromFile = (file) => {
  const match = file.match(/^page_(\d{2})/);
  if (!match) return null;

  const subPage = Number.parseInt(match[1], 10) + 1;
  return `${STEP_INDEX}.${subPage}`;
};

const resolvePageNumber = (file, snapshot) => snapshot.pageNumber ?? derivePageNumberFromFile(file);

const ensureCodesContinuous = (items, label, file) => {
  if (!items || items.length === 0) return;

  const expected = Array.from({ length: items.length }, (_, index) => index + 1);
  const codes = items.map((item) => item.code);
  check(
    codes.every((code, index) => code === expected[index]),
    `[${file}] ${label} codes must start at 1 and increase by 1 (got ${codes.join(', ')})`,
  );
};

const validateOperationTargets = (operations, pageNumber, file) => {
  const pagePrefix = pageNumber ? `P${pageNumber}_` : null;

  operations.forEach((operation) => {
    const target = operation.targetElement;
    check(typeof target === 'string', `[${file}] operation targetElement must be a string`);

    if (target.startsWith('P') && pagePrefix) {
      check(
        target.startsWith(pagePrefix),
        `[${file}] operation targetElement "${target}" should start with ${pagePrefix}`,
      );
    } else {
      check(
        target.startsWith('P') || allowedNonPrefixedTargets.has(target),
        `[${file}] unexpected targetElement "${target}"`,
      );
    }
  });
};

const validateOperationEvents = (operations, file) => {
  operations.forEach((operation) => {
    check(
      allowedEventTypes.has(operation.eventType),
      `[${file}] invalid eventType "${operation.eventType}"`,
    );
    check(
      typeof operation.time === 'string' && timestampPattern.test(operation.time),
      `[${file}] invalid time format for code ${operation.code}: ${operation.time}`,
    );
  });
};

const validateAnswerList = (answers, file) => {
  if (!answers) return;

  ensureCodesContinuous(answers, 'answerList', file);

  answers.forEach((answer) => {
    check(
      typeof answer.targetElement === 'string',
      `[${file}] answer targetElement must be a string`,
    );

    const value = answer.value;
    check(typeof value === 'string', `[${file}] answer value must be a string`);

    if (/^[A-Z]/.test(value)) {
      check(
        radioValuePattern.test(value),
        `[${file}] single-choice answers must include option label and text (got "${value}")`,
      );
    }
  });
};

const validateTimestamps = (snapshot, file) => {
  if (snapshot.beginTime) {
    check(
      timestampPattern.test(snapshot.beginTime),
      `[${file}] beginTime must match YYYY-MM-DD HH:mm:ss`,
    );
  }
  if (snapshot.endTime) {
    check(
      timestampPattern.test(snapshot.endTime),
      `[${file}] endTime must match YYYY-MM-DD HH:mm:ss`,
    );
  }
};

const loadSnapshots = () =>
  fs
    .readdirSync(SNAPSHOT_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({ file, name: path.basename(file, '.json'), snapshot: readSnapshot(file) }));

const snapshots = loadSnapshots();
const snapshotByName = new Map(snapshots.map((entry) => [entry.name, entry.snapshot]));

describe('g8-mikania-experiment submission snapshots', () => {
  describe('schema validation', () => {
    snapshots.forEach(({ file, name, snapshot }) => {
      it(`${name} matches submission schema expectations`, () => {
        const pageNumber = resolvePageNumber(file, snapshot);

        check(
          typeof pageNumber === 'string' && /^\d+\.\d+$/.test(pageNumber),
          `[${file}] pageNumber must match ^\\d+\\.\\d+$`,
        );

        if (snapshot.pageNumber) {
          expect(snapshot.pageNumber).toBe(pageNumber);
        }

        if (snapshot.pageDesc !== undefined) {
          check(
            /^\[.*\]/.test(snapshot.pageDesc),
            `[${file}] pageDesc should include Flow prefix like [flow/submodule/stepIndex]`,
          );
        }

        validateOperationEvents(snapshot.operationList ?? [], file);
        validateOperationTargets(snapshot.operationList ?? [], pageNumber, file);
        ensureCodesContinuous(snapshot.operationList ?? [], 'operationList', file);
        validateAnswerList(snapshot.answerList ?? [], file);
        validateTimestamps(snapshot, file);
      });
    });
  });

  describe('minimum event coverage', () => {
    const requiredEvents = {
      page_00_notice: ['checkbox_check', 'next_click'],
      page_02_step_q1: ['input_focus', 'input_change', 'input_blur', 'next_click'],
      page_03_sim_exp: ['simulation_operation', 'simulation_timing_started', 'simulation_run_result', 'next_click'],
      page_04_q2_data: ['radio_select', 'next_click'],
      page_06_q4_conc: ['radio_select', 'input_focus', 'input_change', 'input_blur', 'next_click'],
    };

    Object.entries(requiredEvents).forEach(([name, events]) => {
      const snapshot = snapshotByName.get(name);
      if (!snapshot) return;

      it(`${name} contains required event set`, () => {
        const eventTypes = snapshot.operationList.map((op) => op.eventType);
        events.forEach((event) => {
          check(
            eventTypes.includes(event),
            `[${name}] expected eventType "${event}" to be present`,
          );
        });

        if (name === 'page_06_q4_conc') {
          check(
            snapshot.operationList.some(
              (op) => op.eventType === 'radio_select' && op.targetElement.includes('Q4a'),
            ),
            '[page_06_q4_conc] Q4a radio_select should be recorded',
          );
          ['input_focus', 'input_change', 'input_blur'].forEach((inputEvent) => {
            check(
              snapshot.operationList.some(
                (op) => op.eventType === inputEvent && op.targetElement.includes('Q4b'),
              ),
              `[page_06_q4_conc] ${inputEvent} should target Q4b`,
            );
          });
        }
      });
    });
  });

  describe('blocked scenarios', () => {
    snapshots
      .filter(({ name }) => name.includes('blocked'))
      .forEach(({ name, snapshot }) => {
        it(`${name} records click_blocked with missing list`, () => {
          const blockedOperation = (snapshot.operationList ?? []).find(
            (operation) => operation.eventType === 'click_blocked',
          );

          check(blockedOperation, `[${name}] should contain a click_blocked event`);

          const parsedValue =
            typeof blockedOperation.value === 'string' && blockedOperation.value.startsWith('{')
              ? JSON.parse(blockedOperation.value)
              : blockedOperation.value;

          check(
            parsedValue && typeof parsedValue.reason === 'string',
            `[${name}] click_blocked.value should include reason`,
          );
          check(
            Array.isArray(parsedValue?.missing),
            `[${name}] click_blocked.value.missing should be an array`,
          );
        });
      });
  });

  describe('timeout scenarios', () => {
    const timeoutSnapshots = [
      'page_05_q3_trend_timeout',
      'page_05_q3_trend_timeout_no_answer',
    ];

    timeoutSnapshots.forEach((name) => {
      const snapshot = snapshotByName.get(name);
      if (!snapshot) return;

      it(`${name} includes timer completion and auto submit metadata`, () => {
        const operations = snapshot.operationList ?? [];
        const eventTypes = operations.map((operation) => operation.eventType);

        check(eventTypes.includes('timer_complete'), `[${name}] missing timer_complete event`);
        check(eventTypes.includes('auto_submit'), `[${name}] missing auto_submit event`);

        const submitSuccess = operations.find((operation) => operation.eventType === 'page_submit_success');
        check(submitSuccess, `[${name}] missing page_submit_success for auto submission`);

        const parsedValue =
          typeof submitSuccess.value === 'string' && submitSuccess.value.startsWith('{')
            ? JSON.parse(submitSuccess.value)
            : submitSuccess.value;
        check(parsedValue?.auto === true, `[${name}] page_submit_success should include auto:true`);

        if (name.endsWith('no_answer')) {
          const answer = snapshot.answerList?.[0];
          check(answer, `[${name}] should include placeholder answer for timeout`);
          check(
            answer.value === '超时未回答',
            `[${name}] timeout placeholder should be "超时未回答"`,
          );
        }
      });
    });
  });
});
