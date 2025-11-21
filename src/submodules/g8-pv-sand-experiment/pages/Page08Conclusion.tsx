import React, { useState, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import { useAnswerDrafts } from '../hooks/useAnswerDrafts';
import { getNextPageId } from '../mapping';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Page08Conclusion.module.css';

const Page08Conclusion: React.FC = () => {
  const {
    logOperation,
    navigateToPage,
    setPageStartTime
  } = usePvSandContext();

  const {
    updateExperimentAnswer,
    collectPageAnswers,
    markPageCompleted,
    answerDraft
  } = useAnswerDrafts();

  const [selectedOption, setSelectedOption] = useState<string>(
    answerDraft.experimentAnswers.conclusionAnswers?.selectedOption || ''
  );
  const [reason, setReason] = useState<string>(
    answerDraft.experimentAnswers.conclusionAnswers?.reason || ''
  );

  const currentPageId = 'page08-conclusion';

  useEffect(() => {
    const startTime = new Date();
    setPageStartTime(startTime);

    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: currentPageId,
      time: startTime.toISOString()
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: currentPageId,
        time: new Date().toISOString()
      });
    };
  }, [logOperation, setPageStartTime]);

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);

    updateExperimentAnswer('conclusionAnswers', {
      ...answerDraft.experimentAnswers.conclusionAnswers,
      selectedOption: option
    });

    logOperation({
      targetElement: '选项',
      eventType: 'click',
      value: option,
      time: new Date().toISOString()
    });
  };

  const handleReasonChange = (value: string) => {
    setReason(value);

    updateExperimentAnswer('conclusionAnswers', {
      ...answerDraft.experimentAnswers.conclusionAnswers,
      reason: value
    });

    logOperation({
      targetElement: '理由输入',
      eventType: 'input',
      value: value,
      time: new Date().toISOString()
    });
  };

  const handleNext = () => {
    logOperation({
      targetElement: '下一页按钮',
      eventType: 'click',
      value: '点击下一页',
      time: new Date().toISOString()
    });

    collectPageAnswers(currentPageId);
    markPageCompleted(currentPageId);

    const nextPageId = getNextPageId(currentPageId);
    if (nextPageId) {
      navigateToPage(nextPageId);
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar currentStep={6} totalSteps={6} variant="experiment" />

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
                placeholder=""
                rows={4}
              />
            </div>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.chartContainer}>
              <svg viewBox="0 0 400 300" className={styles.chart}>
                {/* 坐标轴 */}
                <line x1="50" y1="20" x2="50" y2="250" stroke="#333" strokeWidth="2" />
                <line x1="50" y1="250" x2="380" y2="250" stroke="#333" strokeWidth="2" />

                {/* Y轴刻度 (0-3, 每格0.5) */}
                <text x="20" y="254" fontSize="12" fill="#333">0</text>
                <text x="12" y="212" fontSize="12" fill="#333">0.5</text>
                <text x="20" y="170" fontSize="12" fill="#333">1</text>
                <text x="12" y="128" fontSize="12" fill="#333">1.5</text>
                <text x="20" y="86" fontSize="12" fill="#333">2</text>
                <text x="12" y="44" fontSize="12" fill="#333">2.5</text>
                <text x="20" y="28" fontSize="12" fill="#333">3</text>

                {/* Y轴标签 */}
                <text x="8" y="140" fontSize="12" fill="#333" transform="rotate(-90, 8, 140)">风速 (m/s)</text>

                {/* X轴刻度 */}
                <text x="95" y="270" fontSize="12" fill="#333">20</text>
                <text x="195" y="270" fontSize="12" fill="#333">50</text>
                <text x="315" y="270" fontSize="12" fill="#333">100</text>

                {/* X轴标签 */}
                <text x="160" y="290" fontSize="12" fill="#333">测量高度 (cm)</text>

                {/* 有板数据线 (蓝色) - 2.09, 2.25, 1.66 */}
                <polyline
                  points="100,161 200,155 340,183"
                  fill="none"
                  stroke="#4a90d9"
                  strokeWidth="2"
                />
                <circle cx="100" cy="161" r="4" fill="#4a90d9" />
                <circle cx="200" cy="155" r="4" fill="#4a90d9" />
                <circle cx="340" cy="183" r="4" fill="#4a90d9" />
                <text x="85" y="155" fontSize="11" fill="#4a90d9" fontWeight="bold">2.09</text>
                <text x="185" y="149" fontSize="11" fill="#4a90d9" fontWeight="bold">2.25</text>
                <text x="325" y="177" fontSize="11" fill="#4a90d9" fontWeight="bold">1.66</text>

                {/* 无板数据线 (橙色) - 2.37, 2.62, 2.77 */}
                <polyline
                  points="100,138 200,120 340,113"
                  fill="none"
                  stroke="#ff8c42"
                  strokeWidth="2"
                />
                <circle cx="100" cy="138" r="4" fill="#ff8c42" />
                <circle cx="200" cy="120" r="4" fill="#ff8c42" />
                <circle cx="340" cy="113" r="4" fill="#ff8c42" />
                <text x="85" y="132" fontSize="11" fill="#ff8c42" fontWeight="bold">2.37</text>
                <text x="185" y="114" fontSize="11" fill="#ff8c42" fontWeight="bold">2.62</text>
                <text x="325" y="107" fontSize="11" fill="#ff8c42" fontWeight="bold">2.77</text>

                {/* 图例 */}
                <g transform="translate(320, 30)">
                  <line x1="0" y1="5" x2="20" y2="5" stroke="#4a90d9" strokeWidth="2" />
                  <circle cx="10" cy="5" r="3" fill="#4a90d9" />
                  <text x="25" y="10" fontSize="11" fill="#333">有板</text>

                  <line x1="0" y1="25" x2="20" y2="25" stroke="#ff8c42" strokeWidth="2" />
                  <circle cx="10" cy="25" r="3" fill="#ff8c42" />
                  <text x="25" y="30" fontSize="11" fill="#333">无板</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <div className={styles.navigation}>
          <button onClick={handleNext} className={styles.nextButton}>
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page08Conclusion;
