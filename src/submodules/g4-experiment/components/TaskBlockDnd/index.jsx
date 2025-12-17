
import TaskBlock from './TaskBlock';
import DropZone from './DropZone';
import { TASK_BLOCKS } from '../../constants/taskBlocks';
import styles from './TaskBlockDnd.module.css';

export function TaskBlockDnd({
  solutions,
  onTaskPlaced,
  // onTaskRemoved - reserved for future task removal feature
  onClearSolution,
  onResetAll,
  onDragStart,
  onDragOver,
  showDualSolutions = true,
  showDualAxis = false,
  readOnly = false,
}) {
  const handleToolbarDragStart = (e, task) => {
    if (onDragStart) {
      onDragStart(e, task, true);
    }
  };

  const handlePlacedTaskDragStart = (e, task) => {
    if (onDragStart) {
      onDragStart(e, task, false);
    }
  };

  return (
    <div className={styles.container}>
      {!readOnly && (
        <div className={styles.toolbar}>
          <div className={styles.toolbarLabel}>任务条工具栏（拖拽到方案区域）</div>
          <div className={styles.taskList}>
            {TASK_BLOCKS.map((task) => (
              <TaskBlock
                key={task.id}
                {...task}
                onDragStart={(e) => handleToolbarDragStart(e, task)}
                isToolbar={true}
              />
            ))}
          </div>
        </div>
      )}

      <div className={styles.solutionsArea}>
        <DropZone
          solutionId="solution-1"
          tasks={solutions?.solution1?.tasks || []}
          onDragOver={onDragOver}
          onDrop={(e, rect, id, y) => onTaskPlaced && onTaskPlaced(e, rect, 'solution-1', y)}
          onTaskDragStart={handlePlacedTaskDragStart}
          label="方案一"
          showDualAxis={showDualAxis}
        />

        {showDualSolutions && (
          <DropZone
            solutionId="solution-2"
            tasks={solutions?.solution2?.tasks || []}
            onDragOver={onDragOver}
            onDrop={(e, rect, id, y) => onTaskPlaced && onTaskPlaced(e, rect, 'solution-2', y)}
            onTaskDragStart={handlePlacedTaskDragStart}
            label="方案二"
            showDualAxis={showDualAxis}
          />
        )}
      </div>

      {!readOnly && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => onClearSolution && onClearSolution('solution-1')}
          >
            清空方案一
          </button>
          {showDualSolutions && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => onClearSolution && onClearSolution('solution-2')}
            >
              清空方案二
            </button>
          )}
          <button
            type="button"
            className={styles.resetBtn}
            onClick={onResetAll}
          >
            全部重置
          </button>
        </div>
      )}
    </div>
  );
}

export { TaskBlock, DropZone };
export default TaskBlockDnd;
