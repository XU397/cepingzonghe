import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useAppContext } from '../context/AppContext';
import NavigationButton from '../components/common/NavigationButton';
// 直接使用静态导入
import P1Image from '../assets/images/P1.jpg';

/**
 * 蒸馒头任务引入页面组件
 * 显示蒸馒头任务的引言和背景图片
 */
const IntroductionPage = () => {
  const { 
    navigateToPage, 
    currentPageId,
    setPageEnterTime 
  } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();
  
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  
  // 使用ref防止重复执行
  const pageLoadedRef = useRef(false);
  const operationsRef = useRef([]);

  const recordOperation = useCallback((operation) => {
    const normalizedOperation = { ...operation };
    logOperation(normalizedOperation);
    operationsRef.current = [...operationsRef.current, normalizedOperation];
  }, [logOperation]);
  
  // 页面进入记录 - 借助 ref 确保只执行一次
  useEffect(() => {
    if (!pageLoadedRef.current) {
      pageLoadedRef.current = true;
      operationsRef.current = [];
      setPageEnterTime(new Date());
    }
  }, [setPageEnterTime]);
  
  // 确保图片加载完成
  useEffect(() => {
    const img = new Image();
    img.src = P1Image;
    img.onload = () => {
      setBackgroundLoaded(true);
    };
    img.onerror = (e) => {
      console.error('背景图片加载失败:', e);
    };
  }, []);
  
  /**
   * 处理下一页按钮点击
   */
  const handleNextPage = useCallback(async () => {
    recordOperation({
      eventType: EventTypes.CLICK,
      targetElement: 'btn_next',
      value: '继续'
    });
    
    const submissionSuccess = await submitPage({
      answers: [],
      operations: operationsRef.current,
    });

    if (submissionSuccess) {
      // 数据已经提交，跳转时跳过重复提交
      navigateToPage('Page_03_Dialogue_Question', { skipSubmit: true }); 
    } else {
      console.error('IntroductionPage: 提交页面数据失败');
      alert('数据提交失败，请稍后再试。');
      return false;
    }
    
    return submissionSuccess;
  }, [navigateToPage, recordOperation, submitPage]);

  // 定义背景样式
  const backgroundStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `url(${P1Image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    opacity: backgroundLoaded ? 1 : 0,
    transition: 'opacity 0.5s ease-in',
    zIndex: 0,
  };

  return (
    <div className="page-content page-fade-in" style={{ position: 'relative', overflow: 'hidden', height: '100%',width: '100%' }}>
      {/* 背景图片 */}
      <div style={backgroundStyle} />
      
      {/* 内容容器 */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px',
      }}>
        {/* 标题和内容区域 */}
        <div style={{
          width: '100%',
          maxWidth: '800px',
          marginTop: '0px',
        }}>
          <h1 className="page-title" style={{
            fontSize: '36px',
            color: '#2d5b8e',
            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.7)',
            marginBottom: '10px',
            textAlign: 'center',
          }}>蒸馒头</h1>
          
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            padding: '80px 50px',
            borderRadius: '15px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(5px)',
            marginBottom: '40px',
          }}>
            <p style={{ 
              fontSize: '24px', 
              lineHeight: '1.8', 
              color: '#333',
              textAlign: 'justify',
              textIndent: '2em',
            }}>
              馒头是我国传统的主食之一，其松软的质地和淡淡的香味让人难以抗拒。周末时，热爱烹饪的小明第一次尝试在家蒸馒头，却遇到了一些小问题，请你和他一起探索解决吧！
            </p>
          </div>
        </div>
        
        {/* 按钮区域 */}
        <div style={{ 
          marginTop: 'auto', 
          marginBottom: '30px',
        }}>
          <NavigationButton 
            currentPageId={currentPageId}
            onClick={handleNextPage}
            buttonText="继续"
          />
        </div>
      </div>
    </div>
  );
};

export default IntroductionPage; 
