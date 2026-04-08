import styles from './TimelineCanvas.module.css';

const BLOCK_HEIGHT = 48;

/**
 * TimelineTaskBlock - SVG 任务条组件
 * 用于在时间轴画布上渲染单个任务条
 */
export function TimelineTaskBlock({ block, onPointerDown, isDragging = false, style = {} }) {
  const handlePointerDown = e => {
    if (onPointerDown) {
      onPointerDown(e, block);
    }
  };

  return (
    <g
      transform={`translate(${block.x}, ${block.y})`}
      className={`${styles.blockGroup} ${!isDragging ? styles.draggable : ''}`}
      onPointerDown={handlePointerDown}
      style={style}
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
  );
}

export default TimelineTaskBlock;
