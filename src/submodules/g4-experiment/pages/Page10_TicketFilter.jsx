import { useState, useEffect, useCallback } from 'react';
import { useG4Context } from '../context/G4Context';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Navigation } from '../hooks/useG4Navigation';
import TicketFilterTable from '../components/TicketFilterTable';
import { TRAIN_SCHEDULES } from '../constants/trainSchedules';
import mamaAvatar from '@/assets/images/mamaT.png';
import styles from './Page10_TicketFilter.module.css';

export function Page10_TicketFilter() {
  const { logOperation, collectAnswer, state, toggleTrainSelection } = useG4Context();
  const { handleNextPage } = useG4Navigation();
  const [error, setError] = useState('');

  const selectedTrains = state.selectedTrains || [];

  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_10_车票筛选',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_10_车票筛选',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  const handleToggleSelect = trainNo => {
    const isSelected = selectedTrains.includes(trainNo);

    toggleTrainSelection(trainNo);

    logOperation({
      targetElement: '车次_' + trainNo,
      eventType: isSelected ? EventTypes.CHECKBOX_UNCHECK : EventTypes.CHECKBOX_CHECK,
      value: trainNo,
      time: new Date().toISOString(),
    });

    setError('');
  };

  const handleSubmit = useCallback(async () => {
    if (selectedTrains.length === 0) {
      setError('请至少选择一个符合条件的车次');
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'no_selection',
        time: new Date().toISOString(),
      });
      return false;
    }

    collectAnswer({
      targetElement: '筛选车次',
      value: selectedTrains.join(','),
    });

    await handleNextPage({ nextPageId: 'ticket-pricing' });
    return true;
  }, [selectedTrains, collectAnswer, handleNextPage, logOperation]);

  useEffect(() => {
    const nextButton = document.querySelector('[data-testid="next-button"]');
    if (nextButton) {
      const clickHandler = () => {
        handleSubmit();
      };
      nextButton.addEventListener('click', clickHandler);
      return () => {
        nextButton.removeEventListener('click', clickHandler);
      };
    }
  }, [handleSubmit]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.badge}>9</span>
          <h1 className={styles.title}>火车购票：车票选择</h1>
        </div>
      </div>

      <div className={styles.xiaomingConstraint}>
        <p>
          小明最终决定选择出发时间在11时后、乘车时长在2小时内的火车。以下是可供选择的5辆列车信息。
        </p>
      </div>

      <div className={styles.tableWrapper}>
        <TicketFilterTable
          trains={TRAIN_SCHEDULES}
          selectedTrains={selectedTrains}
          onToggleSelect={handleToggleSelect}
        />
      </div>

      <div className={styles.momHint}>
        <div className={styles.hintHeader}>此外，妈妈提醒小明买车票还要考虑：</div>
        <div className={styles.momContent}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              <img src={mamaAvatar} alt="妈妈" />
            </div>
            <span className={styles.avatarName}>妈妈</span>
          </div>
          <div className={styles.bubble}>
            <p>1、3张车票为同一车次；</p>
            <p>2、到达时间在18时30分前。</p>
          </div>
        </div>
      </div>

      <div className={styles.instruction}>
        请从上面的列车表中选出<span className={styles.highlight}>符合妈妈需求的车次</span>
        （可多选），单击点亮车次前的
        <svg
          viewBox="0 0 24 24"
          className={styles.starIcon}
          fill="none"
          stroke="#ffce6b"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        ，再次单击可取消选择。
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button
        type="button"
        data-testid="next-button"
        onClick={handleSubmit}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </div>
  );
}

export default Page10_TicketFilter;
