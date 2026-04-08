import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import styles from './DialogueChat.module.css';

// 导入头像图片
import xiaomingAvatar from '../../assets/images/xiaomingT.png';
import momAvatar from '../../assets/images/mamaT.png';
import dadAvatar from '../../assets/images/babaT.png';
import uncleAvatar from '../../assets/images/jiujiuT.png';

/**
 * DialogueChat - 对话聊天组件
 * 仿手机聊天界面，支持消息逐条动画显示
 * 严格参考 七年级蒸馒头对话.html 实现
 *
 * @param {Object} characterConfig - 可选，自定义角色配置，会与默认配置合并
 *   格式: { roleId: { name, avatar, side, bubbleClass, arrowClass } }
 */
const DialogueChat = ({
  messages = [],
  title = '幸福一家人',
  autoPlay = true,
  initialDelay = 1000,
  onComplete,
  onContainerFocus,    // 鼠标进入对话框时触发
  onContainerBlur,     // 鼠标离开对话框时触发
  onMessageClick,      // 点击消息时触发，参数: (message, index, role)
  onMessageFocus,      // 鼠标进入消息时触发，参数: (message, index, role)
  onMessageBlur,       // 鼠标离开消息时触发，参数: (message, index, role)
  characterConfig,     // 可选，自定义角色配置
  headerStyle,         // 可选，自定义顶部样式 (如 { background: '#3b82f6' })
  style = {},
  className = ''
}) => {
  // 存储已显示的消息列表
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isContainerFocused, setIsContainerFocused] = useState(false);
  const chatContentRef = useRef(null);
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // 处理鼠标进入对话框
  const handleContainerMouseEnter = useCallback(() => {
    if (!isContainerFocused) {
      setIsContainerFocused(true);
      onContainerFocus?.();
    }
  }, [isContainerFocused, onContainerFocus]);

  // 处理鼠标离开对话框
  const handleContainerMouseLeave = useCallback(() => {
    if (isContainerFocused) {
      setIsContainerFocused(false);
      onContainerBlur?.();
    }
  }, [isContainerFocused, onContainerBlur]);

  // 默认角色配置
  const defaultCharacters = useMemo(() => ({
    xiaoming: {
      name: '小明',
      avatar: xiaomingAvatar,
      side: 'right',
      bubbleClass: styles.bubbleXiaoming,
      arrowClass: styles.bubbleArrowXiaoming,
    },
    ming: {
      name: '小明',
      avatar: xiaomingAvatar,
      side: 'right',
      bubbleClass: styles.bubbleXiaoming,
      arrowClass: styles.bubbleArrowXiaoming,
    },
    mom: {
      name: '妈妈',
      avatar: momAvatar,
      side: 'left',
      bubbleClass: styles.bubbleMom,
      arrowClass: styles.bubbleArrowMom,
    },
    dad: {
      name: '爸爸',
      avatar: dadAvatar,
      side: 'left',
      bubbleClass: styles.bubbleDad,
      arrowClass: styles.bubbleArrowDad,
    },
    uncle: {
      name: '舅舅',
      avatar: uncleAvatar,
      side: 'left',
      bubbleClass: styles.bubbleUncle,
      arrowClass: styles.bubbleArrowUncle,
    },
  }), []);

  // 合并自定义角色配置
  const characters = useMemo(() => {
    if (!characterConfig) return defaultCharacters;
    return { ...defaultCharacters, ...characterConfig };
  }, [defaultCharacters, characterConfig]);

  // 处理消息点击
  const handleMessageClick = useCallback((message, index) => {
    const char = characters[message.role] || characters.xiaoming;
    onMessageClick?.(message, index, char.name);
  }, [characters, onMessageClick]);

  // 处理消息聚焦（鼠标进入）
  const handleMessageMouseEnter = useCallback((message, index) => {
    const char = characters[message.role] || characters.xiaoming;
    onMessageFocus?.(message, index, char.name);
  }, [characters, onMessageFocus]);

  // 处理消息失焦（鼠标离开）
  const handleMessageMouseLeave = useCallback((message, index) => {
    const char = characters[message.role] || characters.xiaoming;
    onMessageBlur?.(message, index, char.name);
  }, [characters, onMessageBlur]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTo({
        top: chatContentRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // 显示下一条消息
  const showNextMessage = useCallback(() => {
    if (currentIndexRef.current >= messages.length) {
      // 对话结束
      setIsTyping(false);
      setIsCompleted(true);
      onComplete?.();

      // 滚动到底部确保能看到提示
      setTimeout(scrollToBottom, 100);
      return;
    }

    // 显示"正在输入"动画
    setIsTyping(true);

    // 确保正在输入时也能看到底部
    setTimeout(scrollToBottom, 50);

    // 模拟打字/阅读延迟 (根据字数动态调整)
    const currentMessage = messages[currentIndexRef.current];
    const delay = Math.min(Math.max(currentMessage.text.length * 80, 1000), 2000);

    setTimeout(() => {
      // 隐藏正在输入
      setIsTyping(false);

      // 添加消息到显示列表
      setDisplayedMessages(prev => [...prev, { ...currentMessage, id: currentIndexRef.current }]);
      currentIndexRef.current += 1;

      // 滚动到底部
      setTimeout(scrollToBottom, 50);

      // 继续下一条
      setTimeout(showNextMessage, 500);
    }, delay);
  }, [messages, onComplete, scrollToBottom]);

  // 重新播放
  const handleReplay = useCallback(() => {
    currentIndexRef.current = 0;
    setDisplayedMessages([]);
    setIsTyping(false);
    setIsCompleted(false);
    isPlayingRef.current = true;

    // 稍微延迟后开始
    setTimeout(showNextMessage, 500);
  }, [showNextMessage]);

  // 自动播放
  useEffect(() => {
    if (autoPlay && !isPlayingRef.current && messages.length > 0) {
      isPlayingRef.current = true;
      const timer = setTimeout(showNextMessage, initialDelay);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, initialDelay, messages.length, showNextMessage]);

  // 渲染单条消息
  const renderMessage = (message, index) => {
    const char = characters[message.role] || characters.xiaoming;
    const isRight = char.side === 'right';

    return (
      <div
        key={message.id ?? index}
        className={`${styles.messageRow} ${isRight ? styles.messageRowRight : ''} ${styles.messageEnter} ${styles.messageClickable}`}
        onClick={() => handleMessageClick(message, index)}
        onMouseEnter={() => handleMessageMouseEnter(message, index)}
        onMouseLeave={() => handleMessageMouseLeave(message, index)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleMessageClick(message, index);
          }
        }}
      >
        {/* 头像 */}
        <div className={`${styles.avatarWrapper} ${isRight ? styles.avatarRight : ''}`}>
          <div className={styles.avatar}>
            <img src={char.avatar} alt={char.name} />
          </div>
          <span className={styles.avatarName}>{char.name}</span>
        </div>

        {/* 气泡 */}
        <div className={`${styles.bubbleWrapper} ${isRight ? styles.bubbleWrapperRight : ''}`}>
          <div className={`${styles.bubble} ${char.bubbleClass}`}>
            {message.text}
          </div>
          <div className={`${styles.bubbleArrow} ${isRight ? styles.bubbleArrowRight : styles.bubbleArrowLeft} ${char.arrowClass}`} />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${styles.chatContainer} ${className}`}
      style={style}
      onMouseEnter={handleContainerMouseEnter}
      onMouseLeave={handleContainerMouseLeave}
    >
      {/* 头部 */}
      <div className={styles.chatHeader} style={headerStyle}>
        <button className={styles.headerBackBtn} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div className={styles.headerTitle}>{title}</div>
        <button className={styles.headerMenu} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>

      {/* 聊天内容区域 */}
      <div className={styles.chatContent} ref={chatContentRef}>
        {/* 已显示的消息 */}
        {displayedMessages.map((msg, idx) => renderMessage(msg, idx))}

        {/* 正在输入提示 */}
        <div className={`${styles.typingIndicator} ${isTyping ? styles.typingVisible : ''}`}>
          <div className={styles.typingDots}>
            <div className={styles.typingDot} style={{ animationDelay: '0s' }}></div>
            <div className={styles.typingDot} style={{ animationDelay: '0.2s' }}></div>
            <div className={styles.typingDot} style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {/* 完成提示 */}
        {isCompleted && (
          <div className={styles.completedTip}>
            ✨ 滚动鼠标滚轮可以查看被遮挡的对话 ✨
          </div>
        )}

        {/* 底部占位 */}
        <div className={styles.bottomSpacer}></div>
      </div>

      {/* 底部输入栏（装饰） */}
      <div className={styles.chatFooter}>
        <button className={styles.footerEmoji} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9"/>
            <line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>
        <div className={styles.footerInput}>我也想问问...</div>
        <button className={styles.footerSendBtn} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* 重播按钮 */}
      <button
        className={styles.replayBtn}
        onClick={handleReplay}
        title="重新播放"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/>
        </svg>
      </button>
    </div>
  );
};

export default DialogueChat;
