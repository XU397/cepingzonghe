/**
 * QuestionBlock - 问题块容器组件
 *
 * 功能:
 * - 问题陈述 + RadioButtonGroup容器
 * - 题号显示(如 "1. ")
 * - 必答标记(红色星号)
 * - 完成状态指示
 *
 * @component
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import RadioButtonGroup from './RadioButtonGroup';
import styles from '../../styles/QuestionBlock.module.css';

/**
 * QuestionBlock Component
 *
 * @param {Object} props
 * @param {number} props.questionNumber - 题号(全局编号1-27)
 * @param {string} props.questionText - 问题文本
 * @param {Array<{value: string, label: string}>} props.options - 选项数组
 * @param {string|null} props.value - 当前选中的值
 * @param {Function} props.onChange - 选择变化回调 (value) => void
 * @param {boolean} [props.required=true] - 是否必答
 * @param {string} [props.orientation='vertical'] - 选项布局方向
 */
const QuestionBlock = ({
  questionNumber,
  questionText,
  options,
  value,
  onChange,
  required = true,
  orientation = 'vertical',
}) => {
  // 计算是否已回答 (Must be called before any conditional returns)
  const isAnswered = useMemo(() => {
    return value !== null && value !== undefined && value !== '';
  }, [value]);

  // 生成唯一的name属性
  const radioGroupName = `question-${questionNumber}`;

  // 验证props after hooks
  if (!questionNumber || !questionText) {
    console.error('[QuestionBlock] questionNumber and questionText are required');
    return null;
  }

  return (
    <div className={`${styles.questionBlock} ${isAnswered ? styles.answered : ''}`}>
      {/* 问题标题区域 */}
      <div className={styles.questionHeader}>
        <div className={styles.questionTitle}>
          <span className={styles.questionNumber}>{questionNumber}.</span>
          <span className={styles.questionText}>{questionText}</span>
          {required && <span className={styles.requiredMark}>*</span>}
        </div>

        {/* 完成状态指示器 */}
        {isAnswered && (
          <div className={styles.completionIndicator}>
            <svg
              className={styles.checkIcon}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span className={styles.completionText}>已完成</span>
          </div>
        )}
      </div>

      {/* 选项区域 */}
      <div className={styles.optionsContainer}>
        <RadioButtonGroup
          name={radioGroupName}
          options={options}
          value={value}
          onChange={onChange}
          orientation={orientation}
          ariaLabel={`问题${questionNumber}: ${questionText}`}
        />
      </div>

      {/* 必答提示(未回答时显示) */}
      {required && !isAnswered && (
        <div className={styles.requiredHint} role="alert" aria-live="polite">
          <svg
            className={styles.infoIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>此题为必答题</span>
        </div>
      )}
    </div>
  );
};

QuestionBlock.propTypes = {
  questionNumber: PropTypes.number.isRequired,
  questionText: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
};

export default QuestionBlock;
