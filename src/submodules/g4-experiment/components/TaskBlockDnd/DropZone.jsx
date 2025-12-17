import { useRef } from 'react';
import TaskBlock from './TaskBlock';
import styles from './DropZone.module.css';

export function DropZone({
  solutionId,
  tasks = [],
  onDragOver,
  onDrop,
  onTaskDragStart,
  label = '',
  showDualAxis = false,
}) {
  const dropZoneRef = useRef(null);

  const handleDrop = (e, axisY = 0) => {
    e.preventDefault();
    if (dropZoneRef.current && onDrop) {
      const rect = dropZoneRef.current.getBoundingClientRect();
      onDrop(e, rect, solutionId, axisY);
    }
  };

  const renderAxis = (axisY, axisLabel) => {
    const axisTasks = tasks.filter(t => t.y === axisY);
    
    return (
      <div 
        className={styles.axis}
        onDragOver={onDragOver}
        onDrop={(e) => handleDrop(e, axisY)}
      >
        <div className={styles.axisLabel}>{axisLabel}</div>
        <div className={styles.timeline}>
          {axisTasks.map((task) => (
            <div
              key={task.cloneId}
              className={styles.placedTask}
              style={{ left: `${task.x}px` }}
            >
              <TaskBlock
                id={task.id}
                label={task.label}
                duration={task.duration}
                width={task.width}
                color={task.color}
                onDragStart={(e) => onTaskDragStart(e, task, false)}
                isToolbar={false}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={dropZoneRef}
      className={styles.dropZone}
      data-drop-zone={solutionId}
    >
      {label && <div className={styles.solutionLabel}>{label}</div>}
      {renderAxis(0, '主轴')}
      {showDualAxis && renderAxis(1, '副轴')}
    </div>
  );
}

export default DropZone;
