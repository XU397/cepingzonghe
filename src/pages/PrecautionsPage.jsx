import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import NavigationButton from '../components/common/NavigationButton';
import { useDataLogging } from '../hooks/useDataLogging';

// 添加倒计时常量
const READING_TIME_SECONDS = 40;

/**
 * 注意事项页面组件
 * 显示任务注意事项，用户需等待40秒倒计时完成后才能勾选确认，然后才能继续
 */
const PrecautionsPage = () => {
  const { 
    currentPageId, 
    startTaskTimer,
    setPageEnterTime 
  } = useAppContext();
  
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  // 添加倒计时相关状态
  const [timeRemainingOnPage, setTimeRemainingOnPage] = useState(READING_TIME_SECONDS);
  const [canSelectCheckbox, setCanSelectCheckbox] = useState(false);

  // 数据记录Hook
  const {
    logCheckboxChange,
    logButtonClick,
    logPageEnter,
    collectDirectAnswer
  } = useDataLogging('Page_01_Precautions');

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const timerRef = useRef(null);

  // 页面进入时记录 - 只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      setPageEnterTime(new Date());
      logPageEnter('注意事项页面');
    }
  }, []);

  // 倒计时逻辑 - 使用ref避免重复设置定时器
  useEffect(() => {
    if (timeRemainingOnPage <= 0) {
      setCanSelectCheckbox(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeRemainingOnPage(prev => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeRemainingOnPage]);

  // 缓存是否禁用继续按钮的计算
  const isContinueDisabled = useMemo(() => {
    return !isAcknowledged;
  }, [isAcknowledged]);

  /**
   * 勾选状态变更处理
   */
  const handleAcknowledgeChange = useCallback((e) => {
    if (!canSelectCheckbox) return; // 倒计时未完成时不允许勾选
    
    const checked = e.target.checked;
    setIsAcknowledged(checked);
    
    // 使用数据记录Hook记录复选框变更
    logCheckboxChange('确认已阅读注意事项', checked, '注意事项确认状态');
    
    // 额外收集确认时间
    if (checked) {
      collectDirectAnswer('注意事项确认时间', new Date().toISOString());
    }
  }, [canSelectCheckbox, logCheckboxChange, collectDirectAnswer]);

  /**
   * 继续按钮点击前的准备
   */
  const handleBeforeContinue = useCallback(() => {
    // 记录继续按钮点击
    logButtonClick('继续', '开始任务');
    
    // 收集页面停留时间等数据
    collectDirectAnswer('页面停留时长', '用户点击继续');
    collectDirectAnswer('任务开始触发', '通过注意事项页面');
    
    // 启动任务计时器
    startTaskTimer();
    return true; // 返回true表示可以继续导航
  }, [logButtonClick, collectDirectAnswer, startTaskTimer]);

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
          作答时间共<span style={{ color: '#d32f2f', fontWeight: 'bold' }}>50分钟</span>(其中测评时间40分钟，问卷调查10分钟)，时间结束后，系统将自动退出答题界面。
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
        opacity: canSelectCheckbox ? 1 : 0.7,
        width: '90%',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          marginBottom: !canSelectCheckbox ? '12px' : '0'
        }}>
          <input
            type="checkbox"
            id="acknowledge-checkbox"
            checked={isAcknowledged}
            onChange={handleAcknowledgeChange}
            disabled={!canSelectCheckbox}
            style={{ 
              width: '20px', 
              height: '20px',
              accentColor: '#2196f3',
              cursor: canSelectCheckbox ? 'pointer' : 'not-allowed',
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
              cursor: canSelectCheckbox ? 'pointer' : 'not-allowed',
              userSelect: 'none'
            }}
          >
            我已阅读并理解上述注意事项 
          </label>
        </div>
        
        {/* 倒计时显示在蓝色框内 */}
        {!canSelectCheckbox && (
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
            }}>{timeRemainingOnPage}</span>秒后可勾选确认...
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', width: '90%' }}>
        <NavigationButton
          currentPageId={currentPageId}
          disabled={isContinueDisabled}
          buttonText="继续"
          onClick={handleBeforeContinue}
          customStyle={{ 
            padding: '10px 30px',
            fontSize: '16px',
            borderRadius: '25px'
          }}
        />
      </div>
    </div>
  );
};

export default PrecautionsPage; 