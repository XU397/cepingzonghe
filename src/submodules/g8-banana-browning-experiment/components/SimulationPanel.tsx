import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import type { OperationLog } from '../types';
import styles from './SimulationPanel.module.css';

interface SimulationPanelProps {
  logOperation: (operation: Omit<OperationLog, 'code'>) => void;
  targetPrefix: string;
}

interface ConditionConfig {
  id: string;
  origin: string;
  temperature: string;
}

const DAYS = [0, 3, 6, 9, 12, 15] as const;

const CONDITIONS: ConditionConfig[] = [
  { id: 'hainan-2', origin: '海南', temperature: '2℃' },
  { id: 'hainan-10', origin: '海南', temperature: '10℃' },
  { id: 'hainan-18', origin: '海南', temperature: '18℃' },
  { id: 'philippines-2', origin: '菲律宾', temperature: '2℃' },
  { id: 'philippines-10', origin: '菲律宾', temperature: '10℃' },
  { id: 'philippines-18', origin: '菲律宾', temperature: '18℃' },
];

const RESULT_TABLE: Record<(typeof DAYS)[number], number[]> = {
  0: [0, 0, 0, 0, 0, 0],
  3: [0.05, 0.03, 0.04, 0.03, 0.02, 0.03],
  6: [0.35, 0.04, 0.06, 0.65, 0.03, 0.05],
  9: [0.8, 0.05, 0.08, 0.9, 0.04, 0.07],
  12: [1, 0.23, 0.4, 1, 0.1, 0.2],
  15: [1, 0.33, 0.46, 1, 0.25, 0.27],
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const buildSimulationResults = (day: (typeof DAYS)[number]) =>
  CONDITIONS.map((condition, index) => ({
    origin: condition.origin,
    temperature: condition.temperature,
    browning: RESULT_TABLE[day][index] ?? 0,
  }));

interface BrowningSpot {
  cx: number;
  cy: number;
  maxR: number;
  fill: string;
  threshold: number;
}

const BROWNING_SPOTS: BrowningSpot[] = [
  { cx: 280, cy: 440, maxR: 18, fill: '#3E2723', threshold: 0.02 },
  { cx: 350, cy: 480, maxR: 20, fill: '#3E2723', threshold: 0.03 },
  { cx: 480, cy: 400, maxR: 16, fill: '#3E2723', threshold: 0.04 },
  { cx: 220, cy: 380, maxR: 16, fill: '#3E2723', threshold: 0.05 },
  { cx: 550, cy: 320, maxR: 18, fill: '#3E2723', threshold: 0.06 },
  { cx: 400, cy: 450, maxR: 16, fill: '#3E2723', threshold: 0.07 },
  { cx: 320, cy: 510, maxR: 16, fill: '#3E2723', threshold: 0.08 },
  { cx: 440, cy: 430, maxR: 16, fill: '#3E2723', threshold: 0.09 },
  { cx: 300, cy: 460, maxR: 18, fill: '#3E2723', threshold: 0.1 },
  { cx: 510, cy: 370, maxR: 16, fill: '#3E2723', threshold: 0.11 },
  { cx: 250, cy: 420, maxR: 16, fill: '#3E2723', threshold: 0.12 },

  { cx: 260, cy: 445, maxR: 34, fill: '#3E2723', threshold: 0.13 },
  { cx: 370, cy: 490, maxR: 38, fill: '#3E2723', threshold: 0.16 },
  { cx: 490, cy: 410, maxR: 30, fill: '#3E2723', threshold: 0.19 },
  { cx: 340, cy: 465, maxR: 40, fill: '#3E2723', threshold: 0.22 },
  { cx: 430, cy: 445, maxR: 34, fill: '#3E2723', threshold: 0.25 },
  { cx: 560, cy: 340, maxR: 30, fill: '#3E2723', threshold: 0.28 },
  { cx: 310, cy: 480, maxR: 38, fill: '#3E2723', threshold: 0.31 },
  { cx: 470, cy: 455, maxR: 34, fill: '#3E2723', threshold: 0.34 },

  { cx: 290, cy: 460, maxR: 50, fill: '#3E2723', threshold: 0.38 },
  { cx: 400, cy: 475, maxR: 55, fill: '#1C1917', threshold: 0.42 },
  { cx: 520, cy: 385, maxR: 44, fill: '#3E2723', threshold: 0.46 },
  { cx: 350, cy: 500, maxR: 52, fill: '#1C1917', threshold: 0.5 },
  { cx: 450, cy: 440, maxR: 58, fill: '#1C1917', threshold: 0.54 },
  { cx: 240, cy: 430, maxR: 42, fill: '#3E2723', threshold: 0.58 },
  { cx: 570, cy: 335, maxR: 46, fill: '#1C1917', threshold: 0.62 },

  { cx: 330, cy: 485, maxR: 68, fill: '#1C1917', threshold: 0.68 },
  { cx: 440, cy: 455, maxR: 74, fill: '#1C1917', threshold: 0.73 },
  { cx: 500, cy: 405, maxR: 62, fill: '#1C1917', threshold: 0.78 },
  { cx: 270, cy: 445, maxR: 66, fill: '#1C1917', threshold: 0.83 },
  { cx: 380, cy: 505, maxR: 72, fill: '#1C1917', threshold: 0.88 },
  { cx: 560, cy: 350, maxR: 56, fill: '#1C1917', threshold: 0.93 },
];

const OVERLAY_START = 0.85;
const OVERLAY_MAX = 0.85;

const spotRadius = (spot: BrowningSpot, browning: number): number => {
  if (browning < spot.threshold) return 0;
  const progress = Math.min(1, (browning - spot.threshold) / 0.12);
  return spot.maxR * (0.45 + progress * 0.55);
};

const spotOpacity = (spot: BrowningSpot, browning: number): number => {
  if (browning < spot.threshold) return 0;
  const progress = Math.min(1, (browning - spot.threshold) / 0.15);
  return 0.65 + progress * 0.35;
};

const overlayOpacity = (browning: number): number => {
  if (browning < OVERLAY_START) return 0;
  return OVERLAY_MAX * Math.min(1, (browning - OVERLAY_START) / (1 - OVERLAY_START));
};
const BananaSvg: React.FC<{ browning: number; label: string }> = ({ browning, label }) => {
  const skinGradId = `skin-${label}`;
  const clipId = `clip-${label}`;
  const shadowFilterId = `shblur-${label}`;

  return (
    <svg
      className={styles.bananaSvg}
      viewBox="270 -25 425 660"
      role="img"
      aria-label={`${label}香蕉黑变比例${formatPercent(browning)}`}
    >
      <defs>
        <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="15" />
        </filter>

        <linearGradient id={skinGradId} x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="40%" stopColor="#FACC15" />
          <stop offset="90%" stopColor="#CA8A04" />
        </linearGradient>

        <clipPath id={clipId}>
          <path d="M 150,370 C 280,600 540,560 650,300 Q 655,250 620,220 C 480,410 300,420 160,330 Q 140,350 150,370 Z" />
        </clipPath>
      </defs>

      <ellipse
        cx="400"
        cy="580"
        rx="120"
        ry="18"
        fill="#D97706"
        opacity={0.12 + browning * 0.13}
        filter={`url(#${shadowFilterId})`}
      />
      <ellipse
        cx="395"
        cy="580"
        rx="70"
        ry="10"
        fill="#92400E"
        opacity={0.15 + browning * 0.15}
        filter={`url(#${shadowFilterId})`}
      />

      <g transform="translate(0, 20) rotate(-75 400 300)">
        <path d="M 620,220 Q 645,160 665,140 L 700,155 Q 680,210 645,295 Z" fill="#84CC16" />
        <path
          d="M 620,220 Q 645,160 665,140 L 700,155 Q 680,210 645,295 Z"
          fill="#65A30D"
          opacity="0.6"
        />
        <polygon points="665,140 700,155 695,165 655,150" fill="#3F2723" />

        <path d="M 150,370 L 125,375 L 130,325 L 160,330 Z" fill="#3F2723" />

        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="0" width="800" height="600" fill={`url(#${skinGradId})`} />

          <path
            d="M 155,360 C 300,530 530,510 645,280"
            fill="none"
            stroke="#A16207"
            strokeWidth="4"
            opacity="0.6"
          />
          <path
            d="M 160,345 C 310,440 500,430 635,240"
            fill="none"
            stroke="#FEF08A"
            strokeWidth="6"
            opacity="0.7"
          />

          {BROWNING_SPOTS.filter(s => spotRadius(s, browning) > 0).map(s => (
            <circle
              key={`s-${label}-${s.cx}-${s.cy}-${s.maxR}`}
              cx={s.cx}
              cy={s.cy}
              r={spotRadius(s, browning)}
              fill={s.fill}
              opacity={spotOpacity(s, browning)}
            />
          ))}

          {browning >= OVERLAY_START && (
            <rect
              x="0"
              y="0"
              width="800"
              height="600"
              fill="#151312"
              opacity={overlayOpacity(browning)}
            />
          )}
        </g>
      </g>
    </svg>
  );
};

const SimulationPanel: React.FC<SimulationPanelProps> = ({ logOperation, targetPrefix }) => {
  const [selectedDay, setSelectedDay] = useState<(typeof DAYS)[number]>(0);
  const [displayedResults, setDisplayedResults] = useState<number[]>(() => RESULT_TABLE[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  const selectedResults = useMemo(() => RESULT_TABLE[selectedDay], [selectedDay]);

  const cancelAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => () => cancelAnimation(), [cancelAnimation]);

  const currentDayIndex = useMemo(() => DAYS.indexOf(selectedDay), [selectedDay]);

  const handleDayIncrement = useCallback(() => {
    if (isAnimating || currentDayIndex >= DAYS.length - 1) return;
    const fromDay = selectedDay;
    const nextDay = DAYS[currentDayIndex + 1];
    setSelectedDay(nextDay);
    logOperation({
      targetElement: `${targetPrefix}天数增加按钮`,
      eventType: EventTypes.SIMULATION_OPERATION,
      value: { action: 'increment_day', fromDay, toDay: nextDay },
      time: new Date().toISOString(),
    });
  }, [isAnimating, currentDayIndex, logOperation, selectedDay, targetPrefix]);

  const handleDayDecrement = useCallback(() => {
    if (isAnimating || currentDayIndex <= 0) return;
    const fromDay = selectedDay;
    const prevDay = DAYS[currentDayIndex - 1];
    setSelectedDay(prevDay);
    logOperation({
      targetElement: `${targetPrefix}天数减少按钮`,
      eventType: EventTypes.SIMULATION_OPERATION,
      value: { action: 'decrement_day', fromDay, toDay: prevDay },
      time: new Date().toISOString(),
    });
  }, [isAnimating, currentDayIndex, logOperation, selectedDay, targetPrefix]);

  const animateResults = useCallback(
    (day: (typeof DAYS)[number], targets: number[]) => {
      cancelAnimation();
      setDisplayedResults(Array(CONDITIONS.length).fill(0));
      setIsAnimating(true);

      const duration = 1200;
      const startTime = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const nextValues = targets.map(value => Number((value * easedProgress).toFixed(4)));

        setDisplayedResults(nextValues);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        setDisplayedResults(targets);
        setIsAnimating(false);
        animationFrameRef.current = null;
        logOperation({
          targetElement: `${targetPrefix}实验结果`,
          eventType: EventTypes.SIMULATION_RUN_RESULT,
          value: {
            selectedDay: day,
            results: buildSimulationResults(day),
          },
          time: new Date().toISOString(),
        });
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    },
    [cancelAnimation, logOperation, targetPrefix]
  );

  const handleStart = useCallback(() => {
    logOperation({
      targetElement: `${targetPrefix}开始实验按钮`,
      eventType: EventTypes.SIMULATION_TIMING_STARTED,
      value: { selectedDay, totalConditions: CONDITIONS.length },
      time: new Date().toISOString(),
    });

    animateResults(selectedDay, selectedResults);
  }, [animateResults, logOperation, selectedDay, selectedResults, targetPrefix]);

  const handleReset = useCallback(() => {
    const fromDay = selectedDay;
    cancelAnimation();
    setIsAnimating(false);
    setSelectedDay(0);
    setDisplayedResults(RESULT_TABLE[0]);
    logOperation({
      targetElement: `${targetPrefix}重置按钮`,
      eventType: EventTypes.SIMULATION_OPERATION,
      value: { action: 'reset', fromDay, toDay: 0 },
      time: new Date().toISOString(),
    });
  }, [cancelAnimation, logOperation, selectedDay, targetPrefix]);

  return (
    <section className={styles.container} aria-label="香蕉变黑模拟实验面板">
      <div className={styles.groupsRow}>
        {[
          { label: '海南香蕉', start: 0 },
          { label: '菲律宾香蕉', start: 3 },
        ].map(group => (
          <div key={group.label} className={styles.originGroup}>
            <h3 className={styles.groupTitle}>{group.label}</h3>
            <div className={styles.groupCards}>
              {CONDITIONS.slice(group.start, group.start + 3).map((condition, i) => {
                const index = group.start + i;
                return (
                  <article key={condition.id} className={styles.conditionCard}>
                    <span className={styles.tempLabel}>恒温箱温度</span>
                    <span className={styles.temp}>{condition.temperature}</span>
                    <div className={styles.visualArea}>
                      <BananaSvg
                        browning={displayedResults[index] ?? 0}
                        label={`${condition.origin}${condition.temperature}`}
                      />
                    </div>
                    <div className={styles.percentageFrame}>
                      <span className={styles.percentageDisplay}>
                        {formatPercent(displayedResults[index] ?? 0)}
                      </span>
                      <span className={styles.percentageCaption}>黑变比例</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.controlsRow}>
        <button type="button" className={styles.btnReset} onClick={handleReset}>
          重置
        </button>

        <div className={styles.daySelector}>
          <button
            type="button"
            className={styles.dayAdjustButton}
            onClick={handleDayDecrement}
            disabled={isAnimating || currentDayIndex <= 0}
            aria-label="减少天数"
          >
            −
          </button>
          <span className={styles.dayDisplay}>
            <span className={styles.dayValue}>{selectedDay}</span>
            <span className={styles.dayUnit}>天</span>
          </span>
          <button
            type="button"
            className={styles.dayAdjustButton}
            onClick={handleDayIncrement}
            disabled={isAnimating || currentDayIndex >= DAYS.length - 1}
            aria-label="增加天数"
          >
            +
          </button>
        </div>

        <button
          type="button"
          className={styles.btnStart}
          onClick={handleStart}
          disabled={isAnimating}
        >
          {isAnimating ? '实验进行中...' : '开始实验'}
        </button>
      </div>
    </section>
  );
};

export default SimulationPanel;
