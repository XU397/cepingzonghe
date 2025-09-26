/**
 * 情景介绍页面 - 四年级火车购票测评
 * 实现PDF第3页的情景介绍页面，显示指定图片和引言文本
 */

import { useEffect, useCallback, useState } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import LeftNavigation from '../components/LeftNavigation';
import ErrorBoundary from '../components/ErrorBoundary';
import './ScenarioIntroPage.css';

const ScenarioIntroPage = () => {
  const { 
    logOperation, 
    setCurrentPage,
    setNavigationStep,
    submitCurrentPageData,
    navigateToPage,
    formatTimestamp 
  } = useGrade4Context();
  
  const [pageEnterTime, setPageEnterTime] = useState(null);

  // 页面进入时记录
  useEffect(() => {
    const enterTime = new Date();
    setPageEnterTime(enterTime);
    
    // 设置当前页面和导航状态
    setCurrentPage(2);
    setNavigationStep('1'); // 高亮"1 出行方案"
    
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入情景介绍页面'
    });

    // 清理函数：页面退出时记录
    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: '离开情景介绍页面'
      });
    };
  }, [logOperation, setCurrentPage, setNavigationStep]);

  // 下一页按钮点击
  const handleNextPageClick = useCallback(async () => {
    logOperation({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: '点击进入问题识别页面'
    });

    try {
      // 提交当前页面数据
      await submitCurrentPageData();
      
      // 导航到问题识别页面
      console.log('[ScenarioIntroPage] 数据提交成功，准备跳转到问题识别页面');
      navigateToPage('problem-identification');
      
    } catch (error) {
      console.error('[ScenarioIntroPage] 提交数据失败:', error);
      alert('数据提交失败，请重试');
    }
  }, [logOperation, submitCurrentPageData, navigateToPage]);

  return (
    <ErrorBoundary>
      <div className="scenario-intro-page">
        {/* 顶部导航栏 */}
        <div className="top-navigation">
          <span className="platform-name">新都区义务教育质量综合评价平台</span>
          <span className="user-info">当前用户</span>
        </div>

        {/* 主应用区 */}
        <div className="main-app-area">
          {/* 左侧导航栏 */}
          <LeftNavigation currentStep="1" />

          {/* 右侧内容区域 */}
          <div className="content-area">
            <div className="page-container">
              {/* 页面标题 */}
              <div className="page-header">
                <h1 className="page-title">情景介绍</h1>
                <div className="page-subtitle">四年级火车购票测评</div>
              </div>

              {/* 页面内容 */}
              <div className="page-content">
                {/* 形象图片 */}
                <div className="content-section">
                  <div className="image-container">
                    <img 
                      src="/src/assets/images/g4-p1-xx.png" 
                      alt="情景介绍形象图" 
                      className="content-image"
                      onError={(e) => {
                        console.warn('图片加载失败:', e.target.src);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* 引言文本 */}
                <div className="content-section">
                  <div className="text-content">
                    <p>
                      暑假即将到来，小明一家计划去北京旅游。为了能够顺利出行，
                      他们需要提前制定详细的出行计划，包括选择合适的交通工具、
                      确定出发时间和购买车票等。
                    </p>
                    <p>
                      在这个测评中，你将帮助小明一家完成火车购票的相关任务，
                      学习如何分析问题、制定方案，并做出合理的决策。
                    </p>
                    <p>
                      请仔细阅读接下来的内容，认真思考每一个问题，
                      这将帮助你更好地理解日常生活中的实际问题解决过程。
                    </p>
                  </div>
                </div>
              </div>

              {/* 导航区域 */}
              <div className="navigation-area">
                <button
                  type="button"
                  className="next-button enabled"
                  onClick={handleNextPageClick}
                  title="点击进入下一页"
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

export default ScenarioIntroPage;