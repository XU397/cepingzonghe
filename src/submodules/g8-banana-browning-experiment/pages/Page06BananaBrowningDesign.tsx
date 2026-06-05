import React, { useCallback, useEffect, useRef } from 'react';
import {
  TEXT_DEBOUNCE_MS,
  TEXT_THROTTLE_CHAR_DELTA,
  createTextEventCollector,
} from '@shared/services/submission/trace';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import type { PageId } from '../mapping';
import styles from '../styles/Page06BananaBrowningDesign.module.css';
import { useTracePageStart } from '../trace/useTracePageStart';

const MAX_CHAR_COUNT = 300;
const MIN_CHAR_COUNT = 2;

const IDEAS_CONFIG = [
  { key: 'Q3a_想法1', label: '想法1', index: 1 } as const,
  { key: 'Q3b_想法2', label: '想法2', index: 2 } as const,
  { key: 'Q3c_想法3', label: '想法3', index: 3 } as const,
];

const fieldIdByIdeaKey: Record<string, string> = {
  Q3a_想法1: 'input_idea_1',
  Q3b_想法2: 'input_idea_2',
  Q3c_想法3: 'input_idea_3',
};

const Page06BananaBrowningDesign: React.FC = () => {
  const {
    collectAnswer,
    answers,
    getPagePrefix,
    registerTraceCollectorFlush,
  } = useG8BananaBrowningContext();
  const traceLogger = useTracePageStart({
    pageId: 'banana_browning_design' as PageId,
    pageNumber: getPagePrefix().replace(/^P/, '').replace(/_$/, ''),
    flowContext: undefined,
    metadata: {
      initial_state: {},
    },
  });
  const textCollectorsRef = useRef<
    Record<string, ReturnType<typeof createTextEventCollector>>
  >({});

  const getTextCollector = useCallback(
    (fieldId: string) => {
      if (!traceLogger) {
        return null;
      }
      if (!textCollectorsRef.current[fieldId]) {
        textCollectorsRef.current[fieldId] = createTextEventCollector({
          fieldId,
          logger: traceLogger,
          debounceMs: TEXT_DEBOUNCE_MS,
          throttleCharDelta: TEXT_THROTTLE_CHAR_DELTA,
        });
      }
      return textCollectorsRef.current[fieldId];
    },
    [traceLogger]
  );

  const flushTextCollectors = useCallback(() => {
    Object.values(textCollectorsRef.current).forEach(collector => collector.flush('submit'));
  }, []);

  useEffect(
    () => registerTraceCollectorFlush(flushTextCollectors),
    [flushTextCollectors, registerTraceCollectorFlush]
  );

  useEffect(
    () => () => {
      Object.values(textCollectorsRef.current).forEach(collector => collector.dispose());
      textCollectorsRef.current = {};
    },
    [traceLogger]
  );

  const getCharCountClass = (value: string): string => {
    const len = value.length;
    if (len > MAX_CHAR_COUNT * 0.9) return styles.limit;
    if (len > MAX_CHAR_COUNT * 0.7) return styles.warning;
    return '';
  };

  const handleChange = useCallback(
    (ideaKey: string, ideaLabel: string, value: string, isComposing?: boolean) => {
      collectAnswer({ targetElement: ideaKey, value });
      getTextCollector(fieldIdByIdeaKey[ideaKey])?.onChange(value, {
        isComposing,
        metadata: {
          source_answer_key: ideaKey,
          field_label: ideaLabel,
        },
      });
    },
    [collectAnswer, getTextCollector]
  );

  const handleFocus = useCallback(
    (ideaKey: string) => {
      getTextCollector(fieldIdByIdeaKey[ideaKey])?.onFocus(String(answers[ideaKey] || ''));
    },
    [answers, getTextCollector]
  );

  const handleBlur = useCallback(
    (ideaKey: string, ideaLabel: string, value: string) => {
      getTextCollector(fieldIdByIdeaKey[ideaKey])?.onBlur(value, {
        source_answer_key: ideaKey,
        field_label: ideaLabel,
      });
    },
    [getTextCollector]
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
                  onFocus={() => handleFocus(idea.key)}
                  onChange={e =>
                    handleChange(
                      idea.key,
                      idea.label,
                      e.target.value,
                      (e.nativeEvent as InputEvent).isComposing
                    )
                  }
                  onBlur={e => handleBlur(idea.key, idea.label, e.target.value)}
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
