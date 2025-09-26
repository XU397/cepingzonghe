/**
 * 注意事项页面 - 四年级火车购票测评
 * 实现PDF第2页的注意事项页面，包含40秒强制阅读计时器
 * 使用现有的倒计时Hook简化实现
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import { useCountdownTimer } from '../hooks/useCountdownTimer';
import './NoticesPage.css';

// 添加倒计时常量
const READING_TIME_SECONDS = 40;

const NoticesPage = () => {
  const { 
    logOperation, 
    submitCurrentPageData,
    navigateToPage,
    formatTimestamp,
    startGlobalTimer
  } = useGrade4Context();
  
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  
  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);

  // 使用倒计时Hook
  const {
    timeRemaining,
    isCompleted: isTimerCompleted,
    formatTime
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
  }, [logOperation]);

  // 下一页按钮处理
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
      
      // 提交当前页面数据
      await submitCurrentPageData();
      
      // 导航到下一页
      navigateToPage('scenario-intro');
    } catch (error) {
      console.error('[NoticesPage] 提交数据失败:', error);
    }
  }, [logOperation, submitCurrentPageData, navigateToPage, startGlobalTimer]);

  return (
    <div className="page-content page-fade-in" style={{ 
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '85vh',
      boxSizing: 'border-box',
      padding: '0px 20px',
      minWidth: '90%',
    }}>
      <h1 className="page-title" style={{ 
        marginBottom: '20px',
        fontSize: '28px'
      }}>注意事项</h1>
      
      <div className="cartoon-box" style={{ 
        marginBottom: '25px',
        borderLeft: '6px solid var(--cartoon-red)',
        position: 'relative',
        padding: '18px 25px',
        width: '90%',
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
          答题时，<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>不要提前点击"下一页"</span>查看后面的内容，<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>否则将无法返回上一页</span>。
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
      
      <div className="checkbox-container" style={{ 
        marginBottom: '25px',
        background: '#e3f2fd',
        border: '2px solid #2196f3',
        padding: '18px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: isAcknowledged ? '0 4px 12px rgba(33, 150, 243, 0.3)' : 'none',
        transform: isAcknowledged ? 'translateY(-3px)' : 'none',
        opacity: isTimerCompleted ? 1 : 0.7,
        width: '90%',
      }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: !isTimerCompleted ? '12px' : '0'
      }}>
        <input
          type="checkbox"
          id="acknowledge-checkbox"
          checked={isAcknowledged}
          onChange={handleCheckboxChange}
          disabled={!isTimerCompleted}
          style={{ 
            width: '20px', 
            height: '20px',
            accentColor: '#2196f3',
            cursor: isTimerCompleted ? 'pointer' : 'not-allowed',
            marginRight: '12px'
          }}
        />
        <label 
          htmlFor="acknowledge-checkbox" 
          className="checkbox-label"
          style={{ 
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1565c0',
            cursor: isTimerCompleted ? 'pointer' : 'not-allowed',
            userSelect: 'none'
          }}
        >
          我已阅读并理解上述注意事项 
        </label>
      </div>
      
      {/* 倒计时显示在蓝色框内 */}
      {!isTimerCompleted && (
        <div style={{
          textAlign: 'center',
          background: '#ff9800',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '16px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          请仔细阅读注意事项，<span style={{ 
            fontSize: '18px', 
            color: '#fff3e0',
            marginLeft: '4px',
            marginRight: '4px'
          }}>{timeRemaining}</span>秒后可勾选确认...
        </div>
      )}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', width: '90%' }}>
        <button
          type="button"
          disabled={!isTimerCompleted || !isAcknowledged}
          onClick={handleNextPage}
          style={{ 
            padding: '10px 30px',
            fontSize: '16px',
            borderRadius: '25px',
            border: 'none',
            cursor: (isTimerCompleted && isAcknowledged) ? 'pointer' : 'not-allowed',
            background: (isTimerCompleted && isAcknowledged) ? '#2196f3' : '#e0e0e0',
            color: (isTimerCompleted && isAcknowledged) ? 'white' : '#9e9e9e',
            transition: 'all 0.3s ease',
            boxShadow: (isTimerCompleted && isAcknowledged) ? '0 4px 15px rgba(33, 150, 243, 0.4)' : 'none',
            transform: (isTimerCompleted && isAcknowledged) ? 'none' : 'none'
          }}
          onMouseEnter={(e) => {
            if (isTimerCompleted && isAcknowledged) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            if (isTimerCompleted && isAcknowledged) {
              e.target.style.transform = 'none';
              e.target.style.boxShadow = '0 4px 15px rgba(33, 150, 243, 0.4)';
            }
          }}
          title={(isTimerCompleted && isAcknowledged) ? '点击进入下一页' : '请先阅读完注意事项并确认'}
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default NoticesPage;