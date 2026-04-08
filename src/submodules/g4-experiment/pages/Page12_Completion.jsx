import { useEffect } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import completionImage from '../../../assets/images/G4_Page11.jpg';
import styles from './Page12_Completion.module.css';

function Page12_Completion() {
  const { logOperation, flowContext } = useG4Context();
  const { subPageNum } = useG4Navigation();

  useEffect(() => {
    logOperation({
      targetElement: 'page_completion',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_12_完成页',
    });
  }, [logOperation]);

  useEffect(() => {
    if (flowContext?.updateModuleProgress && subPageNum) {
      flowContext.updateModuleProgress(String(subPageNum));
    }
  }, [flowContext, subPageNum]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.leftSection}>
          <img
            src={completionImage}
            alt="小明一家在成都旅游"
            className={styles.completionImage}
          />
        </div>

        <div className={styles.rightSection}>
          <div className={styles.content}>
            <div className={styles.iconWrapper}>
              <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#22c55e" />
                <path d="M8 12l2.5 2.5L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className={styles.title}>任务完成！</h1>
            <p className={styles.message}>
              感谢你帮助小明完成了火车票购买，预祝小明一家在成都度过一个美好假期！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page12_Completion;
