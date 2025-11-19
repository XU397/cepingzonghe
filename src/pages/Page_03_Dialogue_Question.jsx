import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import NavigationButton from '../components/common/NavigationButton';
import TextInput from '../components/common/TextInput';
import { useDataLogging } from '../hooks/useDataLogging';
import EventTypes from '../shared/services/submission/eventTypes';
import backgroundImage from '../assets/images/P2.png'; // 导入背景图片 P2.png
import dialogueImage from '../assets/images/P2-1.png'; // 导入对话场景图片

/**
 * @file Page_03_Dialogue_Question.jsx
 * @description P3: 蒸馒头 - 对话与提出问题页面。
 * 用户阅读一段对话，然后根据对话内容提出一个科学问题。
 */
const Page_03_Dialogue_Question = () => {
  const { 
    submitPageData, 
    navigateToPage, 
    currentPageId,
    setPageEnterTime 
  } = useAppContext();
  
  const [scientificQuestion, setScientificQuestion] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [dialogImageLoaded, setDialogImageLoaded] = useState(false);

  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const prevAnswerRef = useRef('');

  // 数据记录Hook
  const {
    logInput,
    logInputBlur,
    logButtonClick,
    logPageEnter,
    logOperation,
    collectAnswer
  } = useDataLogging('Page_03_Dialogue_Question');

  // 页面进入时记录 - 只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      setPageEnterTime(new Date());
      logPageEnter('对话与提出问题页面');
    }
  }, []);

  // 确保图片加载完成
  useEffect(() => {
    const bgImg = new Image();
    bgImg.src = backgroundImage;
    bgImg.onload = () => {
      setBackgroundLoaded(true);
    };
    
    const dlgImg = new Image();
    dlgImg.src = dialogueImage;
    dlgImg.onload = () => {
      setDialogImageLoaded(true);
    };
  }, []);

  // 缓存是否禁用下一页按钮的计算
  const isDisabled = useMemo(() => {
    return scientificQuestion.trim() === '';
  }, [scientificQuestion]);

  /**
   * 处理文本输入框内容变化
   */
  const handleInputChange = useCallback((value) => {
    setScientificQuestion(value);
    logInput('科学问题输入框', value);
  }, [logInput]);

  /**
   * 处理输入框聚焦事件
   */
  const handleInputFocus = useCallback(() => {
    if (!isInputFocused) {
      setIsInputFocused(true); 
    }
    logOperation({
      targetElement: '科学问题输入框',
      eventType: EventTypes.FOCUS,
    });
  }, [isInputFocused, logOperation]);

  /**
   * 处理输入框失焦事件
   */
  const handleInputBlur = useCallback(() => {
    // 使用缓存机制避免重复提交相同答案
    const currentAnswer = scientificQuestion.trim();
    if (currentAnswer !== prevAnswerRef.current) {
      prevAnswerRef.current = currentAnswer;
      logInputBlur('科学问题输入框', scientificQuestion, '用户提出的科学问题');
    }
  }, [scientificQuestion, logInputBlur]);

  /**
   * 处理点击下一页按钮的逻辑
   */
  const handleNextPage = useCallback(async () => {
    logButtonClick('下一页', '提交科学问题');

    // 确保收集最新的答案
    collectAnswer({
      targetElement: '最终科学问题',
      value: scientificQuestion.trim(),
    });

    const submissionSuccess = await submitPageData();

    if (submissionSuccess) {
      navigateToPage('Page_04_Material_Reading_Factor_Selection', { skipSubmit: true });
      return true;
    } else {
      alert('数据提交失败，请稍后再试。');
      return false;
    }
  }, [logButtonClick, collectAnswer, scientificQuestion, submitPageData, navigateToPage]);

  return (
    <div className="page-container page-fade-in" style={{ 
      position: 'relative', 
      height: '100%',
      width: '100%',
      padding: '10px',
      overflow: 'hidden',
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {/* 主要内容容器 - 左右布局 */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        width: '100%',
        maxWidth: '1400px',
        display: 'flex',
        flexDirection: 'row',
        padding: '20px',
        boxSizing: 'border-box',
        gap: '20px'
      }}>
        {/* 左侧对话图片区域 - 占据全高度 */}
        <div style={{ 
          width: '50%',
          minWidth: '400px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* 标题栏 */}
          <div style={{
            backgroundColor: '#5A9BD4',
            color: 'white',
            padding: '8px 8px',
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '15px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '0',
            flexShrink: 0
          }}>
            幸福一家人
          </div>
          
          {/* 图片容器 */}
          <div style={{
            flex: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderBottomLeftRadius: '15px',
            borderBottomRightRadius: '15px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
            border: '3px solid rgba(255, 255, 255, 0.8)',
            borderTop: 'none'
          }}>
            <img 
              src={dialogueImage} 
              alt="对话场景" 
              style={{ 
                width: '80%',
                height: '80%',
                maxHeight: 'calc(100vh - 120px)',
                objectFit: 'contain',
                opacity: dialogImageLoaded ? 1 : 0,
                transition: 'opacity 0.5s ease-in',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px'
              }} 
            />
          </div>
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
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            border: '2px solid rgba(45, 91, 142, 0.2)',
            flexShrink: 0
          }}>
            {/* 问题文本 */}
            <div className="question-section" style={{ 
              marginBottom: '15px'
            }}>
              <p style={{ 
                fontSize: '1.1em', 
                fontWeight: 'bold',
                color: '#333',
                margin: 0,
                lineHeight: '1.4'
              }}>
                根据左侧对话，请写出接下来小明要探究的科学问题？
              </p>
            </div>

            {/* 文本输入框 */}
            <div style={{ marginBottom: '20px' }}>
              <TextInput
                value={scientificQuestion}
                onChange={handleInputChange}
                placeholder="请在此处输入你的回答。"
                isMultiline={true}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                elementDesc="科学问题输入框"
                rows={3}
                maxLength={200}
                style={{ 
                  width: '100%',
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(45, 91, 142, 0.3)',
                  border: '2px solid rgba(45, 91, 142, 0.4)',
                  resize: 'none',
                  minHeight: '80px',
                  padding: '12px'
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

export default Page_03_Dialogue_Question; 
