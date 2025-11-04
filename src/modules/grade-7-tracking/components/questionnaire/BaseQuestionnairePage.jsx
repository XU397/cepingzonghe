/**
 * BaseQuestionnairePage - 通用问卷页面组件
 *
 * 功能:
 * - 加载指定页面的问卷数据
 * - 渲染问题列表(QuestionBlock组件)
 * - 显示完成进度
 * - 处理导航和数据提交
 *
 * @component
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTrackingContext } from '../../context/TrackingProvider.jsx';
import { useQuestionnaire } from '../../hooks/useQuestionnaire';
import { useDataLogger } from '../../hooks/useDataLogger';
import PageLayout from '../layout/PageLayout';
import QuestionTable from './QuestionTable';
import Button from '../ui/Button';
import { getQuestionnairePageData, isLastQuestionnairePage } from '../../utils/questionnaireLoader';
import { QUESTIONNAIRE_DURATION } from '../../config'; // 导入问卷时长配置
import styles from '../../styles/QuestionnairePage.module.css';

/**
 * BaseQuestionnairePage Component
 *
 * @param {Object} props
 * @param {number} props.pageNumber - 页码 (14-21)
 */
const BaseQuestionnairePage = ({ pageNumber }) => {
  const {
    logOperation,
    clearOperations,
    navigateToPage,
    currentPageOperations,
    startQuestionnaireTimerInternal,
    userContext,
  } = useTrackingContext();

  const {
    answers,
    setAnswer,
    isPageComplete,
    getPageCompletionProgress,
  } = useQuestionnaire();

  const { submitPageData } = useDataLogger();

  const [pageStartTime] = useState(() => new Date());
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

  // 加载问卷页面数据
  const pageData = useMemo(() => {
    return getQuestionnairePageData(pageNumber);
  }, [pageNumber]);

  // 检查是否是最后一页
  const isLastPage = useMemo(() => {
    return isLastQuestionnairePage(pageNumber);
  }, [pageNumber]);

  // 获取完成进度
  const completionProgress = useMemo(() => {
    return getPageCompletionProgress(pageNumber);
  }, [pageNumber, getPageCompletionProgress]);

  // 检查是否可以继续
  const canProceed = useMemo(() => {
    return isPageComplete(pageNumber);
  }, [pageNumber, isPageComplete]);

  // 记录页面进入
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: `Page_${pageNumber}_Questionnaire`,
      value: pageData?.title || `问卷页${pageNumber}`,
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: `Page_${pageNumber}_Questionnaire`,
        value: pageData?.title || `问卷页${pageNumber}`,
        time: new Date().toISOString(),
      });
    };
  }, [pageNumber, pageData, logOperation]);

  // T099: 在问卷第一页启动10分钟计时器
  useEffect(() => {
    console.log('[BaseQuestionnairePage] 计时器 useEffect 触发', {
      pageNumber,
      hasStartQuestionnaireTimer: !!userContext?.startQuestionnaireTimer,
      isQuestionnaireStarted: userContext?.isQuestionnaireStarted,
      questionnaireRemainingTime: userContext?.questionnaireRemainingTime,
      userContextKeys: userContext ? Object.keys(userContext).filter(k => k.includes('questionnaire') || k.includes('Timer')) : []
    });

    // 仅在问卷第一页(页码14)且计时器未启动时执行
    if (pageNumber === 14) {
      if (!userContext?.startQuestionnaireTimer) {
        console.error('[BaseQuestionnairePage] ❌ startQuestionnaireTimer 函数不存在！');
        return;
      }

      if (userContext?.isQuestionnaireStarted) {
        console.log('[BaseQuestionnairePage] ℹ️ 计时器已经启动过了，跳过');
        return;
      }

      console.log(`[BaseQuestionnairePage] ✅ 问卷第一页已加载，准备启动${QUESTIONNAIRE_DURATION}秒倒计时（内部）`);

      // 启动 AppContext 的问卷计时器（用于页面显示）
      userContext.startQuestionnaireTimer(QUESTIONNAIRE_DURATION);

      // 启动 TrackingProvider 内部的问卷计时器（用于超时跳转）
      startQuestionnaireTimerInternal();

      console.log('[BaseQuestionnairePage] ✅ 已调用内部问卷计时器，时长:', QUESTIONNAIRE_DURATION);
    }
  }, [pageNumber, userContext, startQuestionnaireTimerInternal]);

  // 处理答案变化
  const handleAnswerChange = useCallback(
    (questionId, value) => {
      const question = pageData?.questions.find((q) => q.id === questionId);
      if (!question) return;

      setAnswer(questionId, value, question.text);

      // 隐藏警告(如果有)
      if (showIncompleteWarning) {
        setShowIncompleteWarning(false);
      }
    },
    [pageData, setAnswer, showIncompleteWarning]
  );

  // 处理"下一页"或"提交问卷"按钮点击
  const handleNextClick = useCallback(async () => {
    // 检查是否完成
    if (!canProceed) {
      setShowIncompleteWarning(true);
      logOperation({
        action: 'click_blocked',
        target: 'next_button',
        value: '未完成所有必答题',
        time: new Date().toISOString(),
      });
      return;
    }

    logOperation({
      action: 'click',
      target: isLastPage ? 'submit_questionnaire_button' : 'next_page_button',
      value: isLastPage ? '提交问卷' : '下一页',
      time: new Date().toISOString(),
    });

    try {
      // 构建MarkObject
      const pageEndTime = new Date();

      // 收集当前页面的答案（将选项值映射为标签文本，未作答按规范填“未回答”）
      const answerList = pageData.questions.map((q, idx) => {
        const selected = answers[`q${q.id}`];
        const label = (q.options || []).find((opt) => opt.value === selected)?.label || null;
        return {
          // 统一命名：P{pageNumber}_问题{序号}
          targetElement: `P${pageNumber}_问题${idx + 1}`,
          value: label || '未回答',
        };
      });

      const markObject = {
        pageNumber: String(pageNumber),
        pageDesc: pageData.title,
        operationList: currentPageOperations.map((op) => ({
          targetElement: op.target,
          eventType: op.action,
          value: op.value || '',
          time: formatDateTime(new Date(op.time || op.timestamp)),
        })),
        answerList,
        beginTime: formatDateTime(pageStartTime),
        endTime: formatDateTime(pageEndTime),
        imgList: [],
      };

      // 提交数据
      const success = await submitPageData(markObject);

      if (success) {
        // 清空操作记录
        clearOperations();

        // 导航到下一页
        if (isLastPage) {
          // 最后一页,导航到完成页(页码22)
          await navigateToPage(22);
        } else {
          // 导航到下一个问卷页
          await navigateToPage(pageNumber + 1);
        }
      }
    } catch (error) {
      console.error('[BaseQuestionnairePage] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [
    canProceed,
    isLastPage,
    pageNumber,
    pageData,
    answers,
    currentPageOperations,
    pageStartTime,
    logOperation,
    submitPageData,
    clearOperations,
    navigateToPage,
  ]);

  // 如果页面数据加载失败
  if (!pageData) {
    return (
      <PageLayout showNavigation={true} showTimer={true}>
        <div className={styles.pageContainer}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#ef4444', fontSize: '18px' }}>
              加载问卷数据失败，请刷新页面重试。
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // 获取统一的选项列表（假设同一页的问题选项相同）
  const commonOptions = useMemo(() => {
    return pageData.questions[0]?.options || [];
  }, [pageData]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        {/* Header Section - 橙色边框说明框 */}
        <div className={styles.instructionBox}>
          <p className={styles.instructions}>{pageData.instructions}</p>
        </div>

        {/* Questions Table Section */}
        <div className={styles.tableSection}>
          <QuestionTable
            questions={pageData.questions}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            options={commonOptions}
          />
        </div>

        {/* Footer Section - 居中按钮 */}
        <div className={styles.footer}>
          <Button
            variant="secondary"
            disabled={!canProceed}
            onClick={handleNextClick}
            className={styles.nextButton}
          >
            {isLastPage ? '提交问卷' : '下一页'}
          </Button>

          {/* Incomplete Warning */}
          {showIncompleteWarning && !canProceed && (
            <div className={styles.warningMessage}>
              请完成本页所有必答题后再继续
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

BaseQuestionnairePage.propTypes = {
  pageNumber: PropTypes.number.isRequired,
};

// 辅助函数: 格式化日期时间为 "YYYY-MM-DD HH:mm:ss"
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export default BaseQuestionnairePage;
