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
import { useTrackingContext } from '../../context/TrackingContext';
import { useQuestionnaire } from '../../hooks/useQuestionnaire';
import { useDataLogger } from '../../hooks/useDataLogger';
import PageLayout from '../layout/PageLayout';
import QuestionBlock from './QuestionBlock';
import Button from '../ui/Button';
import { getQuestionnairePageData, isLastQuestionnairePage } from '../../utils/questionnaireLoader';
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
        action: 'validation_failed',
        target: 'next_button',
        value: '未完成所有必答题',
        time: new Date().toISOString(),
      });
      return;
    }

    logOperation({
      action: 'button_click',
      target: isLastPage ? 'submit_questionnaire_button' : 'next_page_button',
      value: isLastPage ? '提交问卷' : '下一页',
      time: new Date().toISOString(),
    });

    try {
      // 构建MarkObject
      const pageEndTime = new Date();

      // 收集当前页面的答案
      const answerList = pageData.questions.map((q) => ({
        targetElement: `question_${q.id}`,
        value: answers[`q${q.id}`] || '',
      }));

      const markObject = {
        pageNumber: String(pageNumber),
        pageDesc: pageData.title,
        operationList: currentPageOperations.map((op) => ({
          targetElement: op.target,
          eventType: op.action,
          value: op.value || '',
          time: op.time || new Date(op.timestamp).toISOString(),
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

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        {/* Header Section */}
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>{pageData.title}</h1>
          <p className={styles.instructions}>{pageData.instructions}</p>

          {/* Progress Indicator */}
          <div className={styles.progressSection}>
            <span className={styles.progressLabel}>本页完成进度:</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${completionProgress.rate}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>
              {completionProgress.answered} / {completionProgress.total}
            </span>
          </div>
        </div>

        {/* Questions Section */}
        <div className={styles.questionsSection}>
          {pageData.questions.map((question) => {
            const questionId = `q${question.id}`;
            return (
              <QuestionBlock
                key={question.id}
                questionNumber={question.id}
                questionText={question.text}
                options={question.options}
                value={answers[questionId]}
                onChange={(value) => handleAnswerChange(question.id, value)}
                required={true}
                orientation={question.type === 'scale10' ? 'horizontal' : 'vertical'}
              />
            );
          })}
        </div>

        {/* Footer Section */}
        <div className={styles.footer}>
          <div className={styles.navigationHint}>
            {isLastPage ? '完成后将提交问卷' : '完成后点击"下一页"继续'}
          </div>

          <div className={styles.buttonGroup}>
            <Button
              variant="primary"
              size="large"
              disabled={!canProceed}
              onClick={handleNextClick}
            >
              {isLastPage ? '提交问卷' : '下一页'}
            </Button>
          </div>
        </div>

        {/* Incomplete Warning */}
        {showIncompleteWarning && !canProceed && (
          <div className={styles.disabledHint}>
            <svg
              className={styles.warningIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>请完成本页所有必答题后再继续</span>
          </div>
        )}
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
