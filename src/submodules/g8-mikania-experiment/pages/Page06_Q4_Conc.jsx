/**
 * Page 06 - 结论 + Q4
 *
 * 左侧显示Q4问题，右侧为发芽率趋势图
 * Q4a: 是/否判断题 - 菟丝子是否对薇甘菊有抑制作用
 * Q4b: 文本输入 - 结论理由（最少10个字符）
 * 这是最后一页，需要处理最终提交
 *
 * 注意：此页面的 flowContext.onComplete() 由 AssessmentPageFrame 容器在用户点击
 * "提交"按钮并成功提交数据后调用。此页面不直接调用 onComplete()。
 */

import { useEffect, useState } from 'react';
import { useMikaniaExperiment } from '../Component';
import ChartPanel from '../components/ChartPanel';
import styles from '../styles/Page06_Q4_Conc.module.css';

function Page06Q4Conc() {
  const {
    state,
    setAnswer,
    logOperation,
    validateCurrentPage,
    getCurrentMissingFields,
  } = useMikaniaExperiment();

  const [selectedJudgment, setSelectedJudgment] = useState(state.answers.Q4a_菟丝子有效性 || '');
  const [conclusionText, setConclusionText] = useState(state.answers.Q4b_结论理由 || '');
  const [errorQ4a, setErrorQ4a] = useState('');
  const [errorQ4b, setErrorQ4b] = useState('');

  // 记录页面进入
  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: 'page_06_q4_conc',
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: 'page_06_q4_conc',
      });
    };
  }, [logOperation]);

  // 处理判断题变化
  const handleJudgmentChange = (value) => {
    setSelectedJudgment(value);
    setAnswer('Q4a_菟丝子有效性', value);

    // 清除错误提示
    if (errorQ4a) {
      setErrorQ4a('');
    }

    // 记录操作
    logOperation({
      targetElement: 'Q4a_菟丝子有效性',
      eventType: 'radio_select',
      value: value,
    });
  };

  // 处理文本输入变化
  const handleTextChange = (e) => {
    const value = e.target.value;
    setConclusionText(value);
    setAnswer('Q4b_结论理由', value);

    // 清除错误提示
    if (errorQ4b && value.length >= 10) {
      setErrorQ4b('');
    }

    // 记录操作
    logOperation({
      targetElement: 'Q4b_结论理由',
      eventType: 'input_change',
      value: value,
    });
  };

  // 处理提交点击（由 Frame 调用）
  const handleSubmit = () => {
    // 验证必填项
    if (!validateCurrentPage()) {
      const missing = getCurrentMissingFields();

      // 显示具体的错误提示
      if (missing.some(m => m.field === 'Q4a_菟丝子有效性')) {
        setErrorQ4a('请选择是或否');
      }
      if (missing.some(m => m.field === 'Q4b_结论理由')) {
        setErrorQ4b('请输入至少10个字符的理由');
      }

      // 记录阻断事件
      logOperation({
        targetElement: '提交按钮',
        eventType: 'click_blocked',
        value: JSON.stringify({
          reason: 'validation_failed',
          missing,
        }),
      });
      return;
    }

    // 清除错误提示
    setErrorQ4a('');
    setErrorQ4b('');

    // 记录成功点击
    logOperation({
      targetElement: '提交按钮',
      eventType: 'click',
      value: 'final_submit',
    });

    // 触发 Frame 的下一页按钮（在最后一页，Frame 会调用 onComplete）
    const frameNextButton = document.querySelector('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  const charCount = conclusionText.length;
  const minChars = 10;

  return (
    <div className={styles.container}>
      {/* 页面标题 */}
      <h1 className={styles.pageTitle}>薇甘菊防治</h1>

      {/* 左侧：问题 Q4 */}
      <div className={styles.leftPanel}>
        <h2 className={styles.panelTitle}>问题 4</h2>

        {/* Q4a: 判断题 */}
        <div className={styles.questionCard}>
          <p className={styles.questionText}>
            <span className={styles.questionLabel}>判断：</span>
            右图展示了实验数据结果。请问引入菟丝子是否能够有效抑制薇甘菊生长？
          </p>
          <div className={styles.judgmentContainer}>
            <button
              className={`${styles.judgmentButton} ${
                selectedJudgment === '是' ? styles.judgmentSelected : ''
              }`}
              onClick={() => handleJudgmentChange('是')}
            >
              是
            </button>
            <button
              className={`${styles.judgmentButton} ${
                selectedJudgment === '否' ? styles.judgmentSelected : ''
              }`}
              onClick={() => handleJudgmentChange('否')}
            >
              否
            </button>
          </div>
          {errorQ4a && (
            <div className={styles.errorHint}>
              {errorQ4a}
            </div>
          )}
        </div>

        {/* Q4b: 文本输入 */}
        <div className={styles.questionCard}>
          <p className={styles.questionText}>
            <span className={styles.questionLabel}>问答：</span>
            请结合图中数据说明理由。（至少10个字符）
          </p>
          <div className={styles.inputContainer}>
            <textarea
              className={`${styles.textInput} ${errorQ4b ? styles.textInputError : ''}`}
              value={conclusionText}
              onChange={handleTextChange}
              placeholder="请输入您的结论理由..."
              rows={6}
            />
            <div className={styles.charCounter}>
              <span className={charCount < minChars ? styles.insufficientChars : styles.sufficientChars}>
                {charCount}
              </span>
              <span className={styles.charRequirement}>/{minChars} 字符</span>
            </div>
          </div>
          {errorQ4b && (
            <div className={styles.errorHint}>
              {errorQ4b}
            </div>
          )}
        </div>
      </div>

      {/* 右侧：发芽率趋势图 */}
      <div className={styles.rightPanel}>
        <h2 className={styles.panelTitle}>发芽率趋势分析</h2>
        <div className={styles.chartContainer}>
          <ChartPanel />
        </div>
      </div>

      {/* 隐藏的提交按钮，用于 Frame 回调 */}
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
        onClick={handleSubmit}
        data-testid="next-button"
        aria-hidden="true"
      >
        提交
      </button>
    </div>
  );
}

export default Page06Q4Conc;
