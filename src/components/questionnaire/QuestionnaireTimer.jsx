import PropTypes from 'prop-types';
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';

/**
 * 问卷计时器组件（采用统一计时显示）
 *
 * @param {object} props
 * @param {string} [props.className] - 自定义类名
 * @returns {JSX.Element}
 */
function QuestionnaireTimer({ className = '' }) {
  return (
    <TimerContainer
      type="questionnaire"
      label="问卷剩余时间"
      warningThreshold={180}
      criticalThreshold={60}
      className={className}
    />
  );
}

QuestionnaireTimer.propTypes = {
  className: PropTypes.string,
};

export default QuestionnaireTimer;
