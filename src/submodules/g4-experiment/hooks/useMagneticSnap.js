import { useCallback } from 'react';
import { calculateMagneticSnap } from '../components/TaskBlockDnd/MagneticSnap';

/**
 * useMagneticSnap - 磁吸对齐 Hook
 */
export function useMagneticSnap(threshold = 30) {
  const getSnappedPosition = useCallback((dropPos, existingTasks, newTaskWidth) => {
    return calculateMagneticSnap(dropPos, existingTasks, newTaskWidth, threshold);
  }, [threshold]);

  return { getSnappedPosition };
}

export default useMagneticSnap;
