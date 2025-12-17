
import styles from './PhoneSimulator.module.css';

function PhoneSimulator({ title = '假期安排讨论群(4)', children }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.phone}>
        <div className={styles.notch} aria-hidden />
        <div className={styles.navbar}>
          <span className={styles.navTitle}>{title}</span>
        </div>
        <div className={styles.screen}>{children}</div>
      </div>
    </div>
  );
}

export default PhoneSimulator;
