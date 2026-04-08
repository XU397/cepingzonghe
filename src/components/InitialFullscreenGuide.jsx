import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import '../styles/FullscreenPrompt.css';
import { shouldEnforceFullscreen } from '../utils/fullscreenPreference';

/**
 * 初始全屏引导组件
 * 在用户第一次访问时显示，引导用户主动进入全屏
 * 解决浏览器安全策略限制自动全屏的问题
 * 使用 React Portal 渲染到 document.body，确保在所有内容之上
 */
const InitialFullscreenGuide = ({ isFullscreen, onEnterFullscreen }) => {
  const [hasEnteredFullscreenBefore, setHasEnteredFullscreenBefore] = useState(false);
  const [fullscreenCheckEnabled, setFullscreenCheckEnabled] = useState(() => {
    const shouldEnforce = shouldEnforceFullscreen();
    console.log('[InitialFullscreenGuide] 全屏强制检查:', shouldEnforce);
    return shouldEnforce;
  });

  useEffect(() => {
    // 记录用户是否曾经进入过全屏
    if (isFullscreen) {
      console.log('[InitialFullscreenGuide] 用户进入全屏，保存状态');
      setHasEnteredFullscreenBefore(true);
      // 保存到 sessionStorage，避免重复显示初始引导
      sessionStorage.setItem('hasEnteredFullscreen', 'true');
    }
  }, [isFullscreen]);

  useEffect(() => {
    // 检查 sessionStorage 中是否有记录
    const hasEntered = sessionStorage.getItem('hasEnteredFullscreen') === 'true';
    if (hasEntered) {
      setHasEnteredFullscreenBefore(true);
    }
  }, []);

  // 调试日志
  console.log('[InitialFullscreenGuide] 渲染条件:', {
    fullscreenCheckEnabled,
    isFullscreen,
    hasEnteredFullscreenBefore
  });

  // 不强制全屏时不显示
  if (!fullscreenCheckEnabled) {
    console.log('[InitialFullscreenGuide] 不显示：全屏检查未启用');
    return null;
  }

  // 已经在全屏状态，不需要显示
  if (isFullscreen) {
    console.log('[InitialFullscreenGuide] 不显示：已在全屏');
    return null;
  }

  // 如果曾经进入过全屏但现在退出了，使用标准的 FullscreenPrompt 提示
  // 这里我们只处理"从未进入过全屏"的初始状态
  if (hasEnteredFullscreenBefore) {
    console.log('[InitialFullscreenGuide] 不显示：曾经进入过全屏，让 FullscreenPrompt 处理');
    return null; // 让 FullscreenPrompt 处理退出全屏的情况
  }

  console.log('[InitialFullscreenGuide] 显示初始全屏引导');

  // 初始引导界面内容
  const content = (
    <div className="fullscreen-prompt-overlay" style={{
      // 内联样式以确保样式生效
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2147483646,
      pointerEvents: 'auto'
    }}>
      <div className="fullscreen-prompt-container">
        <div className="fullscreen-prompt-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </div>

        <h2 className="fullscreen-prompt-title">欢迎使用测评系统</h2>

        <p className="fullscreen-prompt-message">
          为了提供最佳的测试体验并避免意外操作，
          <br />
          请点击下方按钮进入全屏模式开始测评。
        </p>

        <button
          className="fullscreen-prompt-button"
          onClick={onEnterFullscreen}
          autoFocus
        >
          开始测评（进入全屏）
        </button>

        <p className="fullscreen-prompt-hint">
          提示：测评过程中请保持全屏模式，避免使用 <kbd>F11</kbd> 或 <kbd>Esc</kbd> 键
        </p>
      </div>
    </div>
  );

  // 使用 React Portal 渲染到 document.body
  return ReactDOM.createPortal(content, document.body);
};

export default InitialFullscreenGuide;