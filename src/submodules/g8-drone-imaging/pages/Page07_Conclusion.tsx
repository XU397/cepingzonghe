import React, { useEffect, useState, useRef } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from '../styles/Page07_Conclusion.module.css';

const MIN_CHARS = 5;

interface RadioOption {
  value: string;
  label: string;
}

// Only A and B options (removed C)
const RADIO_OPTIONS: RadioOption[] = [
  { value: 'A', label: 'A. 是' },
  { value: 'B', label: 'B. 否' },
];

// Chart data based on experiment data table (from gsdLookup.ts)
const chartData = [
  { focalLength: 8, '100米': 3.01, '200米': 6.03, '300米': 9.04 },
  { focalLength: 24, '100米': 1.00, '200米': 2.01, '300米': 3.01 },
  { focalLength: 50, '100米': 0.48, '200米': 0.96, '300米': 1.45 },
];

export default function Page07_Conclusion() {
  const { logOperation, setAnswer, getAnswer, saveToStorage, questionIds } = useDroneImagingContext();
  const priorityFactorId = questionIds.priorityFactor;
  const priorityReasonId = questionIds.priorityReason;

  const [selectedRadio, setSelectedRadio] = useState(getAnswer(priorityFactorId) || '');
  const [reasonText, setReasonText] = useState(getAnswer(priorityReasonId) || '');
  const [error, setError] = useState('');
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
  }, []);

  const handleRadioChange = (option: RadioOption) => {
    const value = option.value;
    setSelectedRadio(value);

    // Clear error and its timeout if exists
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setError('');

    setAnswer(priorityFactorId, option.label);
    logOperation({
      targetElement: priorityFactorId,
      eventType: EventTypes.RADIO_SELECT,
      value,
      time: formatTimestamp(new Date()),
    });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const prevValue = reasonText;
    setReasonText(value);

    // Clear error and its timeout if exists
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setError('');

    setAnswer(priorityReasonId, value);
    logOperation({
      targetElement: priorityReasonId,
      eventType: EventTypes.INPUT_CHANGE,
      value: JSON.stringify({ prev: prevValue, next: value }),
      time: formatTimestamp(new Date()),
    });
  };

  const handleTextareaFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    logOperation({
      targetElement: priorityReasonId,
      eventType: EventTypes.INPUT_FOCUS,
      value: e.target.value || '',
      time: formatTimestamp(new Date()),
    });
  };

  const handleTextareaBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    logOperation({
      targetElement: priorityReasonId,
      eventType: EventTypes.INPUT_BLUR,
      value: e.target.value || '',
      time: formatTimestamp(new Date()),
    });
  };

  const handleComplete = () => {
    if (!selectedRadio) {
      // Clear any existing error timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      // Set error message with shake animation
      setError('请选择一个答案');

      // Auto-clear error after 10 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setError('');
        errorTimeoutRef.current = null;
      }, 10000);

      logOperation({
        targetElement: 'submit_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: JSON.stringify({
          reason: 'radio_not_selected',
          missing: [priorityFactorId],
        }),
        time: formatTimestamp(new Date()),
      });
      return;
    }

    if (reasonText.length <= MIN_CHARS) {
      // Clear any existing error timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      // Set error message with shake animation
      setError('请输入至少 5 个字符的理由说明');

      // Auto-clear error after 10 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setError('');
        errorTimeoutRef.current = null;
      }, 10000);

      logOperation({
        targetElement: 'submit_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: JSON.stringify({
          reason: 'reason_too_short',
          missing: [priorityReasonId],
          currentLength: reasonText.length,
          requiredLength: MIN_CHARS + 1,
        }),
        time: formatTimestamp(new Date()),
      });
      return;
    }

    logOperation({
      targetElement: 'submit_button',
      eventType: EventTypes.CLICK,
      value: 'experiment_complete',
      time: formatTimestamp(new Date()),
    });

    saveToStorage();

    logOperation({
      targetElement: 'module',
      eventType: EventTypes.PAGE_SUBMIT_SUCCESS,
      value: 'g8-drone-imaging-complete',
      time: formatTimestamp(new Date()),
    });

    const frameNextButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="frame-next-button"]',
    );
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  const charCount = reasonText.length;
  const charCountClass =
    charCount > MIN_CHARS ? `${styles.charCount} ${styles.valid}` : styles.charCount;

  return (
    <div className={styles.conclusionContainer} data-testid="page-conclusion">
      {/* Two-column layout */}
      <div className={styles.twoColumnLayout}>
        {/* Left column: Chart */}
        <div className={styles.leftPanel}>
          <div className={styles.chartContainer}>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis
                    dataKey="focalLength"
                    label={{ value: '镜头焦距（毫米）', position: 'bottom', offset: 0 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    label={{
                      value: '地面采样距离（厘米/像素）',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} 厘米/像素`, '']}
                    labelFormatter={(label) => `焦距: ${label}mm`}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Line
                    type="linear"
                    dataKey="300米"
                    stroke="#9e9e9e"
                    strokeWidth={2}
                    dot={{ fill: '#9e9e9e', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="linear"
                    dataKey="200米"
                    stroke="#ff9800"
                    strokeWidth={2}
                    dot={{ fill: '#ff9800', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="linear"
                    dataKey="100米"
                    stroke="#2196f3"
                    strokeWidth={2}
                    dot={{ fill: '#2196f3', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className={styles.chartNote}>注：GSD 数值越大，图像就越模糊</p>
          </div>
        </div>

        {/* Right column: Questions */}
        <div className={styles.rightPanel}>
          <h2 className={styles.panelTitle}>总结结论</h2>

          {/* Task box */}
          <div className={styles.taskBox}>
            <p className={styles.taskText}>
              <strong>问题4：</strong> 右图展示了飞行高度、镜头焦距与地面采样距离(GSD)的关系曲线。请问在不同飞行高度下，镜头焦距与GSD的变化关系是否遵循相同的模式？
            </p>
          </div>

          {/* Radio section */}
          <div className={styles.radioSection}>
            <div className={styles.radioGroup} data-testid="conclusion-radio-group">
              {RADIO_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`${styles.radioOption} ${
                    selectedRadio === option.value ? styles.selected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="priority_factor"
                    value={option.value}
                    checked={selectedRadio === option.value}
                    onChange={() => handleRadioChange(option)}
                    className={styles.radioInput}
                    data-testid={`radio-conclusion-${option.value}`}
                  />
                  <span className={styles.radioLabel}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Textarea section */}
          <div className={styles.textareaSection}>
            <p className={styles.sectionLabel}>请结合图中数据说明理由：</p>
            <textarea
              value={reasonText}
              onChange={handleTextareaChange}
              onFocus={handleTextareaFocus}
              onBlur={handleTextareaBlur}
              placeholder="请写下你的理由..."
              className={`${styles.textarea} ${
                error && reasonText.length <= MIN_CHARS ? styles.error : ''
              }`}
              data-testid="conclusion-textarea"
            />
            <div className={styles.charCounter}>
              <span className={charCountClass}>已输入 {charCount} 字</span>
              <span className={styles.minCharsHint}>至少 {MIN_CHARS} 字</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.errorMessage} data-testid="error-message">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Hidden submit/next button for Flow frame fallback (not visible in UI) */}
      <button
        type="button"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: 0,
          opacity: 0,
          pointerEvents: 'none',
          border: 0,
        }}
        tabIndex={-1}
        onClick={handleComplete}
        data-testid="next-button"
        aria-hidden="true"
      >
        完成实验
      </button>
    </div>
  );
}
