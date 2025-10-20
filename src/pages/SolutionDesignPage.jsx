import React, { useState, useEffect } from 'react';
import experimentImg from '../assets/images/experiment.png';
import { useAppContext } from '../context/AppContext';
import { useDataLogging } from '../hooks/useDataLogging';
import TextInput from '../components/common/TextInput';
import NavigationButton from '../components/common/NavigationButton';

/**
 * 蒸馒头:方案设计 - 测量方法构思页面
 * 让用户输入三种不同的测量面团体积的方法构思
 */
const SolutionDesignPage = () => {
  const { 
    navigateToPage, 
    submitPageData,
    currentPageId,
    setPageEnterTime
  } = useAppContext();
  
  // 数据记录Hook
  const {
    logInput,
    logInputBlur,
    logButtonClick,
    logPageEnter,
    collectDirectAnswer
  } = useDataLogging('Page_05_Solution_Design');
  
  const [ideas, setIdeas] = useState({
    idea1: '',
    idea2: '',
    idea3: ''
  });
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  
  // 页面进入记录
  useEffect(() => {
    setPageEnterTime(new Date());
    logPageEnter('方案设计测量方法构思页面');
  }, [setPageEnterTime, logPageEnter]);
  
  // 检查是否至少有一个想法非空
  useEffect(() => {
    const hasAtLeastOneIdea = Object.values(ideas).some(idea => idea.trim().length > 0);
    setIsNextEnabled(hasAtLeastOneIdea);
  }, [ideas]);
  
  // 监听输入变化，更新状态并记录
  const handleIdeaChange = (key, value) => {
    setIdeas(prev => ({
      ...prev,
      [key]: value
    }));
    
    // 记录输入操作
    const ideaNumber = key.replace('idea', '');
    logInput(`想法${ideaNumber}输入框`, value);
  };

  /**
   * 处理输入框失焦事件
   * @param {string} key - 想法键名
   * @param {string} value - 输入值
   */
  const handleInputBlur = (key, value) => {
    const ideaNumber = key.replace('idea', '');
    logInputBlur(`想法${ideaNumber}输入框`, value, `测量方法构思${ideaNumber}`);
  };
  
  /**
   * 处理"下一页"按钮点击
   */
  const handleNextClick = async () => {
    if (!isNextEnabled) {
      logButtonClick('下一页', '点击失败 - 未输入任何想法');
      return;
    }
    
    // 记录按钮点击
    logButtonClick('下一页', '提交测量方法构思');
    
    // 收集三个想法作为答案
    Object.entries(ideas).forEach(([key, value], index) => {
      const ideaNumber = key.replace('idea', '');
      collectDirectAnswer(`测量方法构思${ideaNumber}`, value.trim() || '');
    });
    
    try {
      const submissionSuccess = await submitPageData();
      if (submissionSuccess) {
        navigateToPage('Page_12_Solution_Evaluation_Measurement_Critique');
      } else {
        alert('数据提交失败，请稍后再试。');
      }
    } catch (error) {
      console.error('提交页面数据失败', error);
      alert('数据提交失败，请稍后再试。');
    }
  };
  
  return (
    <div className="page-content page-fade-in">
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
