import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './QuestionnaireTimer.module.css';

/**
 * 问卷计时器组件
 * @param {object} props - 组件属性
 * @param {number} props.remainingTime - 剩余时间（秒）
 * @param {boolean} props.isTimeUp - 时间是否已到
 * @param {string} [props.className] - 自定义CSS类名 (可选)
 * @returns {JSX.Element}
 */
function QuestionnaireTimer({ remainingTime, isTimeUp, className }) {
  const [displayTime, setDisplayTime] = useState('');

  useEffect(() => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    setDisplayTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
  }, [remainingTime]);

  return (
    <div className={`${styles.timerContainer} ${className || ''} ${isTimeUp ? styles.timeUp : remainingTime < 60 ? styles.timeWarning : ''}`}>
      {isTimeUp ? '时间到！' : `剩余时间: ${displayTime}`}
    </div>
  );
}

QuestionnaireTimer.propTypes = {
  remainingTime: PropTypes.number.isRequired,
  isTimeUp: PropTypes.bool.isRequired,
  className: PropTypes.string,
};

export default QuestionnaireTimer; 