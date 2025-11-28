import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import dialogueImg from '../assets/images/dialogue.png';
import { useAppContext } from '../context/AppContext';
import TextInput from '../components/common/TextInput';
import NavigationButton from '../components/common/NavigationButton';

/**
 * 蒸馒头 - 对话与提出问题页面
 * 展示对话情境，让用户提出科学问题
 */
const DialogueQuestionPage = () => {
  const { 
    navigateToPage, 
    setPageEnterTime 
  } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();
  
  const [question, setQuestion] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const pageLoadedRef = useRef(false);
  const operationsRef = useRef([]);
  const inputStateRef = useRef({ focused: false, lastValue: '' });

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
    inputStateRef.current = { focused: false, lastValue: '' };
    setPageEnterTime(new Date());
  }, [setPageEnterTime]);

  const isNextEnabled = useMemo(() => question.trim().length > 0, [question]);
  
  /**
   * 处理"下一页"按钮点击
   * 1. 收集输入的问题作为答案
   * 2. 提交页面数据
   * 3. 导航到下一页
   */
  const handleNextClick = useCallback(async () => {
    if (!isNextEnabled) {
      setAlertMessage('请先输入一个科学问题。');
      setShowAlert(true);
      recordOperation({
        eventType: EventTypes.CLICK_BLOCKED,
        targetElement: 'btn_next',
        value: { reason: '未填写科学问题', missing: ['scientific_question'] }
      });
      return false;
    }

    setShowAlert(false);
    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'btn_next',
      value: '提交科学问题'
    });

    const trimmedQuestion = question.trim();
    const submissionSuccess = await submitPage({
      answers: trimmedQuestion ? [{ targetElement: 'scientific_question', value: trimmedQuestion }] : [],
      operations: operationsRef.current,
    });
    if (submissionSuccess) {
      await navigateToPage('Page_04_Material_Reading_Factor_Selection', { skipSubmit: true });
      return true;
    }

    setAlertMessage('数据提交失败，请稍后再试。');
    setShowAlert(true);
    return false;
  }, [isNextEnabled, navigateToPage, question, recordOperation, submitPage]);

  const handleInputChange = useCallback((value) => {
    const prev = inputStateRef.current.lastValue || '';
    const nextValue = value;

    if (nextValue.length < prev.length) {
      recordOperation({
        eventType: EventTypes.INPUT_DELETE,
        targetElement: 'input_scientific_question',
        value: { action: 'delete', prevLength: prev.length, nextLength: nextValue.length }
      });
    }

    recordOperation({
      eventType: EventTypes.INPUT_CHANGE,
      targetElement: 'input_scientific_question',
      value: { prev, next: nextValue }
    });

    inputStateRef.current.lastValue = nextValue;
    setQuestion(nextValue);
  }, [recordOperation]);

  const handleInputFocus = useCallback(() => {
    if (inputStateRef.current.focused) return;
    recordOperation({
      eventType: EventTypes.INPUT_FOCUS,
      targetElement: 'input_scientific_question',
      value: '聚焦'
    });
    inputStateRef.current.focused = true;
  }, [recordOperation]);

  const handleInputBlur = useCallback(() => {
    recordOperation({
      eventType: EventTypes.INPUT_BLUR,
      targetElement: 'input_scientific_question',
      value: question
    });
    inputStateRef.current.focused = false;
    inputStateRef.current.lastValue = question;
  }, [question, recordOperation]);
  
  return (
    <div className="page-content page-fade-in">
      {showAlert && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#fdecea', color: '#a94442', padding: '10px 16px', borderRadius: '6px', border: '1px solid #f5c6cb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 1050 }}>
          {alertMessage}
        </div>
      )}
      <h1 className="page-title">蒸馒头</h1>
      
      <div className="dialogue-container">
        <div className="dialogue-image">
          {/* 这里可添加对话场景图片 */}
          <img 
            src={dialogueImg} 
            alt="小明与馒头的对话场景"
            className="dialogue-scene-image"
          />
        </div>
        
        <div className="dialogue-text">
          <p className="dialogue-bubble xiaoming-bubble">
            我按照食谱放了酵母、面粉、水和白糖，揉了面团后放在温暖处发酵。
            但过了一会儿，面团发得太大了，变得很松软，甚至有点塌了……
          </p>
          <p className="dialogue-bubble teacher-bubble">
            看来面团过度发酵了。你知道为什么会发生这种情况吗？
          </p>
        </div>
      </div>
      
        <div className="question-input-section">
          <h3 className="section-subtitle">请根据上面的情境，提出一个科学问题：</h3>
          <TextInput
            value={question}
            onFocus={handleInputFocus}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="例如：是什么因素导致面团过度发酵的？"
            isMultiline={true}
            elementDesc="科学问题输入框"
            rows={4}
            required={true}
        />
      </div>
      
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

export default DialogueQuestionPage; 
