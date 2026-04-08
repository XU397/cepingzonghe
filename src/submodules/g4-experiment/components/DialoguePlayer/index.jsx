import React, { useEffect, useMemo, useRef } from 'react';
import useDialoguePlayer from '../../hooks/useDialoguePlayer';
import { DIALOGUE_MESSAGES, ROLE_CONFIG } from '../../constants/dialogueMessages';
import styles from './DialoguePlayer.module.css';

function DialoguePlayer({
  messages = DIALOGUE_MESSAGES,
  roleConfig = ROLE_CONFIG,
  onContainerFocus,
  onContainerBlur,
  onMessageClick,
  onMessageFocus,
  onMessageBlur,
  onReplay,
  onPlaybackStart,
  onPlaybackComplete,
  className = '',
}) {
  const combinedMessages = Array.isArray(messages) && messages.length ? messages : DIALOGUE_MESSAGES;
  const combinedRoles = useMemo(() => ({ ...ROLE_CONFIG, ...roleConfig }), [roleConfig]);
  const scrollRef = useRef(null);

  const {
    visibleMessages,
    isTyping,
    typingRole,
    isPlaying,
    hasCompleted,
    startPlayback,
    // resetPlayback - available but not currently used
  } = useDialoguePlayer({
    messages: combinedMessages,
    autoStart: true,
    initialDelay: 1000,
    messageInterval: 500,
    onMessageShown: undefined,
    onComplete: onPlaybackComplete,
    onStart: onPlaybackStart,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [visibleMessages, isTyping, typingRole]);

  const forwardMessageEvent = (handler, message, index) => {
    if (typeof handler === 'function') {
      const resolvedIndex =
        typeof message?.index === 'number' ? message.index + 1 : typeof index === 'number' ? index + 1 : 0;
      handler(message, resolvedIndex);
    }
  };

  const handleReplay = () => {
    startPlayback();
    if (typeof onReplay === 'function') {
      onReplay();
    }
  };

  const typingAlignRight = (combinedRoles[typingRole]?.align || 'left') === 'right';
  const typingBubbleColor = combinedRoles[typingRole]?.bubbleColor || combinedRoles.uncle?.bubbleColor;

  const renderAvatar = (role) => {
    const avatar = role?.avatar;
    if (React.isValidElement(avatar)) {
      return avatar;
    }
    if (typeof avatar === 'function' || (avatar && typeof avatar === 'object' && '$$typeof' in avatar)) {
      return React.createElement(avatar);
    }
    if (typeof avatar === 'string' && avatar) {
      return <img src={avatar} alt={role?.name || '角色头像'} />;
    }
    return <span className={styles.avatarFallback}>{(role?.name || '?').slice(0, 1)}</span>;
  };

  return (
    <div
      className={`${styles.player} ${className}`}
      onMouseEnter={onContainerFocus}
      onMouseLeave={onContainerBlur}
    >
      <div className={styles.topBar}>
        <div className={styles.headerTitle}>聊天记录</div>
        <div className={`${styles.status} ${isPlaying ? styles.statusPlaying : ''}`}>
          {isPlaying ? '自动播放中' : hasCompleted ? '播放完成' : '等待播放'}
        </div>
      </div>

      <div className={styles.messages} ref={scrollRef}>
        {visibleMessages.map((message, index) => {
          const role = combinedRoles[message.role] || combinedRoles.uncle;
          const alignRight = role?.align === 'right';
          const key = message.index ?? index;
          return (
            <div
              key={key}
              className={`${styles.messageRow} ${alignRight ? styles.alignRight : ''}`}
              onClick={() => forwardMessageEvent(onMessageClick, message, index)}
              onMouseEnter={() => forwardMessageEvent(onMessageFocus, message, index)}
              onMouseLeave={() => forwardMessageEvent(onMessageBlur, message, index)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  forwardMessageEvent(onMessageClick, message, index);
                }
              }}
            >
              <div className={styles.avatarWrapper}>
                <div className={styles.avatar}>
                  {renderAvatar(role)}
                </div>
                <span className={styles.avatarName}>{role?.name || message.role}</span>
              </div>

              <div
                className={`${styles.bubble} ${alignRight ? styles.bubbleRight : styles.bubbleLeft}`}
                style={{ background: role?.bubbleColor }}
              >
                {message.text}
              </div>
            </div>
          );
        })}

        {isTyping ? (
          <div className={`${styles.typingRow} ${typingAlignRight ? styles.typingRight : ''}`}>
            <div
              className={styles.typingBubble}
              style={{ background: typingBubbleColor || 'var(--g4-bubble-blue)' }}
            >
              <span className={styles.typingDots}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.replayButton}
          onClick={handleReplay}
          disabled={isPlaying}
        >
          重播
        </button>
      </div>
    </div>
  );
}

export default DialoguePlayer;
