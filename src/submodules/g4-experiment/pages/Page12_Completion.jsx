import { useEffect } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page12_Completion.module.css';

function Page12_Completion() {
  const { logOperation, flowContext } = useG4Context();
  const { handleNextPage, isSubmitting, subPageNum } = useG4Navigation();

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

  const handleFinish = async () => {
    logOperation({
      targetElement: 'finish_button',
      eventType: EventTypes.NEXT_CLICK,
      value: 'task_completion',
    });
    logOperation({
      targetElement: 'page_completion',
      eventType: EventTypes.PAGE_EXIT,
      value: 'Page_12_完成页',
    });
    const submitted = await handleNextPage({ validate: () => true, nextPageId: null });
    if (submitted && typeof flowContext?.onComplete === 'function') {
      flowContext.onComplete();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>感谢你的帮助</h1>
        <p className={styles.message}>
          感谢你帮助小明完成了火车票购买,预祝小明一家在成都度过一个美好假期!
        </p>
        <button
          type="button"
          className={styles.finishButton}
          onClick={handleFinish}
          disabled={isSubmitting}
        >
          完成
        </button>
      </div>
    </div>
  );
}

export default Page12_Completion;
