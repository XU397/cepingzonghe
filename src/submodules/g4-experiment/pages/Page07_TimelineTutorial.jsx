import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useG4Context } from '../context/G4Context';
import { TASK_BLOCKS } from '../constants/taskBlocks';
import { EventTypes } from '../constants/eventTypes';
import { TimelineCanvas } from '../components/TimelineCanvas';
import { useTimelineDemo } from '../hooks/useTimelineDemo';
import styles from './Page07_TimelineTutorial.module.css';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 280;
const INITIAL_Y = 20;
const MAIN_AXIS_Y = 130;
const SUB_AXIS_Y = 190;
const START_X = 40;

const ORDER_LABELS = {
  'task-1': '①',
  'task-2': '②',
  'task-3': '③',
  'task-4': '④',
  'task-5': '⑤',
};

const DEMO_STEPS = [
  { id: 'task-1', x: START_X, y: MAIN_AXIS_Y },
  { id: 'task-2', x: START_X + 40, y: MAIN_AXIS_Y },
  { id: 'task-4', x: START_X + 40, y: SUB_AXIS_Y },
  { id: 'task-5', x: START_X + 40 + 400, y: MAIN_AXIS_Y },
  { id: 'task-3', x: START_X + 40 + 400 + 240, y: MAIN_AXIS_Y },
];

export function Page07_TimelineTutorial() {
  const { logOperation } = useG4Context();
  const [totalTime, setTotalTime] = useState('');
  const svgRef = useRef(null);
  const timeInputRef = useRef(null);

  const initialBlocks = useMemo(() => {
    let currentX = 40;
    const gap = 20;

    return TASK_BLOCKS.map(task => {
      const x = currentX;
      currentX += task.width + gap;

      return {
        ...task,
        x,
        y: INITIAL_Y,
        label: ORDER_LABELS[task.id],
      };
    });
  }, []);

  const {
    blocks: demoBlocks,
    isPlaying,
    cursor,
    updateBlocksRef,
    playDemo,
    animateCursor,
    wait,
  } = useTimelineDemo(CANVAS_WIDTH, CANVAS_HEIGHT);

  useEffect(() => {
    updateBlocksRef(demoBlocks);
  }, [demoBlocks, updateBlocksRef]);

  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_07_拖拽演示',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_07_拖拽演示',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  const getInputSvgPosition = useCallback(() => {
    if (!svgRef.current || !timeInputRef.current) {
      return null;
    }

    const svgRect = svgRef.current.getBoundingClientRect();
    const inputRect = timeInputRef.current.getBoundingClientRect();

    const x =
      ((inputRect.left + inputRect.width / 2 - svgRect.left) / svgRect.width) * CANVAS_WIDTH;
    const y =
      ((inputRect.top + inputRect.height / 2 - svgRect.top) / svgRect.height) * CANVAS_HEIGHT;

    return { x, y };
  }, []);

  const handlePlayDemo = useCallback(async () => {
    if (isPlaying) return;

    const onDemoStart = () => {
      logOperation({
        targetElement: '演示按钮',
        eventType: EventTypes.DEMO_PLAY,
        value: 'play_demo',
        time: new Date().toISOString(),
      });
    };

    const onTimeInput = async () => {
      const inputPos = getInputSvgPosition();
      if (inputPos) {
        await animateCursor(inputPos.x, inputPos.y, 560);
      }

      if (timeInputRef.current) {
        timeInputRef.current.focus();
      }

      setTotalTime('');
      await wait(180);
      setTotalTime('1');
      await wait(200);
      setTotalTime('19');

      logOperation({
        targetElement: '总用时输入框',
        eventType: EventTypes.INPUT_CHANGE,
        value: '19',
        time: new Date().toISOString(),
      });
    };

    const onDemoComplete = () => {
      logOperation({
        targetElement: '演示区域',
        eventType: EventTypes.DEMO_COMPLETE,
        value: 'timeline_demo_completed',
        time: new Date().toISOString(),
      });
    };

    await playDemo(initialBlocks, DEMO_STEPS, onDemoStart, onDemoComplete, onTimeInput);
  }, [isPlaying, initialBlocks, playDemo, animateCursor, wait, getInputSvgPosition, logOperation]);

  const solutionZones = [
    {
      key: 'demo-zone',
      mainY: MAIN_AXIS_Y,
      subY: SUB_AXIS_Y,
      label: '时间安排区（请拖入此处）',
      showTimeInput: false,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.titleBadge}>6</span>
          <h1 className={styles.title}>火车购票：出发时间</h1>
        </div>
        <p className={styles.description}>
          小明还要思考从家出发的时间。起床后，他要完成以下5件事：
          <span className={styles.taskBlue}>① 洗水壶（1分钟）</span>
          <span className={styles.taskOrange}>② 用水壶烧热水（10分钟）</span>
          <span className={styles.taskGray}>③ 灌水到保温杯（2分钟）</span>
          <span className={styles.taskGreen}>④ 整理背包（2分钟）</span>
          <span className={styles.taskPink}>⑤ 吃早饭（6分钟）</span>。
        </p>
        <p className={styles.note}>
          【注】以下5个长方条分别代表上述①-⑤事件，其长度与事件所用时间对应，可拖动至作答区域完成方案设计。
        </p>
        <p className={`${styles.note} ${styles.noteWithBtn}`}>
          请点击
          <span className={styles.inlinePlayBtn}>播放演示</span>
          查看操作动画。动画表示：小明按①、②、⑤、③顺序依次完成4件事，在完成②的同时完成④，总用时为19分钟。
        </p>
      </div>

      <div className={styles.demoArea}>
        <div className={styles.svgPanel}>
          <TimelineCanvas
            ref={svgRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            initialBlocks={initialBlocks}
            placedBlocks={demoBlocks}
            cursor={cursor}
            solutionZones={solutionZones}
            disabled={true}
            svgProps={{
              className: styles.svgCanvas,
              'aria-label': '任务条拖拽演示',
            }}
          />

          <div className={styles.totalTime}>
            <label htmlFor="timeline-total-time">总用时：</label>
            <input
              id="timeline-total-time"
              ref={timeInputRef}
              className={styles.timeInput}
              value={totalTime}
              readOnly
              aria-label="总用时输入框"
              placeholder="--"
            />
            <span>分钟</span>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={handlePlayDemo}
          disabled={isPlaying}
        >
          {isPlaying ? '演示中...' : '播放演示'}
        </button>
      </div>
    </div>
  );
}

export default Page07_TimelineTutorial;
