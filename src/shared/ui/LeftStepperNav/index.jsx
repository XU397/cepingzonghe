import PropTypes from 'prop-types';
import styles from './styles.module.css';
import '../../styles/nav-tokens.css';

/**
 * 统一左侧步骤导航组件
 *
 * 基于 Grade-7 视觉规范，通过 CSS 变量（tokens）支持模块级覆写
 *
 * @param {Object} props - 组件属性
 * @param {'experiment' | 'questionnaire'} props.mode - 导航模式
 * @param {number} props.currentStep - 当前步骤序号 (1-based)
 * @param {number} props.totalSteps - 总步骤数
 * @param {boolean} [props.compact=false] - 紧凑模式（隐藏步骤指示器）
 * @param {Function} [props.onStepClick] - 步骤点击回调（可选，默认不可点击）
 * @param {string} [props.title='进度'] - 导航标题
 * @param {boolean} [props.showTitle=true] - 是否显示标题
 * @param {boolean} [props.showIndicator=true] - 是否显示步骤指示器 (如 "5/12")
 * @returns {JSX.Element} 左侧步骤导航组件
 */
const LeftStepperNav = ({
  mode = 'experiment',
  currentStep,
  totalSteps,
  compact = false,
  onStepClick,
  title = '进度',
  showTitle = true,
  showIndicator = true,
}) => {
  /**
   * 渲染步骤圆点列表
   */
  const isInteractive = typeof onStepClick === 'function';

  const handleKeyDown = (event, step) => {
    if (!isInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onStepClick(step);
    }
  };

  const renderSteps = () => {
    const steps = [];
    for (let i = 1; i <= totalSteps; i++) {
      const isActive = i === currentStep;
      const isCompleted = i < currentStep;

      // 构建步骤项的 CSS 类
      const stepClasses = [styles.stepItem];
      if (isActive) stepClasses.push(styles.active);
      if (isCompleted) stepClasses.push(styles.completed);
      if (onStepClick) stepClasses.push(styles.clickable);

      steps.push(
        <li
          key={i}
          className={stepClasses.join(' ')}
          onClick={isInteractive ? () => onStepClick(i) : undefined}
          onKeyDown={isInteractive ? (event) => handleKeyDown(event, i) : undefined}
          role={isInteractive ? 'button' : undefined}
          tabIndex={isInteractive ? 0 : -1}
          aria-label={`步骤 ${i}`}
          aria-current={isActive ? 'step' : undefined}
        >
          {i}
        </li>
      );
    }
    return steps;
  };

  return (
    <nav
      className={styles.navContainer}
      data-nav-mode={mode}
      aria-label="步骤导航"
    >
      {/* 标题 */}
      {showTitle && !compact && (
        <div className={styles.navTitle}>{title}</div>
      )}

      {/* 步骤指示器 (如 "5/12") */}
      {showIndicator && !compact && (
        <div className={styles.stepIndicator}>
          {currentStep}/{totalSteps}
        </div>
      )}

      {/* 步骤列表 */}
      <ul className={styles.stepList}>
        {renderSteps()}
      </ul>
    </nav>
  );
};

LeftStepperNav.propTypes = {
  mode: PropTypes.oneOf(['experiment', 'questionnaire']),
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
  compact: PropTypes.bool,
  onStepClick: PropTypes.func,
  title: PropTypes.string,
  showTitle: PropTypes.bool,
  showIndicator: PropTypes.bool,
};

export default LeftStepperNav;
