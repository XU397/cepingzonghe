/**
 * 第9页：方案评估与优化（故事2.7）
 * - 是否最优的单选题
 * - 选择“否”后显示改进方案拖拽区域
 * - 在改进区域放置至少一个任务后才能“下一页”
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import DraggableTaskBlock from '../components/DraggableTaskBlock';
import DropZone from '../components/DropZone';
import TimeCalculator from '../components/TimeCalculator';
import styles from './08-PlanOptimizationPage.module.css';

const PlanOptimizationPage = () => {
  const { logOperation, collectAnswer, navigateToPage, setNavigationStep } = useGrade4Context();

  // 左侧步骤高亮：第8步
  useEffect(() => {
    setNavigationStep('8');
  }, [setNavigationStep]);

  const [isOptimal, setIsOptimal] = useState(null); // null | true | false
  const [showImprovement, setShowImprovement] = useState(false);
  const [improvedSolution, setImprovedSolution] = useState({ tasks: [], totalTime: 0 });
  const [isNextButtonEnabled, setIsNextButtonEnabled] = useState(false);

  // 小明（示例）方案（只读展示）
  const xiaomingSolution = {
    tasks: [
      { id: 'xm_4', label: '④', duration: 2, position: { x: 50, y: 100 }, color: '#50E3C2', name: '整理背包' },
      { id: 'xm_1', label: '①', duration: 1, position: { x: 100, y: 100 }, color: '#4A90E2', name: '洗水壶' },
      { id: 'xm_2', label: '②', duration: 10, position: { x: 130, y: 100 }, color: '#F5A623', name: '用水壶烧热水' },
      { id: 'xm_3', label: '③', duration: 2, position: { x: 350, y: 100 }, color: '#7ED321', name: '灌水到保温杯' },
      { id: 'xm_5', label: '⑤', duration: 6, position: { x: 100, y: 140 }, color: '#D0021B', name: '吃早饭' }
    ],
    totalTime: 15
  };

  const availableTasks = [
    { id: 'task1', label: '①', duration: 1, color: '#4A90E2', name: '洗水壶' },
    { id: 'task2', label: '②', duration: 10, color: '#F5A623', name: '用水壶烧热水' },
    { id: 'task3', label: '③', duration: 2, color: '#7ED321', name: '灌水到保温杯' },
    { id: 'task4', label: '④', duration: 2, color: '#50E3C2', name: '整理背包' },
    { id: 'task5', label: '⑤', duration: 6, color: '#D0021B', name: '吃早饭' }
  ];

  const handleOptimalityChoice = (choice) => {
    setIsOptimal(choice);
    if (choice === true) {
      setIsNextButtonEnabled(true);
      setShowImprovement(false);
    } else {
      setShowImprovement(true);
      setIsNextButtonEnabled(false);
      setImprovedSolution({ tasks: [], totalTime: 0 });
    }

    logOperation({
      targetElement: '是否最优单选',
      eventType: 'radio_select',
      value: choice ? '选择 是（最优）' : '选择 否（需改进）'
    });
  };

  // 拖拽放置
  const handleImprovementDrop = useCallback((taskData, solutionId, position) => {
    if (!taskData) return;
    const taskWithPosition = {
      ...taskData,
      id: `${taskData.id}_${Date.now()}`,
      position,
    };

    setImprovedSolution(prev => {
      const newTasks = [...prev.tasks, taskWithPosition];
      const totalTime = TimeCalculator.calculateCriticalPathTime(newTasks);
      if (newTasks.length > 0) setIsNextButtonEnabled(true);
      return { tasks: newTasks, totalTime };
    });

    logOperation({
      targetElement: `${taskData.name}任务块`,
      eventType: 'drag_drop',
      value: `拖拽到改进方案区域，位置(${Math.round(position.x)},${Math.round(position.y)})`
    });
  }, [logOperation]);

  // 区域内移动
  const handleImprovementMove = useCallback((taskId, newPosition) => {
    setImprovedSolution(prev => {
      const newTasks = prev.tasks.map(t => t.id === taskId ? { ...t, position: newPosition } : t);
      const totalTime = TimeCalculator.calculateCriticalPathTime(newTasks);
      return { tasks: newTasks, totalTime };
    });

    logOperation({
      targetElement: '改进方案任务块',
      eventType: 'task_move',
      value: `移动到(${Math.round(newPosition.x)},${Math.round(newPosition.y)})`
    });
  }, [logOperation]);

  const handleNextClick = () => {
    // 收集答案
    const answerValue = {
      is_xiaoming_optimal: isOptimal === true,
      improvement_provided: showImprovement,
      improved_solution: showImprovement && improvedSolution.tasks.length > 0 ? {
        tasks: improvedSolution.tasks.map(t => ({
          taskId: t.id.replace(/_\d+$/, ''),
          taskLabel: t.label,
          taskName: t.name,
          duration: t.duration,
          position: t.position
        })),
        totalTime: improvedSolution.totalTime,
        analysis: TimeCalculator.analyzeCriticalPath(improvedSolution.tasks)
      } : null
    };

    collectAnswer({ targetElement: 'plan-optimization', value: answerValue });

    logOperation({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: '完成方案评估与优化'
    });

    // 下一页（2.8）暂未实现，这里先回到注意事项或保持当前页
    // TODO: 待故事2.8页面接入后改为 navigateToPage('ticket-filter') 或对应pageId
    navigateToPage('ticket-filter');
  };

  return (
    <AssessmentPageLayout
      onNextClick={handleNextClick}
      isNextButtonEnabled={isNextButtonEnabled}
      className={styles.pageContainer}
    >
      <div className={styles.contentArea}>
        {/* 小明方案展示（只读） */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>如下图，小明也提出了一种安排方案。</p>
          <div className={styles.solutionDisplay}>
            <div className={styles.timelineContainer}>
              {xiaomingSolution.tasks.map(task => (
                <div
                  key={task.id}
                  className={styles.taskBlock}
                  style={{
                    backgroundColor: task.color,
                    width: `${Math.max(task.duration * 20 + 30, 60)}px`,
                    left: `${task.position.x}px`,
                    top: `${task.position.y}px`
                  }}
                >
                  {task.label}
                </div>
              ))}
              <div className={styles.totalTimeDisplay}>
                总用时：<span className={styles.timeValue}>{xiaomingSolution.totalTime}</span>分钟
              </div>
            </div>
          </div>
        </div>

        {/* 评估选择 */}
        <div className={styles.section}>
          <p className={styles.question}>请问小明的方案是否是用时最短的方案？</p>
          <div className={styles.choiceOptions}>
            <label className={styles.radioOption}>
              <input type="radio" name="optimality" value="yes" checked={isOptimal === true} onChange={() => handleOptimalityChoice(true)} />
              <span>是</span>
            </label>
            <label className={styles.radioOption}>
              <input type="radio" name="optimality" value="no" checked={isOptimal === false} onChange={() => handleOptimalityChoice(false)} />
              <span>否</span>
            </label>
          </div>
        </div>

        {/* 条件渲染：改进方案区域 */}
        {showImprovement && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>请拖动长方条，画出你的改进方案。</p>

            <div className={styles.taskSourceArea}>
              {availableTasks.map(task => (
                <DraggableTaskBlock
                  key={task.id}
                  task={task}
                  onDragStart={() => {
                    logOperation({ targetElement: `${task.name}任务块`, eventType: 'drag_start', value: '开始拖拽任务块' });
                  }}
                  onDragEnd={() => {
                    logOperation({ targetElement: '任务块', eventType: 'drag_end', value: '结束拖拽' });
                  }}
                />
              ))}
            </div>

            <div className={styles.improvementDropZone}>
              <DropZone
                solutionId="improved"
                tasks={improvedSolution.tasks}
                onTaskDrop={handleImprovementDrop}
                onTaskMove={(taskId, newPos) => handleImprovementMove(taskId, newPos)}
              />
              <div className={styles.timeDisplay}>
                总用时：<span className={styles.timeValue}>{improvedSolution.totalTime}</span>分钟
              </div>
            </div>
          </div>
        )}
      </div>
    </AssessmentPageLayout>
  );
};

export default PlanOptimizationPage;
