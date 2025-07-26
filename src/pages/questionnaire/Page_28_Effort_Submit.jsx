import React, { useState, useContext, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { EFFORT_QUESTIONS } from '../../utils/questionnaireData';
import EffortScale from '../../components/questionnaire/EffortScale';
import { scrollToTop } from '../../utils/scrollUtils';

import styles from './QuestionnairePage.module.css';

const PAGE_ID = 'Page_28_Effort_Submit';

/**
 * P28: 努力评估与问卷提交页
 * @returns {JSX.Element}
 */
function Page_28_Effort_Submit() {
  const {
    currentPageId,
    questionnaireRemainingTime,
    isQuestionnaireTimeUp,
    saveQuestionnaireAnswer,
    getQuestionnaireAnswer,
    setPageEnterTime,
    completeQuestionnaire,
    isQuestionnaireCompleted,
    logOperation,
    collectAnswer,
    submitPageData,
    navigateToPage,
    handleLogout
  } = useAppContext();

  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);

  // 页面加载时只执行一次的操作，使用ref确保不重复执行
  const pageLoadedRef = useRef(false);
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      // 确保页面滚动到顶部
      scrollToTop();
      setPageEnterTime(new Date());
      logOperation({
        targetElement: 'P28_EffortSubmitPage',
        eventType: 'page_load',
      });
    }
  }, []);

  // 检查问卷是否已经完成
  useEffect(() => {
    if (isQuestionnaireCompleted) {
      setSubmissionComplete(true);
      console.log('[Page_28] 检测到问卷已完成，显示完成页面');
    }
  }, [isQuestionnaireCompleted]);

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
   * @param {number} score 分数
   */
  const handleAnswerChange = useCallback((questionId, score) => {
    setAnswers(prevAnswers => {
      const newAnswers = { ...prevAnswers, [questionId]: score };
      return newAnswers;
    });
    logOperation({
      targetElement: `EffortScale-${questionId}`,
      eventType: 'change',
      value: score.toString()
    });
    
    // 实时收集答案到answerList，确保即使用户没有点击提交按钮也能提交答案
    const questionIndex = EFFORT_QUESTIONS.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      collectAnswer({
        code: questionIndex + 1,
        targetElement: `P28_努力评估问题${questionIndex + 1}`,
        value: score.toString()
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
   * 检查所有问题是否已回答
   * @returns {boolean} 是否所有问题都已回答
   */
  const allQuestionsAnswered = useMemo(() => {
    return EFFORT_QUESTIONS.every(q => answers[q.id] !== undefined && answers[q.id] !== null);
  }, [answers]);

  // 缓存disabled状态，避免每次渲染都重新计算
  const isDisabled = useMemo(() => {
    return isSubmitting || isQuestionnaireTimeUp;
  }, [isSubmitting, isQuestionnaireTimeUp]);

  /**
   * 处理最终提交操作
   */
  const handleSubmit = async () => {
    if (!allQuestionsAnswered && !isQuestionnaireTimeUp) {
      alert('请回答所有问题后再提交。');
      logOperation({ targetElement: 'SubmitButton', eventType: 'click_blocked', value: 'incomplete' });
      return;
    }
    setIsSubmitting(true);
    logOperation({ targetElement: 'SubmitButton', eventType: 'click' });

    // 同步收集所有答案，避免异步状态更新问题
    const answerList = EFFORT_QUESTIONS.map((question, index) => ({
      code: index + 1,
      targetElement: `P28_努力评估问题${index + 1}`,
      value: (answers[question.id] !== undefined ? answers[question.id].toString() : '未回答')
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
      const success = await submitPageData(); // 提交最后一页的数据
      if (success) {
        if (typeof completeQuestionnaire === 'function') {
          completeQuestionnaire(); // 标记问卷已完成
        }
        setSubmissionComplete(true);
        logOperation({ targetElement: 'System', eventType: 'questionnaire_complete', value: 'success' });
      } else {
        alert('问卷提交失败，请重试');
      }
    } catch (error) {
      console.error("提交P28及问卷最终数据失败:", error);
      alert("提交问卷失败，请稍后重试！");
      logOperation({ targetElement: 'System', eventType: 'questionnaire_complete_error', value: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 使用ref来缓存超时处理，避免无限重新渲染
  const timeoutHandledRef = React.useRef(false);

  // 处理问卷超时
  useEffect(() => {
    if (isQuestionnaireTimeUp && !submissionComplete && !isSubmitting && !timeoutHandledRef.current) {
      timeoutHandledRef.current = true;
      setIsSubmitting(true);
      logOperation({ targetElement: 'System', eventType: 'auto_submit_final', value: 'questionnaire_time_up' });
      
      // 同步收集超时时的答案
      const answerList = EFFORT_QUESTIONS.map((question, index) => ({
        code: index + 1,
        targetElement: `P28_努力评估问题${index + 1}`,
        value: (answers[question.id] !== undefined ? answers[question.id].toString() : '超时未回答')
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
          if (typeof completeQuestionnaire === 'function') {
            completeQuestionnaire();
          }
          setSubmissionComplete(true); // 标记提交完成，即使是自动的
          logOperation({ targetElement: 'System', eventType: 'questionnaire_complete_timeout', value: 'success' });
        }).catch(error => {
          console.error("超时自动提交P28数据失败:", error);
          alert("问卷时间到，自动提交答案失败，请检查网络或联系管理员。");
          logOperation({ targetElement: 'System', eventType: 'questionnaire_complete_timeout_error', value: error.message });
        }).finally(() => {
          setIsSubmitting(false);
        });
      }, 0);
    }
  }, [isQuestionnaireTimeUp, submissionComplete, isSubmitting]);

  if (submissionComplete) {
    return (
      <div className={styles.pageContainer}>
        <div className={`${styles.questionnaireContent} ${styles.thankYouMessageContainer}`}>
          <h2>问卷已完成</h2>
          <p>感谢你的参与！你的回答已成功提交。祝你学习进步，生活愉快！</p>
          <p>你现在可以返回登录页面了。</p>
          <div className={styles.buttonContainer}>
            <button 
              className={styles.nextButton}
              onClick={() => {
                logOperation({ targetElement: 'ReturnToLoginButton', eventType: 'click' });
                // 先执行登出操作，清除所有用户状态和认证信息
                handleLogout();
                // handleLogout() 会自动跳转到登录页面，所以不需要手动导航
              }}
              style={{ marginTop: '20px' }}
            >
              返回登录页面
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.questionnaireContent}>
        <h2>P28: 努力评估与提交 ({EFFORT_QUESTIONS.length}题)</h2>
        <p className={styles.pageDescription}> 想象用10分的评分尺度来表示你对事情所付出的努力。
          最高值(10)表示你已尽了自己的最大努力,所投入的努力最高；<br />
          最低值(1)表示你根本没有努力尝试,所投入的努力最低；
          现在想想你完成探究任务和问卷所付出的努力。</p>
        
        <EffortScale 
          questions={EFFORT_QUESTIONS}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          disabled={isDisabled}
        />

        <button 
          className={`${styles.submitButton} ${styles.finalSubmitButton}`}
          onClick={handleSubmit} 
          disabled={(!allQuestionsAnswered && !isQuestionnaireTimeUp) || isSubmitting}
        >
          {isSubmitting ? '提交中...' : '完成并提交问卷'}
        </button>
        {isQuestionnaireTimeUp && !isSubmitting && <p className={styles.timeUpMessage}>问卷时间已到，将自动提交您的答案。</p>}
      </div>
    </div>
  );
}

export default Page_28_Effort_Submit; 