import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import MikaniaExperimentComponent, { PAGE_DESC_MAP, clearModuleStorage } from '@/submodules/g8-mikania-experiment/Component.jsx';
import {
  PAGE_MAP,
  getNavigationMode,
  getStepIndex,
  getTotalSteps,
  getPageSubNum,
} from '@/submodules/g8-mikania-experiment/mapping.js';
import { g8MikaniaExperimentSubmodule } from '@/submodules/g8-mikania-experiment/index.jsx';

const NOTICE_KEY = 'module.g8-mikania-experiment.noticeConfirmed';

function DevContextBridge({ context, contextRef }) {
  // 直接更新 ref，不触发父组件重新渲染
  useEffect(() => {
    if (context) {
      contextRef.current = context;
    }
  }, [context, contextRef]);

  return null;
}

const buildFakeUserContext = () => ({
  user: {
    batchCode: 'DEV-BATCH',
    examNo: 'DEV-EXAM',
  },
});

export default function DevG8DroneImagingHarness() {
  const initialPageId = useMemo(
    () => g8MikaniaExperimentSubmodule.getInitialPage('1'),
    [],
  );
  // 使用 ref 存储 context 避免无限循环
  const attachedContextRef = useRef(null);
  const [currentPageId, setCurrentPageId] = useState(initialPageId);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [completionFlag, setCompletionFlag] = useState(false);
  const [timeoutFlag, setTimeoutFlag] = useState(false);

  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const skipCountdown = searchParams.get('skipCountdown') === '1';

  // Ensure a clean start and optional fast-forward of the notice gating
  useEffect(() => {
    clearModuleStorage();
    if (skipCountdown) {
      localStorage.setItem(NOTICE_KEY, 'true');
    } else {
      localStorage.removeItem(NOTICE_KEY);
    }
  }, [skipCountdown]);

  // Intercept submission to avoid network calls and surface payload
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (String(url).includes('/saveHcMark')) {
        const markRaw = init?.body?.get?.('mark');
        let parsedMark = null;
        try {
          parsedMark = markRaw ? JSON.parse(markRaw) : null;
        } catch (err) {
          parsedMark = null;
        }

        setLastSubmission({
          mark: parsedMark,
          at: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({ code: 200, data: { intercepted: true } }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const flowContext = useMemo(
    () => ({
      flowId: 'dev-flow-g8-mikania',
      submoduleId: g8MikaniaExperimentSubmodule.submoduleId,
      stepIndex: 1,
      modulePageNum: getPageSubNum(currentPageId),
      onComplete: () => setCompletionFlag(true),
      onTimeout: () => setTimeoutFlag(true),
      updateModuleProgress: (subPageNum) => {
        const nextPageId = PAGE_MAP[String(subPageNum)] || currentPageId;
        setCurrentPageId(nextPageId);
      },
    }),
    [currentPageId],
  );

  const navigationMode = getNavigationMode(currentPageId);
  const currentStep = getStepIndex(currentPageId);
  const totalSteps = getTotalSteps();
  const pageMeta = {
    pageId: currentPageId,
    pageNumber: getPageSubNum(currentPageId),
    pageDesc: PAGE_DESC_MAP[currentPageId] || currentPageId,
  };

  // 使用 ref 获取 context
  const getAttachedContext = () => attachedContextRef.current;

  const handleFrameNext = useCallback(async () => {
    const ctx = getAttachedContext();
    if (!ctx) return false;
    const canProceed = ctx.validateCurrentPage?.();
    if (!canProceed) {
      const missing = ctx.getCurrentMissingFields?.() || [];
      ctx.logClickBlocked?.('validation_failed', missing);
      return false;
    }
    await ctx.navigateToNextPage?.();
    return true;
  }, []);

  const renderDevOverlay = useCallback(
    (contextValue) => (
      <DevContextBridge
        context={contextValue}
        contextRef={attachedContextRef}
      />
    ),
    [],
  );

  const submissionDebug = useMemo(() => {
    if (!lastSubmission?.mark) {
      return '尚未提交';
    }
    const ops = lastSubmission.mark.operationList || [];
    const answers = lastSubmission.mark.answerList || [];
    return `${lastSubmission.mark.pageDesc || ''} | 记录 ${ops.length} | 答案 ${answers.length}`;
  }, [lastSubmission]);

  return (
    <AssessmentPageFrame
      navigationMode={navigationMode}
      currentStep={Math.max(currentStep, 1)}
      totalSteps={totalSteps}
      showNavigation={navigationMode !== 'hidden'}
      showTimer={false}
      timerScope="dev.g8.mikania"
      pageMeta={pageMeta}
      nextLabel="下一页 (frame)"
      nextEnabled={true}
      onNext={handleFrameNext}
      nextButtonProps={{ 'data-testid': 'frame-next' }}
      hideNextButton={false}
      footerSlot={(
        <div data-testid="dev-debug-panel">
          <div>当前页面: {currentPageId}</div>
          <div data-testid="dev-last-submission">最近提交: {submissionDebug}</div>
          {completionFlag && <div data-testid="dev-complete-flag">onComplete 已触发</div>}
          {timeoutFlag && <div data-testid="dev-timeout-flag">onTimeout 已触发</div>}
        </div>
      )}
    >
      <MikaniaExperimentComponent
        userContext={buildFakeUserContext()}
        initialPageId={initialPageId}
        flowContext={flowContext}
        devOverlay={renderDevOverlay}
      />
    </AssessmentPageFrame>
  );
}
