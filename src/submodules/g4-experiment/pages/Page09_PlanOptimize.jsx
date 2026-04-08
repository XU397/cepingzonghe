import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useG4Context } from '../context/G4Context';
import { TASK_BLOCKS } from '../constants/taskBlocks';
import { EventTypes } from '../constants/eventTypes';
import { TimelineCanvas } from '../components/TimelineCanvas';
import { useTimelineDragDrop } from '../hooks/useTimelineDragDrop';
import styles from './Page09_PlanOptimize.module.css';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT_READONLY = 195;
const CANVAS_HEIGHT_INTERACTIVE = 300;
const MAIN_AXIS_Y_READONLY = 50;
const SUB_AXIS_Y_READONLY = 110;
const START_X = 40;

const ORDER_LABELS = {
  'task-1': '①',
  'task-2': '②',
  'task-3': '③',
  'task-4': '④',
  'task-5': '⑤',
};

const INTERACTIVE_SOLUTION_CONFIG = [{ key: 'improved', mainY: 145, subY: 215 }];

export function Page09_PlanOptimize() {
  const { logOperation, collectAnswer } = useG4Context();
  const [isOptimal, setIsOptimal] = useState(null);
  const [userInputTime, setUserInputTime] = useState('');
  const svgRef = useRef(null);

  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_09_方案评估',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_09_方案评估',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  useEffect(() => {
    if (isOptimal !== null) {
      collectAnswer({ targetElement: '方案最优', value: isOptimal ? '是' : '否' });
    }
  }, [collectAnswer, isOptimal]);

  const handleOptimalChange = useCallback(
    value => {
      setIsOptimal(value);
      logOperation({
        targetElement: '方案最优选择',
        eventType: EventTypes.RADIO_SELECT,
        value: value ? 'yes' : 'no',
        time: new Date().toISOString(),
      });
    },
    [logOperation]
  );

  const xiaomingPlacedBlocks = useMemo(() => {
    const positions = [];
    let currentX = START_X;

    positions.push({
      ...TASK_BLOCKS[3],
      cloneId: 'xm-task-4',
      x: currentX,
      y: MAIN_AXIS_Y_READONLY,
      label: ORDER_LABELS['task-4'],
    });
    currentX += TASK_BLOCKS[3].width;

    positions.push({
      ...TASK_BLOCKS[0],
      cloneId: 'xm-task-1',
      x: currentX,
      y: MAIN_AXIS_Y_READONLY,
      label: ORDER_LABELS['task-1'],
    });
    currentX += TASK_BLOCKS[0].width;

    const task2X = currentX;
    positions.push({
      ...TASK_BLOCKS[1],
      cloneId: 'xm-task-2',
      x: task2X,
      y: MAIN_AXIS_Y_READONLY,
      label: ORDER_LABELS['task-2'],
    });

    positions.push({
      ...TASK_BLOCKS[4],
      cloneId: 'xm-task-5',
      x: task2X,
      y: SUB_AXIS_Y_READONLY,
      label: ORDER_LABELS['task-5'],
    });

    currentX += TASK_BLOCKS[1].width;

    positions.push({
      ...TASK_BLOCKS[2],
      cloneId: 'xm-task-3',
      x: currentX,
      y: MAIN_AXIS_Y_READONLY,
      label: ORDER_LABELS['task-3'],
    });

    return positions;
  }, []);

  const xiaomingSolutionZones = [
    {
      key: 'xiaoming-solution',
      mainY: MAIN_AXIS_Y_READONLY,
      subY: SUB_AXIS_Y_READONLY,
      label: '',
      showTimeInput: true,
      timeInputProps: {
        value: '15',
        readOnly: true,
        onChange: () => {},
      },
    },
  ];

  const initialBlocks = useMemo(() => {
    let x = 40;
    const gap = 20;
    return TASK_BLOCKS.map(task => {
      const pos = { ...task, x, y: 25, label: ORDER_LABELS[task.id] };
      x += task.width + gap;
      return pos;
    });
  }, []);

  const handleTaskPlaced = useCallback(
    (solutionKey, taskInfo) => {
      logOperation({
        targetElement: '改进方案_任务条',
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
  } = useTimelineDragDrop(
    svgRef,
    INTERACTIVE_SOLUTION_CONFIG,
    handleTaskPlaced,
    null,
    handleDragStart,
    false
  );

  const handleTimeInput = useCallback(e => {
    const normalizedValue = e.target.value.replace(/\D/g, '').slice(0, 3);
    setUserInputTime(normalizedValue);
  }, []);

  useEffect(() => {
    if (isOptimal === false && placedBlocks.length > 0) {
      collectAnswer({
        targetElement: '改进方案',
        value: JSON.stringify({ tasks: placedBlocks, userInputTime }),
      });
    }
  }, [collectAnswer, isOptimal, placedBlocks, userInputTime]);

  const handleBlockPointerDown = useCallback(
    (e, block, isPlaced = false, cloneId = null) => {
      handlePointerDown(e, block, isPlaced, cloneId);
    },
    [handlePointerDown]
  );

  const interactiveSolutionZones = INTERACTIVE_SOLUTION_CONFIG.map(config => ({
    key: config.key,
    mainY: config.mainY,
    subY: config.subY,
    label: '改进方案（请拖入此处）',
    showTimeInput: true,
    timeInputProps: {
      value: userInputTime,
      onChange: handleTimeInput,
      readOnly: false,
    },
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleBadge}>8</span>
          <h1 className={styles.title}>火车购票：出发时间</h1>
        </div>
        <p className={styles.description}>如下图，小明也提出了一种安排方案。</p>
      </div>

      <div className={styles.xiaomingSolution}>
        <TimelineCanvas
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT_READONLY}
          initialBlocks={[]}
          placedBlocks={xiaomingPlacedBlocks}
          solutionZones={xiaomingSolutionZones}
          disabled={true}
          svgProps={{
            className: styles.svgCanvas,
            'aria-label': '小明的方案展示',
          }}
        />
      </div>

      <p className={styles.taskDesc}>
        <span className={styles.taskBlue}>① 洗水壶（1分钟）</span>
        <span className={styles.taskOrange}>② 用水壶烧热水（10分钟）</span>
        <span className={styles.taskGray}>③ 灌水到保温杯（2分钟）</span>
        <span className={styles.taskGreen}>④ 整理背包（2分钟）</span>
        <span className={styles.taskPink}>⑤ 吃早饭（6分钟）</span>
      </p>

      <p className={styles.questionInline}>
        请问小明的方案是否是用时最短的方案？
        <label className={styles.radioLabelInline}>
          <input
            type="radio"
            name="isOptimal"
            checked={isOptimal === true}
            onChange={() => handleOptimalChange(true)}
          />
          <span>是</span>
        </label>
        <label className={styles.radioLabelInline}>
          <input
            type="radio"
            name="isOptimal"
            checked={isOptimal === false}
            onChange={() => handleOptimalChange(false)}
          />
          <span>否</span>
        </label>
      </p>

      {isOptimal === false && (
        <div className={styles.improveSection}>
          <TimelineCanvas
            ref={svgRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT_INTERACTIVE}
            initialBlocks={initialBlocks}
            placedBlocks={placedBlocks}
            draggingBlock={draggingBlock}
            solutionZones={interactiveSolutionZones}
            onBlockPointerDown={handleBlockPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            disabled={false}
            svgProps={{
              className: styles.svgCanvas,
              'aria-label': '改进方案拖放区域',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Page09_PlanOptimize;
