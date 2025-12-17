export const notEmpty = (value) => {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
};

export const positiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

export const positiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
};

export const integerRange = (value, min, max) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return false;
  if (typeof min === 'number' && parsed < min) return false;
  if (typeof max === 'number' && parsed > max) return false;
  return true;
};

const signature = (tasks = []) =>
  tasks
    .filter(Boolean)
    .map((task) => {
      const id = task.id || '';
      const cloneId = task.cloneId || '';
      const x = task.x ?? '';
      const y = task.y ?? '';
      return `${id}-${cloneId}-${x}-${y}`;
    })
    .join('|');

export const solutionsDifferent = (solutionA, solutionB) => {
  if (!solutionA || !solutionB) return false;
  const tasksA = Array.isArray(solutionA.tasks) ? solutionA.tasks : [];
  const tasksB = Array.isArray(solutionB.tasks) ? solutionB.tasks : [];
  if (tasksA.length === 0 && tasksB.length === 0) {
    return false;
  }
  if (signature(tasksA) !== signature(tasksB)) {
    return true;
  }
  return (solutionA.userInputTime ?? null) !== (solutionB.userInputTime ?? null);
};
