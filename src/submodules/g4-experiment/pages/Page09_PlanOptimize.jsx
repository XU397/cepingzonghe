import { useState, useEffect, useCallback } from 'react';
import { useG4Context } from '../context/G4Context';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Navigation } from '../hooks/useG4Navigation';
import TaskBlockDnd from '../components/TaskBlockDnd';
import { TASK_BLOCKS } from '../constants/taskBlocks';
import styles from './Page09_PlanOptimize.module.css';

const XIAOMING_SOLUTION = {
  tasks: [
    { ...TASK_BLOCKS[0], cloneId: 'xm-task-1', x: 0, y: 0 },
    { ...TASK_BLOCKS[1], cloneId: 'xm-task-2', x: 40, y: 0 },
    { ...TASK_BLOCKS[3], cloneId: 'xm-task-4', x: 40, y: 1 },
    { ...TASK_BLOCKS[4], cloneId: 'xm-task-5', x: 120, y: 1 },
    { ...TASK_BLOCKS[2], cloneId: 'xm-task-3', x: 440, y: 0 },
  ],
  totalTime: 15, // spec FR-048: 小明方案总用时15分钟
};

export function Page09_PlanOptimize() {
  const { logOperation, collectAnswer } = useG4Context();
  const { handleNextPage } = useG4Navigation();
  
  const [isOptimal, setIsOptimal] = useState(null);
  const [improvedSolution, setImprovedSolution] = useState({ tasks: [], userInputTime: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_09_方案评估',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_09_方案评估',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  const handleOptimalChange = (value) => {
    setIsOptimal(value);
    setError('');
    
    logOperation({
      targetElement: '方案最优选择',
      eventType: EventTypes.RADIO_SELECT,
      value: value ? 'yes' : 'no',
      time: new Date().toISOString(),
    });
  };

  const handleTaskPlaced = useCallback((e, rect, solutionId, axisY) => {
    const taskId = e.dataTransfer.getData('taskId');
    const taskData = TASK_BLOCKS.find(t => t.id === taskId);
    
    if (!taskData) return;

    const dropX = e.clientX - rect.left;
    const cloneId = taskId + '-improved-' + Date.now();

    const newTask = {
      ...taskData,
      cloneId,
      x: Math.max(0, dropX),
      y: axisY,
    };

    setImprovedSolution(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));

    logOperation({
      targetElement: '改进方案_任务条',
      eventType: EventTypes.TASK_DROP,
      value: JSON.stringify({ action: 'place', task: taskData.label, x: dropX, y: axisY }),
      time: new Date().toISOString(),
    });
  }, [logOperation]);

  const handleClearSolution = useCallback(() => {
    setImprovedSolution({ tasks: [], userInputTime: '' });
  }, []);

  const validateAndNext = async () => {
    setError('');

    if (isOptimal === null) {
      setError('请选择小明的方案是否为最短用时');
      return;
    }

    if (!isOptimal) {
      if (improvedSolution.tasks.length === 0) {
        setError('请设计改进方案');
        return;
      }
      const time = parseInt(improvedSolution.userInputTime, 10);
      if (!time || time < 1 || time > 999) {
        setError('请输入改进方案的总用时（1-999分钟）');
        return;
      }
    }

    collectAnswer({ targetElement: '方案最优', value: isOptimal ? '是' : '否' });
    if (!isOptimal) {
      collectAnswer({ targetElement: '改进方案', value: JSON.stringify(improvedSolution) });
    }

    await handleNextPage({ nextPageId: 'ticket-filter' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>评估小明的方案</h2>
        <p>观察小明设计的方案，判断是否能进一步优化</p>
      </div>

      <div className={styles.xiaomingSolution}>
        <h3>小明的方案（总用时：{XIAOMING_SOLUTION.totalTime}分钟）</h3>
        <TaskBlockDnd
          solutions={{ solution1: XIAOMING_SOLUTION }}
          showDualSolutions={false}
          showDualAxis={true}
          readOnly={true}
        />
      </div>

      <div className={styles.question}>
        <p>小明的方案是否已经是最短用时？</p>
        <div className={styles.radioGroup}>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="isOptimal"
              checked={isOptimal === true}
              onChange={() => handleOptimalChange(true)}
            />
            <span>是</span>
          </label>
          <label className={styles.radioLabel}>
            <input
              type="radio"
              name="isOptimal"
              checked={isOptimal === false}
              onChange={() => handleOptimalChange(false)}
            />
            <span>否</span>
          </label>
        </div>
      </div>

      {isOptimal === false && (
        <div className={styles.improveSection}>
          <h3>请设计你的改进方案</h3>
          <TaskBlockDnd
            solutions={{ solution1: improvedSolution }}
            onTaskPlaced={handleTaskPlaced}
            onClearSolution={handleClearSolution}
            onResetAll={handleClearSolution}
            onDragOver={(e) => e.preventDefault()}
            showDualSolutions={false}
            showDualAxis={true}
          />
          <div className={styles.timeInput}>
            <label>改进方案总用时：</label>
            <input
              type="number"
              min="1"
              max="999"
              value={improvedSolution.userInputTime}
              onChange={(e) => setImprovedSolution(prev => ({ ...prev, userInputTime: e.target.value }))}
              placeholder="分钟"
            />
            <span>分钟</span>
          </div>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.navigation}>
        <button className={styles.nextBtn} onClick={validateAndNext}>
          下一页
        </button>
      </div>
    </div>
  );
}

export default Page09_PlanOptimize;
