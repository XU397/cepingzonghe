/**
 * 故事 2.6: 用户方案设计页面 (PDF第14页)
 * 用户可以拖拽任务块设计两种不同的方案
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import DraggableTaskBlock from '../components/DraggableTaskBlock';
import DropZone from '../components/DropZone';
import TimeCalculator from '../components/TimeCalculator';
import styles from './07-UserSolutionDesignPage.module.css';

const UserSolutionDesignPage = () => {
  const { logOperation, collectAnswer, navigateToPage, setNavigationStep } = useGrade4Context();
  
  const [availableTasks] = useState([
    { id: 'task1', label: '①', duration: 1, color: '#4A90E2', name: '洗水壶' },
    { id: 'task2', label: '②', duration: 10, color: '#F5A623', name: '用水壶烧热水' },
    { id: 'task3', label: '③', duration: 2, color: '#7ED321', name: '灌水到保温杯' },
    { id: 'task4', label: '④', duration: 2, color: '#50E3C2', name: '整理背包' },
    { id: 'task5', label: '⑤', duration: 6, color: '#D0021B', name: '吃早饭' }
  ]);

  const [solution1, setSolution1] = useState({ tasks: [], totalTime: 0 });
  const [solution2, setSolution2] = useState({ tasks: [], totalTime: 0 });
  const [isNextButtonEnabled, setIsNextButtonEnabled] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);

  // 更新左侧步骤高亮（第7步）
  useEffect(() => {
    setNavigationStep('7');
  }, [setNavigationStep]);

  // 计算关键路径时间
  const calculateCriticalPath = useCallback((tasks) => {
    return TimeCalculator.calculateCriticalPathTime(tasks);
  }, []);

  // 处理任务拖拽开始
  const handleDragStart = useCallback((task) => {
    setDraggedTask(task);
    logOperation({
      targetElement: `${task.name}任务块`,
      eventType: 'drag_start',
      value: `开始拖拽任务${task.label}`
    });
  }, [logOperation]);

  // 处理任务拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  // 处理任务拖拽到方案区
  const handleTaskDrop = useCallback((taskData, solutionId, position) => {
    if (!taskData) return;

    const taskWithPosition = {
      ...taskData,
      id: `${taskData.id}_${Date.now()}`, // 创建唯一ID允许复用
      position: position,
      isSnapped: position.snapped || false,
      snapType: position.alignType || null
    };

    if (solutionId === 'solution1') {
      setSolution1(prev => {
        const newTasks = [...prev.tasks, taskWithPosition];
        const totalTime = calculateCriticalPath(newTasks);
        return { tasks: newTasks, totalTime };
      });
    } else {
      setSolution2(prev => {
        const newTasks = [...prev.tasks, taskWithPosition];
        const totalTime = calculateCriticalPath(newTasks);
        return { tasks: newTasks, totalTime };
      });
    }

    // 记录拖拽操作和收集答案
    logOperation({
      targetElement: `${taskData.name}任务块`,
      eventType: 'drag_drop',
      value: `拖拽到${solutionId === 'solution1' ? '方案一' : '方案二'}，位置(${Math.round(position.x)},${Math.round(position.y)})`
    });

    collectAnswer({
      targetElement: `${solutionId}_task_placement`,
      value: {
        taskId: taskData.id,
        taskName: taskData.name,
        duration: taskData.duration,
        position: position,
        timestamp: Date.now()
      }
    });
  }, [calculateCriticalPath, logOperation, collectAnswer]);

  // 处理方案区内任务移动
  const handleTaskMove = useCallback((taskId, newPosition, solutionId) => {
    const updateSolution = (prev) => {
      const newTasks = prev.tasks.map(t => 
        t.id === taskId ? { ...t, position: newPosition, isSnapped: newPosition.snapped || false } : t
      );
      const totalTime = calculateCriticalPath(newTasks);
      return { tasks: newTasks, totalTime };
    };

    if (solutionId === 'solution1') {
      setSolution1(updateSolution);
    } else {
      setSolution2(updateSolution);
    }

    // 记录移动操作
    logOperation({
      targetElement: `方案区内任务块`,
      eventType: 'task_move',
      value: `在${solutionId === 'solution1' ? '方案一' : '方案二'}中移动任务到位置(${Math.round(newPosition.x)},${Math.round(newPosition.y)})`
    });
  }, [calculateCriticalPath, logOperation]);

  // 检查是否可以进入下一页
  useEffect(() => {
    const hasTasksInBothSolutions = solution1.tasks.length > 0 && solution2.tasks.length > 0;
    setIsNextButtonEnabled(hasTasksInBothSolutions);
  }, [solution1.tasks.length, solution2.tasks.length]);

  const handleNextClick = () => {
    // 收集最终方案数据
    const finalAnswerData = {
      solution1: {
        tasks: solution1.tasks.map(t => ({
          taskId: t.id.replace(/_\d+$/, ''), // 移除时间戳
          taskLabel: t.label,
          taskName: t.name,
          duration: t.duration,
          position: t.position,
          isSnapped: t.isSnapped,
          snapType: t.snapType
        })),
        totalTime: solution1.totalTime,
        taskCount: solution1.tasks.length
      },
      solution2: {
        tasks: solution2.tasks.map(t => ({
          taskId: t.id.replace(/_\d+$/, ''),
          taskLabel: t.label,
          taskName: t.name,
          duration: t.duration,
          position: t.position,
          isSnapped: t.isSnapped,
          snapType: t.snapType
        })),
        totalTime: solution2.totalTime,
        taskCount: solution2.tasks.length
      },
      timestamp: Date.now()
    };

    collectAnswer({
      targetElement: '时间规划方案设计',
      value: finalAnswerData
    });

    logOperation({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: `完成方案设计，方案一${solution1.totalTime}分钟，方案二${solution2.totalTime}分钟`
    });

    // 导航到下一页（故事2.7 - 方案评估与优化页面）
    navigateToPage('plan-optimization');
  };

  return (
    <AssessmentPageLayout className={styles.userSolutionDesignPage}>
      <div className={styles.contentArea}>
        {/* 标题说明 */}
        <div className={styles.instructionSection}>
          <h2 className={styles.pageTitle}>方案设计</h2>
          <p className={styles.instructionText}>
            请你拖动长方条，帮小明设计两种不同的事情安排方案吧。
          </p>
          
          {/* 任务说明 */}
          <div className={styles.taskLegend}>
            {availableTasks.map(task => (
              <span key={task.id} className={styles.taskLegendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: task.color }}></span>
                {task.label} {task.name}（{task.duration}分钟）
              </span>
            ))}
          </div>
        </div>

        {/* 可拖拽任务块区域 */}
        <div className={styles.taskSourceArea}>
          <h3 className={styles.sourceTitle}>可用任务：</h3>
          <div className={styles.taskBlocks}>
            {availableTasks.map(task => (
              <DraggableTaskBlock
                key={task.id}
                task={task}
                onDragStart={() => handleDragStart(task)}
                onDragEnd={handleDragEnd}
                isDragging={draggedTask?.id === task.id}
              />
            ))}
          </div>
        </div>

        {/* 方案设计区域 */}
        <div className={styles.solutionArea}>
          <div className={styles.solutionColumn}>
            <div className={styles.solutionHeader}>
              <h3 className={styles.solutionTitle}>方案一</h3>
              <div className={styles.timeDisplay}>
                总用时：<span className={styles.timeValue}>{solution1.totalTime}</span>分钟
              </div>
            </div>
            <DropZone
              solutionId="solution1"
              tasks={solution1.tasks}
              onTaskDrop={handleTaskDrop}
              onTaskMove={(taskId, newPosition) => handleTaskMove(taskId, newPosition, 'solution1')}
            />
          </div>

          <div className={styles.solutionColumn}>
            <div className={styles.solutionHeader}>
              <h3 className={styles.solutionTitle}>方案二</h3>
              <div className={styles.timeDisplay}>
                总用时：<span className={styles.timeValue}>{solution2.totalTime}</span>分钟
              </div>
            </div>
            <DropZone
              solutionId="solution2"
              tasks={solution2.tasks}
              onTaskDrop={handleTaskDrop}
              onTaskMove={(taskId, newPosition) => handleTaskMove(taskId, newPosition, 'solution2')}
            />
          </div>
        </div>
      </div>

      {/* 导航按钮 */}
      <div className={styles.navigationSection}>
        <div className={styles.progressHint}>
          {!isNextButtonEnabled && (
            <p className={styles.hintText}>
              请在两个方案中都放置至少一个任务块才能继续
            </p>
          )}
        </div>
        
        <button 
          className={`${styles.nextButton} ${!isNextButtonEnabled ? styles.disabled : ''}`}
          onClick={handleNextClick}
          disabled={!isNextButtonEnabled}
        >
          下一页
        </button>
      </div>
    </AssessmentPageLayout>
  );
};

export default UserSolutionDesignPage;
