import { useAppContext } from '../../context/AppContext';
import styles from './UserInfoBar.module.css';

/**
 * 用户信息条组件
 * 显示平台名称和登录用户的姓名
 */
const UserInfoBar = () => {
  const { currentUser, isAuthenticated } = useAppContext();

  // 只有在用户认证后才显示用户信息条
  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <div className={styles.userInfoBar}>
      <div className={styles.platformName}>
        新都区义务教育质量综合监测平台
      </div>
      <div className={styles.userInfo}>
        <span className={styles.userName}>
          {currentUser.studentName || '用户'}
        </span>
      </div>
    </div>
  );
};

export default UserInfoBar; 