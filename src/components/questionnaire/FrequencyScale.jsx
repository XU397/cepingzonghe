import PropTypes from 'prop-types';
import styles from './LikertScale.module.css'; // 使用LikertScale的样式

/**
 * 频率量表组件
 * @param {object} props - 组件属性
 * @param {Array<object>} props.activities - 活动列表，每个活动包含id和text
 * @param {object} props.answers - 当前答案对象，键为活动id，值为所选频率
 * @param {Function} props.onAnswerChange - 答案改变时的回调函数 (activityId, frequency)
 * @param {Array<string>} props.options - 频率选项列表
 * @param {string} [props.title] - 量表标题 (可选)
 * @param {string} [props.description] - 量表描述 (可选)
 * @param {boolean} [props.disabled=false] - 是否禁用
 * @returns {JSX.Element}
 */
function FrequencyScale({ activities, answers, onAnswerChange, options, title, description, disabled = false }) {
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
          {activities.map((activity, index) => (
            <tr key={activity.id || index} className={styles.questionTableRow}>
              <td className={styles.questionCell}>
                {activity.text}
              </td>
              {options.map(option => (
                <td key={`${activity.id}-${option}`} className={styles.optionCell}>
                  <label className={styles.radioLabel}>
                    <input 
                      type="radio"
                      name={activity.id} 
                      value={option}
                      checked={answers[activity.id] === option}
                      onChange={() => onAnswerChange(activity.id, option)}
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

FrequencyScale.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  })).isRequired,
  answers: PropTypes.object.isRequired,
  onAnswerChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  disabled: PropTypes.bool,
};

export default FrequencyScale; 