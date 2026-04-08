import React, { useCallback, useEffect, useState } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import SimulationPanel from '../components/SimulationPanel';
import styles from '../styles/Page12SimulationQuestion3.module.css';

const options = [
  { label: 'A', text: '2℃' },
  { label: 'B', text: '10℃' },
  { label: 'C', text: '18℃' },
];
const answerKey = 'Q7_平缓温度';

const Page12SimulationQuestion3: React.FC = () => {
  const { logOperation, collectAnswer, setPageStartTime, answers, getPagePrefix } =
    useG8BananaBrowningContext();
  const targetPrefix = getPagePrefix();
  const [selectedOption, setSelectedOption] = useState<string>('');
  const hasLoggedEnter = React.useRef(false);
  const savedAnswer = answers[answerKey];

  useEffect(() => {
    if (typeof savedAnswer === 'string' && options.some(option => option.text === savedAnswer)) {
      setSelectedOption(savedAnswer);
      return;
    }

    setSelectedOption('');
  }, [savedAnswer]);

  useEffect(() => {
    if (hasLoggedEnter.current) {
      return;
    }
    hasLoggedEnter.current = true;
    setPageStartTime(new Date());
    logOperation({
      targetElement: `${targetPrefix}页面进入`,
      eventType: EventTypes.PAGE_ENTER,
      value: '页面加载完成',
      time: new Date().toISOString(),
    });
  }, [logOperation, setPageStartTime, targetPrefix]);

  const handleOptionSelect = useCallback(
    ({ label, text }: (typeof options)[number]) => {
      setSelectedOption(text);
      collectAnswer({ targetElement: answerKey, value: text });
      logOperation({
        targetElement: `${targetPrefix}${answerKey}`,
        eventType: EventTypes.RADIO_SELECT,
        value: `${label}. ${text}`,
        time: new Date().toISOString(),
      });
    },
    [collectAnswer, logOperation, targetPrefix]
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>11</div>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>香蕉变黑：模拟实验</h1>
        </div>
      </header>

      <div className={styles.contentLayout}>
        <div className={styles.simulationPanel}>
          <SimulationPanel logOperation={logOperation} targetPrefix={targetPrefix} />
        </div>

        <div className={styles.questionPanel}>
          <p className={styles.instruction}>请通过左侧的模拟实验，探索并回答以下3个问题。</p>
          <div className={styles.questionBlock}>
            <h2 className={styles.questionTitle}>
              问题3：在模拟实验中，菲律宾香蕉在不同温度下储存时，黑变速度变化最平缓的是哪种温度条件？
            </h2>
            <div className={styles.options}>
              {options.map(option => (
                <label
                  key={option.label}
                  className={`${styles.option} ${selectedOption === option.text ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name="question"
                    value={option.text}
                    checked={selectedOption === option.text}
                    onChange={() => handleOptionSelect(option)}
                  />
                  <span className={styles.radioIndicator} />
                  <span className={styles.optionText}>{option.text}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page12SimulationQuestion3;
