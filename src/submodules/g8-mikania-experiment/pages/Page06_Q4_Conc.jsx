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
    getCurrentValidationErrors,
    logClickBlocked,
    navigateToNextPage,
    isSubmitting,
  } = useMikaniaExperiment();

  const [selectedJudgment, setSelectedJudgment] = useState(state.answers.Q4a_菟丝子有效性 || '');
  const [conclusionText, setConclusionText] = useState(state.answers.Q4b_结论理由 || '');
  const [showQ4aError, setShowQ4aError] = useState(false);
  const [q4aErrorMessage, setQ4aErrorMessage] = useState('');
  const [showQ4bError, setShowQ4bError] = useState(false);
  const [q4bErrorMessage, setQ4bErrorMessage] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

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
    if (showQ4aError) {
      setShowQ4aError(false);
      setQ4aErrorMessage('');
    }

    // 记录操作
    logOperation({
      targetElement: 'Q4a_菟丝子有效性',
      eventType: 'change',
      value: value,
    });
  };

  // 处理文本输入变化
  const handleTextChange = (e) => {
    const value = e.target.value;
    setConclusionText(value);
    setAnswer('Q4b_结论理由', value);

    // 清除错误提示
    if (showQ4bError && value.length >= 10) {
      setShowQ4bError(false);
      setQ4bErrorMessage('');
    }

    // 记录操作
    logOperation({
      targetElement: 'Q4b_结论理由',
      eventType: 'change',
      value: value,
    });
  };

  // 处理提交点击 (T051, T052)
  const handleSubmit = async () => {
    console.log('[Page06_Q4_Conc] handleSubmit 被调用');
    console.log('[Page06_Q4_Conc] 当前判断:', selectedJudgment);
    console.log('[Page06_Q4_Conc] 当前理由:', conclusionText);
    console.log('[Page06_Q4_Conc] 答案状态:', state.answers);

    const isValid = validateCurrentPage();
    console.log('[Page06_Q4_Conc] 验证结果:', isValid);

    if (!isValid) {
      const errors = getCurrentValidationErrors();
      console.log('[Page06_Q4_Conc] 验证错误:', errors);
      const missingFields = [];

      // Check Q4a
      if (errors.Q4a_菟丝子有效性) {
        setShowQ4aError(true);
        setQ4aErrorMessage(errors.Q4a_菟丝子有效性);
        missingFields.push('Q4a_菟丝子有效性');
      } else {
        setShowQ4aError(false);
        setQ4aErrorMessage('');
      }

      // Check Q4b
      if (errors.Q4b_结论理由) {
        setShowQ4bError(true);
        setQ4bErrorMessage(errors.Q4b_结论理由);
        missingFields.push('Q4b_结论理由');
      } else {
        setShowQ4bError(false);
        setQ4bErrorMessage('');
      }

      // Log click_blocked event (T051)
      logClickBlocked('validation_failed', missingFields);
      return;
    }

    // Clear all errors and proceed
    setShowQ4aError(false);
    setQ4aErrorMessage('');
    setShowQ4bError(false);
    setQ4bErrorMessage('');
    setIsNavigating(true);

    logOperation({
      targetElement: '提交按钮',
      eventType: 'click',
      value: 'page_06_q4_conc',
    });

    console.log('[Page06_Q4_Conc] 准备调用 navigateToNextPage');
    try {
      await navigateToNextPage();
      console.log('[Page06_Q4_Conc] navigateToNextPage 完成');
    } catch (error) {
      console.error('[Page06_Q4_Conc] navigateToNextPage 出错:', error);
    } finally {
      setIsNavigating(false);
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
          {showQ4aError && (
            <div className={styles.errorHint}>{q4aErrorMessage}</div>
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
              className={`${styles.textInput} ${showQ4bError ? styles.textInputError : ''}`}
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
          {showQ4bError && (
            <div className={styles.errorHint}>{q4bErrorMessage}</div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className={styles.actionRow}>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isNavigating || isSubmitting}
          >
            {isNavigating || isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>

      {/* 右侧：发芽率趋势图 */}
      <div className={styles.rightPanel}>
        <h2 className={styles.panelTitle}>发芽率趋势分析</h2>
        <div className={styles.chartContainer}>
          <ChartPanel />
        </div>
      </div>
    </div>
  );
}

export default Page06Q4Conc;
