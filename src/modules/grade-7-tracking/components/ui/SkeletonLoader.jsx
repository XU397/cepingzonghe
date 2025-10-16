/**
 * SkeletonLoader - 骨架屏加载组件
 *
 * 用途:
 * - 内容加载时显示占位符
 * - 提升用户体验，避免空白闪烁
 * - 支持自定义行数和高度
 *
 * T093 - 添加加载状态和骨架屏
 */

import PropTypes from 'prop-types';
import styles from '../../styles/SkeletonLoader.module.css';

const SkeletonLoader = ({
  count = 3,
  height = '20px',
  width = '100%',
  variant = 'text'
}) => {
  return (
    <div className={styles.skeletonContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${styles.skeletonLine} ${styles[variant]}`}
          style={{
            height,
            width: variant === 'text' && index === count - 1 ? '80%' : width
          }}
        />
      ))}
    </div>
  );
};

SkeletonLoader.propTypes = {
  /** 骨架行数 */
  count: PropTypes.number,

  /** 每行高度 */
  height: PropTypes.string,

  /** 宽度 */
  width: PropTypes.string,

  /** 变体: 'text' | 'rectangular' | 'circular' */
  variant: PropTypes.oneOf(['text', 'rectangular', 'circular'])
};

export default SkeletonLoader;
