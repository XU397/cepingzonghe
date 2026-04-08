import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import { useAppContext } from '../context/AppContext';
import NavigationButton from '../components/common/NavigationButton';
import TextInput from '../components/common/TextInput';
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
 * @file Page_03_Dialogue_Question.jsx
 * @description P3: 蒸馒头 - 对话与提出问题页面。
 * 用户阅读一段对话，然后根据对话内容提出一个科学问题。
 */

// 内部内容组件 - 必须在 AssessmentPageFrame 内部使用
const PageContent = () => {
  const {
    navigateToPage,
    currentPageId,
    setPageEnterTime
  } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();
  
  const [scientificQuestion, setScientificQuestion] = useState('');

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const operationsRef = useRef([]);
  const inputStateRef = useRef({ focused: false, lastValue: '' });
  const recordOperation = useCallback((operation) => {
    // 规范 7.4：operation.time 必须在操作发生时记录
    const normalizedOperation = {
      ...operation,
      time: formatTimestamp(new Date()),
    };
    logOperation(normalizedOperation);
    operationsRef.current = [...operationsRef.current, normalizedOperation];
  }, [logOperation]);

  // 页面进入时记录 - 只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      operationsRef.current = [];
      inputStateRef.current = { focused: false, lastValue: '' };
      setPageEnterTime(new Date());
    }
  }, [setPageEnterTime]);

  // 缓存是否禁用下一页按钮的计算
  const isDisabled = useMemo(() => {
    return scientificQuestion.trim() === '';
  }, [scientificQuestion]);

  /**
   * 处理文本输入框内容变化
   */
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
    setScientificQuestion(nextValue);
  }, [recordOperation]);

  /**
   * 处理输入框聚焦事件
   */
  const handleInputFocus = useCallback(() => {
    if (!inputStateRef.current.focused) {
      recordOperation({
        eventType: EventTypes.INPUT_FOCUS,
        targetElement: '科学问题输入框',
        value: '聚焦'
      });
      inputStateRef.current.focused = true;
    }
  }, [recordOperation]);

  /**
   * 处理输入框失焦事件
   */
  const handleInputBlur = useCallback(() => {
    recordOperation({
      eventType: EventTypes.INPUT_BLUR,
      targetElement: '科学问题输入框',
      value: scientificQuestion
    });
    inputStateRef.current.focused = false;
    inputStateRef.current.lastValue = scientificQuestion;
  }, [recordOperation, scientificQuestion]);

  /**
   * 处理对话框聚焦（鼠标进入）
   */
  const handleDialogueFocus = useCallback(() => {
    recordOperation({
      eventType: EventTypes.INPUT_FOCUS,
      targetElement: '对话容器',
      value: '对话框聚焦'
    });
  }, [recordOperation]);

  /**
   * 处理对话框失焦（鼠标离开）
   */
  const handleDialogueBlur = useCallback(() => {
    recordOperation({
      eventType: EventTypes.INPUT_BLUR,
      targetElement: '对话容器',
      value: '对话框失焦'
    });
  }, [recordOperation]);

  /**
   * 处理对话消息点击
   */
  const handleMessageClick = useCallback((message, index, roleName) => {
    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: `对话消息_${index}`,
      value: {
        role: roleName,
        messageIndex: index,
        messageText: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '')
      }
    });
  }, [recordOperation]);

  /**
   * 处理对话消息聚焦（鼠标进入）
   */
  const handleMessageFocus = useCallback((message, index, roleName) => {
    recordOperation({
      eventType: EventTypes.INPUT_FOCUS,
      targetElement: `对话消息_${index}`,
      value: `focus|role=${roleName}|idx=${index}|text=${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`
    });
  }, [recordOperation]);

  /**
   * 处理对话消息失焦（鼠标离开）
   */
  const handleMessageBlur = useCallback((message, index, roleName) => {
    recordOperation({
      eventType: EventTypes.INPUT_BLUR,
      targetElement: `对话消息_${index}`,
      value: `blur|role=${roleName}|idx=${index}|text=${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`
    });
  }, [recordOperation]);

  /**
   * 处理点击下一页按钮的逻辑
   */
  const handleNextPage = useCallback(async () => {
    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'next_button',
      value: '提交科学问题'
    });

    const trimmedQuestion = scientificQuestion.trim();
    const submissionSuccess = await submitPage({
      answers: trimmedQuestion ? [{ targetElement: '科学问题', value: trimmedQuestion }] : [],
      operations: operationsRef.current,
    });

    if (submissionSuccess) {
      navigateToPage('Page_04_Material_Reading_Factor_Selection', { skipSubmit: true });
      return true;
    } else {
      alert('数据提交失败，请稍后再试。');
      return false;
    }
  }, [navigateToPage, recordOperation, scientificQuestion, submitPage]);

  return (
    <div className="page-container page-fade-in" style={{
      position: 'relative',
      height: '100%',
      width: '100%',
      padding: '10px',
      overflow: 'hidden',
      backgroundColor: '#fff7ed',
      backgroundImage: 'radial-gradient(#ffedd5 15%, transparent 16%), radial-gradient(#ffedd5 15%, transparent 16%)',
      backgroundSize: '60px 60px',
      backgroundPosition: '0 0, 30px 30px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* 主要内容容器 - 左右布局 */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        minHeight: 0, /* 关键：允许flex子元素收缩 */
        width: '100%',
        maxWidth: '1400px',
        display: 'flex',
        flexDirection: 'row',
        padding: '20px',
        boxSizing: 'border-box',
        gap: '20px'
      }}>
        {/* 左侧对话区域 - 固定高度720px */}
        <div style={{
          width: '45%',
          minWidth: '400px',
          height: '680px',
          maxHeight: '680px',
          flexShrink: 0,
          overflow: 'hidden'
        }}>
          <DialogueChat
            messages={dialogueMessages}
            title="幸福一家人"
            autoPlay={true}
            initialDelay={800}
            onContainerFocus={handleDialogueFocus}
            onContainerBlur={handleDialogueBlur}
            onMessageClick={handleMessageClick}
            onMessageFocus={handleMessageFocus}
            onMessageBlur={handleMessageBlur}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '30px'
            }}
          />
        </div>

        {/* 右侧内容区域 */}
        <div style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: '400px'
        }}>
          {/* 问题和输入区域 - 位于右侧底部 */}
          <div style={{
            width: '100%',
            padding: '30px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(251, 146, 60, 0.25)',
            border: '3px solid rgba(251, 146, 60, 0.3)',
            flexShrink: 0
          }}>
            {/* 标题：蒸馒头 */}
            <div style={{
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '1.8em',
                fontWeight: 'bold',
                color: '#fb923c',
                margin: 0,
                textShadow: '2px 2px 4px rgba(251, 146, 60, 0.2)',
                letterSpacing: '2px'
              }}>
                蒸馒头
              </h2>
            </div>

            {/* 问题文本 */}
            <div className="question-section" style={{
              marginBottom: '20px'
            }}>
              <p style={{
                fontSize: '1.1em',
                fontWeight: '600',
                color: '#374151',
                margin: 0,
                lineHeight: '1.6',
                padding: '12px',
                backgroundColor: 'rgba(255, 237, 213, 0.5)',
                borderRadius: '10px',
                borderLeft: '4px solid #fb923c'
              }}>
                根据左侧对话，请写出接下来小明要探究的科学问题？
              </p>
            </div>

            {/* 文本输入框 */}
            <div style={{ marginBottom: '24px' }}>
              <TextInput
                value={scientificQuestion}
                onChange={handleInputChange}
                placeholder="请在此处输入你的回答..."
                isMultiline={true}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                elementDesc="科学问题输入框"
                rows={4}
                maxLength={200}
                style={{
                  width: '100%',
                  borderRadius: '12px',
                  fontSize: '16px',
                  backgroundColor: 'rgba(255, 251, 235, 1)',
                  boxShadow: 'inset 0 2px 6px rgba(251, 146, 60, 0.15), 0 2px 8px rgba(251, 146, 60, 0.2)',
                  border: '2px solid rgba(251, 146, 60, 0.4)',
                  resize: 'none',
                  minHeight: '100px',
                  padding: '14px',
                  lineHeight: '1.6',
                  transition: 'all 0.3s ease'
                }}
              />
            </div>
            
            {/* 导航按钮 */}
            <div style={{ width: '100%', textAlign: 'center' }}>
              <NavigationButton
                currentPageId={currentPageId}
                onClick={handleNextPage}
                buttonText="下一页"
                disabled={isDisabled}
                style={{
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 主组件 - 直接渲染内容，Frame由上层Grade7Wrapper提供
const Page_03_Dialogue_Question = () => {
  return <PageContent />;
};

export default Page_03_Dialogue_Question; 
