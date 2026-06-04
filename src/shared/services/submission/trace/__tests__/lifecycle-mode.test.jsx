import { renderHook, act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePageSubmission } from '../../usePageSubmission.js';
import AssessmentPageFrame from '../../../../ui/PageFrame/AssessmentPageFrame.jsx';

vi.mock('@shared/ui/TimerDisplay/TimerContainer', async () => {
  const React = await import('react');
  return {
    default: ({ onTimeout }) =>
      React.createElement('button', { type: 'button', onClick: onTimeout }, '触发超时'),
  };
});

const operationValue = {
  trace_id: 'trace-1',
  page_id: 'page_09_experiment_question_1',
  page_type: 'D2_SIMULATION_QUESTION',
  target_id: 'page',
  target_type: 'page',
  metadata: {},
};

const buildL2Mark = ({ eventType = 'START_PAGE', value = operationValue } = {}) => ({
  pageNumber: '1.10',
  pageDesc: '模拟实验 + 问题1',
  operationList: [
    {
      targetElement: 'P1.10_page',
      eventType,
      value,
      time: '2026-06-03T10:10:00.000+08:00',
      pageId: 'simulation_question_1',
    },
  ],
  answerList: [],
  beginTime: '2026-06-03T10:10:00.000+08:00',
  endTime: '2026-06-03T10:10:30.000+08:00',
  imgList: [],
});

const getUserContext = () => ({ batchCode: 'B001', examNo: 'E001' });

const getFlowContext = () => ({
  flowId: 'flow-g8',
  submoduleId: 'g8-banana-browning-experiment',
  stepIndex: 0,
  pageId: 'simulation_question_1',
});

describe('usePageSubmission l2-trace lifecycle mode', () => {
  it('does not inject legacy lifecycle or flow_context operations', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const traceValidator = vi.fn();

    const { result } = renderHook(() =>
      usePageSubmission({
        lifecycleMode: 'l2-trace',
        traceValidator,
        submitImpl,
        getUserContext,
        getFlowContext,
        buildMark: () => buildL2Mark(),
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

  it('does not add legacy timeout operations or placeholder answers in l2-trace mode', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const traceValidator = vi.fn();

    const { result } = renderHook(() =>
      usePageSubmission({
        lifecycleMode: 'l2-trace',
        traceValidator,
        submitImpl,
        getUserContext,
        buildMark: () => buildL2Mark({ eventType: 'L2_TIMEOUT' }),
      })
    );

    await act(async () => {
      await result.current.submitOnTimeout({
        missingAnswerTargets: ['Q1'],
        autoSubmitReason: 'timeout_auto_submit',
        pageExitReason: 'timeout_auto_submit',
      });
    });

    const submittedMark = submitImpl.mock.calls[0][0].mark;
    expect(submittedMark.operationList.map(operation => operation.eventType)).toEqual([
      'L2_TIMEOUT',
    ]);
    expect(submittedMark.answerList).toEqual([]);
    expect(traceValidator.mock.calls[0][0].operationList.map(operation => operation.eventType)).toEqual([
      'L2_TIMEOUT',
    ]);
  });

  it('honors mark and user context overrides on l2-trace timeout submit', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const traceValidator = vi.fn();
    const overrideMark = buildL2Mark({ eventType: 'L2_TIMEOUT_OVERRIDE' });
    overrideMark.operationList[0].code = 1;

    const { result } = renderHook(() =>
      usePageSubmission({
        lifecycleMode: 'l2-trace',
        traceValidator,
        submitImpl,
        getUserContext: () => ({ batchCode: 'DEFAULT_BATCH', examNo: 'DEFAULT_EXAM' }),
        buildMark: () => buildL2Mark({ eventType: 'SHOULD_NOT_USE_BUILDER' }),
      })
    );

    let success;
    await act(async () => {
      success = await result.current.submitOnTimeout({
        markOverride: overrideMark,
        userContextOverride: { batchCode: 'OVERRIDE_BATCH', examNo: 'OVERRIDE_EXAM' },
        missingAnswerTargets: ['Q1'],
        autoSubmitReason: 'timeout_auto_submit',
        pageExitReason: 'timeout_auto_submit',
      });
    });

    const submittedPayload = submitImpl.mock.calls[0][0];
    expect(success).toBe(true);
    expect(submittedPayload.batchCode).toBe('OVERRIDE_BATCH');
    expect(submittedPayload.examNo).toBe('OVERRIDE_EXAM');
    expect(submittedPayload.mark).toEqual(overrideMark);
    expect(submittedPayload).not.toHaveProperty('mode');
    expect(traceValidator).toHaveBeenCalledWith(overrideMark);
  });

  it('does not emit legacy submit telemetry to external logOperation in l2-trace mode', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const traceValidator = vi.fn();
    const logOperation = vi.fn();

    const { result } = renderHook(() =>
      usePageSubmission({
        lifecycleMode: 'l2-trace',
        traceValidator,
        submitImpl,
        logOperation,
        getUserContext,
        buildMark: () => buildL2Mark(),
      })
    );

    await act(async () => {
      await result.current.submit();
    });

    expect(submitImpl).toHaveBeenCalledTimes(1);
    expect(logOperation).not.toHaveBeenCalled();
  });

  it('does not emit legacy submit telemetry to external logOperation on l2-trace failure', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ code: 401, msg: '会话已过期' });
    const traceValidator = vi.fn();
    const logOperation = vi.fn();
    const handleSessionExpired = vi.fn();

    const { result } = renderHook(() =>
      usePageSubmission({
        lifecycleMode: 'l2-trace',
        traceValidator,
        submitImpl,
        logOperation,
        handleSessionExpired,
        getUserContext,
        buildMark: () => buildL2Mark(),
      })
    );

    let success;
    await act(async () => {
      success = await result.current.submit();
    });

    expect(success).toBe(false);
    expect(submitImpl).toHaveBeenCalledTimes(1);
    expect(handleSessionExpired).toHaveBeenCalledTimes(1);
    expect(logOperation).not.toHaveBeenCalled();
  });

  it('fails before submit when l2-trace mode is missing traceValidator', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const onError = vi.fn();

    const { result } = renderHook(() =>
      usePageSubmission({
        lifecycleMode: 'l2-trace',
        submitImpl,
        onError,
        getUserContext,
        buildMark: () => buildL2Mark(),
      })
    );

    let success;
    await act(async () => {
      success = await result.current.submit();
    });

    expect(success).toBe(false);
    expect(submitImpl).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'lifecycleMode="l2-trace" requires traceValidator',
      })
    );
  });

  it('fails before submit when l2-trace traceValidator throws', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const validationError = new Error('invalid L2 trace');
    const traceValidator = vi.fn(() => {
      throw validationError;
    });
    const onError = vi.fn();

    const { result } = renderHook(() =>
      usePageSubmission({
        lifecycleMode: 'l2-trace',
        traceValidator,
        submitImpl,
        onError,
        getUserContext,
        buildMark: () => buildL2Mark(),
      })
    );

    let success;
    await act(async () => {
      success = await result.current.submit();
    });

    expect(success).toBe(false);
    expect(submitImpl).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(validationError);
  });
});

describe('AssessmentPageFrame l2-trace lifecycle mode', () => {
  it('does not inject frame lifecycle or next_click events by default', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const traceValidator = vi.fn();
    const onLifecycleEvent = vi.fn();

    render(
      <AssessmentPageFrame
        pageId="simulation_question_1"
        pageTitle="模拟实验 + 问题1"
        showTimer={false}
        showNavigation={false}
        onLifecycleEvent={onLifecycleEvent}
        submission={{
          lifecycleMode: 'l2-trace',
          traceValidator,
          submitImpl,
          getUserContext,
          buildMark: () => buildL2Mark(),
        }}
      >
        <div>测试页面</div>
      </AssessmentPageFrame>
    );

    fireEvent.click(screen.getByRole('button', { name: '下一页' }));

    await waitFor(() => expect(submitImpl).toHaveBeenCalledTimes(1));

    const submittedMark = submitImpl.mock.calls[0][0].mark;
    expect(submittedMark.operationList.map(operation => operation.eventType)).toEqual([
      'START_PAGE',
    ]);
    expect(submittedMark.operationList[0].value).toEqual(operationValue);
    expect(traceValidator).toHaveBeenCalledWith(submittedMark);
    expect(onLifecycleEvent).not.toHaveBeenCalled();
  });

  it('uses the caller L2 buildMark on timer timeout when there is no prior mark', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const traceValidator = vi.fn();
    const timeoutMark = buildL2Mark({ eventType: 'L2_TIMEOUT' });

    render(
      <AssessmentPageFrame
        pageId="simulation_question_1"
        pageTitle="模拟实验 + 问题1"
        showNavigation={false}
        hideNextButton
        submission={{
          lifecycleMode: 'l2-trace',
          traceValidator,
          submitImpl,
          getUserContext,
          buildMark: () => timeoutMark,
        }}
      >
        <div>测试页面</div>
      </AssessmentPageFrame>
    );

    fireEvent.click(screen.getByRole('button', { name: '触发超时' }));

    await waitFor(() => expect(submitImpl).toHaveBeenCalledTimes(1));

    const submittedMark = submitImpl.mock.calls[0][0].mark;
    expect(submittedMark.operationList.map(operation => operation.eventType)).toEqual([
      'L2_TIMEOUT',
    ]);
    expect(submittedMark.operationList[0].value).toEqual(operationValue);
    expect(submittedMark.answerList).toEqual([]);
    expect(traceValidator).toHaveBeenCalledWith(submittedMark);
  });
});
