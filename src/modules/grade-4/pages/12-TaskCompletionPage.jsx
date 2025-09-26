/**
 * 故事 2.9：测评完成与数据总提交（PDF 第19页）
 */

import React, { useEffect, useState } from 'react';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';
import { useGrade4Context } from '../context/Grade4Context';
import styles from './12-TaskCompletionPage.module.css';

const TaskCompletionPage = () => {
  const { setNavigationStep, completeGlobalTimer, logOperation, collectAnswer, submitCurrentPageData } = useGrade4Context();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setNavigationStep('11'); }, [setNavigationStep]);

  const onFinish = async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    setError('');
    try {
      // 停止计时
      completeGlobalTimer();
      // 记录模块完成
      logOperation({ targetElement: '模块', eventType: 'module_complete', value: 'grade-4 end' });
      collectAnswer({ targetElement: 'task-completion', value: { completed: true, timestamp: Date.now() } });
      // 提交最后一页数据（其余页在导航时已自动提交）
      await submitCurrentPageData();
      setSubmitted(true);
    } catch (e) {
      setError('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AssessmentPageLayout showNextButton={false}>
      <div className={styles._page}>
        <div className={styles.hero}>
          <div className={styles.title}>测评完成</div>
          <div className={styles.desc}>请点击“完成”提交本模块数据。提交后将显示结果提示。</div>
        </div>
        <div className={styles.submitWrap}>
          <button type="button" className={styles.finishBtn} disabled={submitting || submitted} onClick={onFinish}>
            {submitted ? '已完成' : (submitting ? '提交中…' : '完成')}
          </button>
          {submitted && <span className={styles.statusOk}>提交成功</span>}
          {!!error && <span className={styles.statusBad}>{error}</span>}
        </div>
      </div>
    </AssessmentPageLayout>
  );
};

export default TaskCompletionPage;

