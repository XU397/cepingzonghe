/**
 * 放置区域组件
 * 支持任务拖拽放置和磁吸效果（简化版）
 */

import React, { useState, useRef, useCallback } from 'react';
import MagneticSnapping from './MagneticSnapping';
import styles from './DropZone.module.css';

const DropZone = ({ solutionId, tasks, onTaskDrop, onTaskMove }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [snapPreview, setSnapPreview] = useState(null);
  const [draggedTaskInZone, setDraggedTaskInZone] = useState(null);
  const dropRef = useRef();

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    if (!isDragOver) {
      setIsDragOver(true);
    }

    // 计算拖拽位置并显示磁吸预览
    const rect = dropRef.current.getBoundingClientRect();
    const dragPosition = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // 尝试获取拖拽的任务数据
    try {
      const dragData = e.dataTransfer.getData('application/json');
      if (dragData) {
        const draggedTask = JSON.parse(dragData);
        
        // 计算磁吸位置
        const containerBounds = {
          width: rect.width,
          height: rect.height
        };
        
        const snapResult = MagneticSnapping.calculateSnapping(
          draggedTask,
          dragPosition,
          tasks,
          containerBounds
        );
        
        setSnapPreview(snapResult.snapped ? {
          x: snapResult.x,
          y: snapResult.y,
          alignType: snapResult.alignType,
          width: Math.max(draggedTask.duration * 20 + 30, 60)
        } : null);
      }
    } catch (error) {
      // 忽略解析错误
    }
  };

  const handleDragLeave = (e) => {
    // 只有当真正离开容器时才清除状态
    if (!dropRef.current.contains(e.relatedTarget)) {
      setIsDragOver(false);
      setSnapPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    setSnapPreview(null);

    try {
      const taskData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (!taskData) return;

      const rect = dropRef.current.getBoundingClientRect();
      const rawPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // 应用磁吸技术
      const containerBounds = {
        width: rect.width,
        height: rect.height
      };
      
      const snappedPosition = MagneticSnapping.calculateSnapping(
        taskData, 
        rawPosition, 
        tasks, 
        containerBounds
      );
      
      onTaskDrop(taskData, solutionId, snappedPosition);
      
    } catch (error) {
      console.error('处理拖拽放置时出错:', error);
    }
  };

  // 处理方案区内任务的拖拽
  const handleTaskDragStart = useCallback((taskId, e) => {
    setDraggedTaskInZone(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleTaskDragEnd = useCallback(() => {
    setDraggedTaskInZone(null);
  }, []);

  const handleInternalDrop = useCallback((e) => {
    e.preventDefault();
    
    if (draggedTaskInZone) {
      const rect = dropRef.current.getBoundingClientRect();
      const newPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // 对内部移动也应用磁吸
      const task = tasks.find(t => t.id === draggedTaskInZone);
      if (task) {
        const containerBounds = {
          width: rect.width,
          height: rect.height
        };
        
        const snappedPosition = MagneticSnapping.calculateSnapping(
          task, 
          newPosition, 
          tasks.filter(t => t.id !== draggedTaskInZone), // 排除自己
          containerBounds
        );
        
        onTaskMove(draggedTaskInZone, snappedPosition);
      }
    }
    
    setDraggedTaskInZone(null);
  }, [draggedTaskInZone, tasks, onTaskMove]);

  return (
    <div
      ref={dropRef}
      className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={draggedTaskInZone ? handleInternalDrop : handleDrop}
    >
      {/* 背景网格（拖拽时显示） */}
      {isDragOver && <div className={styles.backgroundGrid}></div>}
      
      {/* 磁吸预览指示器 */}
      {snapPreview && (
        <div
          className={`${styles.snapPreview} ${styles[snapPreview.alignType] || styles.grid}`}
          style={{
            left: `${snapPreview.x}px`,
            top: `${snapPreview.y}px`,
            width: `${snapPreview.width}px`
          }}
        />
      )}

      {tasks.length === 0 ? (
        <div className={styles.placeholder}>
          <div className={styles.placeholderIcon}>📋</div>
          <div className={styles.placeholderText}>
            请拖动长方条至此方框内
          </div>
        </div>
      ) : (
        <div className={styles.taskTimeline}>
          {tasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleTaskDragStart(task.id, e)}
              onDragEnd={handleTaskDragEnd}
              className={`${styles.placedTask} ${task.isSnapped ? styles.snapped : ''} ${draggedTaskInZone === task.id ? styles.dragging : ''}`}
              style={{
                backgroundColor: task.color,
                width: `${Math.max(task.duration * 20 + 30, 60)}px`,
                left: `${task.position.x}px`,
                top: `${task.position.y}px`,
                transform: draggedTaskInZone === task.id ? 'rotate(3deg) scale(1.05)' : 'none',
                zIndex: draggedTaskInZone === task.id ? 1000 : 1
              }}
              title={`${task.name} (${task.duration}分钟)`}
            >
              <span className={styles.taskLabel}>{task.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropZone;