/**
 * 7年级模块包装器
 *
 * 这个组件作为现有 PageRouter 系统的薄包装器。
 * 关键原则：不修改任何现有代码和导入路径，
 * 目标：以最小风险的方式将现有系统集成到模块架构。
 */

import { useEffect, useMemo, useRef } from 'react';

import PageRouter from '../../components/PageRouter';
import { useAppContext } from '../../context/AppContext';
import {
  isQuestionnairePage,
  getQuestionnaireStepNumber,
  TOTAL_QUESTIONNAIRE_STEPS,
  pageInfoMapping,
  TOTAL_USER_STEPS,
} from '../../utils/pageMappings';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import {
  buildPageDesc,
  normalizeAnswersForSubmission,
  normalizeOperationsForSubmission,
  useGrade7PageMeta,
} from './adapter';
import { getPageConfig } from './mapping';

/**
 * 7年级包装器组件
 *
 * 这个组件简单地渲染现有的 PageRouter，同时提供模块化的接口。
 * 所有现有的 AppContext、认证逻辑、页面路由都保持不变。
 *
 * @param {Object} props - 组件属性
 * @param {Object} props.userContext - 用户上下文（包含认证信息等）
 * @param {string} props.initialPageId - 初始页面 ID（用于页面恢复）
 */
const TASK_TIMER_SCOPE = 'module.grade-7.task';
const QUESTIONNAIRE_TIMER_SCOPE = 'module.grade-7.questionnaire';
const TASK_WARNING_THRESHOLD = 5 * 60;
const QUESTIONNAIRE_WARNING_THRESHOLD = 3 * 60;
const CRITICAL_THRESHOLD = 60;

export const Grade7Wrapper = ({ userContext, initialPageId, flowContext, options }) => {
  const {
    currentStepNumber,
    totalUserSteps,
    currentPageId,
    batchCode,
    examNo,
    taskStartTime,
    isQuestionnaireStarted,
    remainingTime,
    questionnaireRemainingTime,
    currentPageData,
    pageEnterTime,
  } = useAppContext();

  const taskDurationMinutes = useMemo(() => {
    const taskSeconds = options?.timers?.task ?? 2400; // 默认 40 分钟
    return Math.round(taskSeconds / 60);
  }, [options?.timers?.task]);

  // 记录包装器的使用情况，便于调试
  // 注意：只依赖不会频繁抖动的字段，避免在 Flow 场景下因对象引用变化导致 cleanup 频繁触发
  useEffect(() => {
    console.log('[Grade7Wrapper] 🎯 7年级模块包装器已挂载', {
      hasUserContext: !!userContext,
      initialPageId,
      currentStepNumber,
      totalUserSteps,
      timestamp: new Date().toISOString(),
    });

    return () => {
      console.log('[Grade7Wrapper] 🧹 7年级模块包装器已卸载');
    };
  }, [initialPageId, currentStepNumber, totalUserSteps]);

  // 处理初始页面设置（实际恢复由现有 AppContext 完成）
  useEffect(() => {
    if (initialPageId) {
      console.log('[Grade7Wrapper] 🔄 设置初始页面', { initialPageId });
    }
  }, [initialPageId]);

  const isCurrentPageQuestionnaire = isQuestionnairePage(currentPageId);
  const isQuestionnaireIntroPage = currentPageId === 'Page_20_Questionnaire_Intro';
  const isPrecautionsPage = currentPageId === 'Page_01_Precautions';
  const currentQuestionnaireStep = getQuestionnaireStepNumber(currentPageId) || 1;
  const navigationMode = isCurrentPageQuestionnaire ? 'questionnaire' : 'experiment';
  const showNavigation = isQuestionnaireIntroPage
    ? false
    : isCurrentPageQuestionnaire || (currentStepNumber > 0 && totalUserSteps > 0);

  // 问卷导航步数修正：Intro页面隐藏导航，所以内容页从1开始
  // questionnaireStepMapping 中 Intro=1, Page_21=2, ...
  // 由于 Intro 隐藏，显示时需要减1，让 Page_21 显示为第1步
  const navCurrentStep = isCurrentPageQuestionnaire
    ? Math.max(1, currentQuestionnaireStep - 1)
    : Math.max(1, currentStepNumber || 1);
  const navTotalSteps = isCurrentPageQuestionnaire
    ? TOTAL_QUESTIONNAIRE_STEPS - 1 // Intro隐藏，总步数减1 (9-1=8)
    : Math.max(totalUserSteps || TOTAL_USER_STEPS, 1);

  // 在 Flow 场景下，任务计时由 FlowModule/TimerService 统一启动，
  // 此时 AppContext 的 taskStartTime 可能仍为 null，但 TimerService 的剩余时间会大于 0。
  // 为兼容单模块和 Flow 两种场景，这里同时参考：
  // - 是否显式启动过计时（taskStartTime / isQuestionnaireStarted）
  // - 是否存在有效剩余时间（remainingTime / questionnaireRemainingTime）
  const hasTaskTimer =
    typeof remainingTime === 'number' && !Number.isNaN(remainingTime) && remainingTime > 0;
  const hasQuestionnaireTimer =
    typeof questionnaireRemainingTime === 'number' &&
    !Number.isNaN(questionnaireRemainingTime) &&
    questionnaireRemainingTime > 0;

  const showTimer =
    isPrecautionsPage || isQuestionnaireIntroPage
      ? false
      : isCurrentPageQuestionnaire
        ? isQuestionnaireStarted || hasQuestionnaireTimer
        : Boolean(taskStartTime) || hasTaskTimer;

  const timerScope = isCurrentPageQuestionnaire ? QUESTIONNAIRE_TIMER_SCOPE : TASK_TIMER_SCOPE;
  const timerWarningThreshold = isCurrentPageQuestionnaire
    ? QUESTIONNAIRE_WARNING_THRESHOLD
    : TASK_WARNING_THRESHOLD;

  // 使用 ref 同步追踪页面进入时间，避免 useMemo 的闭包问题
  const pageEnterTimeRef = useRef(null);
  const lastPageIdRef = useRef(null);
  const mountTimeRef = useRef(new Date());

  // 首次渲染或页面切换时更新 pageEnterTimeRef
  if (pageEnterTimeRef.current === null || currentPageId !== lastPageIdRef.current) {
    const now = new Date();
    console.log('[Grade7Wrapper] 更新 pageEnterTimeRef:', {
      reason: pageEnterTimeRef.current === null ? '首次渲染' : '页面切换',
      prevPageId: lastPageIdRef.current,
      newPageId: currentPageId,
      newTime: now.toISOString(),
      mountTime: mountTimeRef.current.toISOString(),
    });
    pageEnterTimeRef.current = now;
    lastPageIdRef.current = currentPageId;
  }

  // effectivePageEnterTime 保留用于其他用途，优先使用 AppContext 的 pageEnterTime
  const effectivePageEnterTime = useMemo(() => {
    if (pageEnterTime instanceof Date && !Number.isNaN(pageEnterTime.getTime())) {
      return pageEnterTime;
    }

    if (pageEnterTime) {
      const parsed = new Date(pageEnterTime);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    // Fallback: 使用 ref 中的时间
    return pageEnterTimeRef.current;
  }, [currentPageId, pageEnterTime]);

  const pageMeta = useMemo(() => {
    const meta = pageInfoMapping[currentPageId] || {};
    const config = getPageConfig(currentPageId) || null;
    const stepIndex = flowContext?.stepIndex ?? meta.stepIndex ?? 0;

    // 计算子模块内页码
    // 对于问卷页面，使用 getQuestionnaireStepNumber 获取正确的子模块内页码
    // 否则使用 config.subPageNum 或 meta.subPageNum 或 meta.number
    let subPageNum;
    if (isQuestionnairePage(currentPageId)) {
      subPageNum = getQuestionnaireStepNumber(currentPageId) || 1;
    } else {
      const subPageNumRaw = config?.subPageNum ?? meta.subPageNum ?? meta.number ?? '1';
      subPageNum = parseInt(String(subPageNumRaw), 10) || 1;
    }

    const pageNumber = encodeCompositePageNum(stepIndex + 1, subPageNum);

    return {
      pageId: currentPageId || 'unknown',
      pageNumber,
      pageDesc: config?.title || meta.desc || '',
      stepIndex,
      subPageNum,
    };
  }, [currentPageId, flowContext]);

  const { pageNumber: adaptedPageNumber, targetPrefix: pageTargetPrefix } = useGrade7PageMeta(
    currentPageId,
    flowContext,
    pageMeta.stepIndex,
    pageMeta.subPageNum
  );

  const submissionConfig = useMemo(() => {
    const submissionPageNumber = adaptedPageNumber || pageMeta.pageNumber;
    const fallbackPageDesc = pageMeta.pageDesc || pageMeta.pageTitle;

    const baseConfig = {
      getUserContext: () => ({
        batchCode: batchCode || userContext?.batchCode || '',
        examNo: examNo || userContext?.examNo || '',
      }),
      buildMark: () => {
        const meta = pageInfoMapping[currentPageId] || {};
        const operationList = normalizeOperationsForSubmission(currentPageData?.operationList, {
          targetPrefix: pageTargetPrefix,
          flowContext,
          pageId: currentPageId,
        });
        const answerList = normalizeAnswersForSubmission(
          currentPageId,
          currentPageData?.answerList,
          pageTargetPrefix
        );

        // 使用 ref 获取页面进入时间，确保获取的是页面切换时的时间而非 buildMark 调用时的时间
        const beginTimeValue = pageEnterTimeRef.current;
        const endTimeValue = new Date();

        // DEBUG: 追踪时间问题
        console.log('[Grade7Wrapper] buildMark 时间追踪:', {
          beginTimeValue: beginTimeValue?.toISOString(),
          endTimeValue: endTimeValue.toISOString(),
          pageEnterTimeRefCurrent: pageEnterTimeRef.current?.toISOString(),
          currentPageId,
          timeDiffMs: endTimeValue - beginTimeValue,
        });

        return {
          pageNumber: submissionPageNumber,
          pageDesc: buildPageDesc(currentPageId, flowContext, meta.desc || fallbackPageDesc || ''),
          operationList,
          answerList,
          beginTime: formatTimestamp(beginTimeValue),
          endTime: formatTimestamp(endTimeValue),
          imgList: [],
        };
      },
      allowProceedOnFailureInDev: Boolean(import.meta.env?.DEV),
    };

    if (flowContext?.flowId) {
      baseConfig.getFlowContext = () => ({
        flowId: flowContext.flowId,
        submoduleId: flowContext.submoduleId,
        stepIndex: flowContext.stepIndex,
        moduleName: flowContext.moduleName || '蒸馒头实验',
        pageId: currentPageId,
      });
    }

    return baseConfig;
  }, [
    adaptedPageNumber,
    batchCode,
    currentPageId,
    currentPageData,
    examNo,
    flowContext,
    effectivePageEnterTime,
    pageMeta,
    pageTargetPrefix,
    userContext,
  ]);

  return (
    <AssessmentPageFrame
      pageId={pageMeta.pageId}
      pageTitle={pageMeta.pageDesc || pageMeta.pageTitle}
      subPageNum={pageMeta.subPageNum}
      stepIndex={pageMeta.stepIndex}
      navigationMode={navigationMode}
      currentStep={navCurrentStep}
      totalSteps={navTotalSteps}
      showNavigation={showNavigation}
      showTimer={showTimer}
      timerVariant={navigationMode === 'questionnaire' ? 'questionnaire' : 'task'}
      timerWarningThreshold={timerWarningThreshold}
      timerCriticalThreshold={CRITICAL_THRESHOLD}
      timerScope={timerScope}
      submission={submissionConfig}
      pageMeta={pageMeta}
      hideNextButton
      allowNavigationClick={false}
    >
      <PageRouter taskDurationMinutes={taskDurationMinutes} />
    </AssessmentPageFrame>
  );
};

export default Grade7Wrapper;
