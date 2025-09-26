/**
 * 故事 2.6: 拖拽式时间规划 - 交互教程页面 (PDF第13页)
 * 展示拖拽操作的动画演示
 */

import React, { useState, useEffect } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import DragDropTimelineDemo from '../components/DragDropTimelineDemo';
import styles from './06-TimelinePlanningPage.module.css';

const TimelinePlanningPage = () => {
  const { logOperation, navigateToPage, setNavigationStep } = useGrade4Context();
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);

  // 更新左侧步骤高亮（第6步）
  useEffect(() => {
    setNavigationStep('6');
  }, [setNavigationStep]);
  
  const handlePlayDemo = () => {
    setIsDemoPlaying(true);
    
    // 记录播放操作
    logOperation({
      targetElement: '播放按钮',
      eventType: 'button_click',
      value: '播放拖拽演示动画'
    });
  };

  const handleDemoComplete = () => {
    setIsDemoPlaying(false);
    
    // 记录演示完成
    logOperation({
      targetElement: '动画演示',
      eventType: 'demo_complete',
      value: '拖拽演示动画播放完成'
    });
  };

  const handleNextClick = () => {
    console.log('[TimelinePlanningPage] 🔘 下一页按钮被点击');
    logOperation({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: '进入用户方案设计页面'
    });
    
    // 在开发环境中跳过数据提交检查，解决导航阻止问题（Vite 环境）
    const isDevelopment = import.meta.env.DEV;
    console.log('[TimelinePlanningPage] 🔧 开发环境:', isDevelopment);
    console.log('[TimelinePlanningPage] 📍 准备导航到用户方案设计页面, skipSubmit:', isDevelopment);
    
    try {
      navigateToPage('user-solution-design', { skipSubmit: isDevelopment });
      console.log('[TimelinePlanningPage] ✅ navigateToPage 调用完成');
    } catch (error) {
      console.error('[TimelinePlanningPage] ❌ navigateToPage 调用失败:', error);
    }
  };

  return (
    <AssessmentPageLayout className={styles.timelinePlanningPage}>
      <h6 className={styles.pageTitle}>
        <span className={styles.pageNumber}>6</span> 火车购票: 出发时间
      </h6>
      <div className={styles.contentArea}>
        {/* 标题和说明文字 */}
        <div className={styles.instructionSection}>
          <p className={styles.mainText}>
            小明还要思考从家出发的时间。起床后，他要完成以下5件事：
            <span className={styles.taskList}>
              ① 洗水壶（1分钟）② 用水壶烧热水（10分钟）③ 灌水到保温杯（2分钟）
              ④ 整理背包（2分钟） ⑤ 吃早饭（6分钟）
            </span>
            ，他该如何安排这些事情呢？
          </p>
          
          <p className={styles.noteText}>
            【注】以下5个长方条分别代表上述①-⑤事件，其长度与事件所用时间对应，
            可依次选中5个长方条拖动至作答区域，完成方案设计。
          </p>
        </div>

        {/* 播放按钮区域 */}
        <div className={styles.demoControlSection}>
          <p className={styles.demoInstructions}>
            请点击 
            <button 
              className={`${styles.playButton} ${isDemoPlaying ? styles.playing : ''}`}
              onClick={handlePlayDemo}
              disabled={isDemoPlaying}
            >
              {isDemoPlaying ? '播放中...' : '▶'}
            </button> 
            按钮，查看操作动画。动画表示：小明将按①, ②, ⑤, ③顺序依次完成4件事，
            在完成②的同时完成④，方案总用时为19分钟。
          </p>
        </div>

        {/* 拖拽演示区域 */}
        <div className={styles.demoArea}>
          <DragDropTimelineDemo 
            isPlaying={isDemoPlaying}
            onComplete={handleDemoComplete}
          />
        </div>
      </div>

      {/* 下一页按钮 */}
      <div className={styles.navigationSection}>
        <button 
          className={styles.nextButton}
          onClick={handleNextClick}
        >
          下一页
        </button>
      </div>
    </AssessmentPageLayout>
  );
};

export default TimelinePlanningPage;
