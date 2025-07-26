import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

/**
 * 全局计时器组件
 * 显示任务剩余时间
 * 
 * @returns {JSX.Element} 计时器组件
 */
const Timer = () => {
  const { remainingTime, isTaskFinished } = useAppContext();
  const [formattedTime, setFormattedTime] = useState('40:00');
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    if (remainingTime <= 0 || isTaskFinished) {
      setFormattedTime('00:00');
      return;
    }

    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    setFormattedTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    
    // 当剩余时间小于5分钟时启用警告样式
    setIsWarning(remainingTime < 300);
  }, [remainingTime, isTaskFinished]);

  const timerClass = `timer-container ${isWarning ? 'timer-warning pulse-animation' : ''}`;

  return (
    <div className={timerClass}>
      剩余时间: {formattedTime}
    </div>
  );
};

export default Timer; 