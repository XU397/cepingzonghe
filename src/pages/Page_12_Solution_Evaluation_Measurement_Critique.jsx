import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import { useAppContext } from '../context/AppContext';
import styles from '../styles/Page_12_Evaluation.module.css';

import method1Image from '../assets/images/06-1.jpg';
import method2Image from '../assets/images/06-2.jpeg';
import method3Image from '../assets/images/06-3.png';

const DEFAULT_CRITIQUES = {
  method1: { advantages: '', disadvantages: '' },
  method2: { advantages: '', disadvantages: '' },
  method3: { advantages: '', disadvantages: '' },
};

const Page_12_Solution_Evaluation_Measurement_Critique = () => {
  const { navigateToPage, setPageEnterTime } = useAppContext();
  const { submitPage, logOperation } = usePageSubmissionContext();

  const [critiques, setCritiques] = useState(() => ({ ...DEFAULT_CRITIQUES }));
  const [isNavigating, setIsNavigating] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const pageLoadedRef = useRef(false);
  const operationsRef = useRef([]);

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

  const filledFieldsCount = useMemo(() => {
    return Object.values(critiques).reduce(
      (count, method) =>
        count + (method.advantages.trim() ? 1 : 0) + (method.disadvantages.trim() ? 1 : 0),
      0
    );
  }, [critiques]);

  const canNavigate = filledFieldsCount === 6;

  useEffect(() => {
    if (pageLoadedRef.current) return;
    pageLoadedRef.current = true;
    operationsRef.current = [];
    setPageEnterTime(new Date());

    recordOperation({
      eventType: EventTypes.PAGE_ENTER,
      targetElement: 'page_12_evaluation',
      value: '方案评估测量方法评价页面',
    });
  }, [setPageEnterTime, recordOperation]);

  const handleInputChange = useCallback(
    (method, field, value) => {
      setCritiques(prev => ({
        ...prev,
        [method]: {
          ...prev[method],
          [field]: value,
        },
      }));

      recordOperation({
        eventType: EventTypes.INPUT_CHANGE,
        targetElement: `${method}_${field}`,
        value: `字符数：${value.trim().length}`,
      });
    },
    [recordOperation]
  );

  const handleNextPage = useCallback(async () => {
    if (isNavigating || !canNavigate) {
      if (!canNavigate) {
        setAlertMessage('请对每种方法的优点和缺点都进行评价。');
        setShowAlert(true);
      }
      return;
    }

    setIsNavigating(true);

    try {
      recordOperation({
        eventType: EventTypes.CLICK,
        targetElement: 'next_button',
        value: '提交测量方法评价',
      });

      const answers = Object.entries(critiques).flatMap(([methodKey, fields], index) => {
        const methodNumber = index + 1;
        const trimmedAdvantages = fields.advantages.trim();
        const trimmedDisadvantages = fields.disadvantages.trim();
        const methodAnswers = [];

        if (trimmedAdvantages) {
          methodAnswers.push({
            targetElement: `测量方法_${methodNumber}_优点`,
            value: trimmedAdvantages,
          });
        }

        if (trimmedDisadvantages) {
          methodAnswers.push({
            targetElement: `测量方法_${methodNumber}_缺点`,
            value: trimmedDisadvantages,
          });
        }

        return methodAnswers;
      });

      const submissionSuccess = await submitPage({
        answers,
        operations: operationsRef.current,
      });

      if (submissionSuccess) {
        navigateToPage('Page_13_Transition_To_Simulation', { skipSubmit: true });
      } else {
        setAlertMessage('数据提交失败，请重试。');
        setShowAlert(true);
        setIsNavigating(false);
      }
    } catch (error) {
      console.error('[Page_12] 导航失败:', error);
      setAlertMessage(error.message || '页面跳转失败，请重试');
      setShowAlert(true);
      setIsNavigating(false);
    }
  }, [critiques, canNavigate, isNavigating, navigateToPage, recordOperation, submitPage]);

  const methods = useMemo(
    () => [
      {
        id: 'method1',
        name: '方法一：标记法',
        description:
          '将面团近似看成长方体，测量发酵前、后面团的长度、宽度和高度。运用长方体体积公式，算出面团体积。',
        imageSrc: method1Image,
      },
      {
        id: 'method2',
        name: '方法二：排水法',
        description:
          '将一杯盛满水的水杯事先放在水盆中，将面团放入水杯，通过测量水盆中收集的溢出水体积，算出面团体积。',
        imageSrc: method2Image,
      },
      {
        id: 'method3',
        name: '方法三：烧杯法',
        description: '将面团放入带有刻度的烧杯中发酵，直接读取发酵前、后面团的体积。',
        imageSrc: method3Image,
      },
    ],
    []
  );

  return (
    <main className={styles.pageFrame}>
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
        <div className={styles.badge} aria-label="第6题">
          6
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>蒸馒头：方案评估</h1>
          <p className={styles.description}>
            小明提出了以下三种测量面团体积的方法，请对三种方法的优缺点分别进行评价，并写在相应方框内。
          </p>
        </div>
      </header>

      <section className={styles.cardsContainer} aria-label="方案卡片区域">
        {methods.map(method => (
          <article key={method.id} className={styles.card}>
            <div className={styles.cardNumber}>
              <span className={styles.num}>{methods.indexOf(method) + 1}</span>
              <span className={styles.methodName}>{method.name}</span>
            </div>
            <p className={styles.cardDescription}>{method.description}</p>
            <div className={styles.imagePlaceholder} role="img" aria-label={method.name}>
              <img src={method.imageSrc} alt={method.name} />
            </div>
            <div className={styles.inputGroup}>
              <label
                className={`${styles.inputLabel} ${styles.pros}`}
                htmlFor={`pros-${method.id}`}
              >
                优点：
              </label>
              <textarea
                id={`pros-${method.id}`}
                className={styles.textarea}
                value={critiques[method.id].advantages}
                onChange={e => handleInputChange(method.id, 'advantages', e.target.value)}
                placeholder="请填写此方法的优点..."
              />
            </div>
            <div className={styles.inputGroup}>
              <label
                className={`${styles.inputLabel} ${styles.cons}`}
                htmlFor={`cons-${method.id}`}
              >
                缺点：
              </label>
              <textarea
                id={`cons-${method.id}`}
                className={styles.textarea}
                value={critiques[method.id].disadvantages}
                onChange={e => handleInputChange(method.id, 'disadvantages', e.target.value)}
                placeholder="请填写此方法的缺点..."
              />
            </div>
          </article>
        ))}
      </section>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.btnNext}
          aria-label="进入下一页"
          disabled={!canNavigate || isNavigating}
          onClick={handleNextPage}
        >
          {isNavigating ? '提交中...' : '下一页'}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </footer>
    </main>
  );
};

export default Page_12_Solution_Evaluation_Measurement_Critique;
