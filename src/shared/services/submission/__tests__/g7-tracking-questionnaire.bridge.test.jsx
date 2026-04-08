import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let capturedTrackingModuleProps = {};
const mockUpdateModuleProgress = vi.fn();
const mockOnComplete = vi.fn();
const mockOnTimeout = vi.fn();

vi.mock('@/modules/grade-7-tracking', () => ({
  default: {
    ModuleComponent: function TrackingModule({ userContext, children, initialPageId }) {
      capturedTrackingModuleProps = { userContext, children, initialPageId };
      const React = require('react');
      return React.createElement('div', { 'data-testid': 'tracking-module' }, children);
    },
  },
}));

let mockSession = {
  currentPage: 14,
  questionnaireTimerActive: false,
  questionnaireTimeRemaining: 600,
};

vi.mock('@/modules/grade-7-tracking/context/TrackingProvider', () => ({
  useTrackingContext: () => ({ session: mockSession }),
}));

import { G7TrackingQuestionnaireComponent } from '@/submodules/g7-tracking-questionnaire/Component.jsx';

describe('G7TrackingQuestionnaire component bridge', () => {
  const mockFlowContext = {
    flowId: 'flow-g7-tracking-questionnaire',
    submoduleId: 'g7-tracking-questionnaire',
    stepIndex: 0,
    totalSteps: 8,
    updateModuleProgress: mockUpdateModuleProgress,
    onComplete: mockOnComplete,
    onTimeout: mockOnTimeout,
  };

  const mockUserContext = {
    batchCode: 'batch-001',
    examNo: 'exam-001',
    studentName: 'Test Student',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    capturedTrackingModuleProps = {};
    mockUpdateModuleProgress.mockClear();
    mockOnComplete.mockClear();
    mockOnTimeout.mockClear();

    mockSession = {
      currentPage: 14,
      questionnaireTimerActive: false,
      questionnaireTimeRemaining: 600,
    };
  });

  describe('getFlowContext injection', () => {
    it('injects getFlowContext into userContext that returns the provided flowContext', () => {
      render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={mockFlowContext}
        />
      );

      expect(capturedTrackingModuleProps.userContext).toBeDefined();
      expect(typeof capturedTrackingModuleProps.userContext.getFlowContext).toBe('function');

      const returnedFlowContext = capturedTrackingModuleProps.userContext.getFlowContext();
      expect(returnedFlowContext).toEqual(
        expect.objectContaining({
          flowId: mockFlowContext.flowId,
          submoduleId: mockFlowContext.submoduleId,
          stepIndex: mockFlowContext.stepIndex,
          totalSteps: mockFlowContext.totalSteps,
        })
      );
    });

    it('preserves original userContext properties', () => {
      render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={mockFlowContext}
        />
      );

      expect(capturedTrackingModuleProps.userContext.batchCode).toBe('batch-001');
      expect(capturedTrackingModuleProps.userContext.examNo).toBe('exam-001');
      expect(capturedTrackingModuleProps.userContext.studentName).toBe('Test Student');
    });

    it('returns null when flowContext is not provided', () => {
      render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={null}
        />
      );

      const returnedFlowContext = capturedTrackingModuleProps.userContext.getFlowContext();
      expect(returnedFlowContext).toBeNull();
    });
  });

  describe('progress update behavior', () => {
    it('calls updateModuleProgress for questionnaire pages (0.2, 14-21)', async () => {
      mockSession.currentPage = 0.2;
      const { rerender } = render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Page_00_2_QuestionnaireIntro"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockUpdateModuleProgress).toHaveBeenCalledTimes(1);
        expect(mockUpdateModuleProgress).toHaveBeenCalledWith('1');
      });

      mockUpdateModuleProgress.mockClear();
      mockSession.currentPage = 14;
      rerender(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockUpdateModuleProgress).toHaveBeenCalledTimes(1);
        expect(mockUpdateModuleProgress).toHaveBeenCalledWith('2');
      });

      mockUpdateModuleProgress.mockClear();
      mockSession.currentPage = 21;
      rerender(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_08"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockUpdateModuleProgress).toHaveBeenCalledTimes(1);
        expect(mockUpdateModuleProgress).toHaveBeenCalledWith('9');
      });
    });

    it('does NOT call updateModuleProgress for non-questionnaire pages', async () => {
      mockSession.currentPage = 13;
      const { rerender } = render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Page_13_Summary"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockUpdateModuleProgress).not.toHaveBeenCalled();
      });

      mockSession.currentPage = 1;
      rerender(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Page_01_Intro"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockUpdateModuleProgress).not.toHaveBeenCalled();
      });
    });

    it('avoids duplicate progress updates for same page', async () => {
      mockSession.currentPage = 14;
      const { rerender } = render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockUpdateModuleProgress).toHaveBeenCalledTimes(1);
      });

      mockUpdateModuleProgress.mockClear();
      rerender(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockUpdateModuleProgress).not.toHaveBeenCalled();
      });
    });
  });

  describe('completion behavior', () => {
    it('calls onComplete when currentPage is 22 (completion page)', async () => {
      mockSession.currentPage = 22;

      render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Page_22_Completion"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('does NOT call onComplete for questionnaire pages', async () => {
      mockSession.currentPage = 14;

      render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(
        () => {
          expect(mockOnComplete).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });

    it('calls onComplete only once even with multiple renders', async () => {
      mockSession.currentPage = 22;
      const { rerender } = render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Page_22_Completion"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });

      rerender(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Page_22_Completion"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(
        () => {
          expect(mockOnComplete).toHaveBeenCalledTimes(1);
        },
        { timeout: 100 }
      );
    });
  });

  describe('timeout behavior', () => {
    it('calls onTimeout when questionnaire timer expires', async () => {
      mockSession.currentPage = 14;
      mockSession.questionnaireTimerActive = true;
      mockSession.questionnaireTimeRemaining = 0;

      render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(() => {
        expect(mockOnTimeout).toHaveBeenCalledTimes(1);
      });
    });

    it('does NOT call onTimeout when timer is still active', async () => {
      mockSession.currentPage = 14;
      mockSession.questionnaireTimerActive = true;
      mockSession.questionnaireTimeRemaining = 300;

      render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(
        () => {
          expect(mockOnTimeout).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });

    it('does NOT call onTimeout when timer is not active', async () => {
      mockSession.currentPage = 14;
      mockSession.questionnaireTimerActive = false;
      mockSession.questionnaireTimeRemaining = 0;

      render(
        <G7TrackingQuestionnaireComponent
          userContext={mockUserContext}
          initialPageId="Questionnaire_01"
          flowContext={mockFlowContext}
        />
      );

      await waitFor(
        () => {
          expect(mockOnTimeout).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });
  });
});
