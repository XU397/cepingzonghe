import { useEffect, useCallback } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import DialogueChat from '@components/DialogueChat/DialogueChat';
import { DIALOGUE_MESSAGES } from '../constants/dialogueMessages';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page03_ProblemId.module.css';

const truncateText = (text = '', limit = 50) => {
  const safeText = String(text ?? '');
  return safeText.length > limit ? safeText.slice(0, limit) + '...' : safeText;
};

function Page03_ProblemId() {
  const { state, setProblemAnswer, logOperation, collectAnswer, flowContext } =
    useG4Context();
  const { handleNextPage, isSubmitting, subPageNum } = useG4Navigation();
  const answerValue = state.problemAnswer || '';
  const trimmedAnswer = answerValue.trim();
  const canProceed = trimmedAnswer.length > 0 && !isSubmitting;

  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_03_问题识别',
    });
  }, [logOperation]);

  useEffect(() => {
    if (flowContext?.updateModuleProgress && subPageNum) {
      flowContext.updateModuleProgress(String(subPageNum));
    }
  }, [flowContext, subPageNum]);

  const handleDialogueFocus = useCallback(() => {
    logOperation({
      targetElement: '对话容器',
      eventType: EventTypes.INPUT_FOCUS,
      value: '对话框聚焦',
    });
  }, [logOperation]);

  const handleDialogueBlur = useCallback(() => {
    logOperation({
      targetElement: '对话容器',
      eventType: EventTypes.INPUT_BLUR,
      value: '对话框失焦',
    });
  }, [logOperation]);

  const handleMessageClick = useCallback((message, index, roleName) => {
    logOperation({
      targetElement: `对话消息_${index}`,
      eventType: EventTypes.CLICK,
      value: {
        role: roleName,
        messageIndex: index,
        messageText: truncateText(message?.text),
      },
    });
  }, [logOperation]);

  const handleMessageFocus = useCallback((message, index, roleName) => {
    logOperation({
      targetElement: `对话消息_${index}`,
      eventType: EventTypes.INPUT_FOCUS,
      value: `focus|role=${roleName}|idx=${index}|text=${truncateText(message?.text)}`,
    });
  }, [logOperation]);

  const handleMessageBlur = useCallback((message, index, roleName) => {
    logOperation({
      targetElement: `对话消息_${index}`,
      eventType: EventTypes.INPUT_BLUR,
      value: `blur|role=${roleName}|idx=${index}|text=${truncateText(message?.text)}`,
    });
  }, [logOperation]);

  const handleAnswerFocus = () => {
    logOperation({
      targetElement: '问题输入框',
      eventType: EventTypes.INPUT_FOCUS,
      value: '聚焦',
    });
  };

  const handleAnswerBlur = () => {
    logOperation({
      targetElement: '问题输入框',
      eventType: EventTypes.INPUT_BLUR,
      value: answerValue,
    });
  };

  const handleAnswerChange = (event) => {
    const prev = answerValue;
    const next = event.target.value;
    setProblemAnswer(next);

    logOperation({
      targetElement: '问题输入框',
      eventType: EventTypes.INPUT_CHANGE,
      value: { prev, next },
    });

    if (prev.length > next.length) {
      logOperation({
        targetElement: '问题输入框',
        eventType: EventTypes.INPUT_DELETE,
        value: { action: 'delete', prevLength: prev.length, nextLength: next.length },
      });
    }
  };

  const handleNext = async () => {
    if (!trimmedAnswer) {
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'problem_answer_empty',
      });
      return;
    }

    collectAnswer({ targetElement: '问题输入框', value: trimmedAnswer });

    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.CLICK,
      value: '提交答案',
    });
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_EXIT,
      value: 'Page_03_问题识别',
    });

    await handleNextPage({
      validate: () => trimmedAnswer.length > 0,
      nextPageId: 'factor-analysis',
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* Left Column: Dialogue */}
        <div className={styles.phoneColumn}>
          <DialogueChat
            messages={DIALOGUE_MESSAGES}
            title="火车购票群聊"
            autoPlay={true}
            initialDelay={800}
            onContainerFocus={handleDialogueFocus}
            onContainerBlur={handleDialogueBlur}
            onMessageClick={handleMessageClick}
            onMessageFocus={handleMessageFocus}
            onMessageBlur={handleMessageBlur}
            headerStyle={{ background: '#3b82f6' }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '30px',
            }}
          />
        </div>

        {/* Right Column: Content */}
        <div className={styles.contentColumn}>
          <div className={styles.card}>


            <div className={styles.questionSection}>
              <p className={styles.prompt}>
                根据左侧对话，请写出接下来小明要探究的科学问题？
              </p>
            </div>

            <div className={styles.textareaContainer}>
              <textarea
                id="problemAnswer"
                maxLength={200}
                rows={4}
                value={answerValue}
                onChange={handleAnswerChange}
                onFocus={handleAnswerFocus}
                onBlur={handleAnswerBlur}
                placeholder="请在此处输入你的回答..."
                className={styles.textarea}
              />
              <div className={styles.helperRow}>
                <span className={styles.counter}>{answerValue.length}/200</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Page03_ProblemId;
