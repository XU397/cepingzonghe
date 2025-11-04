// 文件: components/DragDropTimelineDemo.jsx (最终修正版)

/**
 * 拖拽时间轴演示组件
 * 修正了动画中色块重叠的问题，实现了动态、有序的排列效果。
 */
import React, { useState, useEffect } from 'react';
import styles from './DragDropTimelineDemo.module.css';

const DragDropTimelineDemo = ({ isPlaying, onComplete }) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  // placedTasks 现在将存储所有已放置任务的完整信息，包括计算出的位置
  const [placedTasks, setPlacedTasks] = useState([]);

  // 任务的原始数据
  const tasks = [
    { id: 'task1', label: '①', duration: 1, color: '#4A90E2', name: '洗水壶' },
    { id: 'task2', label: '②', duration: 10, color: '#F5A623', name: '用水壶烧热水' },
    { id: 'task3', label: '③', duration: 2, color: '#7ED321', name: '灌水到保温杯' },
    { id: 'task4', label: '④', duration: 2, color: '#50E3C2', name: '整理背包' },
    { id: 'task5', label: '⑤', duration: 6, color: '#D0021B', name: '吃早饭' }
  ];

  // 每次开始播放时，重置所有状态
  useEffect(() => {
    if (!isPlaying) {
      setAnimationPhase(0);
      setPlacedTasks([]);
    }
  }, [isPlaying]);

  // --- 核心动画逻辑 ---
  useEffect(() => {
    if (!isPlaying || animationPhase >= 5) {
      console.log('[DragDropTimelineDemo] 动画停止条件:', { isPlaying, animationPhase });
      return; // 如果不在播放或动画已完成，则停止
    }

    console.log('[DragDropTimelineDemo] 动画阶段:', animationPhase);

    // 定义动画的执行顺序
    const animationSequence = ['task1', 'task2', 'task5', 'task3', 'task4'];

    const timer = setTimeout(() => {
      const taskIdToPlace = animationSequence[animationPhase];
      const taskData = tasks.find(t => t.id === taskIdToPlace);

      console.log('[DragDropTimelineDemo] 放置任务:', taskIdToPlace);

      // --- 动态位置计算 ---
      // 这是解决问题的关键：根据已放置的任务，计算新任务的位置
      let newPosition = { top: 60, left: 20 }; // 默认起始位置

      if (taskIdToPlace === 'task4') {
        // 任务④与任务②并行，它的位置基于任务②
        const task2 = placedTasks.find(t => t.id === 'task2');
        if (task2) {
          newPosition = { top: task2.top + 50, left: task2.left }; // 放置在任务②下方
        }
      } else if (placedTasks.length > 0) {
        // 其他任务，依次排列
        // 找到主线上最后一个任务
        const mainLineTasks = placedTasks.filter(t => t.id !== 'task4');
        const lastTask = mainLineTasks[mainLineTasks.length - 1];
        if (lastTask) {
          const lastTaskWidth = lastTask.duration * 40 + 30; // 计算上一个任务的宽度
          newPosition = { top: lastTask.top, left: lastTask.left + lastTaskWidth + 10 }; // 紧跟其后，留10px间距
        }
      }

      // 更新状态，添加新任务到演示区，并进入下一动画阶段
      setPlacedTasks(prev => [...prev, { ...taskData, ...newPosition }]);
      setAnimationPhase(prev => {
        const nextPhase = prev + 1;
        console.log('[DragDropTimelineDemo] 动画阶段更新:', prev, '→', nextPhase);
        return nextPhase;
      });

    }, animationPhase === 0 ? 100 : 800); // 设置动画间隔

    return () => clearTimeout(timer);
  }, [isPlaying, animationPhase]); // 移除 placedTasks 依赖，避免竞态条件

  // 动画全部执行完毕后，调用onComplete
  useEffect(() => {
    console.log('[DragDropTimelineDemo] onComplete effect触发, animationPhase:', animationPhase);

    if (animationPhase === 5) {
      console.log('[DragDropTimelineDemo] 动画完成，1.5秒后调用 onComplete');

      const finalTimer = setTimeout(() => {
        console.log('[DragDropTimelineDemo] 调用 onComplete 回调');
        if (onComplete) {
          onComplete();
        }
      }, 1500);

      return () => {
        console.log('[DragDropTimelineDemo] 清理 onComplete timer');
        clearTimeout(finalTimer);
      };
    }
  }, [animationPhase, onComplete]);


  return (
    <div className={styles.demoContainer}>
      {/* 顶部的静态任务栏 */}
      <div className={styles.taskSourceArea}>
        <div className={styles.taskBlocks}>
          {tasks.map(task => (
            <div
              key={task.id}
              className={`${styles.taskBlock} ${styles[task.id]}`}
              style={{ width: `${task.duration * 40 + 30}px` }}
            >
              <span className={styles.taskLabel}>{task.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 演示动画发生的区域 */}
      <div className={styles.solutionArea}>
        <div className={styles.timelineContainer}>
          {/* 根据 placedTasks 状态，动态渲染出现在演示区的任务块 */}
          {placedTasks.map((task) => (
            <div
              key={task.id}
              className={`${styles.placedTask} ${styles[task.id]}`}
              style={{
                width: `${task.duration * 40 + 30}px`,
                left: `${task.left}px`,
                top: `${task.top}px`,
              }}
            >
              <span className={styles.taskLabel}>{task.label}</span>
            </div>
          ))}

          {/* 总用时显示 */}
          <div className={styles.totalTimeDisplay}>
            总用时：
            <span className={styles.timeValueBox}>
              <span className={styles.timeValue}>
                {/* 当动画播放到最后一步时，显示最终时间 */}
                {animationPhase >= 5 ? '19' : ''}
              </span>
            </span>
            分钟
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragDropTimelineDemo;