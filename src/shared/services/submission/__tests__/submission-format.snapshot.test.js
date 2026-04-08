import { describe, it, expect } from 'vitest';
import { validateMarkObject, isNonEmptyAnswer } from '../schema.ts';
import createSubmissionFixture from './fixtures/submissionFixture.js';
import { encodeCompositePageNum } from '@shared/utils/pageMapping.ts';

const buildValidatedMark = () => {
  const { mark } = createSubmissionFixture();
  return validateMarkObject(mark);
};

describe('submission format snapshot', () => {
  it('captures unified submission baseline for schema + prefixes + events', () => {
    const { pageNumber, targetPrefix } = createSubmissionFixture();
    const validatedMark = buildValidatedMark();

    expect(pageNumber).toBe('1.03');
    expect(pageNumber).toBe(encodeCompositePageNum(1, 3));
    expect(pageNumber).not.toBe('M0:3');

    const flowContextOperation = validatedMark.operationList.find(
      (operation) => operation.eventType === 'flow_context',
    );
    expect(flowContextOperation).toBeTruthy();
    expect(flowContextOperation.value).toMatchObject({
      flowId: 'flow-nitrogen',
      submoduleId: 'g7-lab',
      stepIndex: 0,
    });

    const nonFlowTargets = validatedMark.operationList
      .filter((operation) => operation.eventType !== 'flow_context')
      .map((operation) => operation.targetElement);

    nonFlowTargets.forEach((target) => {
      expect(target.startsWith(targetPrefix)).toBe(true);
    });

    const eventTypes = validatedMark.operationList.map((operation) => operation.eventType);
    expect(eventTypes).toContain('page_enter');
    expect(eventTypes).toContain('page_exit');
    expect(eventTypes.some((event) => event === 'next_click' || event === 'auto_submit')).toBe(
      true,
    );

    const inputEvents = validatedMark.operationList.filter((operation) =>
      operation.eventType.startsWith('input_'),
    );
    expect(inputEvents.length).toBeGreaterThanOrEqual(3);
    inputEvents.forEach((event) => {
      if (event.eventType === 'input_change') {
        expect(event.value).toMatchObject({ prev: expect.any(String), next: expect.any(String) });
      } else {
        expect(typeof event.value === 'string').toBe(true);
      }
    });

    validatedMark.answerList.forEach((answer) => {
      expect(isNonEmptyAnswer(answer)).toBe(true);
    });

    const snapshotPayload = {
      mark: validatedMark,
      checks: {
        encodedPageNumber: pageNumber,
        legacyFormat: 'M0:3',
        targetPrefix,
        nonFlowTargets,
        flowContextOperation,
        minimumEvents: {
          page_enter: eventTypes.includes('page_enter'),
          page_exit: eventTypes.includes('page_exit'),
          next_or_auto: eventTypes.some((event) => event === 'next_click' || event === 'auto_submit'),
        },
        inputEvents,
        answers: validatedMark.answerList,
      },
    };

    expect(snapshotPayload).toMatchInlineSnapshot(`
      {
        "checks": {
          "answers": [
            {
              "code": 1,
              "targetElement": "P1.03_Q1",
              "value": "50kg 尿素",
            },
            {
              "code": 2,
              "targetElement": "P1.03_Q2",
              "value": "保持土壤湿润",
            },
          ],
          "encodedPageNumber": "1.03",
          "flowContextOperation": {
            "code": 5,
            "eventType": "flow_context",
            "pageId": "fertilizer-planning",
            "targetElement": "flow_context",
            "time": "2024-12-01 10:00:20",
            "value": {
              "flowId": "flow-nitrogen",
              "pageId": "fertilizer-planning",
              "stepIndex": 0,
              "submoduleId": "g7-lab",
            },
          },
          "inputEvents": [
            {
              "code": 2,
              "eventType": "input_focus",
              "pageId": "fertilizer-planning",
              "targetElement": "P1.03_Q1",
              "time": "2024-12-01 10:00:05",
              "value": "",
            },
            {
              "code": 3,
              "eventType": "input_change",
              "pageId": "fertilizer-planning",
              "targetElement": "P1.03_Q1",
              "time": "2024-12-01 10:00:08",
              "value": {
                "next": "50kg 尿素",
                "prev": "",
              },
            },
            {
              "code": 4,
              "eventType": "input_blur",
              "pageId": "fertilizer-planning",
              "targetElement": "P1.03_Q1",
              "time": "2024-12-01 10:00:12",
              "value": "",
            },
          ],
          "legacyFormat": "M0:3",
          "minimumEvents": {
            "next_or_auto": true,
            "page_enter": true,
            "page_exit": true,
          },
          "nonFlowTargets": [
            "P1.03_PAGE",
            "P1.03_Q1",
            "P1.03_Q1",
            "P1.03_Q1",
            "P1.03_NEXT",
            "P1.03_EXIT",
          ],
          "targetPrefix": "P1.03_",
        },
        "mark": {
          "answerList": [
            {
              "code": 1,
              "targetElement": "P1.03_Q1",
              "value": "50kg 尿素",
            },
            {
              "code": 2,
              "targetElement": "P1.03_Q2",
              "value": "保持土壤湿润",
            },
          ],
          "beginTime": "2024-12-01 09:59:58",
          "endTime": "2024-12-01 10:01:02",
          "imgList": [],
          "operationList": [
            {
              "code": 1,
              "eventType": "page_enter",
              "pageId": "fertilizer-planning",
              "targetElement": "P1.03_PAGE",
              "time": "2024-12-01 10:00:00",
              "value": "enter_page",
            },
            {
              "code": 2,
              "eventType": "input_focus",
              "pageId": "fertilizer-planning",
              "targetElement": "P1.03_Q1",
              "time": "2024-12-01 10:00:05",
              "value": "",
            },
            {
              "code": 3,
              "eventType": "input_change",
              "pageId": "fertilizer-planning",
              "targetElement": "P1.03_Q1",
              "time": "2024-12-01 10:00:08",
              "value": {
                "next": "50kg 尿素",
                "prev": "",
              },
            },
            {
              "code": 4,
              "eventType": "input_blur",
              "pageId": "fertilizer-planning",
              "targetElement": "P1.03_Q1",
              "time": "2024-12-01 10:00:12",
              "value": "",
            },
            {
              "code": 5,
              "eventType": "flow_context",
              "pageId": "fertilizer-planning",
              "targetElement": "flow_context",
              "time": "2024-12-01 10:00:20",
              "value": {
                "flowId": "flow-nitrogen",
                "pageId": "fertilizer-planning",
                "stepIndex": 0,
                "submoduleId": "g7-lab",
              },
            },
            {
              "code": 6,
              "eventType": "next_click",
              "pageId": "fertilizer-planning",
              "targetElement": "P1.03_NEXT",
              "time": "2024-12-01 10:00:25",
              "value": "go_next",
            },
            {
              "code": 7,
              "eventType": "page_exit",
              "pageId": "fertilizer-planning",
              "targetElement": "P1.03_EXIT",
              "time": "2024-12-01 10:00:40",
              "value": "exit_to_next",
            },
          ],
          "pageDesc": "[flow-nitrogen/g7-lab/0] 氮肥施用逻辑",
          "pageNumber": "1.03",
        },
      }
    `);
  });
});
