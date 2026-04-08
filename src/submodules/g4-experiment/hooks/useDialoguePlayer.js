import { useCallback, useEffect, useRef, useState } from 'react';

const clampTypingDelay = (text = '') => {
  const baseDelay = String(text || '').length * 100;
  return Math.min(Math.max(baseDelay, 1200), 2500);
};

const resolveTimers = (timersRef) => {
  timersRef.current.forEach(({ timerId, resolve }) => {
    if (typeof timerId === 'number') {
      window.clearTimeout(timerId);
    }
    if (typeof resolve === 'function') {
      resolve();
    }
  });
  timersRef.current = [];
};

export function useDialoguePlayer({
  messages = [],
  autoStart = true,
  initialDelay = 1000,
  messageInterval = 500,
  onMessageShown,
  onComplete,
  onStart,
} = {}) {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingRole, setTypingRole] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const runIdRef = useRef(0);
  const timersRef = useRef([]);
  const callbacksRef = useRef({ onMessageShown, onComplete, onStart });

  useEffect(() => {
    callbacksRef.current = { onMessageShown, onComplete, onStart };
  }, [onMessageShown, onComplete, onStart]);

  const sleep = useCallback(
    (ms) =>
      new Promise((resolve) => {
        const timerId = window.setTimeout(() => {
          resolve();
          timersRef.current = timersRef.current.filter((item) => item.timerId !== timerId);
        }, ms);
        timersRef.current.push({ timerId, resolve });
      }),
    []
  );

  const resetPlayback = useCallback(() => {
    runIdRef.current += 1;
    resolveTimers(timersRef);
    setVisibleMessages([]);
    setIsTyping(false);
    setTypingRole(null);
    setIsPlaying(false);
    setHasCompleted(false);
  }, []);

  const startPlayback = useCallback(async () => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    resolveTimers(timersRef);

    setVisibleMessages([]);
    setIsTyping(false);
    setTypingRole(null);
    setHasCompleted(false);
    setIsPlaying(true);
    const startCallback = callbacksRef.current.onStart;
    if (typeof startCallback === 'function') {
      startCallback();
    }

    await sleep(initialDelay);
    if (runId !== runIdRef.current) return;

    for (let index = 0; index < messages.length; index += 1) {
      const message = messages[index];
      setTypingRole(message?.role || null);
      setIsTyping(true);
      await sleep(clampTypingDelay(message?.text));
      if (runId !== runIdRef.current) return;

      setIsTyping(false);
      setTypingRole(null);
      setVisibleMessages((prev) => [...prev, { ...message, index }]);

      const messageCallback = callbacksRef.current.onMessageShown;
      if (typeof messageCallback === 'function') {
        messageCallback(message, index);
      }

      await sleep(messageInterval);
      if (runId !== runIdRef.current) return;
    }

    setIsPlaying(false);
    setHasCompleted(true);
    const completeCallback = callbacksRef.current.onComplete;
    if (typeof completeCallback === 'function') {
      completeCallback();
    }
  }, [initialDelay, messageInterval, messages, sleep]);

  useEffect(() => {
    if (autoStart) {
      startPlayback();
    }
    return () => resetPlayback();
  }, [autoStart, resetPlayback, startPlayback]);

  return {
    visibleMessages,
    isTyping,
    typingRole,
    isPlaying,
    hasCompleted,
    startPlayback,
    resetPlayback,
  };
}

export default useDialoguePlayer;
