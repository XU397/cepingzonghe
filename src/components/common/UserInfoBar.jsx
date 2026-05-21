import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import STORAGE_KEYS, { getStorageItem } from '@shared/services/storage/storageKeys.js';
import { useLoginPageConfig } from '@shared/services/loginPageConfig';
import styles from './UserInfoBar.module.css';

const DEFAULT_PLATFORM_NAME = '学生问题解决能力监测平台';

const readStoredUser = () => {
  try {
    const raw = getStorageItem(STORAGE_KEYS.CORE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Global user status bar.
 * AppShell controls the route-level visibility; forceVisible keeps the green bar
 * visible during Flow/AppContext hydration and uses persisted login data.
 */
const UserInfoBar = ({ forceVisible = false }) => {
  const { currentUser, isAuthenticated, batchCode, examNo } = useAppContext();
  const config = useLoginPageConfig();

  const platformName = useMemo(() => {
    const { displayType, text } = config.logo;
    if ((displayType === 'text' || displayType === 'image_text') && text?.trim()) {
      return text.trim();
    }

    const titleName = `${config.title?.highlightText || ''}${config.title?.mainText || ''}`.trim();
    return titleName || DEFAULT_PLATFORM_NAME;
  }, [config.logo, config.title]);

  const storedUser = useMemo(readStoredUser, []);
  const effectiveUser = currentUser || storedUser || null;
  const effectiveBatchCode =
    batchCode || effectiveUser?.batchCode || getStorageItem(STORAGE_KEYS.CORE_BATCH_CODE) || '';
  const effectiveExamNo =
    examNo || effectiveUser?.examNo || getStorageItem(STORAGE_KEYS.CORE_EXAM_NO) || '';

  if (!effectiveUser || (!forceVisible && !isAuthenticated)) {
    return null;
  }

  return (
    <div className={styles.userInfoBar}>
      <div className={styles.platformName}>
        {platformName}
      </div>
      <div className={styles.userInfo}>
        {effectiveBatchCode && (
          <span className={styles.userMeta}>批次：{effectiveBatchCode}</span>
        )}
        {effectiveExamNo && (
          <span className={styles.userMeta}>考号：{effectiveExamNo}</span>
        )}
        <span className={styles.userName}>
          {effectiveUser?.studentName || '用户'}
        </span>
      </div>
    </div>
  );
};

export default UserInfoBar;
