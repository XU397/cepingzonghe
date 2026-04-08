import { useEffect, useState, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingProvider.jsx';
import { PAGE_MAPPING } from '../config.js';
import PageLayout from '../components/layout/PageLayout.jsx';
import styles from '../styles/Page07_Design.module.css';

const MIN_CHAR_COUNT = 2;

const Page07_Design = () => {
  const {
    session,
    logOperation,
    clearOperations,
    buildMarkObject,
    navigateToPage,
    submitPageData,
  } = useTrackingContext();

  const [pageStartTime] = useState(() => Date.now());
  const [isNavigating, setIsNavigating] = useState(false);

  const [idea1, setIdea1] = useState('');
  const [idea2, setIdea2] = useState('');
  const [idea3, setIdea3] = useState('');

  const [editStartTime, setEditStartTime] = useState({
    idea1: null,
    idea2: null,
    idea3: null,
  });

  const canNavigate =
    idea1.trim().length >= MIN_CHAR_COUNT &&
    idea2.trim().length >= MIN_CHAR_COUNT &&
    idea3.trim().length >= MIN_CHAR_COUNT;

  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'page_07_design',
      value: '方案设计页面',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'page_07_design',
        value: `停留时长: ${((Date.now() - pageStartTime) / 1000).toFixed(1)}秒`,
        time: new Date().toISOString(),
      });
    };
  }, [logOperation, pageStartTime]);

  const handleIdea1Change = useCallback(
    e => {
      const value = e.target.value;
      if (!editStartTime.idea1) {
        setEditStartTime(prev => ({ ...prev, idea1: Date.now() }));
        logOperation({
          action: 'start_edit',
          target: '实验想法输入框1',
          value: 'focus',
          time: new Date().toISOString(),
        });
      }

      setIdea1(value);
      logOperation({
        action: '文本域输入',
        target: '实验想法输入框1',
        value: `字符数：${value.trim().length}`,
        time: new Date().toISOString(),
      });
    },
    [editStartTime.idea1, logOperation]
  );

  const handleIdea2Change = useCallback(
    e => {
      const value = e.target.value;
      if (!editStartTime.idea2) {
        setEditStartTime(prev => ({ ...prev, idea2: Date.now() }));
        logOperation({
          action: 'start_edit',
          target: '实验想法输入框2',
          value: 'focus',
          time: new Date().toISOString(),
        });
      }

      setIdea2(value);
      logOperation({
        action: '文本域输入',
        target: '实验想法输入框2',
        value: `字符数：${value.trim().length}`,
        time: new Date().toISOString(),
      });
    },
    [editStartTime.idea2, logOperation]
  );

  const handleIdea3Change = useCallback(
    e => {
      const value = e.target.value;
      if (!editStartTime.idea3) {
        setEditStartTime(prev => ({ ...prev, idea3: Date.now() }));
        logOperation({
          action: 'start_edit',
          target: '实验想法输入框3',
          value: 'focus',
          time: new Date().toISOString(),
        });
      }

      setIdea3(value);
      logOperation({
        action: '文本域输入',
        target: '实验想法输入框3',
        value: `字符数：${value.trim().length}`,
        time: new Date().toISOString(),
      });
    },
    [editStartTime.idea3, logOperation]
  );

  const handleNextPage = useCallback(async () => {
    if (isNavigating || !canNavigate) return;

    setIsNavigating(true);

    try {
      logOperation({
        action: 'complete_design',
        target: 'design_ideas',
        value: JSON.stringify({
          idea1Length: idea1.trim().length,
          idea2Length: idea2.trim().length,
          idea3Length: idea3.trim().length,
        }),
        time: new Date().toISOString(),
      });

      logOperation({
        action: 'click_next',
        target: '下一页按钮',
        value: 'page_07_to_page_08',
        time: new Date().toISOString(),
      });

      const answerList = [
        { targetElement: '实验想法1', value: idea1.trim() },
        { targetElement: '实验想法2', value: idea2.trim() },
        { targetElement: '实验想法3', value: idea3.trim() },
      ];

      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(
        String(session.currentPage),
        pageInfo?.desc || '方案设计',
        { answerList }
      );
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(6);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page07_Design] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [
    isNavigating,
    canNavigate,
    idea1,
    idea2,
    idea3,
    logOperation,
    buildMarkObject,
    submitPageData,
    clearOperations,
    navigateToPage,
    session,
  ]);

  const ideas = [
    {
      id: 'idea1',
      label: '想法 1',
      value: idea1,
      onChange: handleIdea1Change,
      placeholder: '请输入你的第一个想法\n\n',
    },
    {
      id: 'idea2',
      label: '想法 2',
      value: idea2,
      onChange: handleIdea2Change,
      placeholder: '请输入你的第二个想法\n\n',
    },
    {
      id: 'idea3',
      label: '想法 3',
      value: idea3,
      onChange: handleIdea3Change,
      placeholder: '请输入你的第三个想法\n\n',
    },
  ];

  const getCharCountClass = value => {
    const len = value.length;
    if (len > 300 * 0.9) return styles.limit;
    if (len > 300 * 0.7) return styles.warning;
    return '';
  };

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <div className={styles.badge}>5</div>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>蜂蜜变稀：方案设计</h1>
          </div>
        </header>

        <div className={styles.instructionCard}>
          <p className={styles.instructionText}>
            为验证小明的猜想，首先要确定评估蜂蜜黏度的方法。假设有两瓶蜂蜜，请你帮小明想一想，有哪些可以比较两瓶蜂蜜黏度的方法。请提出三个可能的想法，将其简要陈述在下方方框内。
          </p>
        </div>

        <div className={styles.content}>
          {ideas.map((idea, index) => (
            <div
              key={idea.id}
              className={`${styles.inputCard} ${idea.value.trim().length >= MIN_CHAR_COUNT ? styles.filled : ''}`}
              data-index={index + 1}
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
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className={styles.textareaWrapper}>
                <textarea
                  id={idea.id}
                  className={styles.ideaTextarea}
                  value={idea.value}
                  onChange={idea.onChange}
                  placeholder={idea.placeholder}
                  maxLength={300}
                  aria-label={`${idea.label}输入框`}
                />
                <span className={`${styles.charCount} ${getCharCountClass(idea.value)}`}>
                  {idea.value.length}/300
                </span>
              </div>
            </div>
          ))}
        </div>

        <footer className={styles.footer}>
          <button
            className={styles.btnPrimary}
            onClick={handleNextPage}
            disabled={!canNavigate || isNavigating}
            aria-label="进入下一页"
          >
            <span>{isNavigating ? '提交中...' : '下一页'}</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </footer>
      </div>
    </PageLayout>
  );
};

export default Page07_Design;
