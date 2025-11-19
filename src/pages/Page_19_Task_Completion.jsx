import React, { useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';
import NavigationButton from '../components/common/NavigationButton';
import { pageInfoMapping } from '../utils/pageMappings';
import styles from './Page_19_Task_Completion.module.css';

/**
 * @file Page_19_Task_Completion.jsx
 * @description P19: 主任务完成页面，完成后将进入问卷调查阶段。
 * PRD User_Step_Number_PDF_Ref: 13
 */
const Page_19_Task_Completion = () => {
  const { 
    submitPageData, 
    currentPageId, 
    navigateToPage, 
    setIsTaskFinished,
    setPageEnterTime,
    batchCode,
    examNo,
    formatDateTime,
    currentPageData
  } = useAppContext();

  // 数据记录Hook
  const {
    logButtonClick,
    logPageEnter
  } = useDataLogging('Page_19_Task_Completion');

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const dataSubmittedRef = useRef(false);

  // 页面进入记录 - 只执行一次（提交由按钮触发，避免重复）
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      const enterTime = new Date();
      setPageEnterTime(enterTime);
      logPageEnter('主任务完成页面');
    }
  }, []);

  /**
   * 处理下一页按钮点击
   */
  const handleNextPage = useCallback(async () => {
    // 记录按钮点击操作
    logButtonClick('继续完成问卷调查', '跳转到问卷调查页面');
    
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
    
    // 提交页面数据（标记为来自按钮）
    const submissionSuccess = await submitPageData({ isFromButton: true });

    if (submissionSuccess) {
      console.log("[Page_19_Task_Completion] 页面数据提交成功，跳转到问卷说明页面");
      navigateToPage('Page_20_Questionnaire_Intro', { skipSubmit: true }); 
    } else {
      console.error('Page_19_Task_Completion: 提交页面数据失败');
      alert('数据提交失败，请稍后再试。');
      return false;
    }
    
    return submissionSuccess;
  }, [logButtonClick, setIsTaskFinished, submitPageData, navigateToPage]);

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
