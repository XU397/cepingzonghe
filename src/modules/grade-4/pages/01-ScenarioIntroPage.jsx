/**
 * 情景介绍页面 - 四年级火车购票测评
 * PDF第3页：展示熊猫城市背景图片和引言文本
 * 实现与现有7年级模块完全一致的视觉风格
 */

import { useCallback, useEffect, useMemo } from 'react';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import bgScenario from '../../../assets/images/g4-p1-xx.png';
import { useGrade4Context } from '../context/Grade4Context';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import { moduleConfig } from '../moduleConfig';
import styles from './01-ScenarioIntroPage.module.css';

const TOTAL_NAV_STEPS = 11;

const resolvePageMeta = (currentPage) => {
  const entries = Object.entries(moduleConfig?.pages || {});
  const match = entries.find(([, cfg]) => Number(cfg.number) === Number(currentPage));

  if (!match) {
    return {
      pageId: `grade4-page-${currentPage}`,
      pageNumber: currentPage,
      pageDesc: `第${currentPage}页`,
    };
  }

  const [pageId, cfg] = match;
  return {
    pageId,
    pageNumber: cfg.number ?? currentPage,
    pageDesc: cfg.desc ?? `第${currentPage}页`,
  };
};

const ScenarioIntroPage = () => {
  const {
    logOperation,
    setNavigationStep,
    navigateToPage,
    buildMarkForSubmission,
    getUserContext,
    currentPage,
    currentNavigationStep,
    globalTimer,
    useUnifiedFrame,
  } = useGrade4Context();

  useEffect(() => {
    setNavigationStep('1');

    if (useUnifiedFrame) {
      return undefined;
    }

    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入情景介绍页面',
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: '离开情景介绍页面',
      });
    };
  }, [logOperation, setNavigationStep, useUnifiedFrame]);

  const handleNextPage = useCallback(async () => {
    try {
      logOperation({
        targetElement: '下一页按钮',
        eventType: 'button_click',
        value: '从情景介绍页面导航到问题识别页面',
      });

      await navigateToPage('problem-identification');

      console.log('[ScenarioIntroPage] ✅ 成功导航到问题识别页面');
      return true;
    } catch (error) {
      console.error('[ScenarioIntroPage] 导航失败:', error);
      alert('页面跳转失败，请重试');
      return false;
    }
  }, [logOperation, navigateToPage]);

  const currentStep = useMemo(() => {
    const parsed = parseInt(currentNavigationStep, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 1;
    }
    return Math.min(parsed, TOTAL_NAV_STEPS);
  }, [currentNavigationStep]);

  const showNavigation = useMemo(() => currentPage > 1, [currentPage]);
  const showTimer = useMemo(() => Boolean(globalTimer?.isActive), [globalTimer?.isActive]);
  const timerScope = useMemo(
    () => `module.${moduleConfig?.moduleId || 'grade-4'}.task`,
    [],
  );
  const timerWarningThreshold = moduleConfig?.settings?.warningThresholdSeconds ?? 300;
  const timerCriticalThreshold = moduleConfig?.settings?.criticalThresholdSeconds ?? 60;
  const pageMeta = useMemo(() => resolvePageMeta(currentPage), [currentPage]);

  const submissionConfig = useMemo(() => {
    if (!useUnifiedFrame) {
      return null;
    }

    if (typeof buildMarkForSubmission !== 'function' || typeof getUserContext !== 'function') {
      return null;
    }

    return {
      getUserContext,
      buildMark: () => buildMarkForSubmission(),
      allowProceedOnFailureInDev: Boolean(import.meta.env?.DEV),
    };
  }, [buildMarkForSubmission, getUserContext, useUnifiedFrame]);

  const handleLifecycleEvent = useCallback((operation) => {
    if (!operation) {
      return;
    }

    logOperation({
      targetElement: operation.targetElement || '页面',
      eventType: operation.eventType,
      value: operation.value,
    });
  }, [logOperation]);

  const content = (
    <>
      <div className={`${styles.titleContainer} ${styles.fadeIn}`}>
        <h1 className={styles.pageTitle}>
          情景介绍
        </h1>
      </div>

      <div className={styles.contentArea}>
        <div className={`${styles.introTextBox} ${styles.slideInFromBottom}`}>
          <h2 className={styles.introTitle}>
            出行方案规划
          </h2>
          <p className={styles.introText}>
            小明一家住在四川省南充市。暑假快来了，住在成都的舅舅邀请小明一家到那里做客。请你帮小明一起规划出行方案吧！
          </p>
        </div>
      </div>
    </>
  );

  if (!useUnifiedFrame) {
    return (
      <AssessmentPageLayout
        onNextClick={handleNextPage}
        isNextButtonEnabled
        backgroundImage={bgScenario}
        backgroundStyle={{
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {content}
      </AssessmentPageLayout>
    );
  }

  return (
    <AssessmentPageFrame
      navigationMode="experiment"
      currentStep={currentStep}
      totalSteps={TOTAL_NAV_STEPS}
      navTitle="进度"
      showNavigation={showNavigation}
      showTimer={showTimer}
      timerVariant="task"
      timerLabel="剩余时间"
      timerWarningThreshold={timerWarningThreshold}
      timerCriticalThreshold={timerCriticalThreshold}
      timerScope={timerScope}
      nextLabel="下一页"
      nextEnabled
      onNext={handleNextPage}
      pageMeta={pageMeta}
      submission={submissionConfig || undefined}
      onLifecycleEvent={useUnifiedFrame ? handleLifecycleEvent : undefined}
    >
      <div className={`page-content page-fade-in ${styles.scenarioIntroContainer}`}>
        <div
          className={styles.backgroundImage}
          style={{
            backgroundImage: `url(${bgScenario})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          aria-hidden="true"
        />
        {content}
      </div>
    </AssessmentPageFrame>
  );
};

export default ScenarioIntroPage;
