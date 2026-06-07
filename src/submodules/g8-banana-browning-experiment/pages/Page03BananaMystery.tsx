import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  TEXT_DEBOUNCE_MS,
  TEXT_THROTTLE_CHAR_DELTA,
  createTextEventCollector,
} from '@shared/services/submission/trace';
import momAvatar from '@assets/images/mamaT.png';
import xiaomingAvatar from '@assets/images/xiaomingT.png';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import type { PageId } from '../mapping';
import styles from '../styles/Page03BananaMystery.module.css';
import { buildPage02StartMetadata } from '../trace/pageStartMetadata';
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
  onUserScroll: (_payload: {
    scrollDelta: number;
    scrollDirection: 'up' | 'down';
    visibleContentIdsBefore: string[];
    visibleContentIdsAfter: string[];
  }) => void;
}

const CHARACTER_MAP: Record<string, { name: string; avatar: string; side: 'left' | 'right' }> = {
  mom: { name: '妈妈', avatar: momAvatar, side: 'left' },
  xiaoming: { name: '小明', avatar: xiaomingAvatar, side: 'right' },
};

const REGISTERED_CHAT_CONTENT_IDS = new Set(
  Array.from({ length: 5 }, (_, index) => `chat_bubble_02_${String(index + 1).padStart(2, '0')}`)
);
const USER_SCROLL_INTENT_MS = 1000;
const PROGRAMMATIC_SCROLL_SETTLE_MS = 250;
const USER_SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

const getRegisteredChatContentId = (index: number) => {
  const contentId = `chat_bubble_02_${String(index + 1).padStart(2, '0')}`;
  return REGISTERED_CHAT_CONTENT_IDS.has(contentId) ? contentId : undefined;
};

const DialoguePhone: React.FC<DialoguePhoneProps> = ({
  messages,
  onMessageClick,
  onUserScroll,
}) => {
  const [displayed, setDisplayed] = useState<DialogueMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const currentIdxRef = useRef(0);
  const isPlayingRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const visibleIdsBeforeRef = useRef<string[]>([]);
  const suppressProgrammaticScrollRef = useRef(false);
  const programmaticScrollTargetRef = useRef<number | null>(null);
  const programmaticScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userScrollIntentRef = useRef(false);
  const userScrollIntentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getVisibleContentIds = useCallback(() => {
    const container = chatBodyRef.current;
    if (!container) {
      return [];
    }

    const containerRect = container.getBoundingClientRect();
    return Array.from(container.querySelectorAll<HTMLElement>('[data-content-id]'))
      .filter(element => {
        const elementRect = element.getBoundingClientRect();
        return (
          elementRect.bottom > containerRect.top &&
          elementRect.top < containerRect.bottom &&
          elementRect.right > containerRect.left &&
          elementRect.left < containerRect.right
        );
      })
      .map(element => element.dataset.contentId)
      .filter(
        (contentId): contentId is string =>
          Boolean(contentId) && REGISTERED_CHAT_CONTENT_IDS.has(contentId as string)
      );
  }, []);

  const syncScrollSnapshot = useCallback(() => {
    visibleIdsBeforeRef.current = getVisibleContentIds();
    lastScrollTopRef.current = chatBodyRef.current?.scrollTop || 0;
  }, [getVisibleContentIds]);

  const clearProgrammaticScrollTimer = useCallback(() => {
    if (programmaticScrollTimerRef.current !== null) {
      clearTimeout(programmaticScrollTimerRef.current);
      programmaticScrollTimerRef.current = null;
    }
  }, []);

  const clearUserScrollIntentTimer = useCallback(() => {
    if (userScrollIntentTimerRef.current !== null) {
      clearTimeout(userScrollIntentTimerRef.current);
      userScrollIntentTimerRef.current = null;
    }
  }, []);

  const endProgrammaticScroll = useCallback(() => {
    clearProgrammaticScrollTimer();
    suppressProgrammaticScrollRef.current = false;
    programmaticScrollTargetRef.current = null;
    syncScrollSnapshot();
  }, [clearProgrammaticScrollTimer, syncScrollSnapshot]);

  const scrollToBottom = useCallback(() => {
    const chatBody = chatBodyRef.current;
    if (!chatBody) {
      return;
    }

    clearProgrammaticScrollTimer();
    suppressProgrammaticScrollRef.current = true;
    programmaticScrollTargetRef.current = chatBody.scrollHeight;
    if (typeof chatBody.scrollTo === 'function') {
      chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      chatBody.scrollTop = chatBody.scrollHeight;
    }
    programmaticScrollTimerRef.current = setTimeout(
      endProgrammaticScroll,
      PROGRAMMATIC_SCROLL_SETTLE_MS
    );
  }, [clearProgrammaticScrollTimer, endProgrammaticScroll]);

  const markUserScrollIntent = useCallback(() => {
    userScrollIntentRef.current = true;
    clearUserScrollIntentTimer();
    userScrollIntentTimerRef.current = setTimeout(() => {
      userScrollIntentRef.current = false;
      userScrollIntentTimerRef.current = null;
    }, USER_SCROLL_INTENT_MS);
  }, [clearUserScrollIntentTimer]);

  const handleScroll = useCallback(() => {
    const chatBody = chatBodyRef.current;
    if (!chatBody) {
      return;
    }

    const nextScrollTop = chatBody.scrollTop;
    const scrollDelta = nextScrollTop - lastScrollTopRef.current;
    const visibleContentIdsBefore =
      visibleIdsBeforeRef.current.length > 0
        ? visibleIdsBeforeRef.current
        : getVisibleContentIds();
    const visibleContentIdsAfter = getVisibleContentIds();
    const programmaticTarget = programmaticScrollTargetRef.current;

    if (scrollDelta === 0 || suppressProgrammaticScrollRef.current || !userScrollIntentRef.current) {
      visibleIdsBeforeRef.current = visibleContentIdsAfter;
      lastScrollTopRef.current = nextScrollTop;
      if (
        suppressProgrammaticScrollRef.current &&
        programmaticTarget !== null &&
        Math.abs(nextScrollTop - programmaticTarget) <= 1
      ) {
        endProgrammaticScroll();
      }
      return;
    }

    onUserScroll({
      scrollDelta,
      scrollDirection: scrollDelta < 0 ? 'up' : 'down',
      visibleContentIdsBefore,
      visibleContentIdsAfter,
    });
    visibleIdsBeforeRef.current = visibleContentIdsAfter;
    lastScrollTopRef.current = nextScrollTop;
  }, [endProgrammaticScroll, getVisibleContentIds, onUserScroll]);

  const handleScrollKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (USER_SCROLL_KEYS.has(event.key)) {
        markUserScrollIntent();
      }
    },
    [markUserScrollIntent]
  );

  useEffect(syncScrollSnapshot, [displayed, isCompleted, isTyping, syncScrollSnapshot]);

  useEffect(
    () => () => {
      clearProgrammaticScrollTimer();
      clearUserScrollIntentTimer();
    },
    [clearProgrammaticScrollTimer, clearUserScrollIntentTimer]
  );

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

      <div
        className={styles.chatBody}
        ref={chatBodyRef}
        onWheel={markUserScrollIntent}
        onTouchMove={markUserScrollIntent}
        onPointerDown={markUserScrollIntent}
        onKeyDown={handleScrollKeyDown}
        onScroll={handleScroll}
        data-testid="page02-chat-body"
        tabIndex={0}
      >
        {displayed.map((msg, idx) => {
          const char = CHARACTER_MAP[msg.role] || CHARACTER_MAP.xiaoming;
          const isRight = char.side === 'right';
          const bubbleClass = msg.role === 'mom' ? styles.bubbleMom : styles.bubbleXiaoming;
          const arrowClass = msg.role === 'mom' ? styles.arrowMom : styles.arrowXiaoming;
          const contentId = getRegisteredChatContentId(idx);

          return (
            <div
              key={idx}
              className={`${styles.msgRow} ${isRight ? styles.msgRowRight : ''} ${styles.msgEnter} ${styles.msgClickable}`}
              data-content-id={contentId}
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
    registerTraceCollectorFlush,
  } = useG8BananaBrowningContext();

  const traceLogger = useTracePageStart({
    pageId: 'banana_mystery' as PageId,
    pageNumber: getPagePrefix().replace(/^P/, '').replace(/_$/, ''),
    flowContext: undefined,
    metadata: buildPage02StartMetadata(),
  });

  const [inputValue, setInputValue] = useState(() => {
    const saved = answers['Q1_科学问题'];
    return typeof saved === 'string' ? saved : '';
  });

  const textCollectorRef = useRef<ReturnType<typeof createTextEventCollector> | null>(null);
  const hasInputFocusRef = useRef(false);

  const getTextCollector = useCallback(() => {
    if (!traceLogger) {
      return null;
    }
    if (!textCollectorRef.current) {
      textCollectorRef.current = createTextEventCollector({
        fieldId: 'input_question_1',
        logger: traceLogger,
        debounceMs: TEXT_DEBOUNCE_MS,
        throttleCharDelta: TEXT_THROTTLE_CHAR_DELTA,
      });
    }
    return textCollectorRef.current;
  }, [traceLogger]);

  const flushTextCollector = useCallback(() => {
    textCollectorRef.current?.flush('submit');
  }, []);

  useEffect(
    () => registerTraceCollectorFlush(flushTextCollector),
    [flushTextCollector, registerTraceCollectorFlush]
  );

  useEffect(
    () => () => {
      textCollectorRef.current?.dispose();
      textCollectorRef.current = null;
    },
    [traceLogger]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const nextValue = e.target.value;

      getTextCollector()?.onChange(nextValue, {
        metadata: {
          source_answer_key: 'Q1_科学问题',
        },
      });

      setInputValue(nextValue);
      collectAnswer({ targetElement: 'Q1_科学问题', value: nextValue });

      if (validationError) {
        setValidationError('');
      }
    },
    [getTextCollector, collectAnswer, validationError, setValidationError]
  );

  const handleInputFocus = useCallback(() => {
    hasInputFocusRef.current = true;
    getTextCollector()?.onFocus(inputValue);
  }, [getTextCollector, inputValue]);

  const handleInputBlur = useCallback(() => {
    hasInputFocusRef.current = false;
    getTextCollector()?.onBlur(inputValue, {
      source_answer_key: 'Q1_科学问题',
    });
  }, [getTextCollector, inputValue]);

  const handleUserScroll = useCallback(
    (payload: {
      scrollDelta: number;
      scrollDirection: 'up' | 'down';
      visibleContentIdsBefore: string[];
      visibleContentIdsAfter: string[];
    }) => {
      traceLogger?.chatScroll({
        ...payload,
        phase: hasInputFocusRef.current ? 'during_input' : 'before_input',
      });
    },
    [traceLogger]
  );

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
            onUserScroll={handleUserScroll}
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
