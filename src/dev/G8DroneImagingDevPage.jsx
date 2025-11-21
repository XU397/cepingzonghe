import React, { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import G8DroneImagingComponent from '@submodules/g8-drone-imaging/Component';
import { getPageIdBySubPageNum } from '@submodules/g8-drone-imaging';
import { useAppContext } from '@/context/AppContext.jsx';
import UserInfoBar from '@/components/common/UserInfoBar.jsx';

const clampSubPageNum = (value) => {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num) || num < 1) return 1;
  if (num > 7) return 7;
  return num;
};

const normalizeSubmitMode = (value) => {
  if (value === 'fail') return 'fail';
  return 'success';
};

export default function G8DroneImagingDevPage() {
  const { handleLoginSuccess } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const subPageParam = searchParams.get('page') || '1';
  const submitParam = searchParams.get('submit') || 'success';

  // 设置开发模式的用户信息，确保 UserInfoBar 显示
  useEffect(() => {
    handleLoginSuccess({
      studentName: '开发模式学生',
      examNo: 'DEV_STUDENT_G8',
      batchCode: 'DEV_BATCH_G8',
      url: '/dev/g8-drone-imaging',
      pageNum: '1',
    });
  }, [handleLoginSuccess]);

  const subPageNum = clampSubPageNum(subPageParam);
  const submitMode = normalizeSubmitMode(submitParam);

  const initialPageId = useMemo(
    () => getPageIdBySubPageNum(subPageNum),
    [subPageNum],
  );

  const handleParamChange = useCallback((key, value) => {
    const next = new URLSearchParams(searchParams);
    next.set(key, value);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const submissionConfig = useMemo(() => ({
    getUserContext: () => ({
      batchCode: 'DEV_BATCH_G8',
      examNo: 'DEV_STUDENT_G8',
    }),
    buildMark: () => ({
      pageNumber: `M0:${subPageNum}`,
      pageDesc: `[dev/g8-drone-imaging/${subPageNum}] 开发调试`,
      operationList: [],
      answerList: [],
      // beginTime / endTime 由 usePageSubmission 填充
    }),
    allowProceedOnFailureInDev: false,
    submitImpl: async (payload) => {
      // 本地调试：根据 submitMode 决定模拟成功/失败，方便 E2E 测试覆盖
      // eslint-disable-next-line no-console
      console.log('[G8DroneDev] Mock submit payload', {
        submitMode,
        payload,
      });

      if (submitMode === 'fail') {
        throw new Error('Mock 提交失败（dev harness）');
      }

      return {
        code: 200,
        msg: 'Mock 提交成功（dev harness）',
        obj: true,
      };
    },
  }), [subPageNum, submitMode]);

  const pageMeta = useMemo(() => ({
    pageId: `g8-dev-${initialPageId}`,
    pageNumber: `M0:${subPageNum}`,
    pageDesc: `[dev/g8-drone-imaging/${subPageNum}] ${initialPageId}`,
  }), [initialPageId, subPageNum]);

  const submoduleUserContext = useMemo(() => ({
    user: {
      studentName: '开发模式学生',
      examNo: 'DEV_STUDENT_G8',
      batchCode: 'DEV_BATCH_G8',
    },
    session: {
      pageNum: String(subPageNum),
      moduleUrl: '/dev/g8-drone-imaging',
      isAuthenticated: true,
    },
    helpers: {
      logOperation: (operation) => {
        // eslint-disable-next-line no-console
        console.log('[G8DroneDev] logOperation', operation);
      },
      collectAnswer: (answer) => {
        // eslint-disable-next-line no-console
        console.log('[G8DroneDev] collectAnswer', answer);
      },
      navigateToPage: (pageId) => {
        // eslint-disable-next-line no-console
        console.log('[G8DroneDev] navigateToPage', pageId);
      },
    },
  }), [subPageNum]);

  const flowContext = useMemo(() => ({
    flowId: 'dev-flow-g8-drone-imaging',
    stepIndex: 0,
    submoduleId: 'g8-drone-imaging',
    modulePageNum: String(subPageNum),
    onComplete: () => {
      // eslint-disable-next-line no-console
      console.log('[G8DroneDev] flowContext.onComplete called');
    },
    onTimeout: () => {
      // eslint-disable-next-line no-console
      console.log('[G8DroneDev] flowContext.onTimeout called');
    },
    updateModuleProgress: (nextModulePageNum) => {
      // eslint-disable-next-line no-console
      console.log('[G8DroneDev] updateModuleProgress', nextModulePageNum);
    },
  }), [subPageNum]);

  const handleNext = useCallback(async ({ defaultSubmit }) => {
    if (typeof defaultSubmit === 'function') {
      const ok = await defaultSubmit();
      // eslint-disable-next-line no-console
      console.log('[G8DroneDev] defaultSubmit result', ok);
      return ok;
    }
    return true;
  }, []);

  const submoduleKey = useMemo(
    () => `g8-dev-${initialPageId}-${subPageNum}`,
    [initialPageId, subPageNum],
  );

  return (
    <>
      <UserInfoBar />
      <div style={{ height: '100vh', width: '100vw' }}>
        <AssessmentPageFrame
        navigationMode="experiment"
        currentStep={subPageNum}
        totalSteps={7}
        showNavigation={false}
        showTimer
        timerVariant="task"
        timerLabel="开发计时"
        timerScope="module.g8-drone-imaging.task"
        nextLabel="下一页"
        nextEnabled
        onNext={handleNext}
        submission={submissionConfig}
        pageMeta={pageMeta}
      >
        <div style={{ padding: 16, height: '100%', boxSizing: 'border-box' }}>
          <header style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>G8 Drone Imaging Dev Harness</h2>
            <p style={{ margin: '4px 0 8px', fontSize: 12 }}>
              当前子页: {subPageNum} ({initialPageId})，提交模式: {submitMode === 'success' ? '模拟成功' : '模拟失败'}
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12 }}>
                起始页：
                <select
                  value={String(subPageNum)}
                  onChange={(e) => handleParamChange('page', e.target.value)}
                  style={{ marginLeft: 4 }}
                >
                  {Array.from({ length: 7 }, (_, index) => {
                    const value = String(index + 1);
                    return (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label style={{ fontSize: 12 }}>
                提交结果：
                <select
                  value={submitMode}
                  onChange={(e) => handleParamChange('submit', e.target.value)}
                  style={{ marginLeft: 4 }}
                >
                  <option value="success">模拟成功</option>
                  <option value="fail">模拟失败</option>
                </select>
              </label>
            </div>
          </header>

          <div
            style={{
              border: '1px solid #eee',
              borderRadius: 8,
              padding: 8,
              height: 'calc(100% - 60px)',
              boxSizing: 'border-box',
              overflow: 'auto',
            }}
          >
            <G8DroneImagingComponent
              key={submoduleKey}
              initialPageId={initialPageId}
              userContext={submoduleUserContext}
              flowContext={flowContext}
              options={{}}
            />
          </div>
        </div>
      </AssessmentPageFrame>
      </div>
    </>
  );
}

