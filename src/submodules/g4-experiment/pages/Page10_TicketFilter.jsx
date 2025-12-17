import { useState, useEffect } from 'react';
import { useG4Context } from '../context/G4Context';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Navigation } from '../hooks/useG4Navigation';
import TrainScheduleTable from '../components/TrainScheduleTable';
import { TRAIN_SCHEDULES } from '../constants/trainSchedules';
import styles from './Page10_TicketFilter.module.css';

export function Page10_TicketFilter() {
  const { logOperation, collectAnswer } = useG4Context();
  const { handleNextPage } = useG4Navigation();
  
  const [selectedTrains, setSelectedTrains] = useState([]);
  const [error, setError] = useState('');

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

  const handleToggleSelect = (trainNo) => {
    setSelectedTrains(prev => {
      const isSelected = prev.includes(trainNo);
      const newSelection = isSelected 
        ? prev.filter(t => t !== trainNo)
        : [...prev, trainNo];
      
      logOperation({
        targetElement: '车次_' + trainNo,
        eventType: isSelected ? 'checkbox_uncheck' : 'checkbox_check',
        value: trainNo,
        time: new Date().toISOString(),
      });
      
      return newSelection;
    });
    setError('');
  };

  const validateAndNext = async () => {
    if (selectedTrains.length === 0) {
      setError('请至少选择一个符合条件的车次');
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'no_selection',
        time: new Date().toISOString(),
      });
      return;
    }

    collectAnswer({
      targetElement: '筛选车次',
      value: selectedTrains.join(','),
    });

    await handleNextPage({ nextPageId: 'ticket-pricing' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>车票筛选</h2>
        <p>请根据以下条件筛选合适的车次</p>
      </div>

      <div className={styles.filterConditions}>
        <h3>筛选条件</h3>
        <p><strong>小明的约束：</strong></p>
        <ul>
          <li>出发时间：11时以后</li>
          <li>乘车时长：2小时以内</li>
        </ul>
        <p><strong>妈妈的约束：</strong></p>
        <ul>
          <li>3张车票需同一车次</li>
          <li>到达时间：18:30之前</li>
        </ul>
      </div>

      <div className={styles.tableWrapper}>
        <TrainScheduleTable
          trains={TRAIN_SCHEDULES}
          selectedTrains={selectedTrains}
          onToggleSelect={handleToggleSelect}
          showSelection={true}
        />
      </div>

      <div className={styles.hint}>
        提示：点击车次行即可选择/取消选择
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.navigation}>
        <button className={styles.nextBtn} onClick={validateAndNext}>
          下一页
        </button>
      </div>
    </div>
  );
}

export default Page10_TicketFilter;
