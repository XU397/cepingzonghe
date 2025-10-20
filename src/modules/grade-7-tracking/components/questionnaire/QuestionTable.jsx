/**
 * QuestionTable - 问卷表格布局组件
 * 使用表格形式展示问题和选项（符合附件图设计）
 */

import PropTypes from 'prop-types';
import { useTrackingContext } from '../../context/TrackingContext';
import styles from '../../styles/QuestionTable.module.css';

/**
 * QuestionTable Component
 *
 * @param {Object} props
 * @param {Array} props.questions - 问题列表
 * @param {Object} props.answers - 答案对象 {q1: 'A', q2: 'B', ...}
 * @param {Function} props.onAnswerChange - 答案变化回调 (questionId, value) => void
 * @param {Array} props.options - 选项列表（所有问题共用）
 */
const QuestionTable = ({ questions, answers, onAnswerChange, options }) => {
  const { logOperation } = useTrackingContext();

  const handleRadioChange = (questionId, value) => {
    logOperation({
      action: '单选按钮点击',
      target: `question_${questionId}`,
      value: value,
      time: new Date().toISOString(),
    });
    onAnswerChange(questionId, value);
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.questionTable}>
        <thead>
          <tr>
            <th className={styles.questionColumn}></th>
            {options.map((option) => (
              <th key={option.value} className={styles.optionColumn}>
                {option.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {questions.map((question) => {
            const questionKey = `q${question.id}`;
            const selectedValue = answers[questionKey];

            return (
              <tr key={question.id} className={styles.questionRow}>
                <td className={styles.questionCell}>{question.text}</td>
                {options.map((option) => {
                  const isChecked = selectedValue === option.value;
                  const radioId = `q${question.id}_${option.value}`;

                  return (
                    <td key={option.value} className={styles.optionCell}>
                      <label htmlFor={radioId} className={styles.radioWrapper}>
                        <input
                          type="radio"
                          id={radioId}
                          name={`question_${question.id}`}
                          value={option.value}
                          checked={isChecked}
                          onChange={() => handleRadioChange(question.id, option.value)}
                          className={styles.radioInput}
                        />
                        <span className={styles.radioCustom}>
                          {isChecked && <span className={styles.radioInner}></span>}
                        </span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

QuestionTable.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  answers: PropTypes.object.isRequired,
  onAnswerChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default QuestionTable;
