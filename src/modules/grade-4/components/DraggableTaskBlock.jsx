/**
 * 可拖拽任务块组件
 * 支持简化版拖拽功能（不使用react-dnd）
 */

import React, { useState } from 'react';
import styles from './DraggableTaskBlock.module.css';

const DraggableTaskBlock = ({ task, onDragStart, onDragEnd, isDragging }) => {
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);

  const handleDragStart = (e) => {
    setIsDraggingLocal(true);
    
    // 设置拖拽数据
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'copy';
    
    // 设置拖拽图像
    const dragImage = e.target.cloneNode(true);
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    e.dataTransfer.setDragImage(dragImage, 25, 20);
    
    onDragStart && onDragStart(task);
  };

  const handleDragEnd = (e) => {
    setIsDraggingLocal(false);
    onDragEnd && onDragEnd();
  };

  const handleMouseEnter = () => {
    if (!isDraggingLocal) {
      // 悬停效果
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      className={`${styles.taskBlock} ${isDragging || isDraggingLocal ? styles.dragging : ''}`}
      style={{
        backgroundColor: task.color,
        width: `${Math.max(task.duration * 20 + 30, 60)}px`,
      }}
      title={`${task.name} (${task.duration}分钟)`}
    >
      <span className={styles.taskLabel}>{task.label}</span>
    </div>
  );
};

export default DraggableTaskBlock;