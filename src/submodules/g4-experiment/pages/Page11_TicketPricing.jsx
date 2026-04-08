import { useState, useEffect, useCallback } from 'react';
import { useG4Context } from '../context/G4Context';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG4Navigation } from '../hooks/useG4Navigation';
import TicketFilterTable from '../components/TicketFilterTable';
import VirtualKeyboard from '../components/VirtualKeyboard';
import { TRAIN_SCHEDULES } from '../constants/trainSchedules';
import styles from './Page11_TicketPricing.module.css';

const FILTERED_TRAINS = TRAIN_SCHEDULES.filter(t => t.trainNo === 'D175' || t.trainNo === 'C751');

export function Page11_TicketPricing() {
  const {
    logOperation,
    collectAnswer,
    state,
    setRecommendedTrain,
    setRecommendReason,
    setCalculationProcess,
    setTotalPrice,
  } = useG4Context();
  const { handleNextPage } = useG4Navigation();

  const [recommendReason, setLocalRecommendReason] = useState(state.recommendReason || '');
  const [calculationProcess, setLocalCalculationProcess] = useState(state.calculationProcess || '');
  const [totalPrice, setLocalTotalPrice] = useState(state.totalPrice || '');
  const [error, setError] = useState('');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const recommendedTrain = state.recommendedTrain;

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

  const handleTrainSelect = trainNo => {
    setRecommendedTrain(trainNo);
    logOperation({
      targetElement: '推荐车次',
      eventType: EventTypes.RADIO_SELECT,
      value: trainNo,
      time: new Date().toISOString(),
    });
    setError('');
  };

  const handleRecommendReasonChange = e => {
    const value = e.target.value;
    setLocalRecommendReason(value);
    setRecommendReason(value);
    logOperation({
      targetElement: '推荐理由',
      eventType: EventTypes.INPUT,
      value: value,
      time: new Date().toISOString(),
    });
  };

  const handleTotalPriceChange = e => {
    const value = e.target.value;
    setLocalTotalPrice(value);
    setTotalPrice(value);
    logOperation({
      targetElement: '总票价',
      eventType: EventTypes.INPUT,
      value: value,
      time: new Date().toISOString(),
    });
  };

  const handleKeyPress = key => {
    const newValue = calculationProcess + key;
    setLocalCalculationProcess(newValue);
    setCalculationProcess(newValue);
    logOperation({
      targetElement: '虚拟键盘',
      eventType: EventTypes.KEY_PRESS,
      value: key,
      time: new Date().toISOString(),
    });
  };

  const handleEnter = () => {
    const newValue = calculationProcess + '\n';
    setLocalCalculationProcess(newValue);
    setCalculationProcess(newValue);
    setCurrentLineIndex(prev => prev + 1);
    logOperation({
      targetElement: '虚拟键盘',
      eventType: EventTypes.KEY_PRESS,
      value: 'Enter',
      time: new Date().toISOString(),
    });
  };

  const handleSubmit = useCallback(async () => {
    setError('');

    if (!recommendedTrain) {
      setError('请选择推荐的车次');
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'no_train_selection',
        time: new Date().toISOString(),
      });
      return false;
    }
    if (!recommendReason.trim()) {
      setError('请填写推荐理由');
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'no_recommend_reason',
        time: new Date().toISOString(),
      });
      return false;
    }
    if (!calculationProcess.trim()) {
      setError('请输入计算过程');
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'no_calculation_process',
        time: new Date().toISOString(),
      });
      return false;
    }
    const priceValue = parseInt(totalPrice.trim(), 10);
    if (
      !totalPrice.trim() ||
      Number.isNaN(priceValue) ||
      priceValue <= 0 ||
      !Number.isInteger(priceValue)
    ) {
      setError('请输入有效的总票价（正整数）');
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'invalid_total_price',
        time: new Date().toISOString(),
      });
      return false;
    }

    collectAnswer({ targetElement: '推荐车次', value: recommendedTrain });
    collectAnswer({ targetElement: '推荐理由', value: recommendReason });
    collectAnswer({ targetElement: '计算过程', value: calculationProcess });
    collectAnswer({ targetElement: '总票价', value: totalPrice });

    await handleNextPage({ nextPageId: 'task-completion' });
    return true;
  }, [
    recommendedTrain,
    recommendReason,
    calculationProcess,
    totalPrice,
    collectAnswer,
    handleNextPage,
    logOperation,
  ]);

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
          <span className={styles.badge}>10</span>
          <h1 className={styles.title}>火车购票：车票选择</h1>
        </div>
        <p className={styles.subtitle}>以下是符合小明和妈妈要求的列车信息。</p>
      </div>

      <div className={styles.tableWrapper}>
        <TicketFilterTable
          trains={FILTERED_TRAINS}
          selectedTrains={recommendedTrain ? [recommendedTrain] : []}
          onToggleSelect={handleTrainSelect}
        />
      </div>

      <div className={styles.recommendSection}>
        <p className={styles.instructionText}>
          根据表格信息，为小明推荐一个你认为合适的车次，点亮车次前的
          <svg
            viewBox="0 0 24 24"
            className={styles.starIcon}
            fill="none"
            stroke="#ffce6b"
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          ，并在方框内说明理由。
        </p>
        <textarea
          className={styles.textArea}
          value={recommendReason}
          onChange={handleRecommendReasonChange}
          placeholder="请在此处输入你的回答。"
          rows={2}
        />
      </div>

      <div className={styles.calculationSection}>
        <div className={styles.calculationRow}>
          <div className={styles.calculationInputWrapper}>
            <p className={styles.calculationInstruction}>
              选好方案后，请计算三人总票价。爸爸妈妈为全价成人票，小明为半价儿童票。请利用右侧键盘输入数字和运算符号，在方框内列出计算过程（按
              <span className={styles.enterIcon}>↵</span>
              可换行），并自行计算结果。
            </p>
            <div className={styles.calculationDisplay}>
              {calculationProcess.split('\n').map((line, index, lines) => (
                <div
                  key={index}
                  className={`${styles.calcLine} ${index === currentLineIndex ? styles.calcLineActive : ''}`}
                >
                  {line || <span className={styles.linePlaceholder}>请在此处输入你的回答。</span>}
                </div>
              ))}
              {calculationProcess === '' && (
                <div className={`${styles.calcLine} ${styles.calcLineActive}`}>
                  <span className={styles.linePlaceholder}>请在此处输入你的回答。</span>
                </div>
              )}
            </div>
            <div className={styles.totalPriceRow}>
              <span className={styles.totalLabel}>总票价：</span>
              <input
                type="text"
                className={styles.totalInput}
                value={totalPrice}
                onChange={handleTotalPriceChange}
                placeholder=""
              />
              <span className={styles.totalUnit}>元</span>
            </div>
          </div>
          <div className={styles.keyboardWrapper}>
            <VirtualKeyboard onKeyPress={handleKeyPress} onEnter={handleEnter} />
          </div>
        </div>
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

export default Page11_TicketPricing;
