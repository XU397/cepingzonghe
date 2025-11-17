/**
 * 统一计时器服务 - 导出入口
 */

export { TimerService, default } from './TimerService.js';
export { useTimer } from './useTimer.js';
export {
  getDefaultTimers,
  getTimerConfigForModule,
  calculateProgress,
  getTimerState,
  NOTICE_DEFAULT_DURATION,
} from './getDefaultTimers.js';
