import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { submissionFormatTimestamp as formatTimestamp } from '@shared/services/submission';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import NavigationButton from '../components/common/NavigationButton';
import { getNextPageId } from '../utils/pageMappings';
import { useAppContext } from '../context/AppContext';

// 添加倒计时常量
const READING_TIME_SECONDS = 10;
const TIMEOUT_SECONDS = 30; // 倒计时结束后的超时时间

/**
 * 注意事项页面组件
 * 显示任务注意事项，用户需等待10秒倒计时完成后才能勾选确认，然后才能继续
 */
const PrecautionsPage = () => {
  const { 
    currentPageId, 
    startTaskTimer,
    setPageEnterTime,
    navigateToPage
  } = useAppContext();
  const { submitPage, logOperation, submitOnTimeout } = usePageSubmissionContext();

  const [isAcknowledged, setIsAcknowledged] = useState(false);
  // 添加倒计时相关状态
  const [timeRemainingOnPage, setTimeRemainingOnPage] = useState(READING_TIME_SECONDS);
  const [canSelectCheckbox, setCanSelectCheckbox] = useState(false);

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const timerRef = useRef(null);
  const operationsRef = useRef([]);
  const timerCompleteLoggedRef = useRef(false);
  const timeoutTimerRef = useRef(null); // 超时计时器
  const hasSubmittedRef = useRef(false); // 防止重复提交

  const appendOperation = useCallback((operation) => {
    const normalizedOperation = {
      time: formatTimestamp(new Date()),
      ...operation
    };
    logOperation(normalizedOperation);
    operationsRef.current = [...operationsRef.current, normalizedOperation];
  }, [logOperation]);

  const logTimerStart = useCallback(() => {
    appendOperation({
      eventType: EventTypes.TIMER_START,
      targetElement: 'countdown_timer',
      value: { duration: READING_TIME_SECONDS, unit: 'seconds' }
    });
  }, [appendOperation]);

  // 页面进入时记录 - 只执行一次
  useEffect(() => {
    if (pageLoadedRef.current) return;
    pageLoadedRef.current = true;
    operationsRef.current = [];
    setPageEnterTime(new Date());
    logTimerStart();
  }, [logTimerStart, setPageEnterTime]);

  // 超时自动提交处理（使用useCallback）
  const handleTimeoutSubmit = useCallback(async () => {
    if (hasSubmittedRef.current) {
      return; // 防止重复提交
    }
    hasSubmittedRef.current = true;

    console.log('[PrecautionsPage] 触发超时自动提交');

    const success = await submitOnTimeout({
      missingAnswerTargets: [
        {
          targetElement: '确认：已阅读并同意注意事项？',
          value: '超时未确认'
        }
      ],
      autoSubmitReason: '超时自动提交',
      autoSubmitMeta: {
        timeout: TIMEOUT_SECONDS,
        readingDuration: READING_TIME_SECONDS
      },
      pageExitReason: 'timeout_auto_submit',
      timeoutSeconds: TIMEOUT_SECONDS,
      placeholderValue: '超时未确认',
      markOverride: {
        operationList: operationsRef.current,
        answerList: [
          {
            targetElement: '确认：已阅读并同意注意事项？',
            value: '超时未确认'
          },
          {
            targetElement: 'reading_duration',
            value: String(READING_TIME_SECONDS)
          }
        ]
      }
    });

    if (success) {
      startTaskTimer();
      const nextPageId = getNextPageId(currentPageId);
      if (nextPageId) {
        await navigateToPage(nextPageId, { skipSubmit: true });
      } else {
        console.error(`[PrecautionsPage] 无法确定下一页，从 ${currentPageId} 跳转失败`);
      }
    }
  }, [currentPageId, navigateToPage, startTaskTimer, submitOnTimeout]);

  // 倒计时逻辑 - 使用ref避免重复设置定时器
  useEffect(() => {
    if (timeRemainingOnPage <= 0) {
      if (!timerCompleteLoggedRef.current) {
        timerCompleteLoggedRef.current = true;
        appendOperation({
          eventType: EventTypes.TIMER_COMPLETE,
          targetElement: 'countdown_timer',
          value: { duration: READING_TIME_SECONDS, unit: 'seconds' }
        });

        // 启动超时自动提交计时器
        timeoutTimerRef.current = setTimeout(() => {
          handleTimeoutSubmit();
        }, TIMEOUT_SECONDS * 1000);
      }
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
  }, [appendOperation, handleTimeoutSubmit, timeRemainingOnPage]);

  // 组件卸载时清理超时计时器
  useEffect(() => {
    return () => {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
    };
  }, []);

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

    appendOperation({
      eventType: checked ? EventTypes.CHECKBOX_CHECK : EventTypes.CHECKBOX_UNCHECK,
      targetElement: 'precautions_acknowledged',
      value: checked ? 'true' : 'false'
    });
  }, [appendOperation, canSelectCheckbox]);

  /**
   * 继续按钮点击前的准备
   */
  const handleBeforeContinue = useCallback(async () => {
    if (hasSubmittedRef.current) {
      return false; // 防止重复提交
    }
    hasSubmittedRef.current = true;

    // 取消超时计时器
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }

    appendOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'btn_continue',
      value: '开始任务'
    });

    const success = await submitPage({
      answers: [
        { targetElement: '确认：已阅读并同意注意事项？', value: 'A. 已阅读并同意' },
        { targetElement: 'reading_duration', value: String(READING_TIME_SECONDS) }
      ],
      operations: operationsRef.current
    });

    if (success) {
      startTaskTimer();
      const nextPageId = getNextPageId(currentPageId);
      if (nextPageId) {
        await navigateToPage(nextPageId, { skipSubmit: true });
      } else {
        console.error(`[PrecautionsPage] 无法确定下一页，从 ${currentPageId} 跳转失败`);
      }
    }

    return success;
  }, [appendOperation, currentPageId, navigateToPage, startTaskTimer, submitPage]);

  return (
    <div className="page-content page-fade-in" style={{ 
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      //minHeight: '85vh',
      boxSizing: 'border-box',
      padding: '0px 20px',
      height: '100%'
      //minWidth: '90%',
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
