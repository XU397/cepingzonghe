import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './SvgTaskDnd.module.css';

const DEFAULT_CANVAS_WIDTH = 1000;
const DEFAULT_CANVAS_HEIGHT = 280;
const DEFAULT_INITIAL_Y = 20;
const DEFAULT_MAIN_AXIS_Y = 130;
const DEFAULT_SUB_AXIS_Y = 190;
const DEFAULT_START_X = 40;
const SNAP_THRESHOLD = 30;
const BLOCK_HEIGHT = 48;

export function SvgTaskDnd({
  tasks = [],
  onTaskPlaced,
  onSolutionChange,
  onDemoPlay,
  onDemoComplete,
  showDualSolutions = true,
  enableManualDrag = true,
  enableDemo = true,
  demoSteps = [],
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  initialY = DEFAULT_INITIAL_Y,
  mainAxisY = DEFAULT_MAIN_AXIS_Y,
  subAxisY = DEFAULT_SUB_AXIS_Y,
  startX = DEFAULT_START_X,
  showTotalTimeInput = false,
  totalTimeValue = '',
  onTotalTimeChange,
  readOnly = false,
  className = '',
}) {
  const [blocks, setBlocks] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursor, setCursor] = useState({
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    visible: false,
    grabbing: false,
  });

  const blocksRef = useRef([]);
  const svgRef = useRef(null);

  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  const initialBlocks = useMemo(() => {
    let currentX = startX;
    const gap = 20;

    return tasks.map(task => {
      const x = currentX;
      currentX += task.width + gap;

      return {
        ...task,
        x,
        y: initialY,
        initialX: x,
        initialY,
      };
    });
  }, [tasks, startX, initialY]);

  const resetBlocks = useCallback(() => {
    setBlocks(initialBlocks.map(b => ({ ...b })));
    setCursor({
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      visible: false,
      grabbing: false,
    });
    setIsPlaying(false);
  }, [initialBlocks, canvasWidth, canvasHeight]);

  useEffect(() => {
    resetBlocks();
  }, [resetBlocks]);

  const calculateSnap = useCallback(
    (x, y, currentBlock) => {
      let newX = x;
      let newY = y;
      let isSnappedY = false;

      if (Math.abs(newY - mainAxisY) < SNAP_THRESHOLD) {
        newY = mainAxisY;
        isSnappedY = true;
      } else if (showDualSolutions && Math.abs(newY - subAxisY) < SNAP_THRESHOLD) {
        newY = subAxisY;
        isSnappedY = true;
      } else if (Math.abs(newY - initialY) < SNAP_THRESHOLD) {
        newY = initialY;
      }

      if (isSnappedY && currentBlock) {
        let bestX = newX;
        let minDiff = SNAP_THRESHOLD;
        let foundSnap = false;

        if (Math.abs(newX - startX) < SNAP_THRESHOLD) {
          bestX = startX;
          minDiff = Math.abs(newX - startX);
          foundSnap = true;
        }

        blocksRef.current.forEach(otherBlock => {
          if (otherBlock.id === currentBlock.id) return;
          if (otherBlock.y < mainAxisY - SNAP_THRESHOLD) return;

          const otherLeft = otherBlock.x;
          const otherRight = otherBlock.x + otherBlock.width;
          const myWidth = currentBlock.width;

          const distLL = Math.abs(newX - otherLeft);
          if (distLL < minDiff) {
            minDiff = distLL;
            bestX = otherLeft;
            foundSnap = true;
          }

          const distLR = Math.abs(newX - otherRight);
          if (distLR < minDiff) {
            minDiff = distLR;
            bestX = otherRight;
            foundSnap = true;
          }

          const targetX_RR = otherRight - myWidth;
          const distRR = Math.abs(newX - targetX_RR);
          if (distRR < minDiff) {
            minDiff = distRR;
            bestX = targetX_RR;
            foundSnap = true;
          }

          const targetX_RL = otherLeft - myWidth;
          const distRL = Math.abs(newX - targetX_RL);
          if (distRL < minDiff) {
            minDiff = distRL;
            bestX = targetX_RL;
            foundSnap = true;
          }
        });

        if (foundSnap) {
          newX = bestX;
        }
      }

      return { x: newX, y: newY };
    },
    [mainAxisY, subAxisY, initialY, startX, showDualSolutions]
  );

  const getSvgPoint = useCallback(e => {
    if (!svgRef.current) return null;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const handlePointerDown = useCallback(
    (e, blockId) => {
      if (isPlaying || readOnly || !enableManualDrag) return;

      const block = blocksRef.current.find(b => b.id === blockId);
      if (!block) return;

      const svgP = getSvgPoint(e);
      if (!svgP) return;

      setDraggingId(blockId);
      setOffset({ x: svgP.x - block.x, y: svgP.y - block.y });

      setBlocks(prev => {
        const target = prev.find(b => b.id === blockId);
        if (!target) return prev;
        return [...prev.filter(b => b.id !== blockId), target];
      });

      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [isPlaying, readOnly, enableManualDrag, getSvgPoint]
  );

  const handlePointerMove = useCallback(
    e => {
      if (draggingId === null || isPlaying) return;

      const svgP = getSvgPoint(e);
      if (!svgP) return;

      setBlocks(prev =>
        prev.map(b => {
          if (b.id === draggingId) {
            return { ...b, x: svgP.x - offset.x, y: svgP.y - offset.y };
          }
          return b;
        })
      );
    },
    [draggingId, isPlaying, getSvgPoint, offset]
  );

  const handlePointerUp = useCallback(
    e => {
      if (draggingId === null) return;

      const draggingBlock = blocksRef.current.find(b => b.id === draggingId);
      if (draggingBlock) {
        const { x: snappedX, y: snappedY } = calculateSnap(
          draggingBlock.x,
          draggingBlock.y,
          draggingBlock
        );

        let solutionKey = null;
        if (snappedY === mainAxisY || snappedY === subAxisY) {
          solutionKey = 'solution1';
        }

        setBlocks(prev =>
          prev.map(b => (b.id === draggingId ? { ...b, x: snappedX, y: snappedY } : b))
        );

        if (onTaskPlaced && solutionKey) {
          onTaskPlaced(draggingId, snappedX, snappedY, solutionKey);
        }
        if (onSolutionChange) {
          onSolutionChange(blocksRef.current);
        }
      }

      setDraggingId(null);
      if (e.currentTarget) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    [draggingId, calculateSnap, mainAxisY, subAxisY, onTaskPlaced, onSolutionChange]
  );

  const handlePointerLeave = useCallback(
    e => {
      if (draggingId !== null) {
        handlePointerUp(e);
      }
    },
    [draggingId, handlePointerUp]
  );

  const wait = useCallback(ms => new Promise(resolve => window.setTimeout(resolve, ms)), []);

  const animateMove = useCallback(async (blockId, targetX, targetY, duration = 800) => {
    const start = performance.now();
    const currentBlock = blocksRef.current.find(item => item.id === blockId);

    if (!currentBlock) return;

    const { x: startX, y: startY, width } = currentBlock;

    return new Promise(resolve => {
      const animate = time => {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;

        const currentX = startX + (targetX - startX) * ease;
        const currentY = startY + (targetY - startY) * ease;

        setBlocks(prev =>
          prev.map(b => (b.id === blockId ? { ...b, x: currentX, y: currentY } : b))
        );

        setCursor(prev => ({ ...prev, x: currentX + width / 2, y: currentY + BLOCK_HEIGHT / 2 }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }, []);

  const animateCursor = useCallback(
    async (targetX, targetY, duration = 500) => {
      const start = performance.now();

      return new Promise(resolve => {
        const startCursor = { ...cursor };

        const animate = time => {
          const elapsed = time - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = progress * (2 - progress);

          const currentX = startCursor.x + (targetX - startCursor.x) * ease;
          const currentY = startCursor.y + (targetY - startCursor.y) * ease;

          setCursor(prev => ({ ...prev, x: currentX, y: currentY }));

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(animate);
      });
    },
    [cursor]
  );

  const playDemo = useCallback(async () => {
    if (isPlaying || !enableDemo) return;

    setIsPlaying(true);
    resetBlocks();

    if (onDemoPlay) {
      onDemoPlay();
    }

    await wait(100);
    setCursor(prev => ({ ...prev, visible: true, grabbing: false }));

    for (const step of demoSteps) {
      const current = blocksRef.current.find(item => item.id === step.id);
      if (!current) continue;

      await animateCursor(current.x + current.width / 2, current.y + BLOCK_HEIGHT / 2);
      setCursor(prev => ({ ...prev, grabbing: true }));
      await wait(160);

      await animateMove(step.id, step.x, step.y);

      setCursor(prev => ({ ...prev, grabbing: false }));
      await wait(240);
    }

    setCursor(prev => ({ ...prev, visible: false, grabbing: false }));
    setIsPlaying(false);

    if (onDemoComplete) {
      onDemoComplete();
    }
  }, [
    isPlaying,
    enableDemo,
    resetBlocks,
    onDemoPlay,
    onDemoComplete,
    wait,
    animateCursor,
    animateMove,
    demoSteps,
  ]);

  return (
    <div className={`${styles.container} ${className}`}>
      {enableDemo && (
        <div className={styles.controls}>
          <button type="button" className={styles.playBtn} onClick={playDemo} disabled={isPlaying}>
            {isPlaying ? '演示中...' : '播放演示'}
          </button>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={resetBlocks}
            disabled={isPlaying}
          >
            重置
          </button>
        </div>
      )}

      <div className={styles.svgPanel}>
        <svg
          ref={svgRef}
          className={styles.svgCanvas}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          onPointerMove={enableManualDrag ? handlePointerMove : undefined}
          onPointerUp={enableManualDrag ? handlePointerUp : undefined}
          onPointerLeave={enableManualDrag ? handlePointerLeave : undefined}
          aria-label="任务条拖放区域"
        >
          <title>任务条拖放区域</title>

          <rect
            x="20"
            y={mainAxisY - SNAP_THRESHOLD}
            width={canvasWidth - 40}
            height={subAxisY + BLOCK_HEIGHT + SNAP_THRESHOLD - mainAxisY + SNAP_THRESHOLD}
            rx="14"
            className={styles.dropZoneRect}
          />
          <text x="28" y={mainAxisY - SNAP_THRESHOLD - 8} className={styles.zoneLabel}>
            时间安排区（{enableManualDrag ? '请拖入此处' : '演示区域'}）
          </text>

          <line
            x1="24"
            y1={mainAxisY + BLOCK_HEIGHT / 2}
            x2={canvasWidth - 24}
            y2={mainAxisY + BLOCK_HEIGHT / 2}
            className={styles.axisLine}
          />
          {showDualSolutions && (
            <line
              x1="24"
              y1={subAxisY + BLOCK_HEIGHT / 2}
              x2={canvasWidth - 24}
              y2={subAxisY + BLOCK_HEIGHT / 2}
              className={styles.axisLine}
            />
          )}

          {blocks.map(block => (
            <g
              key={block.id}
              transform={`translate(${block.x}, ${block.y})`}
              className={`${styles.blockGroup} ${enableManualDrag && !readOnly && !isPlaying ? styles.draggable : ''}`}
              onPointerDown={e => handlePointerDown(e, block.id)}
            >
              <rect
                width={block.width}
                height={BLOCK_HEIGHT}
                rx="6"
                fill={block.color}
                className={styles.blockRect}
              />
              <text
                x={block.width / 2}
                y={BLOCK_HEIGHT / 2 + 8}
                textAnchor="middle"
                className={styles.blockText}
              >
                {block.label}
              </text>
            </g>
          ))}

          {cursor.visible && (
            <g transform={`translate(${cursor.x}, ${cursor.y})`} className={styles.cursorLayer}>
              <circle r="18" className={styles.cursorHalo} />
              <path
                className={styles.cursorIcon}
                d={
                  cursor.grabbing
                    ? 'M4 8C4 6.5 5 5.5 6.5 5.5C7.2 5.5 7.8 5.8 8.2 6.2C8.4 5 9.4 4 10.7 4C11.5 4 12.2 4.4 12.6 5C12.9 4 13.8 3.2 15 3.2C16.1 3.2 17 3.9 17.4 4.8C17.7 4.3 18.3 4 19 4C20.1 4 21 4.9 21 6V14C21 17.3 18.3 20 15 20H10C6.7 20 4 17.3 4 14V8Z'
                    : 'M4 0L4 18L8 14L11 20L14 18L11 12L16 12L4 0Z'
                }
                transform={cursor.grabbing ? 'translate(-12,-10)' : 'translate(-8,-8)'}
              />
            </g>
          )}
        </svg>

        {showTotalTimeInput && (
          <div className={styles.totalTime}>
            <label htmlFor="svg-total-time">总用时：</label>
            <input
              id="svg-total-time"
              className={styles.timeInput}
              value={totalTimeValue}
              onChange={e => onTotalTimeChange && onTotalTimeChange(e.target.value)}
              readOnly={readOnly}
              aria-label="总用时输入框"
              placeholder="--"
            />
            <span>分钟</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SvgTaskDnd;
