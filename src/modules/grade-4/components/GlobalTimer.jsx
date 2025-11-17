import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';
import { moduleConfig } from '../moduleConfig';
import { useGrade4Context } from '../context/Grade4Context';

const GlobalTimer = () => {
  const { globalTimer } = useGrade4Context();

  if (!globalTimer.isActive) {
    return null;
  }

  const warningThresholdSeconds =
    moduleConfig?.settings?.warningThresholdSeconds ?? 5 * 60;
  const criticalThresholdSeconds =
    moduleConfig?.settings?.criticalThresholdSeconds ?? 60;

  return (
    <TimerContainer
      type="task"
      label="剩余时间"
      warningThreshold={warningThresholdSeconds}
      criticalThreshold={criticalThresholdSeconds}
    />
  );
};

export default GlobalTimer;
