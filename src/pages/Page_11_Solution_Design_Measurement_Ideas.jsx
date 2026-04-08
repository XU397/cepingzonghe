import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import imgBefore from '../assets/images/05-1.png';
import imgAfter from '../assets/images/05-2.png';
import { useAppContext } from '../context/AppContext';
import styles from '../styles/Page_11_Solution_Design.module.css';

const MIN_CHAR_COUNT = 2;

const DEFAULT_IDEAS = {
  idea1: '',
  idea2: '',
  idea3: '',
};

const DEFAULT_INPUT_STATE = {
  idea1: { focused: false, lastValue: '' },
  idea2: { focused: false, lastValue: '' },
  idea3: { focused: false, lastValue: '' },
};

const Page_11_Solution_Design_Measurement_Ideas = () => {
  const { navigateToPage, currentPageId, setPageEnterTime } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();

  const [ideas, setIdeas] = useState(() => ({ ...DEFAULT_IDEAS }));
  const [isNavigating, setIsNavigating] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const pageLoadedRef = useRef(false);
  const operationsRef = useRef([]);
  const inputStatesRef = useRef({ ...DEFAULT_INPUT_STATE });
  const [editStartTime, setEditStartTime] = useState({
    idea1: null,
    idea2: null,
    idea3: null,
  });

  const canNavigate =
    ideas.idea1.trim().length >= MIN_CHAR_COUNT &&
    ideas.idea2.trim().length >= MIN_CHAR_COUNT &&
    ideas.idea3.trim().length >= MIN_CHAR_COUNT;

  const recordOperation = useCallback(
    operation => {
      const normalizedOperation = {
        ...operation,
        time: formatTimestamp(new Date()),
      };
      logOperation(normalizedOperation);
      operationsRef.current = [...operationsRef.current, normalizedOperation];
    },
    [logOperation]
  );

  useEffect(() => {
    if (pageLoadedRef.current) return;
    pageLoadedRef.current = true;
    operationsRef.current = [];
    inputStatesRef.current = { ...DEFAULT_INPUT_STATE };
    setPageEnterTime(new Date());

    recordOperation({
      eventType: EventTypes.PAGE_ENTER,
      targetElement: 'page_11_design',
      value: '方案设计测量方法构思页面',
    });
  }, [setPageEnterTime, recordOperation]);

  const handleIdeaChange = useCallback(
    (key, value) => {
      const prevValue = inputStatesRef.current[key]?.lastValue || '';

      if (!editStartTime[key]) {
        setEditStartTime(prev => ({ ...prev, [key]: Date.now() }));
        recordOperation({
          eventType: EventTypes.INPUT_FOCUS,
          targetElement: `输入框_${key}`,
          value: '开始编辑',
        });
      }

      setIdeas(prev => ({
        ...prev,
        [key]: value,
      }));

      recordOperation({
        eventType: EventTypes.INPUT_CHANGE,
        targetElement: `输入框_${key}`,
        value: { prev: prevValue, next: value },
      });

      inputStatesRef.current[key] = {
        ...(inputStatesRef.current[key] || { focused: false, lastValue: '' }),
        lastValue: value,
      };
    },
    [editStartTime, recordOperation]
  );

  const handleInputBlur = useCallback(
    key => {
      const value = ideas[key] || '';
      recordOperation({
        eventType: EventTypes.INPUT_BLUR,
        targetElement: `输入框_${key}`,
        value,
      });

      inputStatesRef.current[key] = {
        ...(inputStatesRef.current[key] || { focused: false, lastValue: '' }),
        focused: false,
        lastValue: value,
      };
    },
    [ideas, recordOperation]
  );

  const handleNextPage = useCallback(async () => {
    if (isNavigating || !canNavigate) {
      if (!canNavigate) {
        setAlertMessage('请至少输入一种测量方法构思。');
        setShowAlert(true);
      }
      return;
    }

    setIsNavigating(true);

    try {
      recordOperation({
        eventType: EventTypes.CLICK,
        targetElement: 'next_button',
        value: '提交测量方法构思',
      });

      const answers = Object.entries(ideas)
        .map(([key, value]) => {
          const trimmed = value.trim();
          if (!trimmed) return null;
          const index = parseInt(key.replace('idea', ''), 10);
          const targetElement = Number.isFinite(index) ? `测量想法_${index}` : `测量想法_${key}`;
          return { targetElement, value: trimmed };
        })
        .filter(Boolean);

      const submissionSuccess = await submitPage({
        answers,
        operations: operationsRef.current,
      });

      if (submissionSuccess) {
        navigateToPage('Page_12_Solution_Evaluation_Measurement_Critique', { skipSubmit: true });
      } else {
        setAlertMessage('数据提交失败，请重试。');
        setShowAlert(true);
        setIsNavigating(false);
      }
    } catch (error) {
      console.error('[Page_11] 导航失败:', error);
      setAlertMessage(error.message || '页面跳转失败，请重试');
      setShowAlert(true);
      setIsNavigating(false);
    }
  }, [ideas, canNavigate, isNavigating, navigateToPage, recordOperation, submitPage]);

  const ideasConfig = useMemo(
    () => [
      { key: 'idea1', label: '想法 1', placeholder: '请在此处输入你的第一个想法' },
      { key: 'idea2', label: '想法 2', placeholder: '请在此处输入你的第二个想法' },
      { key: 'idea3', label: '想法 3', placeholder: '请在此处输入你的第三个想法' },
    ],
    []
  );

  const getCharCountClass = value => {
    const len = value.length;
    if (len > 300 * 0.9) return styles.limit;
    if (len > 300 * 0.7) return styles.warning;
    return '';
  };

  return (
    <div className={styles.pageContainer}>
      {showAlert && (
        <div className={styles.alertBox}>
          <span>{alertMessage}</span>
          <button
            type="button"
            onClick={() => setShowAlert(false)}
            className={styles.alertCloseBtn}
            aria-label="关闭提示"
          >
            ×
          </button>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.badge}>5</div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>蒸馒头：方案设计</h1>
        </div>
      </header>

      <div className={styles.instructionCard}>
        <p className={styles.instructionText}>
          为验证小明的猜想，首先要确定评估<strong>面团发酵程度</strong>
          的方法。通过查阅资料，小明发现可以通过<strong>测量发酵后的面团体积</strong>来进行评估。
        </p>

        <div className={styles.imageCompareWrapper}>
          <div className={styles.imageItem}>
            <img src={imgBefore} alt="发酵前面团" className={styles.doughImage} />
            <p className={styles.imageLabel}>发酵前</p>
          </div>

          <span className={styles.arrowIcon}>→</span>

          <div className={styles.imageItem}>
            <img src={imgAfter} alt="发酵后面团" className={styles.doughImage} />
            <p className={styles.imageLabel}>发酵后</p>
          </div>
        </div>

        <p className={styles.instructionText}>
          请你帮小明想一想，有哪些可以
          <span className={styles.highlightText}>测量面团发酵后体积</span>
          的方法。请提出三个可能的想法，将其简要陈述在下方方框内。
        </p>
      </div>

      <div className={styles.content}>
        {ideasConfig.map((idea, index) => (
          <div
            key={idea.key}
            className={`${styles.inputCard} ${ideas[idea.key].trim().length >= MIN_CHAR_COUNT ? styles.filled : ''}`}
          >
            <div className={styles.inputHeader}>
              <div className={styles.inputNumber}>{index + 1}</div>
              <span className={styles.inputLabel}>{idea.label}</span>
              <svg
                className={styles.checkIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#67d5b5"
                strokeWidth="3"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className={styles.textareaWrapper}>
              <textarea
                id={idea.key}
                className={styles.ideaTextarea}
                value={ideas[idea.key]}
                onChange={e => handleIdeaChange(idea.key, e.target.value)}
                onBlur={() => handleInputBlur(idea.key)}
                placeholder={idea.placeholder}
                maxLength={300}
                aria-label={`${idea.label}输入框`}
              />
              <span className={`${styles.charCount} ${getCharCountClass(ideas[idea.key])}`}>
                {ideas[idea.key].length}/300
              </span>
            </div>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={handleNextPage}
          disabled={!canNavigate || isNavigating}
          aria-label="进入下一页"
        >
          <span>{isNavigating ? '提交中...' : '下一页'}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </footer>
    </div>
  );
};

export default Page_11_Solution_Design_Measurement_Ideas;
