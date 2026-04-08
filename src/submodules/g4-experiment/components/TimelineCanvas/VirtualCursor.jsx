import styles from './TimelineCanvas.module.css';

export function VirtualCursor({ x, y, grabbing }) {
  return (
    <g transform={`translate(${x}, ${y})`} className={styles.cursorLayer}>
      <circle r="18" className={styles.cursorHalo} />
      <path
        className={styles.cursorIcon}
        d={
          grabbing
            ? 'M4 8C4 6.5 5 5.5 6.5 5.5C7.2 5.5 7.8 5.8 8.2 6.2C8.4 5 9.4 4 10.7 4C11.5 4 12.2 4.4 12.6 5C12.9 4 13.8 3.2 15 3.2C16.1 3.2 17 3.9 17.4 4.8C17.7 4.3 18.3 4 19 4C20.1 4 21 4.9 21 6V14C21 17.3 18.3 20 15 20H10C6.7 20 4 17.3 4 14V8Z'
            : 'M4 0L4 18L8 14L11 20L14 18L11 12L16 12L4 0Z'
        }
        transform={grabbing ? 'translate(-12,-10)' : 'translate(-8,-8)'}
      />
    </g>
  );
}

export default VirtualCursor;
