/**
 * 7年级模块包装器
 *
 * 这个组件作为现有PageRouter系统的薄包装层
 * 关键原则：不修改任何现有代码和导入路径
 * 目标：以最小风险的方式将现有系统集成到模块架构中
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
 * 这个组件简单地渲染现有的PageRouter，同时提供模块化的接口
 * 所有现有的AppContext、认证逻辑、页面路由都保持不变
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.userContext - 用户上下文（包含认证信息等）
 * @param {string} props.initialPageId - 初始页面ID（用于页面恢复）
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
  } = useAppContext();

  // 记录包装器的使用情况，便于调试 - 只在真正需要时记录
  useEffect(() => {
    console.log('[Grade7Wrapper] 🎯 7年级模块包装器已挂载', {
      hasUserContext: !!userContext,
      initialPageId,
      currentStepNumber,
      totalUserSteps,
      timestamp: new Date().toISOString()
    });

    // 清理函数
    return () => {
      console.log('[Grade7Wrapper] 🧹 7年级模块包装器已卸载');
    };
  }, [initialPageId, currentStepNumber, totalUserSteps]); // 只依赖initialPageId，避免userContext对象引用变化导致重复执行

  // 处理初始页面设置
  useEffect(() => {
    if (initialPageId) {
      console.log('[Grade7Wrapper] 🔄 设置初始页面', { initialPageId });

      // 注意：这里我们不直接操作页面跳转
      // 而是依赖现有的AppContext和登录逻辑来处理页面恢复
      // 这样可以保持现有的页面恢复机制不变
    }
  }, [initialPageId]);

  const isCurrentPageQuestionnaire = isQuestionnairePage(currentPageId);
  const currentQuestionnaireStep = getQuestionnaireStepNumber(currentPageId) || 1;
  const navigationMode = isCurrentPageQuestionnaire ? 'questionnaire' : 'experiment';
  const showNavigation = isCurrentPageQuestionnaire || (currentStepNumber > 0 && totalUserSteps > 0);

  const navCurrentStep = isCurrentPageQuestionnaire
    ? currentQuestionnaireStep
    : Math.max(1, currentStepNumber || 1);
  const navTotalSteps = isCurrentPageQuestionnaire
    ? TOTAL_QUESTIONNAIRE_STEPS
    : Math.max(totalUserSteps || TOTAL_USER_STEPS, 1);

  const showTimer = isCurrentPageQuestionnaire ? isQuestionnaireStarted : Boolean(taskStartTime);
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
  }, [batchCode, currentPageId, flowContext, examNo, preparePageSubmissionData, userContext]);

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
