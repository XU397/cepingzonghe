import React, { useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { OUTSCHOOL_ACTIVITIES, FREQUENCY_OPTIONS } from '../../utils/questionnaireData';
import FrequencyScale from '../../components/questionnaire/FrequencyScale';
import { scrollToTop } from '../../utils/scrollUtils';

import styles from './QuestionnairePage.module.css';
import { getNextPageId } from '../../utils/pageMappings';

const PAGE_ID = 'Page_27_Outschool_Activities';
const DEFAULT_NEXT_PAGE_ID = 'Page_28_Effort_Submit';

/**
 * P27: 校外科学活动参与情况
 * @returns {JSX.Element}
 */
function Page_27_Outschool_Activities() {
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

  // 页面加载时只执行一次的操作，使用ref确保不重复执行
  const pageLoadedRef = useRef(false);
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      // 确保页面滚动到顶部
      scrollToTop();
      setPageEnterTime(new Date());
      logOperation({
        targetElement: 'P27_OutschoolActivitiesPage',
        eventType: 'page_load',
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
   * @param {string} activityId 活动ID
   * @param {string} frequency 频率
   */
  const handleAnswerChange = useCallback((activityId, frequency) => {
    setAnswers(prevAnswers => {
      const newAnswers = { ...prevAnswers, [activityId]: frequency };
      return newAnswers;
    });
    logOperation({
      targetElement: `FrequencyScale-${activityId}`,
      eventType: 'change',
      value: frequency
    });
    
    // 实时收集答案到answerList，确保即使用户没有点击下一页按钮也能提交答案
    const activityIndex = OUTSCHOOL_ACTIVITIES.findIndex(act => act.id === activityId);
    if (activityIndex !== -1) {
      collectAnswer({
        code: activityIndex + 1,
        targetElement: `P27_校外科学活动${activityIndex + 1}`,
        value: frequency
      });
    }
  }, [logOperation, collectAnswer]);

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
   * 检查所有活动是否已选择频率
   * @returns {boolean} 是否所有活动都已选择频率
   */
  const allActivitiesAnswered = useMemo(() => {
    return OUTSCHOOL_ACTIVITIES.every(act => !!answers[act.id]);
  }, [answers]);

  // 缓存disabled状态，避免每次渲染都重新计算
  const isDisabled = useMemo(() => {
    return isSubmitting || isQuestionnaireTimeUp;
  }, [isSubmitting, isQuestionnaireTimeUp]);

  /**
   * 处理下一页操作
   */
  const handleNextPage = async () => {
    if (!allActivitiesAnswered && !isQuestionnaireTimeUp) {
      alert('请为所有活动选择参与频率后再继续。');
      logOperation({ targetElement: 'NextButton', eventType: 'click_blocked', value: 'incomplete' });
      return;
    }
    setIsSubmitting(true);
    logOperation({ targetElement: 'NextButton', eventType: 'click' });

    // 同步收集所有答案，避免异步状态更新问题
    const answerList = OUTSCHOOL_ACTIVITIES.map((activity, index) => ({
      code: index + 1,
      targetElement: `P27_校外科学活动${index + 1}`,
      value: answers[activity.id] || '未回答'
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
        await navigateToPage('Page_28_Effort_Submit', { skipSubmit: true });
      } else {
        alert('数据提交失败，请重试');
      }
    } catch (error) {
      console.error("提交P27数据失败:", error);
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
      const answerList = OUTSCHOOL_ACTIVITIES.map((activity, index) => ({
        code: index + 1,
        targetElement: `P27_校外科学活动${index + 1}`,
        value: answers[activity.id] || '超时未回答'
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
          navigateToPage('Page_28_Effort_Submit', { skipSubmit: true });
        }).catch(error => {
          console.error("超时自动提交P27数据失败:", error);
          alert("问卷时间到，自动提交答案失败，请检查网络或联系管理员。");
        }).finally(() => {
          setIsSubmitting(false);
        });
              }, 0);
      }
    }, [isQuestionnaireTimeUp, isSubmitting]);


  return (
    <div className={styles.pageContainer}>
      <div className={styles.questionnaireContent}>
        <p className={styles.pageDescription}>请选择你参与以下各项<span style={{ color: 'red' }}>校外</span>科学活动的频率。</p>
        
        <div className={styles.tableContainer}>
          <FrequencyScale 
            activities={OUTSCHOOL_ACTIVITIES}
            options={FREQUENCY_OPTIONS}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            disabled={isDisabled}
          />
        </div>
        
        <div className={styles.buttonContainer}>
          <button 
            className={styles.nextButton}
            onClick={handleNextPage} 
            disabled={(!allActivitiesAnswered && !isQuestionnaireTimeUp) || isSubmitting}
          >
            {isSubmitting ? '提交中...' : '下一页'}
          </button>
          {isQuestionnaireTimeUp && <p className={styles.timeUpMessage}>问卷时间已到，将自动提交您的答案。</p>}
        </div>
      </div>
    </div>
  );
}

export default Page_27_Outschool_Activities; 