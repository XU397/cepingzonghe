import React, { useState, useEffect, useRef } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import EventTypes from '@shared/services/submission/eventTypes.js';
import styles from '../styles/Page08Conclusion.module.css';

const Page08Conclusion: React.FC = () => {
  const {
    logOperation,
    setPageStartTime,
    collectAnswer,
    answers,
    getPagePrefix
  } = usePvSandContext();

  const targetPrefix = getPagePrefix();
  const q4aTarget = `${targetPrefix}Q4a_光伏板有效性`;
  const q4bTarget = `${targetPrefix}Q4b_结论理由`;

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const pageInitializedRef = useRef(false);

  // Initialize from saved answers
  useEffect(() => {
    const savedOption = answers['selectedOption'];
    if (savedOption && typeof savedOption === 'string') {
      setSelectedOption(savedOption);
    }
    const savedReason = answers['reason'];
    if (savedReason && typeof savedReason === 'string') {
      setReason(savedReason);
    }
  }, []);

  // Listen for validation errors from frame
  useEffect(() => {
    const handleValidationError = () => {
      setShowError(true);
      logOperation({
        targetElement: `${targetPrefix}下一页按钮`,
        eventType: EventTypes.CLICK_BLOCKED,
        value: {
          reason: 'conclusion_incomplete',
          missing: ['Q4a_光伏板有效性', 'Q4b_结论理由'],
          timestamp: new Date().toISOString(),
        },
        time: new Date().toISOString(),
      });
      // Auto-hide error after 3 seconds
      setTimeout(() => setShowError(false), 3000);
    };

    window.addEventListener('pv-sand-validation-error', handleValidationError);
    return () => {
      window.removeEventListener('pv-sand-validation-error', handleValidationError);
    };
  }, [targetPrefix, logOperation]);

  useEffect(() => {
    if (pageInitializedRef.current) {
      return;
    }
    pageInitializedRef.current = true;

    const startTime = new Date();
    setPageStartTime(startTime);
  }, [setPageStartTime]);

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);

    collectAnswer({
      targetElement: 'selectedOption',
      value: option
    });

    // 格式化为规范的选项格式
    const formattedValue = option === '是' ? 'A. 是' : 'B. 否';
    logOperation({
      targetElement: q4aTarget,
      eventType: EventTypes.RADIO_SELECT,
      value: formattedValue,
      time: new Date().toISOString()
    });
  };

  const handleReasonChange = (value: string) => {
    const prev = reason;
    setReason(value);

    collectAnswer({
      targetElement: 'reason',
      value: value
    });

    const isDelete = value.length < prev.length;
    const eventType = isDelete ? EventTypes.INPUT_DELETE : EventTypes.INPUT_CHANGE;
    const normalizedValue = isDelete
      ? {
          action: 'delete',
          prevLength: prev.length,
          nextLength: value.length,
        }
      : {
          prev,
          next: value,
        };

    logOperation({
      targetElement: q4bTarget,
      eventType,
      value: normalizedValue,
      time: new Date().toISOString()
    });
  };

  const handleReasonFocus = () => {
    logOperation({
      targetElement: q4bTarget,
      eventType: EventTypes.INPUT_FOCUS,
      value: reason ?? '',
      time: new Date().toISOString(),
    });
  };

  const handleReasonBlur = () => {
    logOperation({
      targetElement: q4bTarget,
      eventType: EventTypes.INPUT_BLUR,
      value: reason ?? '',
      time: new Date().toISOString()
    });
  };

  const isValid = !!selectedOption && reason.length >= 10;

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <h1 className={styles.title}>光伏治沙</h1>

        <div className={styles.contentWrapper}>
          <div className={styles.leftSection}>
            <div className={styles.questionBox}>
              <p className={styles.questionTitle}>
                <strong>问题4：</strong>右图展示了不同高度的风速测量数据。请问光伏板是否能够有效改变近地表的风速环境？
              </p>

              <div className={styles.options}>
                <label className={styles.optionItem}>
                  <input
                    type="radio"
                    name="conclusion"
                    value="是"
                    checked={selectedOption === '是'}
                    onChange={() => handleOptionChange('是')}
                  />
                  <span className={styles.optionText}>是</span>
                </label>
                <label className={styles.optionItem}>
                  <input
                    type="radio"
                    name="conclusion"
                    value="否"
                    checked={selectedOption === '否'}
                    onChange={() => handleOptionChange('否')}
                  />
                  <span className={styles.optionText}>否</span>
                </label>
              </div>

              <p className={styles.reasonLabel}>请结合图中数据说明理由。</p>

              <textarea
                className={styles.reasonInput}
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                onFocus={handleReasonFocus}
                onBlur={handleReasonBlur}
                placeholder="请输入您的理由..."
                rows={4}
              />
              <div style={{ textAlign: 'right', fontSize: '12px', color: isValid ? 'green' : 'red', marginTop: '5px' }}>
                {reason.length}/10 字符
              </div>

              {showError && (
                <div className={styles.errorMessage}>
                  请选择结论并填写至少 10 个字符的理由
                </div>
              )}
            </div>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.chartContainer}>
              <svg viewBox="0 0 600 500" className={styles.chart} preserveAspectRatio="xMidYMid meet">
                {/* 坐标轴 */}
                <line x1="80" y1="40" x2="80" y2="420" stroke="#333" strokeWidth="3" />
                <line x1="80" y1="420" x2="560" y2="420" stroke="#333" strokeWidth="3" />

                {/* Y轴刻度 (0-3, 每格0.5) */}
                <text x="50" y="427" fontSize="16" fill="#333" textAnchor="end">0</text>
                <text x="50" y="360" fontSize="16" fill="#333" textAnchor="end">0.5</text>
                <text x="50" y="293" fontSize="16" fill="#333" textAnchor="end">1</text>
                <text x="50" y="226" fontSize="16" fill="#333" textAnchor="end">1.5</text>
                <text x="50" y="159" fontSize="16" fill="#333" textAnchor="end">2</text>
                <text x="50" y="92" fontSize="16" fill="#333" textAnchor="end">2.5</text>
                <text x="50" y="47" fontSize="16" fill="#333" textAnchor="end">3</text>

                {/* Y轴标签 */}
                <text x="20" y="230" fontSize="18" fill="#333" transform="rotate(-90, 20, 230)" fontWeight="600">风速 (m/s)</text>

                {/* X轴刻度 */}
                <text x="160" y="450" fontSize="16" fill="#333" textAnchor="middle">20</text>
                <text x="320" y="450" fontSize="16" fill="#333" textAnchor="middle">50</text>
                <text x="490" y="450" fontSize="16" fill="#333" textAnchor="middle">100</text>

                {/* X轴标签 */}
                <text x="320" y="485" fontSize="18" fill="#333" textAnchor="middle" fontWeight="600">测量高度 (cm)</text>

                {/* 网格线 */}
                <line x1="80" y1="360" x2="560" y2="360" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="80" y1="293" x2="560" y2="293" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="80" y1="226" x2="560" y2="226" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="80" y1="159" x2="560" y2="159" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />
                <line x1="80" y1="92" x2="560" y2="92" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />

                {/* 有板数据线 (蓝色) - 2.09, 2.25, 1.66 */}
                <polyline
                  points="160,280 320,270 490,308"
                  fill="none"
                  stroke="#2196f3"
                  strokeWidth="3"
                />
                <circle cx="160" cy="280" r="6" fill="#2196f3" />
                <circle cx="320" cy="270" r="6" fill="#2196f3" />
                <circle cx="490" cy="308" r="6" fill="#2196f3" />
                <text x="160" y="265" fontSize="14" fill="#2196f3" fontWeight="bold" textAnchor="middle">2.09</text>
                <text x="320" y="255" fontSize="14" fill="#2196f3" fontWeight="bold" textAnchor="middle">2.25</text>
                <text x="490" y="293" fontSize="14" fill="#2196f3" fontWeight="bold" textAnchor="middle">1.66</text>

                {/* 无板数据线 (橙色) - 2.37, 2.62, 2.77 */}
                <polyline
                  points="160,249 320,230 490,220"
                  fill="none"
                  stroke="#ff9800"
                  strokeWidth="3"
                />
                <circle cx="160" cy="249" r="6" fill="#ff9800" />
                <circle cx="320" cy="230" r="6" fill="#ff9800" />
                <circle cx="490" cy="220" r="6" fill="#ff9800" />
                <text x="160" y="234" fontSize="14" fill="#ff9800" fontWeight="bold" textAnchor="middle">2.37</text>
                <text x="320" y="215" fontSize="14" fill="#ff9800" fontWeight="bold" textAnchor="middle">2.62</text>
                <text x="490" y="205" fontSize="14" fill="#ff9800" fontWeight="bold" textAnchor="middle">2.77</text>

                {/* 图例 */}
                <g transform="translate(460, 60)">
                  <rect x="0" y="0" width="120" height="70" fill="white" stroke="#ddd" strokeWidth="1" rx="4" />

                  <line x1="10" y1="20" x2="40" y2="20" stroke="#2196f3" strokeWidth="3" />
                  <circle cx="25" cy="20" r="4" fill="#2196f3" />
                  <text x="45" y="25" fontSize="14" fill="#333" fontWeight="600">有板</text>

                  <line x1="10" y1="50" x2="40" y2="50" stroke="#ff9800" strokeWidth="3" />
                  <circle cx="25" cy="50" r="4" fill="#ff9800" />
                  <text x="45" y="55" fontSize="14" fill="#333" fontWeight="600">无板</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page08Conclusion;
