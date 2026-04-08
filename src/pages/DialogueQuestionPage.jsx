import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import { useAppContext } from '../context/AppContext';
import TextInput from '../components/common/TextInput';
import NavigationButton from '../components/common/NavigationButton';
import DialogueChat from '../components/DialogueChat';

// 对话消息数据
const dialogueMessages = [
  { role: 'xiaoming', text: '爸爸妈妈，我发现我蒸的馒头和你们做的不一样，不香又有点软，不够有嚼劲。' },
  { role: 'dad', text: '我尝尝。味道确实不太对，咬下去有点粘牙。' },
  { role: 'xiaoming', text: '怎么会这样呢？' },
  { role: 'mom', text: '第一次做已经很棒了！可能是面团过度发酵了。你掰开馒头，里面是不是有很多大孔？' },
  { role: 'xiaoming', text: '是呀，妈妈。什么是过度发酵呢？' },
  { role: 'mom', text: '过度发酵就是面团膨胀的很大，没有弹性了，外观也不好看。' },
  { role: 'xiaoming', text: '原来是这样！我做的时候面团确实膨胀得很大。' },
  { role: 'mom', text: '所以蒸馒头前，控制好面的发酵程度很关键，不过发酵过度也很常见。' },
  { role: 'xiaoming', text: '那面团为什么会发酵过度呢？' },
  { role: 'mom', text: '这可不好说，我都是凭经验，你可以去查查。' }
];

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
    const normalizedOperation = {
      ...operation,
      time: formatTimestamp(new Date()),
    };
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
        targetElement: 'next_button',
        value: { reason: '未填写科学问题', missing: ['科学问题'] }
      });
      return false;
    }

    setShowAlert(false);
    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'next_button',
      value: '提交科学问题'
    });

    const trimmedQuestion = question.trim();
    const submissionSuccess = await submitPage({
      answers: trimmedQuestion ? [{ targetElement: '科学问题', value: trimmedQuestion }] : [],
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
        targetElement: '科学问题输入框',
        value: { action: 'delete', prevLength: prev.length, nextLength: nextValue.length }
      });
    }

    recordOperation({
      eventType: EventTypes.INPUT_CHANGE,
      targetElement: '科学问题输入框',
      value: { prev, next: nextValue }
    });

    inputStateRef.current.lastValue = nextValue;
    setQuestion(nextValue);
  }, [recordOperation]);

  const handleInputFocus = useCallback(() => {
    if (inputStateRef.current.focused) return;
    recordOperation({
      eventType: EventTypes.INPUT_FOCUS,
      targetElement: '科学问题输入框',
      value: '聚焦'
    });
    inputStateRef.current.focused = true;
  }, [recordOperation]);

  const handleInputBlur = useCallback(() => {
    recordOperation({
      eventType: EventTypes.INPUT_BLUR,
      targetElement: '科学问题输入框',
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
      
      <div className="dialogue-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <DialogueChat
          messages={dialogueMessages}
          title="蒸馒头心得讨论"
          autoPlay={true}
          initialDelay={800}
        />
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
