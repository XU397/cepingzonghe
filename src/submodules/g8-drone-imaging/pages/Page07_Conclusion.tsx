import React, { useEffect, useState } from 'react';
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
  { value: 'A', label: 'A. 飞行高度' },
  { value: 'B', label: 'B. 镜头焦距' },
];

// Chart data based on experiment data table
const chartData = [
  { focalLength: 8, '100米': 3, '200米': 6, '300米': 9 },
  { focalLength: 24, '100米': 1, '200米': 2, '300米': 3 },
  { focalLength: 50, '100米': 0.5, '200米': 1, '300米': 1 },
];

export default function Page07_Conclusion() {
  const { logOperation, setAnswer, getAnswer, saveToStorage } = useDroneImagingContext();

  const [selectedRadio, setSelectedRadio] = useState(getAnswer('P7_优先调整因素') || '');
  const [reasonText, setReasonText] = useState(getAnswer('P7_理由说明') || '');
  const [error, setError] = useState('');

  useEffect(() => {
    logOperation({
      targetElement: 'page',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page07_Conclusion',
      time: formatTimestamp(new Date()),
    });

    return () => {
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page07_Conclusion',
        time: formatTimestamp(new Date()),
      });
    };
  }, [logOperation]);

  const handleRadioChange = (value: string) => {
    setSelectedRadio(value);
    setError('');
    setAnswer('P7_优先调整因素', value);
    logOperation({
      targetElement: 'P7_优先调整因素',
      eventType: EventTypes.RADIO_SELECT,
      value,
      time: formatTimestamp(new Date()),
    });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReasonText(value);
    setError('');
    setAnswer('P7_理由说明', value);
    logOperation({
      targetElement: 'P7_理由说明',
      eventType: EventTypes.INPUT_CHANGE,
      value,
      time: formatTimestamp(new Date()),
    });
  };

  const handleComplete = () => {
    if (!selectedRadio) {
      setError('请选择一个答案');
      logOperation({
        targetElement: 'submit_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'radio_not_selected',
        time: formatTimestamp(new Date()),
      });
      return;
    }

    if (reasonText.length <= MIN_CHARS) {
      setError('请输入至少 5 个字符的理由说明');
      logOperation({
        targetElement: 'submit_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'reason_too_short',
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
        {/* Left column: Questions */}
        <div className={styles.leftPanel}>
          <h2 className={styles.panelTitle}>总结结论</h2>

          {/* Task box */}
          <div className={styles.taskBox}>
            <p className={styles.taskText}>
              <strong>问题4：</strong> 右图展示了飞行高度、镜头焦距与地面采样距离（GSD）的关系曲线。请问在航拍中，为获取更高精度的影像，应优先考虑降低飞行高度还是调整镜头焦距？
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
                    onChange={() => handleRadioChange(option.value)}
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
            <p className={styles.sectionLabel}>请说明你的理由：</p>
            <textarea
              value={reasonText}
              onChange={handleTextareaChange}
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

        {/* Right column: Chart */}
        <div className={styles.rightPanel}>
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
                    dataKey="100米"
                    stroke="#2196f3"
                    strokeWidth={2}
                    dot={{ fill: '#2196f3', r: 5 }}
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
                    dataKey="300米"
                    stroke="#9e9e9e"
                    strokeWidth={2}
                    dot={{ fill: '#9e9e9e', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className={styles.chartNote}>注：GSD 数值越大，图像就越模糊</p>
          </div>
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

