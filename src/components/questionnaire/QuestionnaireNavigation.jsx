import React from 'react';
import styles from '../common/StepNavigation.module.css';

/**
 * 问卷步骤导航组件
 * 显示问卷的9个步骤（P20-P28）
 * 
 * @param {Object} props - 组件属性
 * @param {number} props.currentQuestionnaireStep - 当前问卷步骤序号 (1-9)
 * @param {number} props.totalQuestionnaireSteps - 总问卷步骤数 (9)
 * @returns {JSX.Element} 问卷步骤导航组件
 */
const QuestionnaireNavigation = ({ currentQuestionnaireStep, totalQuestionnaireSteps = 9 }) => {
  const renderSteps = () => {
    const steps = [];
    for (let i = 1; i <= totalQuestionnaireSteps; i++) {
      const isActive = i === currentQuestionnaireStep;
      const isCompleted = i < currentQuestionnaireStep;
      
      // 构建步骤项的CSS类
      let stepClassName = styles.stepItem;
      if (isActive) stepClassName += ` ${styles.active}`;
      if (isCompleted) stepClassName += ` ${styles.completed}`;
      
      steps.push(
        <li key={i} className={stepClassName}>
          {i}
        </li>
      );
    }
    return steps;
  };

  return (
    <div className={styles.stepNavigationContainer}>
      <div className={styles.stepIndicator}>
        问卷 {currentQuestionnaireStep}/{totalQuestionnaireSteps}
      </div>
      <ul className={styles.stepList}>
        {renderSteps()}
      </ul>
    </div>
  );
};

export default QuestionnaireNavigation;