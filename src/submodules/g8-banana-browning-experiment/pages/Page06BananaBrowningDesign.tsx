import React, { useEffect, useCallback } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import styles from '../styles/Page06BananaBrowningDesign.module.css';

const MAX_CHAR_COUNT = 300;
const MIN_CHAR_COUNT = 2;

const IDEAS_CONFIG = [
  { key: 'Q3a_想法1', label: '想法1', index: 1 } as const,
  { key: 'Q3b_想法2', label: '想法2', index: 2 } as const,
  { key: 'Q3c_想法3', label: '想法3', index: 3 } as const,
];

const Page06BananaBrowningDesign: React.FC = () => {
  const { logOperation, collectAnswer, setPageStartTime, answers, getPagePrefix } =
    useG8BananaBrowningContext();
  const targetPrefix = getPagePrefix();

  useEffect(() => {
    setPageStartTime(new Date());
    logOperation({
      targetElement: `${targetPrefix}页面进入`,
      eventType: EventTypes.PAGE_ENTER,
      value: '页面加载完成',
      time: new Date().toISOString(),
    });
  }, [logOperation, setPageStartTime, targetPrefix]);

  const getCharCountClass = (value: string): string => {
    const len = value.length;
    if (len > MAX_CHAR_COUNT * 0.9) return styles.limit;
    if (len > MAX_CHAR_COUNT * 0.7) return styles.warning;
    return '';
  };

  const handleChange = useCallback(
    (ideaKey: string, label: string, value: string) => {
      collectAnswer({ targetElement: ideaKey, value });
      logOperation({
        targetElement: `${targetPrefix}${label}输入`,
        eventType: EventTypes.INPUT_CHANGE,
        value,
        time: new Date().toISOString(),
      });
    },
    [collectAnswer, logOperation, targetPrefix]
  );

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.badge}>5</div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>香蕉变黑：方案设计</h1>
        </div>
      </header>

      <div className={styles.instructionCard}>
        <p className={styles.instructionText}>
          为验证小明的猜想，首先需要确定如何判断香蕉变黑的程度。通过查阅资料，小明发现可以用香蕉表皮黑变区域面积占总果皮表面积的百分比（简称"
          <strong>黑变比例</strong>
          "）来衡量。请你帮小明想一想，有哪些方法可以测量黑变比例。请提出三个可能的想法，简要写在下方方框内。
        </p>
      </div>

      <div className={styles.content}>
        {IDEAS_CONFIG.map(idea => {
          const currentValue = (answers[idea.key] as string) || '';
          const isFilled = currentValue.trim().length >= MIN_CHAR_COUNT;

          return (
            <div key={idea.key} className={`${styles.inputCard} ${isFilled ? styles.filled : ''}`}>
              <div className={styles.inputHeader}>
                <div className={styles.inputNumber}>{idea.index}</div>
                <span className={styles.inputLabel}>{idea.label}</span>
                <svg
                  className={styles.checkIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="3"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className={styles.textareaWrapper}>
                <textarea
                  className={styles.ideaTextarea}
                  value={currentValue}
                  onChange={e => handleChange(idea.key, idea.label, e.target.value)}
                  placeholder="请输入你的想法。"
                  maxLength={MAX_CHAR_COUNT}
                  aria-label={`${idea.label}输入框`}
                />
                <span className={`${styles.charCount} ${getCharCountClass(currentValue)}`}>
                  {currentValue.length}/{MAX_CHAR_COUNT}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Page06BananaBrowningDesign;
