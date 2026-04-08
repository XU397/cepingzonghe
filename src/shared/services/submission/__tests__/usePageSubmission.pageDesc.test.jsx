import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePageSubmission } from '../usePageSubmission.js';
import { encodeCompositePageNum } from '@shared/utils/pageMapping.ts';

describe('usePageSubmission - pageDesc enhancement', () => {
  it('prefixes pageDesc with flow context data before submitting', async () => {
    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const submitImpl = vi.fn(async () => ({ code: 200 }));
    const pageNumber = encodeCompositePageNum(1, 1);

    const { result } = renderHook(() =>
      usePageSubmission({
        buildMark: () => ({
          pageNumber,
          pageDesc: '注意事项',
          operationList: [
            {
              code: 1,
              eventType: 'page_enter',
              targetElement: 'page_enter',
              value: '进入页面',
              time: '2024-11-11 10:00:00',
            },
            {
              code: 2,
              eventType: 'next_click',
              targetElement: 'next_button',
              value: 'go_next',
              time: '2024-11-11 10:00:05',
            },
            {
              code: 3,
              eventType: 'page_exit',
              targetElement: 'page_exit',
              value: '离开页面',
              time: '2024-11-11 10:00:10',
            },
          ],
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
    expect(typeof flowContextEvent.value).toBe('string');
    const parsedValue = JSON.parse(flowContextEvent.value);
    expect(parsedValue).toEqual({
      flowId: 'test-flow-1',
      submoduleId: 'g7-experiment',
      stepIndex: 0,
      moduleName: null,
      pageId: 'notice',
    });
  });
});
