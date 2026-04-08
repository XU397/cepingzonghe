import { useState, useCallback, useRef } from 'react';

const BLOCK_HEIGHT = 48;

export function useTimelineDragDrop(
  svgRef,
  solutionConfigs,
  onTaskPlaced,
  onTaskRemoved,
  onDragStart,
  disabled = false
) {
  const [placedBlocks, setPlacedBlocks] = useState([]);
  const [draggingBlock, setDraggingBlock] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const placedBlocksRef = useRef([]);
  const threshold = 25;

  const updatePlacedBlocksRef = useCallback(newBlocks => {
    placedBlocksRef.current = newBlocks;
  }, []);

  const getSvgPoint = useCallback(
    e => {
      if (!svgRef?.current) return null;
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
      return { x: svgP.x, y: svgP.y };
    },
    [svgRef]
  );

  const getSolutionInfo = useCallback(
    y => {
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
    [solutionConfigs]
  );

  const calculateSnapX = useCallback((x, snapY, currentBlock, excludeId) => {
    if (!snapY || !currentBlock) return x;

    let bestX = x;
    let minDiff = threshold;

    const sameRowTasks = placedBlocksRef.current.filter(
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
  }, []);

  const handlePointerDown = useCallback(
    (e, block, isPlaced = false, cloneId = null) => {
      if (disabled) return;

      const svgP = getSvgPoint(e);
      if (!svgP) return;

      const dragBlock = isPlaced ? placedBlocksRef.current.find(b => b.cloneId === cloneId) : block;

      if (!dragBlock) return;

      setDraggingBlock({
        ...dragBlock,
        isPlaced,
        cloneId: cloneId || `${block.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      });
      setOffset({ x: svgP.x - dragBlock.x, y: svgP.y - dragBlock.y });

      if (onDragStart) {
        onDragStart(dragBlock.id, isPlaced);
      }

      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [disabled, getSvgPoint, onDragStart]
  );

  const handlePointerMove = useCallback(
    e => {
      if (!draggingBlock || disabled) return;

      const svgP = getSvgPoint(e);
      if (!svgP) return;

      setDraggingBlock(prev => ({
        ...prev,
        x: svgP.x - offset.x,
        y: svgP.y - offset.y,
      }));
    },
    [draggingBlock, disabled, getSvgPoint, offset]
  );

  const handlePointerUp = useCallback(
    e => {
      if (!draggingBlock) return;

      const { solutionKey, snapY } = getSolutionInfo(draggingBlock.y);

      if (solutionKey && snapY) {
        const snappedX = calculateSnapX(
          draggingBlock.x,
          snapY,
          draggingBlock,
          draggingBlock.cloneId
        );

        const newBlock = {
          ...draggingBlock,
          x: snappedX,
          y: snapY,
        };

        setPlacedBlocks(prev => {
          const filtered = prev.filter(b => b.cloneId !== draggingBlock.cloneId);
          const updated = [...filtered, newBlock];
          placedBlocksRef.current = updated;
          return updated;
        });

        if (onTaskPlaced) {
          setTimeout(() => {
            onTaskPlaced(solutionKey, {
              taskId: draggingBlock.id,
              x: Math.round(snappedX),
              y: Math.round(snapY),
              width: draggingBlock.width,
              duration: draggingBlock.duration,
            });
          }, 0);
        }
      } else if (draggingBlock.isPlaced) {
        setPlacedBlocks(prev => {
          const filtered = prev.filter(b => b.cloneId !== draggingBlock.cloneId);
          placedBlocksRef.current = filtered;

          if (onTaskRemoved) {
            onTaskRemoved(draggingBlock.cloneId);
          }

          return filtered;
        });
      }

      setDraggingBlock(null);
      if (e.currentTarget) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    [draggingBlock, getSolutionInfo, calculateSnapX, onTaskPlaced, onTaskRemoved]
  );

  const handlePointerLeave = useCallback(
    e => {
      if (draggingBlock) {
        handlePointerUp(e);
      }
    },
    [draggingBlock, handlePointerUp]
  );

  const reset = useCallback(() => {
    setPlacedBlocks([]);
    setDraggingBlock(null);
    placedBlocksRef.current = [];
  }, []);

  const getSolutionTasks = useCallback(
    solutionKey => {
      const config = solutionConfigs.find(c => c.key === solutionKey);
      if (!config) return [];

      return placedBlocksRef.current.filter(
        b => Math.abs(b.y - config.mainY) < threshold || Math.abs(b.y - config.subY) < threshold
      );
    },
    [solutionConfigs]
  );

  return {
    placedBlocks,
    draggingBlock,
    placedBlocksRef,
    updatePlacedBlocksRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    reset,
    getSolutionTasks,
    BLOCK_HEIGHT,
  };
}

export default useTimelineDragDrop;
