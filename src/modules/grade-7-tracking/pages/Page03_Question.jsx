/**
 * Page03_Question - 提出问题页面 (页码 2)
 *
 * 功能:
 * - 显示小明和爸爸的对话气泡
 * - 提供文本输入框让学生输入问题
 * - 输入内容后才能点击"下一页"
 */

import { useEffect, useCallback, useState } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/ExplorationPages.module.css';

const DIALOGUE_CONTENT = [
  {
    speaker: '小明',
    text: '爸爸，我发现这瓶蜂蜜好像比刚买回来的时候要稀一些了。',
    avatar: 'xiaoming'
  },
  {
    speaker: '爸爸',
    text: '嗯，你观察得很仔细。蜂蜜的黏度确实会发生变化。',
    avatar: 'baba'
  },
  {
    speaker: '小明',
    text: '那是什么原因导致蜂蜜变稀的呢？',
    avatar: 'xiaoming'
  },
  {
    speaker: '爸爸',
    text: '这是个好问题！你可以通过实验来探究这个现象。',
    avatar: 'baba'
  }
];

const Page03_Question = () => {
  const {
    logOperation,
    clearOperations,
    currentPageOperations,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [pageStartTime] = useState(() => new Date());
  const [questionText, setQuestionText] = useState('');
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  // 记录页面进入/退出
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'Page_02_Question',
      value: '提出问题',
      time: new Date().toISOString()
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_02_Question',
        value: '提出问题',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  // 处理文本输入
  const handleTextChange = useCallback((event) => {
    const value = event.target.value;
    setQuestionText(value);

    if (!hasStartedTyping && value.length > 0) {
      setHasStartedTyping(true);
      logOperation({
        action: 'text_input_start',
        target: 'question_input',
        value: '开始输入',
        time: new Date().toISOString()
      });
    }

    logOperation({
      action: 'text_input',
      target: 'question_input',
      value: value,
      time: new Date().toISOString()
    });
  }, [hasStartedTyping, logOperation]);

  // 处理"下一页"点击
  const handleNextClick = useCallback(async () => {
    if (questionText.trim().length === 0) {
      alert('请输入您要探究的科学问题');
      return;
    }

    logOperation({
      action: 'button_click',
      target: 'next_page_button',
      value: '下一页',
      time: new Date().toISOString()
    });

    try {
      const pageEndTime = new Date();
      const markObject = {
        pageNumber: '2',
        pageDesc: '提出问题',
        operationList: currentPageOperations.map(op => ({
          targetElement: op.target,
          eventType: op.action,
          value: op.value || '',
          time: op.time || new Date(op.timestamp).toISOString()
        })),
        answerList: [
          {
            targetElement: 'question_input',
            value: questionText.trim()
          }
        ],
        beginTime: formatDateTime(pageStartTime),
        endTime: formatDateTime(pageEndTime),
        imgList: []
      };

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(3);
      }
    } catch (error) {
      console.error('[Page03_Question] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [questionText, currentPageOperations, pageStartTime, logOperation, submitPageData, clearOperations, navigateToPage]);

  const canGoNext = questionText.trim().length > 0;

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <div className={styles.splitLayout}>
          {/* 左侧: 对话气泡 */}
          <div className={styles.leftPanel}>
            <h2 className={styles.sectionTitle}>蜂蜜的奥秘</h2>
            <div className={styles.dialogueContainer}>
              {DIALOGUE_CONTENT.map((dialogue, index) => (
                <div
                  key={index}
                  className={`${styles.dialogueBubble} ${
                    dialogue.speaker === '小明' ? styles.xiaomingBubble : styles.babaBubble
                  }`}
                >
                  <div className={styles.speakerName}>{dialogue.speaker}:</div>
                  <div className={styles.dialogueText}>{dialogue.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧: 任务描述和输入框 */}
          <div className={styles.rightPanel}>
            <div className={styles.taskSection}>
              <h3 className={styles.taskTitle}>任务</h3>
              <p className={styles.taskDescription}>
                根据左侧对话，请写出接下来小明要探究的科学问题？
              </p>
              <textarea
                value={questionText}
                onChange={handleTextChange}
                placeholder="请在此输入您的问题..."
                className={styles.textArea}
                rows={8}
              />
            </div>
          </div>
        </div>

        {/* 下一页按钮 */}
        <div className={styles.buttonContainer}>
          <button
            onClick={handleNextClick}
            disabled={!canGoNext}
            className={`${styles.nextButton} ${canGoNext ? styles.active : styles.disabled}`}
          >
            下一页
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

// 辅助函数: 格式化日期时间
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export default Page03_Question;
