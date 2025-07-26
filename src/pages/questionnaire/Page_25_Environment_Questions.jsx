import React, { useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ENVIRONMENT_QUESTIONS, LIKERT_OPTIONS_4 } from '../../utils/questionnaireData';
import LikertScale from '../../components/questionnaire/LikertScale';
import { scrollToTop } from '../../utils/scrollUtils';

import styles from './QuestionnairePage.module.css';
import { getNextPageId } from '../../utils/pageMappings';

const PAGE_ID = 'Page_25_Environment_Questions';
const DEFAULT_NEXT_PAGE_ID = 'Page_26_School_Activities';

/**
 * P25: 创造环境问题组
 * @returns {JSX.Element}
 */
function Page_25_Environment_Questions() {
  const {
    currentPageId,
    navigateToPage,
    questionnaireRemainingTime,
    isQuestionnaireTimeUp,
    saveQuestionnaireAnswer,
    getQuestionnaireAnswer,
    setPageEnterTime,
    logOperation,
    collectAnswer,
    submitPageData
  } = useAppContext();

  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 将所有子问题合并为一个统一的数组，不分类显示
  const allQuestions = useMemo(() => {
    return Object.values(ENVIRONMENT_QUESTIONS).reduce((acc, category) => acc.concat(category.questions), []);
  }, []);

  // 页面加载时只执行一次的操作，使用ref确保不重复执行
  const pageLoadedRef = useRef(false);
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      // 确保页面滚动到顶部
      scrollToTop();
      setPageEnterTime(new Date());
      logOperation({
        eventType: 'page_load',
        targetElement: 'P25_EnvironmentQuestionsPage',
      });
    }
  }, []);

  // 获取保存的答案，只在组件挂载时执行一次
  useEffect(() => {
    const savedAnswers = getQuestionnaireAnswer(PAGE_ID);
    if (savedAnswers) {
      setAnswers(savedAnswers);
    }
  }, []);

  /**
   * 处理答案变化
   * @param {string} questionId 问题ID
   * @param {string} answer 答案
   */
  const handleAnswerChange = useCallback((questionId, answer) => {
    setAnswers(prevAnswers => {
      const newAnswers = { ...prevAnswers, [questionId]: answer };
      return newAnswers;
    });
    logOperation({
      targetElement: `LikertScale-${questionId}`,
      eventType: 'change',
      value: answer
    });
    
    // 实时收集答案到answerList，确保即使用户没有点击下一页按钮也能提交答案
    const questionIndex = allQuestions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      collectAnswer({
        code: questionIndex + 1,
        targetElement: `P25_创造环境问题${questionIndex + 1}`,
        value: answer
      });
    }
  }, [logOperation, collectAnswer, allQuestions]);

  // 使用useEffect来保存答案，避免在渲染期间调用setState
  // 使用ref来缓存上一次的answers，避免不必要的保存操作
  const prevAnswersRef = useRef({});
  useEffect(() => {
    if (Object.keys(answers).length > 0 && JSON.stringify(answers) !== JSON.stringify(prevAnswersRef.current)) {
      prevAnswersRef.current = answers;
      saveQuestionnaireAnswer(PAGE_ID, answers);
    }
  }, [answers]);

  /**
   * 检查所有问题是否已回答
   * @returns {boolean} 是否所有问题都已回答
   */
  const allQuestionsAnswered = useMemo(() => {
    return allQuestions.every(q => !!answers[q.id]);
  }, [answers, allQuestions]);

  // 缓存disabled状态，避免每次渲染都重新计算
  const isDisabled = useMemo(() => {
    return isSubmitting || isQuestionnaireTimeUp;
  }, [isSubmitting, isQuestionnaireTimeUp]);

  /**
   * 处理下一页操作
   */
  const handleNextPage = async () => {
    if (!allQuestionsAnswered && !isQuestionnaireTimeUp) {
      alert('请回答所有问题后再继续。');
      logOperation({ targetElement: 'NextButton', eventType: 'click_blocked', value: 'incomplete' });
      return;
    }
    setIsSubmitting(true);
    logOperation({ targetElement: 'NextButton', eventType: 'click' });

    // 同步收集所有答案，避免异步状态更新问题
    const answerList = allQuestions.map((question, index) => ({
      code: index + 1,
      targetElement: `P25_创造环境问题${index + 1}`,
      value: answers[question.id] || '未回答'
    }));

    // 手动将答案添加到AppContext，确保立即可用
    answerList.forEach(answer => {
      collectAnswer({
        targetElement: answer.targetElement,
        value: answer.value,
        code: answer.code
      });
    });

    // 等待一个React渲染周期，确保状态更新完成
    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      const success = await submitPageData();
      if (success) {
        await navigateToPage('Page_26_School_Activities', { skipSubmit: true });
      } else {
        alert('数据提交失败，请重试');
      }
    } catch (error) {
      console.error("提交P25数据失败:", error);
      alert("提交答案失败，请稍后重试！");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 使用ref来缓存超时处理，避免无限重新渲染
  const timeoutHandledRef = React.useRef(false);

  // 处理问卷超时
  useEffect(() => {
    if (isQuestionnaireTimeUp && !isSubmitting && !timeoutHandledRef.current) {
      timeoutHandledRef.current = true;
      setIsSubmitting(true);
      logOperation({ targetElement: 'System', eventType: 'auto_submit', value: 'questionnaire_time_up' });
      
      // 同步收集超时时的答案
      const answerList = allQuestions.map((question, index) => ({
        code: index + 1,
        targetElement: `P25_创造环境问题${index + 1}`,
        value: answers[question.id] || '超时未回答'
      }));

      // 手动将答案添加到AppContext
      answerList.forEach(answer => {
        collectAnswer({
          targetElement: answer.targetElement,
          value: answer.value,
          code: answer.code
        });
      });
      
      // 等待状态更新后提交
      setTimeout(() => {
        submitPageData().then(() => {
          navigateToPage('Page_26_School_Activities', { skipSubmit: true });
        }).catch(error => {
          console.error("超时自动提交P25数据失败:", error);
          alert("问卷时间到，自动提交答案失败，请检查网络或联系管理员。");
        }).finally(() => {
          setIsSubmitting(false);
        });
      }, 0);
    }
  }, [isQuestionnaireTimeUp, isSubmitting, allQuestions]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.questionnaireContent}>
        <p className={styles.pageDescription}>请根据你对下列说法的同意程度进行选择。</p>
        
        <div className={styles.tableContainer}>
          <LikertScale
            questions={allQuestions}
            options={LIKERT_OPTIONS_4}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            disabled={isDisabled}
            tableMode={true}
          />
        </div>

        <div className={styles.buttonContainer}>
          <button
            className={styles.nextButton}
            onClick={handleNextPage}
            disabled={(!allQuestionsAnswered && !isQuestionnaireTimeUp) || isSubmitting}
          >
            {isSubmitting ? '提交中...' : '下一页'}
          </button>
          {isQuestionnaireTimeUp && <p className={styles.timeUpMessage}>问卷时间已到，将自动提交您的答案。</p>}
        </div>
      </div>
    </div>
  );
}

export default Page_25_Environment_Questions; 