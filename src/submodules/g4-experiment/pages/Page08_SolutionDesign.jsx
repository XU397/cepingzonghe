import { useState, useEffect, useCallback } from 'react';
import { useG4Context } from '../context/G4Context';
import { useG4Navigation } from '../hooks/useG4Navigation';
import TaskBlockDnd from '../components/TaskBlockDnd';
import { TASK_BLOCKS } from '../constants/taskBlocks';
import EventTypes from '@shared/services/submission/eventTypes.js';
import styles from './Page08_SolutionDesign.module.css';

export function Page08_SolutionDesign() {
  const { logOperation, collectAnswer } = useG4Context();
  const { handleNextPage } = useG4Navigation();
  
  const [solutions, setSolutions] = useState({
    solution1: { tasks: [], userInputTime: '' },
    solution2: { tasks: [], userInputTime: '' },
  });
  const [error, setError] = useState('');

  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_08_方案设计',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_08_方案设计',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  const handleTaskPlaced = useCallback((e, rect, solutionId, axisY) => {
    const taskId = e.dataTransfer.getData('taskId');
    const isFromToolbar = e.dataTransfer.getData('isFromToolbar') === 'true';
    const taskData = TASK_BLOCKS.find(t => t.id === taskId);
    
    if (!taskData) return;

    const dropX = e.clientX - rect.left;
    const cloneId = isFromToolbar 
      ? taskId + '-' + Date.now()
      : e.dataTransfer.getData('cloneId');

    const newTask = {
      ...taskData,
      cloneId,
      x: Math.max(0, dropX),
      y: axisY,
    };

    setSolutions(prev => ({
      ...prev,
      [solutionId === 'solution-1' ? 'solution1' : 'solution2']: {
        ...prev[solutionId === 'solution-1' ? 'solution1' : 'solution2'],
        tasks: [...prev[solutionId === 'solution-1' ? 'solution1' : 'solution2'].tasks, newTask],
      },
    }));

    logOperation({
      targetElement: solutionId + '_任务条',
      eventType: EventTypes.TASK_DROP,
      value: JSON.stringify({ action: 'place', task: taskData.label, x: dropX, y: axisY }),
      time: new Date().toISOString(),
    });
  }, [logOperation]);

  const handleClearSolution = useCallback((solutionId) => {
    const key = solutionId === 'solution-1' ? 'solution1' : 'solution2';
    setSolutions(prev => ({
      ...prev,
      [key]: { ...prev[key], tasks: [] },
    }));
    
    logOperation({
      targetElement: solutionId,
      eventType: EventTypes.CLICK,
      value: 'clear_solution',
      time: new Date().toISOString(),
    });
  }, [logOperation]);

  const handleResetAll = useCallback(() => {
    setSolutions({
      solution1: { tasks: [], userInputTime: '' },
      solution2: { tasks: [], userInputTime: '' },
    });
    
    logOperation({
      targetElement: '全部重置',
      eventType: EventTypes.CLICK,
      value: 'reset_all',
      time: new Date().toISOString(),
    });
  }, [logOperation]);

  const handleTimeInput = (solutionKey, value) => {
    setSolutions(prev => ({
      ...prev,
      [solutionKey]: { ...prev[solutionKey], userInputTime: value },
    }));
  };

  const validateAndNext = async () => {
    setError('');

    if (solutions.solution1.tasks.length === 0) {
      setError('方案一需要至少放置一个任务条');
      return;
    }
    if (solutions.solution2.tasks.length === 0) {
      setError('方案二需要至少放置一个任务条');
      return;
    }

    const time1 = parseInt(solutions.solution1.userInputTime, 10);
    const time2 = parseInt(solutions.solution2.userInputTime, 10);

    if (!time1 || time1 < 1 || time1 > 999) {
      setError('请输入方案一的总用时（1-999分钟）');
      return;
    }
    if (!time2 || time2 < 1 || time2 > 999) {
      setError('请输入方案二的总用时（1-999分钟）');
      return;
    }

    const tasks1Str = JSON.stringify(solutions.solution1.tasks.map(t => t.id).sort());
    const tasks2Str = JSON.stringify(solutions.solution2.tasks.map(t => t.id).sort());
    if (tasks1Str === tasks2Str && time1 === time2) {
      setError('请设计两种不同的方案');
      return;
    }

    collectAnswer({ targetElement: '方案一', value: JSON.stringify(solutions.solution1) });
    collectAnswer({ targetElement: '方案二', value: JSON.stringify(solutions.solution2) });

    await handleNextPage({ nextPageId: 'plan-optimization' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>设计你的时间规划方案</h2>
        <p>请设计两种不同的方案来安排小明的出发准备任务</p>
      </div>

      <TaskBlockDnd
        solutions={solutions}
        onTaskPlaced={handleTaskPlaced}
        onClearSolution={handleClearSolution}
        onResetAll={handleResetAll}
        onDragOver={(e) => e.preventDefault()}
        showDualSolutions={true}
        showDualAxis={true}
      />

      <div className={styles.timeInputs}>
        <div className={styles.timeInputGroup}>
          <label>方案一总用时：</label>
          <input
            type="number"
            min="1"
            max="999"
            value={solutions.solution1.userInputTime}
            onChange={(e) => handleTimeInput('solution1', e.target.value)}
            placeholder="分钟"
          />
          <span>分钟</span>
        </div>
        <div className={styles.timeInputGroup}>
          <label>方案二总用时：</label>
          <input
            type="number"
            min="1"
            max="999"
            value={solutions.solution2.userInputTime}
            onChange={(e) => handleTimeInput('solution2', e.target.value)}
            placeholder="分钟"
          />
          <span>分钟</span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.navigation}>
        <button className={styles.nextBtn} onClick={validateAndNext}>
          下一页
        </button>
      </div>
    </div>
  );
}

export default Page08_SolutionDesign;
