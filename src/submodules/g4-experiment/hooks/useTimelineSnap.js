import { useCallback } from 'react';

const DEFAULT_THRESHOLD = 25;

export function useTimelineSnap(threshold = DEFAULT_THRESHOLD) {
  const getSolutionInfo = useCallback(
    (y, solutionConfigs) => {
      for (const config of solutionConfigs) {
        if (Math.abs(y - config.mainY) < threshold) {
          return { solutionKey: config.key, snapY: config.mainY };
        }
        if (Math.abs(y - config.subY) < threshold) {
          return { solutionKey: config.key, snapY: config.subY };
        }
      }
      return { solutionKey: null, snapY: null };
    },
    [threshold]
  );

  const calculateSnapX = useCallback(
    (x, snapY, currentBlock, placedBlocks, excludeId) => {
      if (!snapY || !currentBlock) return x;

      let bestX = x;
      let minDiff = threshold;

      const sameRowTasks = placedBlocks.filter(
        b => b.cloneId !== excludeId && Math.abs(b.y - snapY) < threshold
      );

      if (Math.abs(x - 40) < threshold) {
        bestX = 40;
        minDiff = Math.abs(x - 40);
      }

      sameRowTasks.forEach(other => {
        const myWidth = currentBlock.width;

        const distLL = Math.abs(x - other.x);
        if (distLL < minDiff) {
          minDiff = distLL;
          bestX = other.x;
        }

        const distLR = Math.abs(x - (other.x + other.width));
        if (distLR < minDiff) {
          minDiff = distLR;
          bestX = other.x + other.width;
        }

        const targetRR = other.x + other.width - myWidth;
        const distRR = Math.abs(x - targetRR);
        if (distRR < minDiff) {
          minDiff = distRR;
          bestX = targetRR;
        }

        const targetRL = other.x - myWidth;
        const distRL = Math.abs(x - targetRL);
        if (distRL < minDiff) {
          minDiff = distRL;
          bestX = targetRL;
        }
      });

      return Math.max(40, bestX);
    },
    [threshold]
  );

  return { getSolutionInfo, calculateSnapX };
}

export default useTimelineSnap;
