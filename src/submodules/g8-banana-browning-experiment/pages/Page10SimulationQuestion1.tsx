import React, { useCallback, useEffect, useState } from 'react';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import type { PageId } from '../mapping';
import SimulationPanel from '../components/SimulationPanel';
import styles from '../styles/Page10SimulationQuestion1.module.css';
import { optionIdFromOptionLabel } from '../trace/fieldBindings';
import { useTracePageStart } from '../trace/useTracePageStart';

const options = [
  { label: 'A', text: '3天' },
  { label: 'B', text: '6天' },
  { label: 'C', text: '9天' },
  { label: 'D', text: '12天' },
  { label: 'E', text: '15天' },
];
const answerKey = 'Q5_海南香蕉变黑时间';

const Page10SimulationQuestion1: React.FC = () => {
  const { collectAnswer, answers, getPagePrefix } = useG8BananaBrowningContext();
  const traceLogger = useTracePageStart({
    pageId: 'simulation_question_1' as PageId,
    pageNumber: getPagePrefix().replace(/^P/, '').replace(/_$/, ''),
    flowContext: undefined,
    metadata: {
      initial_state: { selected_option: null },
    },
  });
  const [selectedOption, setSelectedOption] = useState<string>('');
  const savedAnswer = answers[answerKey];

  useEffect(() => {
    if (typeof savedAnswer === 'string' && options.some(option => option.text === savedAnswer)) {
      setSelectedOption(savedAnswer);
      return;
    }

    setSelectedOption('');
  }, [savedAnswer]);

  const handleOptionSelect = useCallback(
    ({ text }: (typeof options)[number]) => {
      const previousOptionId = selectedOption ? optionIdFromOptionLabel(selectedOption) : null;
      const nextOptionId = optionIdFromOptionLabel(text);
      setSelectedOption(text);
      collectAnswer({ targetElement: answerKey, value: text });
      traceLogger?.selectAnswer({
        questionId: 'question_1',
        optionId: nextOptionId,
        optionText: text,
        valueBefore: previousOptionId,
        targetId: `question_1_${nextOptionId}`,
        questionIndex: 1,
        totalQuestionCount: 3,
      });
    },
    [collectAnswer, selectedOption, traceLogger]
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>9</div>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>香蕉变黑：模拟实验</h1>
        </div>
      </header>

      <div className={styles.contentLayout}>
        <div className={styles.simulationPanel}>
          <SimulationPanel traceLogger={traceLogger} />
        </div>

        <div className={styles.questionPanel}>
          <p className={styles.instruction}>请通过左侧的模拟实验，探索并回答以下3个问题。</p>
          <div className={styles.questionBlock}>
            <h2 className={styles.questionTitle}>
              问题1：在模拟实验中，2℃条件下储存的海南香蕉，从开始到完全变黑需要多长时间？
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

export default Page10SimulationQuestion1;
