import { useEffect } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page02_ScenarioIntro.module.css';

const SCENARIO_TEXT =
  '小明一家住在四川省南充市。暑假快来了,住在成都的舅舅邀请小明一家到那里做客。请你帮小明一起规划出行方案吧!';

function Page02_ScenarioIntro() {
  const { logOperation, flowContext } = useG4Context();
  const { handleNextPage, isSubmitting, subPageNum } = useG4Navigation();

  useEffect(() => {
    logOperation({
      targetElement: 'page_scenario_intro',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_02_情景介绍',
    });
  }, [logOperation]);

  useEffect(() => {
    if (flowContext?.updateModuleProgress && subPageNum) {
      flowContext.updateModuleProgress(String(subPageNum));
    }
    if (flowContext) {
      logOperation({
        targetElement: 'global_timer',
        eventType: EventTypes.TIMER_START,
        value: 'task_2400s',
      });
    }
  }, [flowContext, logOperation, subPageNum]);

  const handleNext = async () => {
    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.NEXT_CLICK,
      value: 'scenario_intro_next',
    });
    logOperation({
      targetElement: 'page_scenario_intro',
      eventType: EventTypes.PAGE_EXIT,
      value: 'Page_02_情景介绍',
    });
    await handleNextPage({
      nextPageId: 'problem-identification',
    });
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>情景介绍</h1>
      <div className={styles.content}>
        <div className={styles.mapCard}>
          <div className={styles.mapHeader}>地图示意图</div>
          <div className={styles.mapPlaceholder}>
            <div className={styles.markerHome}>小明家</div>
            <div className={styles.markerNanchong}>南充</div>
            <div className={styles.markerChengdu}>成都</div>
          </div>
          <p className={styles.mapHint}>地图占位符，展示小明家 - 南充 - 成都的相对位置</p>
        </div>
        <div className={styles.textCard}>
          <p className={styles.scenarioText}>{SCENARIO_TEXT}</p>
          <p className={styles.note}>本页为展示页，阅读后点击“下一页”继续。</p>
          <div className={styles.actions}>
            <button
              type='button'
              className={styles.nextButton}
              onClick={handleNext}
              disabled={isSubmitting}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page02_ScenarioIntro;
