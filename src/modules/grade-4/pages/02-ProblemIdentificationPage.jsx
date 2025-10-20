/**
 * 问题识别页面 - 四年级火车购票测评
 * PDF第4页：左侧显示群聊对话图片，右侧为问题提示和输入区域
 * 实现文本输入验证和按钮状态管理
 */

import { useEffect, useState } from 'react';
import talkImg from '../../../assets/images/g4-p2-talk.png';
import { useGrade4Context } from '../context/Grade4Context';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import styles from './02-ProblemIdentificationPage.module.css';

const ProblemIdentificationPage = () => {
  const { 
    logOperation, 
    collectAnswer,
    setNavigationStep,
    setProblemStatement,
    problemStatement,
    navigateToPage
  } = useGrade4Context();

  const [inputText, setInputText] = useState(problemStatement || '');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // 设置导航栏高亮状态 - "2. 出行方案"
    setNavigationStep('2');
    
    // 记录页面进入
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入问题识别页面'
    });
  }, [logOperation, setNavigationStep]);

  // 实时检测文本框内容变化
  useEffect(() => {
    const trimmedValue = inputText.trim();
    setIsValid(trimmedValue.length > 0);
  }, [inputText]);

  const handleTextChange = (e) => {
    const value = e.target.value;
    setInputText(value);
    
    // 更新状态管理
    setProblemStatement(value);
    
    // 记录用户输入操作
    logOperation({
      targetElement: '问题识别输入框',
      eventType: 'textarea_input',
      value: value.substring(0, 100) + (value.length > 100 ? '...' : '') // 限制日志长度
    });
  };

  const handleNextPage = async () => {
    try {
      // 收集最终答案
      collectAnswer({
        targetElement: '问题识别',
        value: inputText.trim()
      });
      
      // 记录下一页按钮点击
      logOperation({
        targetElement: '下一页按钮',
        eventType: 'button_click',
        value: '从问题识别页面导航到因素分析页面'
      });
      
      // 使用自动提交导航
      await navigateToPage('factor-analysis');
      
      console.log('[ProblemIdentificationPage] ✅ 成功导航到因素分析页面');
    } catch (error) {
      console.error('[ProblemIdentificationPage] 导航失败:', error);
      alert('页面跳转失败，请重试');
    }
  };

  return (
    <AssessmentPageLayout 
      onNextClick={handleNextPage}
      isNextButtonEnabled={isValid}
    >
      {/* 页面标题 */}
      <div className={`${styles.titleContainer} ${styles.fadeIn}`}>
        <h1 className={styles.pageTitle}>
          问题识别
        </h1>
      </div>

      {/* 整体布局 - 左右分栏，填满整个容器高度 */}
      <div className={styles.mainContent}>
        {/* 左侧：聊天对话图片区域 */}
        <div 
          className={`${styles.leftImageArea} ${styles.slideInFromLeft}`}
          style={{
            backgroundImage: `url(${talkImg})`
          }}
        >
          {/* 可以添加一些装饰或者留空 */}
        </div>

        {/* 右侧：问题提示和输入区域 */}
        <div className={`${styles.rightInputArea} ${styles.slideInFromRight}`}>
          <div className={styles.inputCard}>
            {/* 问题标题 */}
            <h3 className={styles.questionTitle}>
              根据以上对话，小明需要解决什么问题？
            </h3>
            
            {/* 文本输入区域 */}
            <div className={styles.textInputContainer}>
              <textarea
                className={`${styles.textInput} ${isValid ? styles.valid : styles.invalid}`}
                placeholder="请在此处输入你识别的问题..."
                value={inputText}
                onChange={handleTextChange}
              />
              
              {/* 输入提示 */}
              <div className={`${styles.inputHint} ${isValid ? styles.valid : styles.invalid}`}>
                {isValid ? '✓ 内容已输入，可以继续下一步' : '请输入问题描述后再继续'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AssessmentPageLayout>
  );
};

export default ProblemIdentificationPage;
