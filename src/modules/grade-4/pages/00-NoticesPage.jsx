/**
 * 注意事项页面 - 四年级火车购票测评
 * 实现PDF第2页的注意事项页面，包含40秒强制阅读计时器
 * 使用现有的倒计时Hook简化实现
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import { moduleConfig } from '../moduleConfig';
import { useCountdownTimer } from '../hooks/useCountdownTimer';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import styles from './00-NoticesPage.module.css';

// 倒计时时长来源于模块配置，避免魔法数
const READING_TIME_SECONDS = moduleConfig?.settings?.noticesReadingTime || 40;

const NoticesPage = () => {
  const { 
    logOperation, 
    collectAnswer,
    submitCurrentPageData,
    navigateToPage,
    startGlobalTimer
  } = useGrade4Context();
  
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  
  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);

  // 使用倒计时Hook
  const {
    timeRemaining,
    isCompleted: isTimerCompleted
  } = useCountdownTimer({
    initialTime: READING_TIME_SECONDS,
    onComplete: () => {
      // 倒计时完成时记录操作
      logOperation({
        targetElement: '40秒倒计时',
        eventType: 'timer_complete',
        value: '倒计时完成，复选框已激活'
      });
    },
    autoStart: true
  });

  // 页面加载时记录操作
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      
      // 记录页面进入
      logOperation({
        targetElement: '页面',
        eventType: 'page_enter',
        value: '进入注意事项页面'
      });
      
      // 记录倒计时开始
      logOperation({
        targetElement: '40秒倒计时',
        eventType: 'timer_start',
        value: '开始40秒强制阅读倒计时'
      });
    }
  }, [logOperation]);

  // 复选框变化处理
  const handleCheckboxChange = useCallback((event) => {
    const checked = event.target.checked;
    setIsAcknowledged(checked);
    
    // 记录复选框操作
    logOperation({
      targetElement: '确认复选框',
      eventType: 'checkbox_select',
      value: checked ? '用户确认已阅读注意事项' : '用户取消确认'
    });
    
    // 收集答案
    collectAnswer({
      targetElement: '注意事项确认',
      value: checked ? '已确认' : '未确认'
    });
  }, [logOperation, collectAnswer]);

  // 下一页按钮处理 - 使用自动提交导航
  const handleNextPage = useCallback(async () => {
    try {
      // 记录导航操作
      logOperation({
        targetElement: '下一页按钮',
        eventType: 'button_click',
        value: '点击下一页，进入情景介绍'
      });
      
      // 启动40分钟全局倒计时
      startGlobalTimer();
      
      // 记录全局计时器启动
      logOperation({
        targetElement: '全局计时器',
        eventType: 'timer_start',
        value: '启动40分钟全局倒计时'
      });
      
      // 使用新的自动提交导航（会自动提交当前页面数据）
      await navigateToPage('scenario-intro');
      
      console.log('[NoticesPage] ✅ 成功导航到情景介绍页面');
    } catch (error) {
      console.error('[NoticesPage] 导航失败:', error);
      alert('页面跳转失败，请重试');
    }
  }, [logOperation, navigateToPage, startGlobalTimer]);

  return (
    <AssessmentPageLayout
      showNavigation={false}
      showTimer={false}
      isNextButtonEnabled={isTimerCompleted && isAcknowledged}
      onNextClick={handleNextPage}
      className={styles.noticesPageContainer}
    >
      <h1 className={`page-title ${styles.noticesPageTitle}`}>注意事项</h1>
      
      <div className={styles.cartoonBox} style={{ 
        marginBottom: '20px',
        borderLeft: '6px solid var(--cartoon-red)',
        position: 'relative',
        padding: '15px 20px',
        width: '100%',
        maxWidth: '900px',
        flexShrink: 0
      }}>
        <div style={{
          position: 'absolute',
          top: '-28px',
          left: '15px',
          background: 'var(--cartoon-red)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '15px',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          请仔细阅读
        </div>
        
        <p style={{ 
          fontSize: '16px', 
          lineHeight: '1.8', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          color: '#333'
        }}>
          <span style={{ 
            display: 'inline-block', 
            marginRight: '8px',
            color: 'var(--cartoon-red)',
            fontSize: '16px',
            marginTop: '2px'
          }}>•</span>
          作答时间共<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>40分钟</span>，时间结束后，系统将自动退出答题界面。
        </p>
        <p style={{ 
          fontSize: '18px', 
          lineHeight: '1.8', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          color: '#333'
        }}>
          <span style={{ 
            display: 'inline-block', 
            marginRight: '8px',
            color: 'var(--cartoon-red)',
            fontSize: '18px',
            marginTop: '2px'
          }}>•</span>
          请按顺序回答每页问题，<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>上一页题目未完成作答，将无法点击进入下一页</span>。
        </p>
        <p style={{ 
          fontSize: '18px', 
          lineHeight: '1.8', 
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'flex-start',
          color: '#333'
        }}>
          <span style={{ 
            display: 'inline-block', 
            marginRight: '8px',
            color: 'var(--cartoon-red)',
            fontSize: '18px',
            marginTop: '2px'
          }}>•</span>
          答题时，<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>不要提前点击&ldquo;下一页&rdquo;</span>查看后面的内容，<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>否则将无法返回上一页</span>。
        </p>
        <p style={{ 
          fontSize: '18px', 
          lineHeight: '1.8', 
          marginBottom: '0',
          display: 'flex',
          alignItems: 'flex-start',
          color: '#333'
        }}>
          <span style={{ 
            display: 'inline-block', 
            marginRight: '8px',
            color: 'var(--cartoon-red)',
            fontSize: '18px',
            marginTop: '2px'
          }}>•</span>
          遇到系统故障、死机、死循环等特殊情况时，<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>请举手示意老师</span>。
        </p>
      </div>
      
      <div className={`${styles.checkboxContainer} ${isTimerCompleted ? styles.enabled : styles.disabled}`}>
        <div className={styles.checkboxInner}>
          <input
            type="checkbox"
            id="acknowledge-checkbox"
            checked={isAcknowledged}
            onChange={handleCheckboxChange}
            disabled={!isTimerCompleted}
            className={styles.checkboxInput}
          />
          <label 
            htmlFor="acknowledge-checkbox" 
            className={`${styles.checkboxLabel} ${isTimerCompleted ? styles.enabled : styles.disabled}`}
          >
            我已阅读并同意以上注意事项{!isTimerCompleted ? `(${timeRemaining}s)` : ''}
          </label>
        </div>
      </div>
      
      {/* 填充剩余空间的元素 */}
      <div style={{ flex: 1, minHeight: '20px' }}></div>
    </AssessmentPageLayout>
  );
};

export default NoticesPage;
