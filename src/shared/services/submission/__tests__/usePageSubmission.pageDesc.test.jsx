import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageSubmission } from '../usePageSubmission.js';

describe('usePageSubmission - pageDesc enhancement', () => {
  it('prefixes pageDesc with flow context data before submitting', async () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const submitImpl = vi.fn(async () => ({ code: 200 }));

    const { result } = renderHook(() =>
      usePageSubmission({
        buildMark: () => ({
          pageNumber: '1',
          pageDesc: '注意事项',
          operationList: [],
          answerList: [],
        }),
        getUserContext: () => ({
          batchCode: '250619',
          examNo: '1001',
        }),
        getFlowContext: () => ({
          flowId: 'test-flow-1',
          submoduleId: 'g7-experiment',
          stepIndex: 0,
          pageId: 'notice',
        }),
        submitImpl,
        logger,
      }),
    );

    await act(async () => {
      const success = await result.current.submit();
      expect(success).toBe(true);
    });

    expect(submitImpl).toHaveBeenCalledTimes(1);
    const payload = submitImpl.mock.calls[0][0];
    expect(payload.mark.pageDesc).toBe('[test-flow-1/g7-experiment/0] 注意事项');

    const flowContextEvent = payload.mark.operationList.find(
      (operation) => operation.eventType === 'flow_context',
    );
    expect(flowContextEvent).toBeTruthy();
    expect(flowContextEvent.value).toEqual({
      flowId: 'test-flow-1',
      submoduleId: 'g7-experiment',
      stepIndex: 0,
      pageId: 'notice',
    });
  });
});
