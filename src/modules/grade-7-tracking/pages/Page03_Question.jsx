/**
 * Page03_Question - 提出问题页面 (页码 2)
 *
 * 功能:
 * - 显示小明和爸爸的对话气泡动画（蜂蜜黏度对话）
 * - 提供文本输入框让学生输入问题
 * - 输入内容后才能点击下一页
 * - 记录用户与对话的交互操作
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import { useTrackingContext } from '../context/TrackingProvider.jsx';
import PageLayout from '../components/layout/PageLayout';
import DialogueChat from '@components/DialogueChat';
import styles from '../styles/Page03_Question.module.css';
import { PAGE_MAPPING } from '../config.js';

// 蜂蜜黏度对话脚本 - 参考 docs/对话框动画参考/七年级追踪蜂蜜黏度对话.html
const dialogueMessages = [
  { role: 'ming', text: '爸爸，今天倒蜂蜜时，我发现蜂蜜没有之前那么黏稠了。' },
  { role: 'dad', text: '我看看，好像是变稀了。' },
  { role: 'ming', text: '怎么会这样呢？' },
  { role: 'dad', text: '是不是蜂蜜过保质期了？' },
  { role: 'ming', text: '不是啊，爸爸，还有一年才过期呢。' },
  { role: 'dad', text: '那是不是最近天气太热，或者存放的地方不对？' },
  {
    role: 'ming',
    text: '我看了说明，蜂蜜是要避光保存的。我平时就放在橱柜里，应该不会被太阳晒到。是不是有别的原因呢？',
  },
  { role: 'dad', text: '这我就不清楚了，你可以上网查查，回头也给我讲讲。' },
  { role: 'ming', text: '好的！' },
];

const Page03_Question = () => {
  const {
    session,
    logOperation,
    clearOperations,
    navigateToPage,
    buildMarkObject,
    submitPageData,
  } = useTrackingContext();

  const [pageStartTime] = useState(() => new Date());
  const [questionText, setQuestionText] = useState('');
  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  // 用于跟踪对话交互状态
  const dialogueFocusRef = useRef(false);
  const operationsRef = useRef([]);

  // 记录操作到本地缓存和context
  const recordOperation = useCallback(
    operation => {
      const opWithTime = {
        ...operation,
        time: new Date().toISOString(),
      };
      logOperation(opWithTime);
      operationsRef.current = [...operationsRef.current, opWithTime];
    },
    [logOperation]
  );

  // 记录页面进入/退出
  useEffect(() => {
    recordOperation({
      action: 'page_enter',
      target: 'Page_02_Question',
      value: '提出问题',
    });

    return () => {
      recordOperation({
        action: 'page_exit',
        target: 'Page_02_Question',
        value: '提出问题',
      });
    };
  }, [recordOperation]);

  // 处理对话容器聚焦（鼠标进入）
  const handleDialogueFocus = useCallback(() => {
    if (!dialogueFocusRef.current) {
      recordOperation({
        action: 'dialogue_focus',
        target: 'dialogue_container',
        value: '对话框聚焦',
      });
      dialogueFocusRef.current = true;
    }
  }, [recordOperation]);

  // 处理对话容器失焦（鼠标离开）
  const handleDialogueBlur = useCallback(() => {
    recordOperation({
      action: 'dialogue_blur',
      target: 'dialogue_container',
      value: '对话框失焦',
    });
    dialogueFocusRef.current = false;
  }, [recordOperation]);

  // 处理对话消息点击
  const handleMessageClick = useCallback(
    (message, index, roleName) => {
      recordOperation({
        action: 'message_click',
        target: `message_${index}`,
        value: {
          role: roleName,
          messageIndex: index,
          messageText: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
        },
      });
    },
    [recordOperation]
  );

  // 处理对话消息聚焦（鼠标进入）
  const handleMessageFocus = useCallback(
    (message, index, roleName) => {
      recordOperation({
        action: 'message_focus',
        target: `message_${index}`,
        value: {
          role: roleName,
          index: index,
          text: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
        },
      });
    },
    [recordOperation]
  );

  // 处理对话消息失焦（鼠标离开）
  const handleMessageBlur = useCallback(
    (message, index, roleName) => {
      recordOperation({
        action: 'message_blur',
        target: `message_${index}`,
        value: {
          role: roleName,
          index: index,
          text: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : ''),
        },
      });
    },
    [recordOperation]
  );

  // 处理对话播放完成
  const handleDialogueComplete = useCallback(() => {
    recordOperation({
      action: 'dialogue_complete',
      target: 'dialogue_container',
      value: '对话播放完成',
    });
  }, [recordOperation]);

  // 处理文本输入
  const handleTextChange = useCallback(
    event => {
      const value = event.target.value;
      const prevValue = questionText;
      setQuestionText(value);

      // 记录首次输入
      if (!hasStartedTyping && value.length > 0) {
        setHasStartedTyping(true);
        recordOperation({
          action: 'text_input_start',
          target: 'question_input',
          value: '开始输入',
        });
      }

      // 记录删除操作
      if (value.length < prevValue.length) {
        recordOperation({
          action: 'text_delete',
          target: 'question_input',
          value: {
            prevLength: prevValue.length,
            newLength: value.length,
          },
        });
      }

      // 记录输入变化
      recordOperation({
        action: 'text_input',
        target: 'question_input',
        value: value,
      });
    },
    [hasStartedTyping, questionText, recordOperation]
  );

  // 处理输入框聚焦
  const handleInputFocus = useCallback(() => {
    recordOperation({
      action: 'input_focus',
      target: 'question_input',
      value: '输入框聚焦',
    });
  }, [recordOperation]);

  // 处理输入框失焦
  const handleInputBlur = useCallback(() => {
    recordOperation({
      action: 'input_blur',
      target: 'question_input',
      value: questionText,
    });
  }, [recordOperation, questionText]);

  // 处理"下一页"点击
  const handleNextClick = useCallback(async () => {
    if (questionText.trim().length === 0) {
      alert('请输入您要探究的科学问题');
      return;
    }

    recordOperation({
      action: 'button_click',
      target: 'next_page_button',
      value: '下一页',
    });

    try {
      // 收集最终答案
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(
        String(session.currentPage),
        pageInfo?.desc || '提出问题',
        {
          answerList: [
            {
              targetElement: 'question_input',
              value: questionText.trim(),
            },
          ],
          operationList: operationsRef.current,
        }
      );

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        operationsRef.current = [];
        await navigateToPage(3);
      }
    } catch (error) {
      console.error('[Page03_Question] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [
    session,
    questionText,
    recordOperation,
    submitPageData,
    clearOperations,
    navigateToPage,
    buildMarkObject,
  ]);

  const canGoNext = questionText.trim().length > 0;

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.splitLayout}>
            {/* 左侧: 对话动画区域 */}
            <div className={styles.leftPanel}>
              <DialogueChat
                messages={dialogueMessages}
                title="爸爸"
                autoPlay={true}
                initialDelay={800}
                onContainerFocus={handleDialogueFocus}
                onContainerBlur={handleDialogueBlur}
                onMessageClick={handleMessageClick}
                onMessageFocus={handleMessageFocus}
                onMessageBlur={handleMessageBlur}
                onComplete={handleDialogueComplete}
                headerStyle={{ background: '#3b82f6' }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '30px',
                }}
              />
            </div>

            {/* 右侧: 任务描述和输入框 */}
            <div className={styles.rightPanel}>
              <div className={styles.contentCard}>
                {/* 标题 */}
                <div className={styles.pageTitle}>
                  <h2>蜂蜜的奥秘</h2>
                </div>

                {/* 问题描述 */}
                <div className={styles.questionSection}>
                  <p className={styles.taskDescription}>
                    根据左侧对话，请写出接下来小明要探究的科学问题？
                  </p>
                </div>

                {/* 文本输入框 */}
                <div className={styles.textAreaWrapper}>
                  <textarea
                    value={questionText}
                    onChange={handleTextChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="请在此处输入你的回答..."
                    className={styles.textArea}
                    rows={4}
                  />
                </div>

                {/* 导航按钮 */}
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
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Page03_Question;
