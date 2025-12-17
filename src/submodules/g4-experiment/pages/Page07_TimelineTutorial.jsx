import { useState, useEffect, useCallback } from 'react';
import { useG4Context } from '../context/G4Context';
import { useG4Navigation } from '../hooks/useG4Navigation';
import { TASK_BLOCKS } from '../constants/taskBlocks';
import { EventTypes } from '../constants/eventTypes';
import styles from './Page07_TimelineTutorial.module.css';

const DEMO_SEQUENCE = ['task-1', 'task-2', 'task-4', 'task-5', 'task-3'];
const DEMO_POSITIONS = [
  { id: 'task-1', x: 0, y: 0 },
  { id: 'task-2', x: 40, y: 0 },
  { id: 'task-4', x: 40, y: 1 },
  { id: 'task-5', x: 120, y: 1 },
  { id: 'task-3', x: 440, y: 0 },
];

export function Page07_TimelineTutorial() {
  const { logOperation } = useG4Context();
  const { handleNextPage } = useG4Navigation();
  const [demoTasks, setDemoTasks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalTime, setTotalTime] = useState('');

  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_07_拖拽演示',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_07_拖拽演示',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  const playDemo = useCallback(async () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setDemoTasks([]);
    setTotalTime('');
    
    logOperation({
      targetElement: '演示按钮',
      eventType: EventTypes.CLICK,
      value: 'play_demo',
      time: new Date().toISOString(),
    });

    for (let i = 0; i < DEMO_SEQUENCE.length; i++) {
      const taskId = DEMO_SEQUENCE[i];
      const pos = DEMO_POSITIONS[i];
      const taskData = TASK_BLOCKS.find(t => t.id === taskId);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setDemoTasks(prev => [...prev, {
        ...taskData,
        cloneId: taskId + '-demo',
        x: pos.x,
        y: pos.y,
      }]);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    setTotalTime('19');
    setIsPlaying(false);
  }, [isPlaying, logOperation]);

  const resetDemo = useCallback(() => {
    setDemoTasks([]);
    setTotalTime('');
    logOperation({
      targetElement: '重置按钮',
      eventType: EventTypes.CLICK,
      value: 'reset_demo',
      time: new Date().toISOString(),
    });
  }, [logOperation]);

  const handleNext = () => {
    handleNextPage('user-solution-design', {
      pageNumber: '7',
      pageDesc: '拖拽演示页',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>时间规划演示</h2>
        <p>观看如何安排小明的出发准备任务，合理利用时间</p>
      </div>

      <div className={styles.demoArea}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLabel}>任务条</div>
          <div className={styles.taskList}>
            {TASK_BLOCKS.map(task => (
              <div 
                key={task.id}
                className={styles.taskBlock}
                style={{ width: task.width, backgroundColor: task.color }}
              >
                {task.label} ({task.duration}分)
              </div>
            ))}
          </div>
        </div>

        <div className={styles.timeline}>
          <div className={styles.axisContainer}>
            <div className={styles.axisLabel}>主轴</div>
            <div className={styles.axis}>
              {demoTasks.filter(t => t.y === 0).map(task => (
                <div
                  key={task.cloneId}
                  className={styles.placedTask}
                  style={{ left: task.x, width: task.width, backgroundColor: task.color }}
                >
                  {task.label}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.axisContainer}>
            <div className={styles.axisLabel}>副轴</div>
            <div className={styles.axis}>
              {demoTasks.filter(t => t.y === 1).map(task => (
                <div
                  key={task.cloneId}
                  className={styles.placedTask}
                  style={{ left: task.x, width: task.width, backgroundColor: task.color }}
                >
                  {task.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.totalTime}>
          总用时：<span className={styles.timeValue}>{totalTime || '—'}</span> 分钟
        </div>
      </div>

      <div className={styles.controls}>
        <button 
          className={styles.playBtn}
          onClick={playDemo}
          disabled={isPlaying}
        >
          {isPlaying ? '演示中...' : '播放演示'}
        </button>
        <button 
          className={styles.resetBtn}
          onClick={resetDemo}
          disabled={isPlaying}
        >
          重置
        </button>
      </div>

      <div className={styles.navigation}>
        <button className={styles.nextBtn} onClick={handleNext}>
          下一页
        </button>
      </div>
    </div>
  );
}

export default Page07_TimelineTutorial;
