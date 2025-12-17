
import styles from './TaskBlock.module.css';

/**
 * TaskBlock - 可拖拽的任务条组件
 */
export function TaskBlock({
  id,
  label,
  duration,
  width,
  color,
  onDragStart,
  isToolbar = false,
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.setData('isFromToolbar', String(isToolbar));
    e.dataTransfer.effectAllowed = 'copyMove';
    if (onDragStart) {
      onDragStart(e, { id, label, duration, width, color });
    }
  };

  return (
    <div
      className={styles.taskBlock}
      draggable
      onDragStart={handleDragStart}
      style={{
        width: `${width}px`,
        backgroundColor: color,
      }}
      data-task-id={id}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.duration}>{duration}分</span>
    </div>
  );
}

export default TaskBlock;
