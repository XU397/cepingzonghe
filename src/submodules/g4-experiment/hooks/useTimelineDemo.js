import { useState, useCallback, useRef } from 'react';

export function useTimelineDemo(canvasWidth, canvasHeight) {
  const [blocks, setBlocks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cursor, setCursor] = useState({
    x: canvasWidth / 2,
    y: canvasHeight / 2,
    visible: false,
    grabbing: false,
  });

  const blocksRef = useRef([]);

  const updateBlocksRef = useCallback(newBlocks => {
    blocksRef.current = newBlocks;
  }, []);

  const wait = useCallback(ms => new Promise(resolve => window.setTimeout(resolve, ms)), []);

  const setTaskPosition = useCallback((taskId, x, y) => {
    setBlocks(prev => {
      const target = prev.find(item => item.id === taskId);
      if (!target) return prev;
      const rest = prev.filter(item => item.id !== taskId);
      return [...rest, { ...target, x, y }];
    });
  }, []);

  const animateCursor = useCallback(
    async (targetX, targetY, duration = 500) => {
      const start = performance.now();
      const from = { ...cursor };

      return new Promise(resolve => {
        const move = time => {
          const progress = Math.min((time - start) / duration, 1);
          const ease = progress * (2 - progress);

          setCursor(prev => ({
            ...prev,
            x: from.x + (targetX - from.x) * ease,
            y: from.y + (targetY - from.y) * ease,
          }));

          if (progress < 1) {
            requestAnimationFrame(move);
            return;
          }
          resolve();
        };

        requestAnimationFrame(move);
      });
    },
    [cursor]
  );

  const animateTaskMove = useCallback(
    async (taskId, targetX, targetY) => {
      const duration = 760;
      const start = performance.now();
      const block = blocksRef.current.find(item => item.id === taskId);

      if (!block) return;

      const { x: fromX, y: fromY, width } = block;

      return new Promise(resolve => {
        const move = time => {
          const progress = Math.min((time - start) / duration, 1);
          const ease = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;

          const currentX = fromX + (targetX - fromX) * ease;
          const currentY = fromY + (targetY - fromY) * ease;

          setTaskPosition(taskId, currentX, currentY);
          setCursor(prev => ({
            ...prev,
            x: currentX + width / 2,
            y: currentY + 24,
          }));

          if (progress < 1) {
            requestAnimationFrame(move);
            return;
          }
          resolve();
        };

        requestAnimationFrame(move);
      });
    },
    [setTaskPosition]
  );

  const playDemo = useCallback(
    async (initialBlocks, demoSteps, onDemoStart, onDemoComplete, onTimeInput) => {
      if (isPlaying) return;

      setIsPlaying(true);
      setBlocks(initialBlocks);
      blocksRef.current = initialBlocks;
      setCursor({
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        visible: true,
        grabbing: false,
      });

      if (onDemoStart) onDemoStart();

      await wait(120);

      for (const step of demoSteps) {
        const current = blocksRef.current.find(item => item.id === step.id);
        if (!current) continue;

        await animateCursor(current.x + current.width / 2, current.y + 24);
        setCursor(prev => ({ ...prev, grabbing: true }));
        await wait(160);
        await animateTaskMove(step.id, step.x, step.y);
        setCursor(prev => ({ ...prev, grabbing: false }));
        await wait(240);
      }

      if (onTimeInput) {
        await onTimeInput();
      }

      await wait(260);
      setCursor(prev => ({ ...prev, visible: false, grabbing: false }));
      setIsPlaying(false);

      if (onDemoComplete) onDemoComplete();
    },
    [isPlaying, canvasWidth, canvasHeight, wait, animateCursor, animateTaskMove]
  );

  const reset = useCallback(() => {
    setBlocks([]);
    setIsPlaying(false);
    setCursor({
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      visible: false,
      grabbing: false,
    });
  }, [canvasWidth, canvasHeight]);

  return {
    blocks,
    isPlaying,
    cursor,
    blocksRef,
    updateBlocksRef,
    playDemo,
    reset,
    setTaskPosition,
    animateCursor,
    animateTaskMove,
    wait,
  };
}

export default useTimelineDemo;
