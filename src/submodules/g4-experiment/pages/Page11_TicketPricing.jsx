import { useState, useEffect } from 'react';
import { useG4Context } from '../context/G4Context';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Navigation } from '../hooks/useG4Navigation';
import TrainScheduleTable from '../components/TrainScheduleTable';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { TRAIN_SCHEDULES } from '../constants/trainSchedules';
import styles from './Page11_TicketPricing.module.css';

const FILTERED_TRAINS = TRAIN_SCHEDULES.filter(
  t => t.trainNo === 'D175' || t.trainNo === 'C751'
);

export function Page11_TicketPricing() {
  const { logOperation, collectAnswer } = useG4Context();
  const { handleNextPage } = useG4Navigation();
  
  const [recommendedTrain, setRecommendedTrain] = useState(null);
  const [recommendReason, setRecommendReason] = useState('');
  const [calculationProcess, setCalculationProcess] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_11_车票计价',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_11_车票计价',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  const handleTrainSelect = (trainNo) => {
    setRecommendedTrain(trainNo);
    logOperation({
      targetElement: '推荐车次',
      eventType: EventTypes.RADIO_SELECT,
      value: trainNo,
      time: new Date().toISOString(),
    });
    setError('');
  };

  const handleKeyPress = (key) => {
    setCalculationProcess(prev => prev + key);
    logOperation({
      targetElement: '虚拟键盘',
      eventType: EventTypes.KEY_PRESS,
      value: key,
      time: new Date().toISOString(),
    });
  };

  const handleEnter = () => {
    setCalculationProcess(prev => prev + '\n');
  };

  const handleClear = () => {
    setCalculationProcess('');
  };

  const validateAndNext = async () => {
    setError('');

    if (!recommendedTrain) {
      setError('请选择推荐的车次');
      return;
    }
    if (!recommendReason.trim()) {
      setError('请填写推荐理由');
      return;
    }
    if (!calculationProcess.trim()) {
      setError('请输入计算过程');
      return;
    }
    if (!totalPrice.trim() || isNaN(parseInt(totalPrice, 10))) {
      setError('请输入有效的总票价');
      return;
    }

    collectAnswer({ targetElement: '推荐车次', value: recommendedTrain });
    collectAnswer({ targetElement: '推荐理由', value: recommendReason });
    collectAnswer({ targetElement: '计算过程', value: calculationProcess });
    collectAnswer({ targetElement: '总票价', value: totalPrice });

    await handleNextPage({ nextPageId: 'task-completion' });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>车票计价</h2>
        <p>选择推荐车次并计算票价</p>
      </div>

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <h3>筛选后的车次</h3>
          <TrainScheduleTable
            trains={FILTERED_TRAINS}
            selectedTrains={recommendedTrain ? [recommendedTrain] : []}
            onToggleSelect={handleTrainSelect}
            showSelection={true}
          />

          <div className={styles.reasonSection}>
            <label>推荐理由：</label>
            <textarea
              value={recommendReason}
              onChange={(e) => setRecommendReason(e.target.value)}
              placeholder="请输入你推荐这趟车次的理由..."
              rows={3}
            />
          </div>
        </div>

        <div className={styles.rightPanel}>
          <h3>票价计算</h3>
          <div className={styles.calcSection}>
            <label>计算过程：</label>
            <textarea
              value={calculationProcess}
              onChange={(e) => setCalculationProcess(e.target.value)}
              placeholder="使用下方键盘输入计算过程..."
              rows={5}
            />
          </div>

          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onEnter={handleEnter}
            onClear={handleClear}
          />

          <div className={styles.totalSection}>
            <label>总票价：</label>
            <input
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="元"
            />
            <span>元</span>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.navigation}>
        <button className={styles.nextBtn} onClick={validateAndNext}>
          提交并完成
        </button>
      </div>
    </div>
  );
}

export default Page11_TicketPricing;
