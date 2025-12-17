/**
 * 磁吸对齐算法
 */

export function calculateMagneticSnap(dropPos, existingTasks, newTaskWidth, threshold = 30) {
  if (!existingTasks || existingTasks.length === 0) {
    return { x: dropPos.x, snapped: false, alignType: null };
  }

  const snapPoints = [];

  existingTasks.forEach((task) => {
    const taskLeft = task.x;
    const taskRight = task.x + task.width;

    snapPoints.push({ x: taskLeft, alignType: 'left-left' });
    snapPoints.push({ x: taskRight, alignType: 'left-right' });
    snapPoints.push({ x: taskRight - newTaskWidth, alignType: 'right-right' });
    snapPoints.push({ x: taskLeft - newTaskWidth, alignType: 'right-left' });
  });

  let nearest = { x: dropPos.x, dist: Infinity, alignType: null, snapped: false };

  snapPoints.forEach((point) => {
    const dist = Math.abs(point.x - dropPos.x);
    if (dist < nearest.dist && dist < threshold) {
      nearest = { x: point.x, dist, alignType: point.alignType, snapped: true };
    }
  });

  return { x: nearest.x, snapped: nearest.snapped, alignType: nearest.alignType };
}

export function checkOverlap(newTask, existingTasks) {
  return existingTasks.some((task) => {
    const newRight = newTask.x + newTask.width;
    const taskRight = task.x + task.width;
    return !(newRight <= task.x || newTask.x >= taskRight);
  });
}

export default { calculateMagneticSnap, checkOverlap };
