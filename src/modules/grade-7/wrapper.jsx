/**
 * 7年级模块包装器
 *
 * 这个组件作为现有 PageRouter 系统的薄包装器。
 * 关键原则：不修改任何现有代码和导入路径，
 * 目标：以最小风险的方式将现有系统集成到模块架构。
 */

import { useEffect, useMemo } from 'react';

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

export const Grade7Wrapper = ({ userContext, initialPageId, flowContext }) => {
  const {
    currentStepNumber,
    totalUserSteps,
    currentPageId,
    batchCode,
    examNo,
    preparePageSubmissionData,
    taskStartTime,
    isQuestionnaireStarted,
    remainingTime,
    questionnaireRemainingTime,
  } = useAppContext();

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
  const currentQuestionnaireStep = getQuestionnaireStepNumber(currentPageId) || 1;
  const navigationMode = isCurrentPageQuestionnaire ? 'questionnaire' : 'experiment';
  const showNavigation =
    isCurrentPageQuestionnaire || (currentStepNumber > 0 && totalUserSteps > 0);

  const navCurrentStep = isCurrentPageQuestionnaire
    ? currentQuestionnaireStep
    : Math.max(1, currentStepNumber || 1);
  const navTotalSteps = isCurrentPageQuestionnaire
    ? TOTAL_QUESTIONNAIRE_STEPS
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

  const showTimer = isCurrentPageQuestionnaire
    ? isQuestionnaireStarted || hasQuestionnaireTimer
    : Boolean(taskStartTime) || hasTaskTimer;

  const timerScope = isCurrentPageQuestionnaire ? QUESTIONNAIRE_TIMER_SCOPE : TASK_TIMER_SCOPE;
  const timerWarningThreshold = isCurrentPageQuestionnaire
    ? QUESTIONNAIRE_WARNING_THRESHOLD
    : TASK_WARNING_THRESHOLD;

  const submissionConfig = useMemo(() => {
    const baseConfig = {
      getUserContext: () => ({
        batchCode: batchCode || userContext?.batchCode || '',
        examNo: examNo || userContext?.examNo || '',
      }),
      buildMark: () => preparePageSubmissionData(),
      allowProceedOnFailureInDev: Boolean(import.meta.env?.DEV),
    };

    if (flowContext?.flowId) {
      baseConfig.getFlowContext = () => ({
        flowId: flowContext.flowId,
        submoduleId: flowContext.submoduleId,
        stepIndex: flowContext.stepIndex,
        pageId: currentPageId,
      });
    }

    return baseConfig;
  }, [batchCode, currentPageId, examNo, flowContext, preparePageSubmissionData, userContext]);

  const pageMeta = useMemo(() => {
    const meta = pageInfoMapping[currentPageId] || {};
    return {
      pageId: currentPageId,
      pageNumber: meta.number || currentPageId,
      pageDesc: meta.desc || '',
    };
  }, [currentPageId]);

  return (
    <AssessmentPageFrame
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
      <PageRouter />
    </AssessmentPageFrame>
  );
};

export default Grade7Wrapper;

