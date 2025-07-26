import React from 'react';
import PropTypes from 'prop-types';
import styles from './LikertScale.module.css';

/**
 * 李克特量表组件
 * @param {object} props - 组件属性
 * @param {Array<object>} props.questions - 问题列表，每个问题包含id和text
 * @param {object} props.answers - 当前答案对象，键为问题id，值为所选选项
 * @param {Function} props.onAnswerChange - 答案改变时的回调函数 (questionId, answer)
 * @param {Array<string>} props.options - 选项列表
 * @param {string} [props.title] - 量表标题 (可选)
 * @param {string} [props.description] - 量表描述 (可选)
 * @param {boolean} [props.disabled=false] - 是否禁用
 * @param {boolean} [props.tableMode=false] - 是否使用表格模式
 * @returns {JSX.Element}
 */
function LikertScale({ questions, answers, onAnswerChange, options, title, description, disabled = false, tableMode = false }) {
  
  // 表格模式渲染
  if (tableMode) {
    return (
      <div className={styles.likertTableContainer}>
        {title && <h3 className={styles.scaleTitle}>{title}</h3>}
        {description && <p className={styles.scaleDescription}>{description}</p>}
        
        <table className={styles.likertTable}>
          <thead>
            <tr>
              <th className={styles.questionColumn}></th>
              {options.map(option => (
                <th key={option} className={styles.optionColumn}>
                  {option}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((question, index) => (
              <tr key={question.id || index} className={styles.questionTableRow}>
                <td className={styles.questionCell}>
                  {question.text}
                </td>
                {options.map(option => (
                  <td key={`${question.id}-${option}`} className={styles.optionCell}>
                    <label className={styles.radioLabel}>
                      <input 
                        type="radio"
                        name={question.id} 
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={() => onAnswerChange(question.id, option)}
                        disabled={disabled}
                        className={styles.radioInput}
                      />
                      <span className={styles.radioCustom}></span>
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // 原有的卡片模式渲染
  return (
    <div className={styles.likertScaleContainer}>
      {title && <h3 className={styles.scaleTitle}>{title}</h3>}
      {description && <p className={styles.scaleDescription}>{description}</p>}
      {questions.map((question, index) => (
        <div key={question.id || index} className={styles.questionRow}>
          <p className={styles.questionText}>{index + 1}. {question.text}</p>
          <div className={styles.optionsGroup}>
            {options.map(option => (
              <label key={`${question.id}-${option}`} className={`${styles.optionLabel} ${answers[question.id] === option ? styles.selected : ''} ${disabled ? styles.disabledLabel : ''}`}>
                <input 
                  type="radio"
                  name={question.id} 
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={() => onAnswerChange(question.id, option)}
                  disabled={disabled}
                  className={styles.radioInput}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

LikertScale.propTypes = {
  questions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  })).isRequired,
  answers: PropTypes.object.isRequired,
  onAnswerChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  disabled: PropTypes.bool,
  tableMode: PropTypes.bool,
};

export default LikertScale; 