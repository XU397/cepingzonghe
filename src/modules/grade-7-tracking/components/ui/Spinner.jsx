/**
 * Spinner - 加载状态指示器组件
 *
 * 用途:
 * - 数据加载时显示旋转动画
 * - 表单提交时显示处理中状态
 * - 支持三种尺寸: small, medium, large
 *
 * T093 - 添加加载状态和骨架屏
 */

import PropTypes from 'prop-types';
import styles from '../../styles/Spinner.module.css';

const Spinner = ({ size = 'medium', message = '' }) => {
  return (
    <div className={styles.spinnerContainer} data-size={size}>
      <div className={styles.spinner}>
        <div className={styles.spinnerCircle}></div>
      </div>
      {message && (
        <div className={styles.spinnerMessage}>
          {message}
        </div>
      )}
    </div>
  );
};

Spinner.propTypes = {
  /** 尺寸: 'small' | 'medium' | 'large' */
  size: PropTypes.oneOf(['small', 'medium', 'large']),

  /** 加载提示消息 */
  message: PropTypes.string
};

export default Spinner;
