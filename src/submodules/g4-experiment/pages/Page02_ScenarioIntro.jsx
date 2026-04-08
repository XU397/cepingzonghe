import { useEffect } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page02_ScenarioIntro.module.css';

const SCENARIO_TEXT =
  '小明一家住在四川省南充市。暑假快来了,住在成都的舅舅邀请小明一家到那里做客。请你帮小明一起规划出行方案吧!';

function Page02_ScenarioIntro() {
  const { logOperation, flowContext } = useG4Context();
  const { subPageNum } = useG4Navigation();

  useEffect(() => {
    logOperation({
      targetElement: 'page_scenario_intro',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_02_情景介绍',
    });

    return () => {
      logOperation({
        targetElement: 'page_scenario_intro',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_02_情景介绍',
      });
    };
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

  return (
    <div className={styles.introContainer}>
      <div className={styles.introContent}>
        <div className={styles.textBlock}>
          <p className={styles.scenarioText}>{SCENARIO_TEXT}</p>
        </div>
      </div>
    </div>
  );
}

export default Page02_ScenarioIntro;
