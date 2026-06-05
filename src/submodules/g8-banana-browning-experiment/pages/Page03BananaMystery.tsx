import React, { useCallback, useEffect, useRef, useState } from 'react';
import momAvatar from '@assets/images/mamaT.png';
import xiaomingAvatar from '@assets/images/xiaomingT.png';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import type { PageId } from '../mapping';
import styles from '../styles/Page03BananaMystery.module.css';
import { useTracePageStart } from '../trace/useTracePageStart';

interface DialogueMessage {
  role: 'mom' | 'xiaoming';
  text: string;
}

const dialogueMessages: DialogueMessage[] = [
  { role: 'mom', text: '回来啦？手里拿着香蕉，怎么不吃呀？' },
  {
    role: 'xiaoming',
    text: '正准备吃呢，可拿起来一看，香蕉皮上好多黑斑。上次您买回来的那串，放了好几天都没这么快变黑。',
  },
  { role: 'mom', text: '我看看…还真是，好几块呢。是不是放太久了？还是被什么东西压到了？' },
  {
    role: 'xiaoming',
    text: '没有啊，买回来就正常放在果盘里，也没磕着碰着。时间也不长，我剥开看了，里面果肉好好的，一点没坏。',
  },
  { role: 'mom', text: '果肉没事说明还没坏。不过皮黑得这么快，确实有点奇怪。' },
  { role: 'xiaoming', text: '对啊，那这次香蕉为什么黑得这么快呢？' },
  { role: 'mom', text: '这我也不太清楚。要不你去查查资料，做个小实验？弄明白了也跟我说说。' },
];

const MAX_LENGTH = 200;

interface DialoguePhoneProps {
  messages: DialogueMessage[];
  onMessageClick: (msg: DialogueMessage, idx: number, roleName: string) => void;
}

const CHARACTER_MAP: Record<string, { name: string; avatar: string; side: 'left' | 'right' }> = {
  mom: { name: '妈妈', avatar: momAvatar, side: 'left' },
  xiaoming: { name: '小明', avatar: xiaomingAvatar, side: 'right' },
};

const DialoguePhone: React.FC<DialoguePhoneProps> = ({
  messages,
  onMessageClick,
}) => {
  const [displayed, setDisplayed] = useState<DialogueMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const currentIdxRef = useRef(0);
  const isPlayingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const showNext = useCallback(() => {
    if (currentIdxRef.current >= messages.length) {
      setIsTyping(false);
      setIsCompleted(true);
      setTimeout(scrollToBottom, 100);
      return;
    }

    setIsTyping(true);
    setTimeout(scrollToBottom, 50);

    const msg = messages[currentIdxRef.current];
    const delay = Math.min(Math.max(msg.text.length * 80, 1000), 2000);

    setTimeout(() => {
      setIsTyping(false);
      setDisplayed(prev => [...prev, msg]);
      currentIdxRef.current += 1;
      setTimeout(scrollToBottom, 50);
      setTimeout(showNext, 500);
    }, delay);
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isPlayingRef.current && messages.length > 0) {
      isPlayingRef.current = true;
      const timer = setTimeout(showNext, 800);
      return () => clearTimeout(timer);
    }
  }, [showNext, messages.length]);

  const handleReplay = useCallback(() => {
    currentIdxRef.current = 0;
    setDisplayed([]);
    setIsTyping(false);
    setIsCompleted(false);
    isPlayingRef.current = true;
    setTimeout(showNext, 500);
  }, [showNext]);

  return (
    <div className={styles.chatPhone}>
      <div className={styles.chatHeader}>
        <button type="button" className={styles.headerBtn}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className={styles.headerTitle}>小明和妈妈</div>
        <button type="button" className={styles.headerBtn}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>

      <div className={styles.chatBody} ref={chatBodyRef}>
        {displayed.map((msg, idx) => {
          const char = CHARACTER_MAP[msg.role] || CHARACTER_MAP.xiaoming;
          const isRight = char.side === 'right';
          const bubbleClass = msg.role === 'mom' ? styles.bubbleMom : styles.bubbleXiaoming;
          const arrowClass = msg.role === 'mom' ? styles.arrowMom : styles.arrowXiaoming;

          return (
            <div
              key={idx}
              className={`${styles.msgRow} ${isRight ? styles.msgRowRight : ''} ${styles.msgEnter} ${styles.msgClickable}`}
              onClick={() => onMessageClick(msg, idx, char.name)}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') onMessageClick(msg, idx, char.name);
              }}
            >
              <div className={`${styles.avatarCol} ${isRight ? styles.avatarColRight : ''}`}>
                <div className={styles.avatarCircle}>
                  <img src={char.avatar} alt={char.name} />
                </div>
                <span className={styles.avatarLabel}>{char.name}</span>
              </div>

              <div className={`${styles.bubbleWrap} ${isRight ? styles.bubbleWrapRight : ''}`}>
                <div className={`${styles.bubble} ${bubbleClass}`}>{msg.text}</div>
                <div
                  className={`${styles.bubbleArrow} ${isRight ? styles.arrowRight : styles.arrowLeft} ${arrowClass}`}
                />
              </div>
            </div>
          );
        })}

        <div className={`${styles.typingRow} ${isTyping ? styles.typingVisible : ''}`}>
          <div className={styles.typingDots}>
            <div className={styles.typingDot} style={{ animationDelay: '0s' }} />
            <div className={styles.typingDot} style={{ animationDelay: '0.2s' }} />
            <div className={styles.typingDot} style={{ animationDelay: '0.4s' }} />
          </div>
        </div>

        {isCompleted && (
          <div className={styles.completedTip}>✨ 滚动鼠标滚轮可以查看被遮挡的对话 ✨</div>
        )}

        <div className={styles.bottomSpacer} />
      </div>

      <div className={styles.chatFooter}>
        <button
          type="button"
          className={styles.footerBtn}
          style={{ background: 'transparent', boxShadow: 'none', color: '#6b7280' }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
        <div className={styles.footerFakeInput}>我也想问问...</div>
        <button type="button" className={styles.footerBtn}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <button type="button" className={styles.replayBtn} onClick={handleReplay} title="重新播放">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12" />
        </svg>
      </button>
    </div>
  );
};

const Page03BananaMystery: React.FC = () => {
  const {
    collectAnswer,
    answers,
    getPagePrefix,
    validationError,
    setValidationError,
  } = useG8BananaBrowningContext();

  const traceLogger = useTracePageStart({
    pageId: 'banana_mystery' as PageId,
    pageNumber: getPagePrefix().replace(/^P/, '').replace(/_$/, ''),
    flowContext: undefined,
    metadata: {
      initial_state: {},
    },
  });

  const [inputValue, setInputValue] = useState(() => {
    const saved = answers['Q1_科学问题'];
    return typeof saved === 'string' ? saved : '';
  });

  const inputStateRef = useRef({ focused: false });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = e.target.value;

      traceLogger?.textChange('input_question_1', inputValue, nextValue, {
        source_answer_key: 'Q1_科学问题',
      });

      setInputValue(nextValue);
      collectAnswer({ targetElement: 'Q1_科学问题', value: nextValue });

      if (validationError) {
        setValidationError('');
      }
    },
    [traceLogger, inputValue, collectAnswer, validationError, setValidationError]
  );

  const handleInputFocus = useCallback(() => {
    if (!inputStateRef.current.focused) {
      traceLogger?.textFocus('input_question_1', inputValue);
      inputStateRef.current.focused = true;
    }
  }, [traceLogger, inputValue]);

  const handleInputBlur = useCallback(() => {
    traceLogger?.textBlur('input_question_1', inputValue, inputValue, {
      source_answer_key: 'Q1_科学问题',
    });
    inputStateRef.current.focused = false;
  }, [traceLogger, inputValue]);

  const handleMessageClick = useCallback(
    (_message: { text: string }, index: number, speakerName: string) => {
      if (index >= 5) {
        return;
      }
      const contentId = `chat_bubble_02_${String(index + 1).padStart(2, '0')}`;
      traceLogger?.contentActivate(contentId, 'content', {
        source: 'chat_bubble',
        sequence_index: index + 1,
        speaker_name: speakerName,
      });
    },
    [traceLogger]
  );

  return (
    <div className={styles.container}>
      <div className={styles.layout}>
        <div className={styles.dialogueSection}>
          <DialoguePhone
            messages={dialogueMessages}
            onMessageClick={handleMessageClick}
          />
        </div>

        <div className={styles.inputSection}>
          <div className={styles.inputCard}>
            <div className={styles.title}>
              <h2>
                香蕉的奥秘
                <span className={styles.bananaDecor}>
                  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <path
                      d="M12 52C12 52 8 32 24 18C40 4 56 8 56 8"
                      stroke="#eab308"
                      strokeWidth="6"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M14 50C14 50 12 36 26 24C40 12 52 12 52 12"
                      stroke="#fde047"
                      strokeWidth="4"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <circle cx="20" cy="40" r="2.5" fill="#78350f" opacity="0.7" />
                    <circle cx="30" cy="30" r="2" fill="#78350f" opacity="0.6" />
                    <circle cx="40" cy="22" r="2.5" fill="#78350f" opacity="0.7" />
                    <circle cx="48" cy="16" r="1.5" fill="#78350f" opacity="0.5" />
                  </svg>
                </span>
              </h2>
            </div>

            <div className={styles.questionPrompt}>
              <p>根据左侧对话，请写出接下来小明要探究的科学问题？</p>
            </div>

            <div className={styles.textAreaWrapper}>
              <textarea
                className={styles.textArea}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="请在此处输入你的回答。"
                rows={4}
                maxLength={MAX_LENGTH}
              />
            </div>
            {validationError && (
              <div className={styles.validationError} key={validationError}>
                {validationError}
              </div>
            )}
            <div
              className={`${styles.charCount} ${
                inputValue.length >= MAX_LENGTH ? styles.charCountOver : ''
              }`}
            >
              {inputValue.length}/{MAX_LENGTH}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page03BananaMystery;
