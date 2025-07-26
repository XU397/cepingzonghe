import PropTypes from 'prop-types';
import styles from './EffortScale.module.css';

/**
 * 努力程度评估量表组件 (1-10分)
 * @param {object} props - 组件属性
 * @param {Array<object>} props.questions - 问题列表，每个问题包含id, text, description
 * @param {object} props.answers - 当前答案对象，键为问题id，值为所选分数
 * @param {Function} props.onAnswerChange - 答案改变时的回调函数 (questionId, score)
 * @param {string} [props.title] - 量表标题 (可选)
 * @param {boolean} [props.disabled=false] - 是否禁用
 * @returns {JSX.Element}
 */
function EffortScale({ questions, answers, onAnswerChange, title, disabled = false }) {
  const scoreOptions = Array.from({ length: 10 }, (_, i) => i + 1); // 生成1-10的数字数组

  return (
    <div className={styles.effortScaleContainer}>
      {title && <h3 className={styles.scaleTitle}>{title}</h3>}
      {questions.map(question => (
        <div key={question.id} className={styles.questionBlock}>
          <p className={styles.questionText}>{question.text}</p>
          {question.description && <p className={styles.questionDescription}>{question.description}</p>}
          <div className={styles.optionsContainer}>
            {scoreOptions.map(score => (
              <label key={score} className={`${styles.optionLabel} ${answers[question.id] === score ? styles.selected : ''} ${disabled ? styles.disabledLabel : ''}`}>
                <input 
                  type="radio"
                  name={question.id}
                  value={score}
                  checked={answers[question.id] === score}
                  onChange={() => onAnswerChange(question.id, score)}
                  disabled={disabled}
                  className={styles.radioInput}
                />
                {score}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

EffortScale.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    description: PropTypes.string,
  })).isRequired,
  answers: PropTypes.object.isRequired,
  onAnswerChange: PropTypes.func.isRequired,
  title: PropTypes.string,
  disabled: PropTypes.bool,
};

export default EffortScale; 