/**
 * 问题识别页面 - 四年级火车购票测评
 * 实现PDF第4页的问题识别页面，包含对话界面和问题输入区域
 */

import { useEffect, useCallback, useState } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import LeftNavigation from '../components/LeftNavigation';
import ErrorBoundary from '../components/ErrorBoundary';
import './ProblemIdentificationPage.css';

const ProblemIdentificationPage = () => {
  const { 
    logOperation, 
    collectAnswer,
    setCurrentPage,
    setNavigationStep,
    setProblemStatement,
    problemStatement,
    submitCurrentPageData,
    formatTimestamp 
  } = useGrade4Context();
  
  const [inputValue, setInputValue] = useState(problemStatement || '');
  const [pageEnterTime, setPageEnterTime] = useState(null);

  // 实时验证输入内容
  const isInputValid = inputValue.trim().length > 0;

  // 页面进入时记录
  useEffect(() => {
    const enterTime = new Date();
    setPageEnterTime(enterTime);
    
    // 设置当前页面和导航状态
    setCurrentPage(3);
    setNavigationStep('2'); // 高亮"2 出行方案"
    
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入问题识别页面'
    });

    // 清理函数：页面退出时记录
    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: '离开问题识别页面'
      });
    };
  }, [logOperation, setCurrentPage, setNavigationStep]);

  // 处理输入变化
  const handleInputChange = useCallback((event) => {
    const value = event.target.value;
    setInputValue(value);
    setProblemStatement(value);
    
    // 记录输入操作
    logOperation({
      targetElement: '问题识别文本框',
      eventType: 'text_input',
      value: `用户输入：${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`
    });
  }, [logOperation, setProblemStatement]);

  // 下一页按钮点击
  const handleNextPageClick = useCallback(async () => {
    if (!isInputValid) return;

    logOperation({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: '点击提交问题识别答案并进入下一页'
    });

    // 收集最终答案
    collectAnswer({
      targetElement: '小明需要解决的问题',
      value: inputValue.trim()
    });

    try {
      // 提交当前页面数据
      await submitCurrentPageData();
      
      // 目前是最后一页，显示完成信息
      console.log('[ProblemIdentificationPage] 问题识别阶段完成');
      alert(`问题识别完成！您的回答是：${inputValue.trim()}\n下一阶段：火车购票任务即将开始`);
      
    } catch (error) {
      console.error('[ProblemIdentificationPage] 提交数据失败:', error);
      alert('数据提交失败，请重试');
    }
  }, [isInputValid, inputValue, logOperation, collectAnswer, submitCurrentPageData]);

  return (
    <ErrorBoundary>
      <div className="page-container">
        {/* 顶部导航栏 - 按照UI/UX规范 */}
        <div className="top-navigation">
          <span className="platform-name">新都区义务教育质量综合评价平台</span>
          <span className="user-info">当前用户</span>
        </div>

        {/* 主应用区 */}
        <div className="main-app-area">
          {/* 左侧导航栏 */}
          <LeftNavigation currentStep="2" />

          {/* 右侧内容区域 */}
          <div className="content-area">
            <div className="page-content">
              {/* 页面标题 */}
              <h1 className="page-title">问题识别</h1>

              {/* 对话区域 */}
              <div className="content-section">
                <div className="chat-header">
                  <div className="chat-title">假期安排讨论群</div>
                  <div className="chat-members">3人</div>
                </div>
                <div className="chat-content">
                  <img 
                    src="/src/assets/images/g4-p2-talk.png" 
                    alt="假期安排讨论群对话" 
                    className="chat-image"
                    onError={(e) => {
                      console.warn('对话图片加载失败:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>

              {/* 问题区域 */}
              <div className="content-section">
                <div className="question-prompt">
                  <h3 className="question-title">根据上面的对话，你认为小明需要解决什么问题？</h3>
                  <p className="question-instruction">
                    请仔细阅读对话内容，思考小明面临的具体问题，并在下方文本框中详细描述。
                  </p>
                </div>
                
                <div className="input-section">
                  <textarea
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="请在此处输入你的回答..."
                    className="problem-input"
                    rows={6}
                  />
                  
                  <div className="input-help">
                    <span className="char-count">
                      已输入 {inputValue.length} 个字符
                    </span>
                    {!isInputValid && (
                      <span className="input-warning">
                        请输入您的回答
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 导航区域 */}
              <div className="navigation-area">
                <button
                  type="button"
                  className={`next-button ${isInputValid ? 'enabled' : 'disabled'}`}
                  onClick={handleNextPageClick}
                  disabled={!isInputValid}
                  title={isInputValid ? '点击提交并进入下一页' : '请先输入您的回答'}
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProblemIdentificationPage;