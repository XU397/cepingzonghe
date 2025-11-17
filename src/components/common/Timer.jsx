import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';

/**
 * 全局计时器组件
 * 显示任务剩余时间
 * 
 * @returns {JSX.Element} 计时器组件
 */
const Timer = () => {
  return (
    <TimerContainer
      type="task"
      label="剩余时间"
      warningThreshold={300}
      criticalThreshold={60}
    />
  );
};

export default Timer; 
