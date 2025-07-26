import styles from './StepNavigation.module.css';

/**
 * 步骤导航组件
 * 
 * @param {Object} props - 组件属性
 * @param {number} props.currentStepNumber - 当前步骤序号
 * @param {number} props.totalSteps - 总步骤数
 * @returns {JSX.Element} 步骤导航组件
 */
const StepNavigation = ({ currentStepNumber, totalSteps }) => {
  const renderSteps = () => {
    const steps = [];
    for (let i = 1; i <= totalSteps; i++) {
      const isActive = i === currentStepNumber;
      const isCompleted = i < currentStepNumber;
      
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
        {currentStepNumber}/{totalSteps}
      </div>
      <ul className={styles.stepList}>
        {renderSteps()}
      </ul>
    </div>
  );
};

export default StepNavigation; 