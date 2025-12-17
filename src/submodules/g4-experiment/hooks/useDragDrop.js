import { useState, useCallback } from 'react';
import { calculateMagneticSnap } from '../components/TaskBlockDnd/MagneticSnap';

function generateCloneId(baseId) {
  return baseId + '-clone-' + Math.random().toString(36).substr(2, 8);
}

export function useDragDrop(onTaskPlaced, onTaskRemoved) {
  const [draggingTask, setDraggingTask] = useState(null);

  const handleDragStart = useCallback((e, taskData, isFromToolbar = false) => {
    setDraggingTask({ ...taskData, isFromToolbar });
    e.dataTransfer.effectAllowed = isFromToolbar ? 'copy' : 'move';
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggingTask?.isFromToolbar ? 'copy' : 'move';
  }, [draggingTask]);

  const handleDrop = useCallback((e, dropZoneRect, existingTasks, axisY = 0) => {
    e.preventDefault();
    if (!draggingTask) return null;

    const dropX = e.clientX - dropZoneRect.left;
    const { x: snappedX, snapped } = calculateMagneticSnap(
      { x: dropX },
      existingTasks.filter(t => t.y === axisY),
      draggingTask.width
    );

    const cloneId = draggingTask.isFromToolbar 
      ? generateCloneId(draggingTask.id)
      : draggingTask.cloneId;

    const placedTask = {
      ...draggingTask,
      cloneId,
      x: Math.max(0, snappedX),
      y: axisY,
    };

    if (onTaskPlaced) {
      onTaskPlaced(placedTask, snapped);
    }

    setDraggingTask(null);
    return placedTask;
  }, [draggingTask, onTaskPlaced]);

  const handleDragEnd = useCallback((e) => {
    if (draggingTask && !draggingTask.isFromToolbar && onTaskRemoved) {
      const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
      const isOverDropZone = dropTarget?.closest('[data-drop-zone]');
      if (!isOverDropZone) {
        onTaskRemoved(draggingTask.cloneId);
      }
    }
    setDraggingTask(null);
  }, [draggingTask, onTaskRemoved]);

  return {
    draggingTask,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}

export default useDragDrop;
