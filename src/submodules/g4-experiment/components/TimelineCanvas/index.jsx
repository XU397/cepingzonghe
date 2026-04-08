import { forwardRef } from 'react';
import { TimelineTaskBlock } from './TimelineTaskBlock';
import { VirtualCursor } from './VirtualCursor';
import styles from './TimelineCanvas.module.css';

const BLOCK_HEIGHT = 48;

export const TimelineCanvas = forwardRef(function TimelineCanvas(
  {
    width,
    height,
    initialBlocks,
    placedBlocks = [],
    draggingBlock = null,
    cursor = null,
    solutionZones = [],
    children,
    svgProps = {},
    onBlockPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
    disabled = false,
  },
  ref
) {
  return (
    <svg
      ref={ref}
      className={styles.svgCanvas}
      viewBox={`0 0 ${width} ${height}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      {...svgProps}
    >
      <title>任务条拖放区域</title>

      {solutionZones.map((zone, idx) => (
        <SolutionZone
          key={zone.key || idx}
          zone={zone}
          canvasWidth={width}
          blockHeight={BLOCK_HEIGHT}
        />
      ))}

      {initialBlocks.map(block => (
        <TimelineTaskBlock
          key={`source-${block.id}`}
          block={block}
          onPointerDown={disabled ? undefined : onBlockPointerDown}
          isDragging={false}
        />
      ))}

      {placedBlocks.map(block => (
        <TimelineTaskBlock
          key={block.cloneId}
          block={block}
          onPointerDown={
            disabled ? undefined : e => onBlockPointerDown?.(e, block, true, block.cloneId)
          }
          isDragging={false}
        />
      ))}

      {draggingBlock && !draggingBlock.isPlaced && (
        <TimelineTaskBlock
          block={draggingBlock}
          isDragging={true}
          style={{ pointerEvents: 'none', opacity: 0.8 }}
        />
      )}

      {cursor?.visible && <VirtualCursor x={cursor.x} y={cursor.y} grabbing={cursor.grabbing} />}

      {children}
    </svg>
  );
});

function SolutionZone({ zone, canvasWidth, blockHeight }) {
  const { key, mainY, subY, label, showTimeInput, timeInputProps } = zone;
  const threshold = 25;
  const zoneHeight = subY + blockHeight + threshold - mainY + threshold;

  return (
    <g key={key}>
      <rect
        x="20"
        y={mainY - threshold}
        width={canvasWidth - 40}
        height={zoneHeight}
        rx="14"
        className={styles.dropZoneRect}
      />
      <text x="28" y={mainY - threshold - 8} className={styles.zoneLabel}>
        {label}
      </text>
      <line
        x1="24"
        y1={mainY + blockHeight / 2}
        x2={canvasWidth - 24}
        y2={mainY + blockHeight / 2}
        className={styles.axisLine}
      />
      <line
        x1="24"
        y1={subY + blockHeight / 2}
        x2={canvasWidth - 24}
        y2={subY + blockHeight / 2}
        className={styles.axisLine}
      />
      {showTimeInput && timeInputProps && (
        <foreignObject x={canvasWidth - 200} y={subY + 8} width="180" height="40">
          <div xmlns="http://www.w3.org/1999/xhtml" className={styles.timeInputWrap}>
            <label htmlFor={`time-input-${key}`}>总用时：</label>
            <input
              id={`time-input-${key}`}
              type="text"
              inputMode="numeric"
              value={timeInputProps.value}
              onChange={timeInputProps.onChange}
              className={styles.timeInput}
              readOnly={timeInputProps.readOnly}
            />
            <span>分钟</span>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default TimelineCanvas;
