/**
 * 情景介绍页面 - 四年级火车购票测评
 * PDF第3页：展示熊猫城市背景图片和引言文本
 * 实现与现有7年级模块完全一致的视觉风格
 */

import { useEffect } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import styles from './01-ScenarioIntroPage.module.css';

const ScenarioIntroPage = () => {
  const { 
    logOperation, 
    setNavigationStep,
    navigateToPage
  } = useGrade4Context();

  useEffect(() => {
    // 设置导航栏高亮状态 - "1. 出行方案"
    setNavigationStep('1');
    
    // 记录页面进入
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入情景介绍页面'
    });
  }, [logOperation, setNavigationStep]);

  const handleNextPage = async () => {
    try {
      // 记录下一页按钮点击
      logOperation({
        targetElement: '下一页按钮',
        eventType: 'button_click',
        value: '从情景介绍页面导航到问题识别页面'
      });
      
      // 使用自动提交导航
      await navigateToPage('problem-identification');
      
      console.log('[ScenarioIntroPage] ✅ 成功导航到问题识别页面');
    } catch (error) {
      console.error('[ScenarioIntroPage] 导航失败:', error);
      alert('页面跳转失败，请重试');
    }
  };

  return (
    <AssessmentPageLayout 
      onNextClick={handleNextPage}
      isNextButtonEnabled={true} // 此页面默认启用
      backgroundImage="/src/assets/images/g4-p1-xx.png"
      backgroundStyle={{
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* 页面标题 */}
      <div className={`${styles.titleContainer} ${styles.fadeIn}`}>
        <h1 className={styles.pageTitle}>
          情景介绍
        </h1>
      </div>

      {/* 内容区域 - 填满整个可用空间，背景图覆盖整个区域 */}
      <div className={styles.contentArea}>
        {/* 引言文本 */}
        <div className={`${styles.introTextBox} ${styles.slideInFromBottom}`}>
          <h2 className={styles.introTitle}>
            出行方案规划
          </h2>
          <p className={styles.introText}>
            小明一家住在四川省南充市。暑假快来了，住在成都的舅舅邀请小明一家到那里做客。请你帮小明一起规划出行方案吧！
          </p>
        </div>
      </div>
    </AssessmentPageLayout>
  );
};

export default ScenarioIntroPage;