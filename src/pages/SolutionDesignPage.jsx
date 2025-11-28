import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import experimentImg from '../assets/images/experiment.png';
import { useAppContext } from '../context/AppContext';
import TextInput from '../components/common/TextInput';
import NavigationButton from '../components/common/NavigationButton';

/**
 * 蒸馒头:方案设计 - 测量方法构思页面
 * 让用户输入三种不同的测量面团体积的方法构思
 */
const SolutionDesignPage = () => {
  const { 
    navigateToPage, 
    currentPageId,
    setPageEnterTime
  } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();
  
  const [ideas, setIdeas] = useState({
    idea1: '',
    idea2: '',
    idea3: ''
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const operationsRef = useRef([]);
  const inputStatesRef = useRef({
    idea1: { focused: false, lastValue: '' },
    idea2: { focused: false, lastValue: '' },
    idea3: { focused: false, lastValue: '' },
  });
  const pageLoadedRef = useRef(false);

  const recordOperation = useCallback((operation) => {
    const normalizedOperation = { ...operation };
    logOperation(normalizedOperation);
    operationsRef.current = [...operationsRef.current, normalizedOperation];
  }, [logOperation]);
  
  // 页面进入记录
  useEffect(() => {
    if (pageLoadedRef.current) return;
    pageLoadedRef.current = true;
    operationsRef.current = [];
    inputStatesRef.current = {
      idea1: { focused: false, lastValue: '' },
      idea2: { focused: false, lastValue: '' },
      idea3: { focused: false, lastValue: '' },
    };
    setPageEnterTime(new Date());
  }, [setPageEnterTime]);
  
  const isNextEnabled = useMemo(
    () => Object.values(ideas).some(idea => idea.trim().length > 0),
    [ideas],
  );
  
  // 监听输入变化，更新状态并记录
  const handleIdeaChange = useCallback((key, value) => {
    const prevValue = inputStatesRef.current[key]?.lastValue || '';
    const nextValue = value;

    setIdeas(prev => ({
      ...prev,
      [key]: nextValue
    }));
    
    if (nextValue.length < prevValue.length) {
      recordOperation({
        eventType: EventTypes.INPUT_DELETE,
        targetElement: `input_${key}`,
        value: { action: 'delete', prevLength: prevValue.length, nextLength: nextValue.length }
      });
    }

    recordOperation({
      eventType: EventTypes.INPUT_CHANGE,
      targetElement: `input_${key}`,
      value: { prev: prevValue, next: nextValue }
    });

    inputStatesRef.current[key] = {
      ...(inputStatesRef.current[key] || { focused: false, lastValue: '' }),
      lastValue: nextValue
    };
  }, [recordOperation]);

  /**
   * 处理输入框失焦事件
   * @param {string} key - 想法键名
   * @param {string} value - 输入值
   */
  const handleInputBlur = useCallback((key, value) => {
    recordOperation({
      eventType: EventTypes.INPUT_BLUR,
      targetElement: `input_${key}`,
      value: value || ''
    });

    inputStatesRef.current[key] = {
      ...(inputStatesRef.current[key] || { focused: false, lastValue: '' }),
      focused: false,
      lastValue: value || ''
    };
  }, [recordOperation]);

  const handleInputFocus = useCallback((key) => {
    const currentState = inputStatesRef.current[key] || { focused: false, lastValue: '' };
    if (currentState.focused) return;

    recordOperation({
      eventType: EventTypes.INPUT_FOCUS,
      targetElement: `input_${key}`,
      value: '聚焦'
    });

    inputStatesRef.current[key] = {
      ...currentState,
      focused: true,
      lastValue: ideas[key] || ''
    };
  }, [ideas, recordOperation]);
  
  /**
   * 处理"下一页"按钮点击
   */
  const handleNextClick = useCallback(async () => {
    if (!isNextEnabled) {
      setAlertMessage('请至少输入一种测量方法构思。');
      setShowAlert(true);
      recordOperation({
        eventType: EventTypes.CLICK_BLOCKED,
        targetElement: 'btn_next',
        value: { reason: '未输入想法', missing: ['measurement_ideas'] }
      });
      return false;
    }

    setShowAlert(false);
    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'btn_next',
      value: '提交测量方法构思'
    });

    const answers = Object.entries(ideas).map(([key, value]) => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const index = parseInt(key.replace('idea', ''), 10);
      const targetElement = Number.isFinite(index) ? `measurement_idea_${index}` : `measurement_idea_${key}`;
      return { targetElement, value: trimmed };
    }).filter(Boolean);
    
    const submissionSuccess = await submitPage({
      answers,
      operations: operationsRef.current,
    });
    if (submissionSuccess) {
      navigateToPage('Page_12_Solution_Evaluation_Measurement_Critique', { skipSubmit: true });
      return true;
    }

    setAlertMessage('数据提交失败，请稍后再试。');
    setShowAlert(true);
    return false;
  }, [ideas, isNextEnabled, navigateToPage, recordOperation, submitPage]);
  
  return (
    <div className="page-content page-fade-in">
      {showAlert && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#fdecea', color: '#a94442', padding: '10px 16px', borderRadius: '6px', border: '1px solid #f5c6cb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 1050 }}>
          {alertMessage}
        </div>
      )}
      <h1 className="page-title">蒸馒头:方案设计</h1>
      
      <div className="solution-design-container">
        <div className="experiment-image">
          {/* 实验场景图片 */}
          <img 
            src={experimentImg} 
            alt="科学实验场景"
            className="experiment-scene-image"
          />
        </div>
        
        <div className="instruction-section">
          <p className="instruction-text">
            小明想测量面团在不同条件下发酵前、后的体积变化，以探究温度和时间对面团发酵的影响。
            请帮助小明设计一些方法，用来测量面团的体积。
          </p>
          <p className="instruction-highlight">
            请在下方输入框中写下你的测量方法构思（至少提出一种想法）
          </p>
        </div>
        
        <div className="ideas-input-section">
          <div className="idea-input-container">
            <h3 className="section-subtitle">想法一:</h3>
            <TextInput
              value={ideas.idea1}
              onFocus={() => handleInputFocus('idea1')}
              onChange={(value) => handleIdeaChange('idea1', value)}
              onBlur={() => handleInputBlur('idea1', ideas.idea1)}
              placeholder="请描述你的测量方法构思..."
              isMultiline={true}
              elementDesc="测量方法构思输入框1"
              rows={3}
            />
          </div>
          
          <div className="idea-input-container">
            <h3 className="section-subtitle">想法二:</h3>
            <TextInput
              value={ideas.idea2}
              onFocus={() => handleInputFocus('idea2')}
              onChange={(value) => handleIdeaChange('idea2', value)}
              onBlur={() => handleInputBlur('idea2', ideas.idea2)}
              placeholder="请描述你的测量方法构思..."
              isMultiline={true}
              elementDesc="测量方法构思输入框2"
              rows={3}
            />
          </div>
          
          <div className="idea-input-container">
            <h3 className="section-subtitle">想法三:</h3>
            <TextInput
              value={ideas.idea3}
              onFocus={() => handleInputFocus('idea3')}
              onChange={(value) => handleIdeaChange('idea3', value)}
              onBlur={() => handleInputBlur('idea3', ideas.idea3)}
              placeholder="请描述你的测量方法构思..."
              isMultiline={true}
              elementDesc="测量方法构思输入框3"
              rows={3}
            />
          </div>
        </div>
      </div>
      
      {!isNextEnabled && (
        <p className="validation-tip">请至少输入一种测量方法构思</p>
      )}
      
      <div className="navigation-container">
        <NavigationButton 
          onClick={handleNextClick} 
          disabled={!isNextEnabled}
          className="primary-button"
        >
          下一页
        </NavigationButton>
      </div>
    </div>
  );
};

export default SolutionDesignPage; 
