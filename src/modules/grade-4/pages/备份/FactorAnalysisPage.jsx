/**
 * 因素分析页面 - 四年级火车购票测评
 * 实现PDF第5页的因素分析页面，包含多选因素列表和自定义复选框
 */

import { useEffect, useCallback, useState } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import LeftNavigation from '../components/LeftNavigation';
import ErrorBoundary from '../components/ErrorBoundary';
import CustomCheckbox from '../components/ui/CustomCheckbox';
import './FactorAnalysisPage.css';

// 六个因素选项的定义 - 根据PDF图片g4-p3-ck.png中的选项
const FACTOR_OPTIONS = [
  { id: 1, name: '小明家到出发站的路程' },
  { id: 2, name: '火车车厢数' },
  { id: 3, name: '成都东站到舅舅家的路程' },
  { id: 4, name: '火车到达时间' },
  { id: 5, name: '剩余车票数' },
  { id: 6, name: '火车发展历史' }
];

const FactorAnalysisPage = () => {
  const { 
    logOperation, 
    collectAnswer,
    setCurrentPage,
    setNavigationStep,
    relevantFactors,
    setRelevantFactors,
    submitCurrentPageData
  } = useGrade4Context();
  
  const [selectedFactors, setSelectedFactors] = useState(relevantFactors || []);

  // 实时验证选择状态
  const isSelectionValid = selectedFactors.length > 0;

  // 获取因素名称的工具函数
  const getFactorName = useCallback((factorId) => {
    const factor = FACTOR_OPTIONS.find(f => f.id === factorId);
    return factor ? factor.name : `因素${factorId}`;
  }, []);

  // 页面进入时记录
  useEffect(() => {
    // 设置当前页面和导航状态
    setCurrentPage(4); // 因素分析为第4页
    setNavigationStep('3'); // 高亮"3 火车购票"
    
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入因素分析页面'
    });

    // 清理函数：页面退出时记录
    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: '离开因素分析页面'
      });
    };
  }, [logOperation, setCurrentPage, setNavigationStep]);

  // 处理因素选择切换
  const handleFactorToggle = useCallback((factorId) => {
    const isCurrentlySelected = selectedFactors.includes(factorId);
    const newSelectedFactors = isCurrentlySelected
      ? selectedFactors.filter(id => id !== factorId)
      : [...selectedFactors, factorId];
    
    setSelectedFactors(newSelectedFactors);
    setRelevantFactors(newSelectedFactors);
    
    // 记录操作
    logOperation({
      targetElement: `因素选项_${factorId}`,
      eventType: isCurrentlySelected ? 'checkbox_uncheck' : 'checkbox_check',
      value: `${isCurrentlySelected ? '取消选择' : '选择'}因素：${getFactorName(factorId)}`,
      elementId: `factor_checkbox_${factorId}`
    });
    
    // 收集当前选择状态答案
    collectAnswer({
      targetElement: "当前选择的因素",
      value: newSelectedFactors
    });
  }, [selectedFactors, setRelevantFactors, logOperation, collectAnswer, getFactorName]);

  // 下一页按钮点击
  const handleNextPageClick = useCallback(async () => {
    if (!isSelectionValid) return;

    logOperation({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: `点击提交因素分析答案并进入下一页，选择的因素：${selectedFactors.map(getFactorName).join(', ')}`
    });

    // 收集最终答案
    collectAnswer({
      targetElement: '需要考虑的因素',
      value: selectedFactors
    });

    try {
      // 提交当前页面数据
      await submitCurrentPageData();
      
      // 当前是因素分析页面，显示完成信息
      console.log('[FactorAnalysisPage] 因素分析阶段完成');
      alert(`因素分析完成！您选择的因素是：${selectedFactors.map(getFactorName).join('、')}\n下一阶段：具体购票环节即将开始`);
      
    } catch (error) {
      console.error('[FactorAnalysisPage] 提交数据失败:', error);
      alert('数据提交失败，请重试');
    }
  }, [isSelectionValid, selectedFactors, logOperation, collectAnswer, submitCurrentPageData, getFactorName]);

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
          <LeftNavigation currentStep="3" />

          {/* 右侧内容区域 */}
          <div className="content-area">
            <div className="page-content">
              {/* 页面标题 */}
              <h1 className="page-title">因素分析</h1>
              
              <div className="content-section">
                <div className="character-illustration">
                  <img 
                    src="/src/assets/images/g4-p3-xm.png" 
                    alt="因素分析人物插图" 
                    className="character-image"
                    onError={(e) => {
                      console.warn('人物插图加载失败:', e.target.src);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              
              <div className="content-section">
                <div className="question-prompt">
                  <h3 className="question-title">为解决上述问题，请问小明在购票时需要考虑以下哪些因素？</h3>
                  <p className="question-instruction">
                    单击选择你认为正确的选项，再次单击可取消选择（可多选）。
                  </p>
                </div>
                
                <div className="factors-grid">
                  {FACTOR_OPTIONS.map((factor) => (
                    <CustomCheckbox
                      key={factor.id}
                      id={factor.id}
                      label={factor.name}
                      checked={selectedFactors.includes(factor.id)}
                      onChange={() => handleFactorToggle(factor.id)}
                    />
                  ))}
                </div>

                <div className="selection-summary">
                  {selectedFactors.length > 0 && (
                    <p className="selection-info">
                      已选择 {selectedFactors.length} 个因素：
                      {selectedFactors.map(getFactorName).join('、')}
                    </p>
                  )}
                  {selectedFactors.length === 0 && (
                    <p className="selection-hint">
                      请至少选择一个需要考虑的因素
                    </p>
                  )}
                </div>
              </div>

              {/* 导航区域 */}
              <div className="navigation-area">
                <button
                  type="button"
                  className={`next-button ${isSelectionValid ? 'enabled' : 'disabled'}`}
                  onClick={handleNextPageClick}
                  disabled={!isSelectionValid}
                  title={isSelectionValid ? '点击提交并进入下一页' : '请先选择至少一个因素'}
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

export default FactorAnalysisPage;