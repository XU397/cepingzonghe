/**
 * Page03_Question - 提出问题页面 (页码 2)
 *
 * 功能:
 * - 显示小明和爸爸的对话气泡
 * - 提供文本输入框让学生输入问题
 * - 输入内容后才能点击下一页
 */

import { useEffect, useCallback, useState } from 'react';
import { useTrackingContext } from '../context/TrackingProvider.jsx';
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/Page03_Question.module.css';
import dialogueImage from '../../../assets/images/小明和爸爸对话.png';
import { PAGE_MAPPING } from '../config.js';

const Page03_Question = () => {
  const {
    session,
    logOperation,
    clearOperations,
    navigateToPage,
    buildMarkObject,
    submitPageData
  } = useTrackingContext();
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
      // 收集最终答案
      // 统一由 Provider 构建提交对象
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(
        String(session.currentPage),
        pageInfo?.desc || '提出问题',
        { answerList: [{ targetElement: 'question_input', value: questionText.trim() }] }
      );

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(3);
      }
    } catch (error) {
      console.error('[Page03_Question] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [session, questionText, logOperation, submitPageData, clearOperations, navigateToPage, buildMarkObject]);

  const canGoNext = questionText.trim().length > 0;

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <h2 className={styles.pageTitle}>蜂蜜的奥秘</h2>

        <div className={styles.splitLayout}>
          {/* 左侧: 对话图片 */}
          <div className={styles.leftPanel}>
            <div className={styles.imageWrapper}>
              <img
                src={dialogueImage}
                alt="小明和爸爸的对话"
                className={styles.dialogueImage}
              />
            </div>
          </div>

          {/* 右侧: 任务描述和输入框 */}
          <div className={styles.rightPanel}>
            <div className={styles.taskSection}>
              <p className={styles.taskDescription}>
                根据左侧对话，请写出接下来小明要探究的科学问题？
              </p>
              <textarea
                value={questionText}
                onChange={handleTextChange}
                placeholder="请在此输入你的问题..."
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

// 统一改为由 Provider 进行时间与结构标准化

export default Page03_Question;




