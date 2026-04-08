import { useCallback, useEffect, useMemo, useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import QuestionTable from '../components/questionnaire/QuestionTable';
import { useTrackingContext } from '../context/TrackingProvider.jsx';
import { useQuestionnaire } from '../hooks/useQuestionnaire';
import { useDataLogger } from '../hooks/useDataLogger';
import { getQuestionnairePageData } from '../utils/questionnaireLoader';
import styles from '../styles/Page21_Questionnaire7.module.css';

const PAGE_NUMBER = 20;

const Page21_Questionnaire7 = () => {
  const { logOperation, clearOperations, navigateToPage, buildMarkObject } = useTrackingContext();
  const { answers, setAnswer, isPageComplete } = useQuestionnaire();
  const { submitPageData } = useDataLogger();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIncompleteWarning, setShowIncompleteWarning] = useState(false);

  const pageData = useMemo(() => getQuestionnairePageData(PAGE_NUMBER), []);

  const canProceed = useMemo(() => isPageComplete(PAGE_NUMBER), [isPageComplete]);

  const options = useMemo(() => pageData?.questions?.[0]?.options || [], [pageData]);

  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: `Page_${PAGE_NUMBER}_Questionnaire`,
      value: pageData?.title || `问卷页${PAGE_NUMBER}`,
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: `Page_${PAGE_NUMBER}_Questionnaire`,
        value: pageData?.title || `问卷页${PAGE_NUMBER}`,
        time: new Date().toISOString(),
      });
    };
  }, [logOperation, pageData]);

  const handleAnswerChange = useCallback(
    (questionId, value) => {
      const question = pageData?.questions.find(q => q.id === questionId);
      if (!question) {
        return;
      }

      setAnswer(question.id, value, question.text);

      if (showIncompleteWarning) {
        setShowIncompleteWarning(false);
      }
    },
    [pageData, setAnswer, showIncompleteWarning]
  );

  const handleNextClick = useCallback(async () => {
    if (!canProceed) {
      setShowIncompleteWarning(true);
      logOperation({
        action: 'click_blocked',
        target: 'next_button',
        value: '未完成所有必答题',
        time: new Date().toISOString(),
      });
      return;
    }

    setIsSubmitting(true);

    logOperation({
      action: 'click',
      target: 'next_page_button',
      value: '下一页',
      time: new Date().toISOString(),
    });

    try {
      const answerList = pageData.questions.map((question, index) => {
        const selected = answers[`q${question.id}`];
        const label =
          (question.options || []).find(option => option.value === selected)?.label || null;

        return {
          targetElement: `P${PAGE_NUMBER}_问题${index + 1}`,
          value: label || '未回答',
        };
      });

      const markObject = buildMarkObject(String(PAGE_NUMBER), pageData.title, { answerList });
      const success = await submitPageData(markObject);

      if (!success) {
        throw new Error('数据提交失败');
      }

      clearOperations();
      await navigateToPage(PAGE_NUMBER + 1);
    } catch (error) {
      console.error('[Page21_Questionnaire7] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    answers,
    buildMarkObject,
    canProceed,
    clearOperations,
    logOperation,
    navigateToPage,
    pageData,
    submitPageData,
  ]);

  if (!pageData) {
    return (
      <PageLayout showNavigation={true} showTimer={true}>
        <div className={styles.pageContainer}>
          <div className={styles.errorBox}>加载问卷数据失败，请刷新页面重试。</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <div className={styles.questionnaireContent}>
          <p className={styles.pageDescription}>
            请选择你参与以下各项<span className={styles.highlight}>校外</span>科学活动的频率。
          </p>

          <div className={styles.tableContainer}>
            <QuestionTable
              questions={pageData.questions}
              answers={answers}
              onAnswerChange={handleAnswerChange}
              options={options}
            />
          </div>

          <div className={styles.buttonContainer}>
            <button
              type="button"
              className={styles.nextButton}
              onClick={handleNextClick}
              disabled={!canProceed || isSubmitting}
            >
              {isSubmitting ? '提交中...' : '下一页'}
            </button>

            {showIncompleteWarning && !canProceed && (
              <div className={styles.warningMessage}>请完成本页所有必答题后再继续</div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Page21_Questionnaire7;
