import styles from './VirtualKeyboard.module.css';

const KEYBOARD_LAYOUT = [
  ['0', '6', '+'],
  ['1', '7', '-'],
  ['2', '8', '×'],
  ['3', '9', '÷'],
  ['4', '.', '='],
  ['5', '↵'],
];

export function VirtualKeyboard({ onKeyPress, onEnter }) {
  const handleKeyClick = key => {
    if (key === '↵') {
      onEnter && onEnter();
    } else {
      onKeyPress && onKeyPress(key);
    }
  };

  return (
    <div className={styles.keyboard}>
      {KEYBOARD_LAYOUT.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          {row.map(key => (
            <button
              key={key}
              type="button"
              className={[
                styles.key,
                key === '↵' ? styles.enterKey : '',
                ['+', '-', '×', '÷'].includes(key) ? styles.operatorKey : '',
                key === '=' ? styles.equalsKey : '',
              ].join(' ')}
              onClick={() => handleKeyClick(key)}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

export default VirtualKeyboard;
