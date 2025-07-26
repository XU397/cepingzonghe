import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import TextInput from '../components/common/TextInput';
import NavigationButton from '../components/common/NavigationButton';

/**
 * 蒸馒头 - 对话与提出问题页面
 * 展示对话情境，让用户提出科学问题
 */
const DialogueQuestionPage = () => {
  const { 
    navigateToNextPage, 
    collectAnswer,
    submitPageData 
  } = useAppContext();
  
  const [question, setQuestion] = useState('');
  const [isNextEnabled, setIsNextEnabled] = useState(false);
  
  // 监听问题输入，决定"下一页"按钮的状态
  useEffect(() => {
    setIsNextEnabled(question.trim().length > 0);
  }, [question]);
  
  /**
   * 处理"下一页"按钮点击
   * 1. 收集输入的问题作为答案
   * 2. 提交页面数据
   * 3. 导航到下一页
   */
  const handleNextClick = async () => {
    if (!isNextEnabled) return;
    
    // 收集问题作为答案
    collectAnswer({
      code: '1',
      targetElement: '科学问题输入框',
      value: question
    });
    
    // 提交页面数据
    try {
      await submitPageData();
      navigateToNextPage();
    } catch (error) {
      console.error('提交页面数据失败', error);
      // 显示错误提示（可以添加一个状态来控制错误提示的显示）
    }
  };
  
  return (
    <div className="page-content page-fade-in">
      <h1 className="page-title">蒸馒头</h1>
      
      <div className="dialogue-container">
        <div className="dialogue-image">
          {/* 这里可添加对话场景图片 */}
          <img 
            src="/src/assets/images/dialogue.png" 
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
          onChange={setQuestion}
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