
import styles from './MapInteractive.module.css';

function RouteButton({ routeId, label, isSelected, onClick }) {
  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick(routeId);
    }
  };

  return (
    <button
      type='button'
      className={`${styles.routeButton} ${isSelected ? styles.routeButtonActive : ''}`}
      onClick={handleClick}
    >
      <span className={styles.routeLabel}>{label}</span>
      <span className={styles.routeCode}>R{routeId}</span>
    </button>
  );
}

export default RouteButton;
