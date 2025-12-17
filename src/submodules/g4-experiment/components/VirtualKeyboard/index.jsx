
import styles from './VirtualKeyboard.module.css';

const KEYBOARD_LAYOUT = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+'],
  ['Enter', 'C'],
];

export function VirtualKeyboard({ onKeyPress, onEnter, onClear }) {
  const handleKeyClick = (key) => {
    if (key === 'Enter') {
      onEnter && onEnter();
    } else if (key === 'C') {
      onClear && onClear();
    } else {
      onKeyPress && onKeyPress(key);
    }
  };

  return (
    <div className={styles.keyboard}>
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          {row.map((key) => (
            <button
              key={key}
              type="button"
              className={[styles.key, (key === 'Enter' || key === 'C') ? styles.specialKey : ''].join(' ')}
              onClick={() => handleKeyClick(key)}
            >
              {key === 'Enter' ? '换行' : key === 'C' ? '清除' : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default VirtualKeyboard;
