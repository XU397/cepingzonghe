/**
 * @file RouteAnalysisPage.jsx
 * @description 交互式地图与路线计算页面 - 四年级模块第5页
 * 用户可以点击路线按钮查看地图详情，并输入路线1和路线5的计算结果
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import LeftNavigation from '../components/LeftNavigation';
import InteractiveMap from '../components/containers/InteractiveMap';
import RouteCalculator from '../components/ui/RouteCalculator';
import './RouteAnalysisPage.css';

/**
 * 路线分析页面组件
 * @returns {JSX.Element} 路线分析页面
 */
const RouteAnalysisPage = () => {
  const { 
    logOperation, 
    collectAnswer, 
    routeCalculations, 
    setRouteCalculations,
    navigateToPage,
    submitCurrentPageData,
    formatTimestamp,
    setCurrentPage,
    setNavigationStep
  } = useGrade4Context();
  
  // 本地状态
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [route1Distance, setRoute1Distance] = useState(routeCalculations.route1_km?.toString() || '');
  const [route5Distance, setRoute5Distance] = useState(routeCalculations.route5_km?.toString() || '');
  const [pageEnterTime, setPageEnterTime] = useState(null);
  
  // 页面进入记录（必需）
  useEffect(() => {
    const enterTime = new Date();
    setPageEnterTime(enterTime);
    setCurrentPage(5); // 设置当前页面为第5页
    setNavigationStep('4'); // 高亮导航第4项："4 火车购票:出发站"
    
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入交互式地图与路线计算页面'
    });
  }, [logOperation, setCurrentPage, setNavigationStep]);
  
  // 数字输入验证
  const isValidInput = useCallback((value) => {
    if (!value || value.trim() === '') return false;
    const numericRegex = /^\d+(\.\d+)?$/;
    const num = parseFloat(value);
    return numericRegex.test(value.trim()) && !isNaN(num) && num > 0;
  }, []);
  
  // 表单验证状态
  const isFormValid = useMemo(() => {
    return isValidInput(route1Distance) && isValidInput(route5Distance);
  }, [route1Distance, route5Distance, isValidInput]);
  
  // 处理路线按钮点击
  const handleRouteButtonClick = useCallback((routeId) => {
    setSelectedRoute(routeId);
    
    // 记录路线切换操作
    logOperation({
      targetElement: `路线${routeId}按钮`,
      eventType: 'button_click',
      value: `切换到路线${routeId}详情图`,
      elementId: `route_button_${routeId}`
    });
  }, [logOperation]);
  
  // 处理距离输入变更
  const handleDistanceInput = useCallback((routeId, value) => {
    if (routeId === 1) {
      setRoute1Distance(value);
      
      // 更新Context状态
      const numValue = value ? parseFloat(value) : null;
      setRouteCalculations({
        route1_km: !isNaN(numValue) ? numValue : null
      });
      
      // 收集答案（如果是有效数值）
      if (isValidInput(value)) {
        collectAnswer({
          targetElement: "路线1总距离",
          value: numValue
        });
      }
    } else if (routeId === 5) {
      setRoute5Distance(value);
      
      // 更新Context状态
      const numValue = value ? parseFloat(value) : null;
      setRouteCalculations({
        route5_km: !isNaN(numValue) ? numValue : null
      });
      
      // 收集答案（如果是有效数值）
      if (isValidInput(value)) {
        collectAnswer({
          targetElement: "路线5总距离",
          value: numValue
        });
      }
    }
    
    // 记录输入操作
    logOperation({
      targetElement: `路线${routeId}距离输入框`,
      eventType: 'input_change',
      value: `输入距离：${value}`,
      elementId: `route_${routeId}_distance_input`
    });
  }, [setRouteCalculations, collectAnswer, logOperation, isValidInput]);
  
  // 处理表单提交和页面导航
  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      console.warn('[RouteAnalysisPage] 表单验证失败，无法提交');
      return;
    }
    
    try {
      // 记录提交操作
      logOperation({
        targetElement: '下一页按钮',
        eventType: 'button_click',
        value: '点击下一页，提交路线计算结果'
      });
      
      // 提交页面数据
      await submitCurrentPageData();
      
      console.log('[RouteAnalysisPage] 路线计算数据提交成功');
      
      // 导航到下一页（这里暂时只是日志，实际导航逻辑需要根据业务需求确定）
      console.log('[RouteAnalysisPage] 准备导航到下一页');
      
    } catch (error) {
      console.error('[RouteAnalysisPage] 页面数据提交失败:', error);
      alert('数据提交失败，请重试');
    }
  }, [isFormValid, logOperation, submitCurrentPageData]);
  
  return (
    <div className="page-container">
      {/* 顶部导航栏 */}
      <div className="top-navigation">
        <span className="platform-name">新都区义务教育质量综合评价平台</span>
        <span className="user-info">当前用户</span>
      </div>

      {/* 主应用区 */}
      <div className="main-app-area">
        {/* 左侧导航栏 - 高亮"4 火车购票:出发站" */}
        <LeftNavigation currentStep="4" />
        
        {/* 右侧内容区域 */}
        <div className="content-area">
          <div className="page-content">
            {/* 页面标题 */}
            <h1 className="page-title">出发站选择</h1>
            
            {/* 页面描述 */}
            <div className="content-section">
              <p className="page-description">
                买火车票首先要考虑出发站。小明家附近有2个火车站：南充站和南充北站。
                小明家到这2个火车站共有5条路线。请依次点击左下图【路线】按钮，查看这5条路线，
                计算【路线1】和【路线5】的路程，并将结果填在右侧表格相应的空格内。
              </p>
            </div>
            
            {/* 路线分析内容 */}
            <div className="content-section">
              <div className="route-analysis-container">
                {/* 左侧路线按钮区 */}
                <div className="route-buttons">
                  {[1, 2, 3, 4, 5].map(routeId => (
                    <button
                      key={routeId}
                      className={`route-button route${routeId} ${selectedRoute === routeId ? 'active' : ''}`}
                      onClick={() => handleRouteButtonClick(routeId)}
                      id={`route_button_${routeId}`}
                    >
                      路线{routeId}
                    </button>
                  ))}
                </div>
                
                {/* 中央地图区域 */}
                <InteractiveMap 
                  selectedRoute={selectedRoute}
                  onRouteChange={setSelectedRoute}
                />
                
                {/* 右侧路程表格 */}
                <RouteCalculator
                  route1Distance={route1Distance}
                  route5Distance={route5Distance}
                  onRoute1Change={(value) => handleDistanceInput(1, value)}
                  onRoute5Change={(value) => handleDistanceInput(5, value)}
                  isValidInput={isValidInput}
                />
              </div>
            </div>
            
            {/* 导航区域 */}
            <div className="navigation-area">
              <button 
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`next-button ${isFormValid ? 'enabled' : 'disabled'}`}
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteAnalysisPage;