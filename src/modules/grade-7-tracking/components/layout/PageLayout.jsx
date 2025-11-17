import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import { useTrackingContext } from '../../context/TrackingContext';
import { getRelativePageInfo } from '../../utils/pageMapping';
import {
  PAGE_MAPPING,
  TASK_TIMER_SCOPE,
  QUESTIONNAIRE_TIMER_SCOPE,
} from '../../config';
import styles from '../../styles/PageLayout.module.css';

const QUESTIONNAIRE_WARNING_THRESHOLD = 180;
const TASK_WARNING_THRESHOLD = 300;
const CRITICAL_THRESHOLD = 60;

const PageLayout = ({ children, showNavigation = true, showTimer = true }) => {
  const { session } = useTrackingContext();

  const relativeInfo = useMemo(
    () => getRelativePageInfo(session.currentPage),
    [session.currentPage],
  );

  const navigationMode = session.navigationMode || 'hidden';
  const effectiveShowNavigation =
    showNavigation && navigationMode !== 'hidden' && relativeInfo.totalPages > 0;

  const timerScope =
    navigationMode === 'questionnaire'
      ? QUESTIONNAIRE_TIMER_SCOPE
      : TASK_TIMER_SCOPE;
  const timerWarningThreshold =
    navigationMode === 'questionnaire'
      ? QUESTIONNAIRE_WARNING_THRESHOLD
      : TASK_WARNING_THRESHOLD;

  const pageMeta = useMemo(() => {
    const pageInfo = PAGE_MAPPING[parseFloat(session.currentPage)] || {};
    return {
      pageId: pageInfo.pageId || `g7-tracking-${session.currentPage}`,
      pageNumber: session.currentPage,
      pageDesc: pageInfo.desc || `页面 ${session.currentPage}`,
    };
  }, [session.currentPage]);

  return (
    <AssessmentPageFrame
      navigationMode={navigationMode}
      currentStep={Math.max(1, relativeInfo.currentPage || 1)}
      totalSteps={Math.max(1, relativeInfo.totalPages || 1)}
      showNavigation={effectiveShowNavigation}
      showTimer={showTimer && navigationMode !== 'hidden'}
      timerVariant={navigationMode === 'questionnaire' ? 'questionnaire' : 'task'}
      timerWarningThreshold={timerWarningThreshold}
      timerCriticalThreshold={CRITICAL_THRESHOLD}
      timerScope={timerScope}
      hideNextButton
      allowNavigationClick={false}
      pageMeta={pageMeta}
      bodyClassName={styles.contentWrapper}
    >
      <div className={styles.contentFrame}>
        {children}
      </div>
    </AssessmentPageFrame>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showNavigation: PropTypes.bool,
  showTimer: PropTypes.bool,
};

export default PageLayout;
