/**
 * 因素分析页面 - 四年级火车购票测评
 * Story 2.3: 实现多选交互功能，让学生选择购票时需要考虑的因素
 * 参考ProblemIdentificationPage的左右分栏布局设计
 */

import { useEffect, useState } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import styles from './03-TrainTicketFactorsPage.module.css';

// 预定义的购票因素列表
const PURCHASE_FACTORS = [
  '小明家到出发站的路程',
  '成都东站到舅舅家的路程', 
  '剩余车票数',
  '火车车厢数',
  '火车到达时间',
  '火车发展历史'
];

const TrainTicketFactorsPage = () => {
  const { 
    logOperation, 
    collectAnswer,
    setNavigationStep,
    setRelevantFactors,
    relevantFactors,
    navigateToPage
  } = useGrade4Context();

  const [selectedFactors, setSelectedFactors] = useState(relevantFactors || []);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // 设置导航栏高亮状态 - "3. 因素分析"
    setNavigationStep('3');
    
    // 记录页面进入
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入因素分析页面'
    });
  }, [logOperation, setNavigationStep]);

  // 实时检测选择状态变化
  useEffect(() => {
    setIsValid(selectedFactors.length > 0);
  }, [selectedFactors]);

  // 因素选择/取消选择处理
  const handleFactorToggle = (factor) => {
    const isSelected = selectedFactors.includes(factor);
    let updatedFactors;
    
    if (isSelected) {
      updatedFactors = selectedFactors.filter(f => f !== factor);
      logOperation({
        targetElement: '因素选择框',
        eventType: 'click',
        value: `取消选择-${factor}`
      });
    } else {
      updatedFactors = [...selectedFactors, factor];
      logOperation({
        targetElement: '因素选择框',
        eventType: 'click',
        value: factor
      });
    }
    
    setSelectedFactors(updatedFactors);
    setRelevantFactors(updatedFactors);
  };

  const handleNextPage = async () => {
    try {
      // 收集最终答案
      collectAnswer({
        targetElement: '因素分析',
        value: selectedFactors
      });
      
      // 记录下一页按钮点击
      logOperation({
        targetElement: '下一页按钮',
        eventType: 'button_click',
        value: '从因素分析页面导航到路线分析页面'
      });
      
      // 使用自动提交导航
      await navigateToPage('route-analysis');
      
      console.log('[TrainTicketFactorsPage] ✅ 成功导航到路线分析页面');
    } catch (error) {
      console.error('[TrainTicketFactorsPage] 导航失败:', error);
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
        <div className={styles.pageNumber}>3</div>
        <h1 className={styles.pageTitle}>
          火车购票
        </h1>
      </div>

      {/* 整体布局 - 上下垂直结构，填满整个容器高度 */}
      <div className={styles.mainContent}>
        {/* 上部：小明角色图像和对话气泡 - 左右布局 */}
        <div 
          className={`${styles.topImageArea} ${styles.slideInFromTop}`}
        >
          <div className={styles.characterContainer}>
            {/* 左侧：小明角色图像 */}
            <div className={styles.characterImage}>
              <div className={styles.boyCharacter}>👦</div>
            </div>
            
            {/* 右侧：对话气泡 */}
            <div className={styles.speechBubble}>
              <div className={styles.bubbleContent}>
                我要为爸爸妈妈和自己购买从南充到成都的火车票。从家出发到成都东站的总用时要尽量短，且要在18时30分前到达。
              </div>
              <div className={styles.bubbleArrow}></div>
            </div>
          </div>
        </div>

        {/* 下部：问题提示和因素选择界面 - 占据约2/3高度 */}
        <div 
          className={`${styles.bottomInputArea} ${styles.slideInFromBottom}`}
        >
          <div className={styles.inputCard}>
            {/* 问题标题 */}
            <div className={styles.questionTitle}>
              为解决上述问题，请问小明在购票时需要考虑以下哪些因素？
            </div>
            
            {/* 操作提示 */}
            <div className={styles.operationHint}>
              单击选择你认为正确的选项，再次单击可取消选择（可多选）。
            </div>
            
            {/* 因素选择器网格 */}
            <div className={styles.factorSelectorGrid}>
              {PURCHASE_FACTORS.map((factor, index) => (
                <div
                  key={factor}
                  className={`${styles.factorOption} ${
                    selectedFactors.includes(factor) ? styles.selected : ''
                  } ${styles.fadeInDelay} ${styles[`delay${index + 1}`]}`}
                  onClick={() => handleFactorToggle(factor)}
                >
                  <div className={styles.factorCheckbox}>
                    {selectedFactors.includes(factor) && (
                      <span className={styles.checkmark}>✓</span>
                    )}
                  </div>
                  <span className={styles.factorLabel}>{factor}</span>
                </div>
              ))}
            </div>
            
            {/* 选择状态提示 */}
            <div className={styles.selectionStatus}>
              {selectedFactors.length > 0 ? (
                <span className={styles.validStatus}>
                  已选择 {selectedFactors.length} 个因素
                </span>
              ) : (
                <span className={styles.invalidStatus}>
                  请至少选择一个因素
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </AssessmentPageLayout>
  );
};

export default TrainTicketFactorsPage;