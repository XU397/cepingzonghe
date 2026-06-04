import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePageSubmission } from '../../usePageSubmission.js';

describe('usePageSubmission l2-trace lifecycle mode', () => {
  it('does not inject legacy lifecycle or flow_context operations', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const traceValidator = vi.fn();
    const operationValue = {
      trace_id: 'trace-1',
      page_id: 'page_09_experiment_question_1',
      page_type: 'D2_SIMULATION_QUESTION',
      target_id: 'page',
      target_type: 'page',
      metadata: {},
    };

    const { result } = renderHook(() =>
      usePageSubmission({
        lifecycleMode: 'l2-trace',
        traceValidator,
        submitImpl,
        getUserContext: () => ({ batchCode: 'B001', examNo: 'E001' }),
        getFlowContext: () => ({
          flowId: 'flow-g8',
          submoduleId: 'g8-banana-browning-experiment',
          stepIndex: 0,
          pageId: 'simulation_question_1',
        }),
        buildMark: () => ({
          pageNumber: '1.10',
          pageDesc: '模拟实验 + 问题1',
          operationList: [
            {
              targetElement: 'P1.10_page',
              eventType: 'START_PAGE',
              value: operationValue,
              time: '2026-06-03T10:10:00.000+08:00',
              pageId: 'simulation_question_1',
            },
          ],
          answerList: [],
          beginTime: '2026-06-03T10:10:00.000+08:00',
          endTime: '2026-06-03T10:10:30.000+08:00',
          imgList: [],
        }),
      })
    );

    await act(async () => {
      await result.current.submit();
    });

    const submittedMark = submitImpl.mock.calls[0][0].mark;
    expect(submittedMark.operationList.map(operation => operation.eventType)).toEqual([
      'START_PAGE',
    ]);
    expect(submittedMark.operationList[0].value).toEqual(operationValue);
    expect(traceValidator).toHaveBeenCalledWith(submittedMark);
  });
});
