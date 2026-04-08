import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useG4Context } from '../context/G4Context';
import { TASK_BLOCKS } from '../constants/taskBlocks';
import { EventTypes } from '../constants/eventTypes';
import { TimelineCanvas } from '../components/TimelineCanvas';
import { useTimelineDragDrop } from '../hooks/useTimelineDragDrop';
import styles from './Page08_SolutionDesign.module.css';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 580;
const INITIAL_Y = 25;

const ORDER_LABELS = {
  'task-1': '①',
  'task-2': '②',
  'task-3': '③',
  'task-4': '④',
  'task-5': '⑤',
};

const SOLUTION_CONFIGS = [
  { key: 'solution1', mainY: 145, subY: 215 },
  { key: 'solution2', mainY: 375, subY: 445 },
];

export function Page08_SolutionDesign() {
  const { logOperation, collectAnswer } = useG4Context();

  const [solutions, setSolutions] = useState({
    solution1: { tasks: [], userInputTime: '' },
    solution2: { tasks: [], userInputTime: '' },
  });

  const svgRef = useRef(null);
  const latestAnswerRef = useRef({ solution1: '', solution2: '' });

  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_08_方案设计',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_08_方案设计',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  useEffect(() => {
    const solution1Value = JSON.stringify(solutions.solution1);
    const solution2Value = JSON.stringify(solutions.solution2);

    if (latestAnswerRef.current.solution1 !== solution1Value) {
      collectAnswer({ targetElement: '方案一', value: solution1Value });
      latestAnswerRef.current.solution1 = solution1Value;
    }

    if (latestAnswerRef.current.solution2 !== solution2Value) {
      collectAnswer({ targetElement: '方案二', value: solution2Value });
      latestAnswerRef.current.solution2 = solution2Value;
    }
  }, [collectAnswer, solutions]);

  const initialBlocks = useMemo(() => {
    let x = 40;
    const gap = 20;
    return TASK_BLOCKS.map(task => {
      const pos = { ...task, x, y: INITIAL_Y, label: ORDER_LABELS[task.id] };
      x += task.width + gap;
      return pos;
    });
  }, []);

  const handleTaskPlaced = useCallback(
    (solutionKey, taskInfo) => {
      logOperation({
        targetElement: `${solutionKey}_任务条`,
        eventType: EventTypes.TASK_DROP,
        value: JSON.stringify({
          taskId: taskInfo.taskId,
          x: Math.round(taskInfo.x),
          y: Math.round(taskInfo.y),
        }),
        time: new Date().toISOString(),
      });
    },
    [logOperation]
  );

  const handleDragStart = useCallback(
    (taskId, isPlaced) => {
      logOperation({
        targetElement: isPlaced ? '已放置任务条' : '任务条',
        eventType: EventTypes.DRAG_START,
        value: taskId,
        time: new Date().toISOString(),
      });
    },
    [logOperation]
  );

  const {
    placedBlocks,
    draggingBlock,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
  } = useTimelineDragDrop(svgRef, SOLUTION_CONFIGS, handleTaskPlaced, null, handleDragStart, false);

  const handleTimeInput = useCallback((solutionKey, value) => {
    const normalizedValue = value.replace(/\D/g, '').slice(0, 3);
    setSolutions(prev => ({
      ...prev,
      [solutionKey]: { ...prev[solutionKey], userInputTime: normalizedValue },
    }));
  }, []);

  const handleBlockPointerDown = useCallback(
    (e, block, isPlaced = false, cloneId = null) => {
      handlePointerDown(e, block, isPlaced, cloneId);
    },
    [handlePointerDown]
  );

  const solutionZones = SOLUTION_CONFIGS.map(config => ({
    key: config.key,
    mainY: config.mainY,
    subY: config.subY,
    label: config.key === 'solution1' ? '方案一（请拖入此处）' : '方案二（请拖入此处）',
    showTimeInput: true,
    timeInputProps: {
      value: solutions[config.key].userInputTime,
      onChange: e => handleTimeInput(config.key, e.target.value),
      readOnly: false,
    },
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleBadge}>7</span>
          <h1 className={styles.title}>火车购票：出发时间</h1>
        </div>
        <p className={styles.prompt}>请你拖动长方条，帮小明设计两种不同的事情安排方案吧。</p>
        <p className={styles.taskDesc}>
          <span className={styles.taskBlue}>① 洗水壶（1分钟）</span>
          <span className={styles.taskOrange}>② 用水壶烧热水（10分钟）</span>
          <span className={styles.taskGray}>③ 灌水到保温杯（2分钟）</span>
          <span className={styles.taskGreen}>④ 整理背包（2分钟）</span>
          <span className={styles.taskPink}>⑤ 吃早饭（6分钟）</span>
        </p>
      </div>

      <div className={styles.svgPanel}>
        <TimelineCanvas
          ref={svgRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          initialBlocks={initialBlocks}
          placedBlocks={placedBlocks}
          draggingBlock={draggingBlock}
          solutionZones={solutionZones}
          onBlockPointerDown={handleBlockPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          disabled={false}
          svgProps={{
            className: styles.svgCanvas,
            'aria-label': '任务条拖放区域',
          }}
        />
      </div>
    </div>
  );
}

export default Page08_SolutionDesign;
