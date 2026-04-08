import React, { useEffect, useCallback, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import { useAppContext } from '../context/AppContext';
import NavigationButton from '../components/common/NavigationButton';
import styles from './Page_19_Task_Completion.module.css';

/**
 * @file Page_19_Task_Completion.jsx
 * @description P19: 主任务完成页面，完成后将进入问卷调查阶段。
 * PRD User_Step_Number_PDF_Ref: 13
 */
const Page_19_Task_Completion = () => {
  const { 
    currentPageId, 
    navigateToPage, 
    setIsTaskFinished,
    setPageEnterTime
  } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const operationsRef = useRef([]);
  const isSubmittingRef = useRef(false);

  const recordOperation = useCallback((operation) => {
    const normalizedOperation = {
      ...operation,
      time: formatTimestamp(new Date()),
    };
    logOperation(normalizedOperation);
    operationsRef.current = [...operationsRef.current, normalizedOperation];
  }, [logOperation]);

  // 页面进入记录 - 只执行一次（提交由按钮触发，避免重复）
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      const enterTime = new Date();
      setPageEnterTime(enterTime);
      operationsRef.current = [];
    }
  }, [setPageEnterTime]);

  /**
   * 处理下一页按钮点击
   */
  const handleNextPage = useCallback(async () => {
    if (isSubmittingRef.current) {
      return false;
    }
    isSubmittingRef.current = true;

    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'next_button',
      value: '进入问卷调查'
    });
    
    // 设置任务完成状态，停止任务计时器
    console.log("[Page_19_Task_Completion] 设置任务完成状态，停止测评计时器");
    if (setIsTaskFinished) {
      setIsTaskFinished(true);
      console.log("[Page_19_Task_Completion] setIsTaskFinished(true) called - 测评阶段结束");
      
      // 清除测评计时器相关的localStorage数据
      localStorage.removeItem('taskStartTime');
      localStorage.removeItem('remainingTime');
      console.log("[Page_19_Task_Completion] 测评计时器数据已清除");
    } else {
      console.warn("[Page_19_Task_Completion] setIsTaskFinished is not defined or not a function.");
    }

    const submissionSuccess = await submitPage({
      answers: [{ targetElement: '任务完成确认', value: 'true' }],
      operations: operationsRef.current,
    });

    if (submissionSuccess) {
      console.log("[Page_19_Task_Completion] 页面数据提交成功，跳转到问卷说明页面");
      await navigateToPage('Page_20_Questionnaire_Intro', { skipSubmit: true }); 
      isSubmittingRef.current = false;
      return true;
    }

    console.error('Page_19_Task_Completion: 提交页面数据失败');
    alert('数据提交失败，请稍后再试。');
    isSubmittingRef.current = false;
    return false;
  }, [navigateToPage, recordOperation, setIsTaskFinished, submitPage]);

  return (
    <div className={`page-container ${styles.pageContainer} page-fade-in`}>
      <div className={styles.completionCard}>
        <h1 className={`page-title ${styles.title}`}>蒸馒头任务完成！</h1>
        
        <p className={styles.message}>
          🎉 恭喜你！ 🎉
          <br />
          经过一番探究，总算真相大白，原来是发酵时间过长，导致了小明蒸的馒头过度发酵。感谢你对小明的帮助！
          <br />
          <br />
          接下来，我们还有一份简短的问卷调查，用于了解你的学习体验。
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <NavigationButton 
            currentPageId={currentPageId}
            onClick={handleNextPage}
            buttonText="继续完成问卷调查"
            customStyle={{
              padding: '15px 30px',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          />
        </div>
        
        <p className={styles.footnote}>
          问卷大约需要10分钟时间。
        </p>
      </div>
    </div>
  );
};

export default Page_19_Task_Completion; 
