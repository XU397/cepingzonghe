import { useEffect, useMemo } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import PhoneSimulator from '../components/PhoneSimulator';
import DialoguePlayer from '../components/DialoguePlayer';
import { DIALOGUE_MESSAGES, ROLE_CONFIG } from '../constants/dialogueMessages';
import { useG4Context } from '../context/G4Context';
import useG4Navigation from '../hooks/useG4Navigation';
import styles from './Page03_ProblemId.module.css';

const truncateText = (text = '', limit = 50) => {
  const safeText = String(text ?? '');
  return safeText.length > limit ? safeText.slice(0, limit) : safeText;
};

function Page03_ProblemId() {
  const { state, setProblemAnswer, logOperation, collectAnswer, playDialogue, flowContext } =
    useG4Context();
  const { handleNextPage, isSubmitting, subPageNum } = useG4Navigation();
  const answerValue = state.problemAnswer || '';
  const trimmedAnswer = answerValue.trim();
  const canProceed = trimmedAnswer.length > 0 && !isSubmitting;

  const messageRoles = useMemo(() => ROLE_CONFIG, []);

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

  const handleDialogueFocus = () => {
    logOperation({
      targetElement: '对话容器',
      eventType: EventTypes.INPUT_FOCUS,
      value: '对话框聚焦',
    });
  };

  const handleDialogueBlur = () => {
    logOperation({
      targetElement: '对话容器',
      eventType: EventTypes.INPUT_BLUR,
      value: '对话框失焦',
    });
  };

  const handleMessageClick = (message, index) => {
    const messageIndex = typeof index === 'number' ? index : (message?.index ?? 0) + 1;
    logOperation({
      targetElement: `对话消息_${messageIndex}`,
      eventType: EventTypes.CLICK,
      value: {
        role: message?.role,
        messageIndex,
        messageText: truncateText(message?.text),
      },
    });
  };

  const handleMessageHover = (type) => (message, index) => {
    const messageIndex = typeof index === 'number' ? index : (message?.index ?? 0) + 1;
    const roleName = messageRoles[message?.role]?.name || message?.role || '角色';
    logOperation({
      targetElement: `对话消息_${messageIndex}`,
      eventType: type === 'focus' ? EventTypes.INPUT_FOCUS : EventTypes.INPUT_BLUR,
      value: `${type}|role=${roleName}|idx=${messageIndex}|text=${truncateText(message?.text)}`,
    });
  };

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

  const handlePlaybackStart = () => {
    playDialogue();
  };

  const handleReplay = () => {
    logOperation({
      targetElement: '对话重播',
      eventType: EventTypes.CLICK,
      value: 'replay',
    });
    playDialogue();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>问题识别</h1>
        <p className={styles.subtitle}>查看家庭群聊，写出需要解决的问题。</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.phoneColumn}>
          <PhoneSimulator>
            <div className={styles.dialogueShell}>
              <DialoguePlayer
                messages={DIALOGUE_MESSAGES}
                roleConfig={ROLE_CONFIG}
                onContainerFocus={handleDialogueFocus}
                onContainerBlur={handleDialogueBlur}
                onMessageClick={handleMessageClick}
                onMessageFocus={handleMessageHover('focus')}
                onMessageBlur={handleMessageHover('blur')}
                onReplay={handleReplay}
                onPlaybackStart={handlePlaybackStart}
              />
            </div>
          </PhoneSimulator>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>火车购票</h2>
            <span className={styles.cardBadge}>必答</span>
          </div>
          <p className={styles.prompt}>
            根据左侧对话,请写出小明接下来要解决什么问题?
          </p>

          <label className={styles.fieldLabel} htmlFor="problemAnswer">
            你的回答
          </label>
          <textarea
            id="problemAnswer"
            maxLength={200}
            rows={4}
            value={answerValue}
            onChange={handleAnswerChange}
            onFocus={handleAnswerFocus}
            onBlur={handleAnswerBlur}
            placeholder="请输入需要解决的问题 (最多200字)"
            className={styles.textarea}
          />
          <div className={styles.helperRow}>
            <span className={styles.helperText}>请输入不超过200字的描述</span>
            <span className={styles.counter}>{answerValue.length}/200</span>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.nextButton}
              onClick={handleNext}
              disabled={!canProceed}
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page03_ProblemId;
