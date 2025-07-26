import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useDataLogging } from '../../hooks/useDataLogging';
import { scrollToTop } from '../../utils/scrollUtils';
import styles from './QuestionnairePage.module.css';


const PAGE_ID = 'Page_20_Questionnaire_Intro';
const READING_TIME_SECONDS = 20;

/**
 * P20: 问卷说明与开始页
 * @returns {JSX.Element}
 */
function Page_20_Questionnaire_Intro() {
  const {
    navigateToPage,
    startQuestionnaireTimer,
    questionnaireRemainingTime,
    isQuestionnaireTimeUp,
    setPageEnterTime,
    submitPageData
  } = useAppContext();

  // 数据记录Hook
  const {
    logButtonClick,
    logPageEnter,
    collectDirectAnswer
  } = useDataLogging(PAGE_ID);

  const [timeRemainingOnPage, setTimeRemainingOnPage] = useState(READING_TIME_SECONDS);
  const [canProceed, setCanProceed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 确保页面滚动到顶部
    scrollToTop();
    setPageEnterTime(new Date());
    logPageEnter('问卷说明与开始页面');
  }, [setPageEnterTime, logPageEnter]);

  useEffect(() => {
    if (timeRemainingOnPage <= 0) {
      setCanProceed(true);
      return;
    }
    const timerId = setInterval(() => {
      setTimeRemainingOnPage(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeRemainingOnPage]);

  const handleStartQuestionnaire = async () => {
    if (!canProceed) return;

    setIsSubmitting(true);
    
    // 记录按钮点击
    logButtonClick('开始作答', '用户确认问卷说明，开始作答');
    
    // 记录一个象征性的答案，表明用户确认了说明页
    collectDirectAnswer('问卷说明确认', '已确认');

    try {
      const success = await submitPageData();
      if (success) {
        console.log("[Page_20_Questionnaire_Intro] 启动问卷计时器，开始10分钟倒计时");
        startQuestionnaireTimer(); // 启动全局问卷计时器（10分钟）
        
        // 持久化问卷计时器状态
        localStorage.setItem('isQuestionnaireStarted', 'true');
        localStorage.setItem('questionnaireStartTime', new Date().toISOString());
        localStorage.setItem('questionnaireRemainingTime', '600'); // 10分钟 = 600秒
        
        console.log("[Page_20_Questionnaire_Intro] 问卷计时器已启动，跳转到问卷第一页");
        await navigateToPage('Page_21_Curiosity_Questions', { skipSubmit: true });
      } else {
        alert('数据提交失败，请重试');
      }
    } catch (error) {
      console.error("提交P20数据或启动问卷失败:", error);
      alert("无法开始问卷，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.questionnaireContent}>
        <h1 className={styles.introTitle}>调查问卷说明</h1>
        <div className={styles.introText}>
          <p>恭喜完成探究任务!接下来,你将进入问卷调查部分(10分钟)。</p>
          <ul>
            <li>在本问卷中，回答没有正确或错误之分，你只需要根据自己的真实情况填写即可。如有不明白的地方或不确定如何作答，可以提问。 </li>
            <li>你可以使用屏幕右下角的下一页按钮来回答下一个问题。</li>
            <li>你和其他人的答案将会合并计算成总数和平均数，我们不会辨别个别参加者。</li>
            <li>你提供的答案会绝对保密。 </li>
          </ul>
          <p><strong>感谢你的配合！</strong></p>
        </div>

        {!canProceed && (
          <div className={styles.readingTimer}>
            请仔细阅读说明，<span className={styles.countdown}>{timeRemainingOnPage}</span>秒后可开始作答...
          </div>
        )}

        <div className={styles.buttonContainer}>
          <button 
            className={`${styles.nextButton} ${styles.startButton}`} 
            onClick={handleStartQuestionnaire}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? '处理中...' : '开始作答'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Page_20_Questionnaire_Intro; 