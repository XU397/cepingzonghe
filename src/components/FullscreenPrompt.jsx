import React from 'react';
import '../styles/FullscreenPrompt.css';

/**
 * 全屏提示组件
 * 当用户退出全屏时显示，提示用户重新进入全屏
 */
const FullscreenPrompt = ({ onEnterFullscreen }) => {
  return (
    <div className="fullscreen-prompt-overlay">
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

        <h2 className="fullscreen-prompt-title">请进入全屏模式</h2>

        <p className="fullscreen-prompt-message">
          为了确保测试环境的完整性和避免意外操作，
          <br />
          请点击下方按钮重新进入全屏模式。
        </p>

        <button
          className="fullscreen-prompt-button"
          onClick={onEnterFullscreen}
          autoFocus
        >
          进入全屏
        </button>

        <p className="fullscreen-prompt-hint">
          提示：按 <kbd>F11</kbd> 或 <kbd>Esc</kbd> 键也可能影响全屏状态
        </p>
      </div>
    </div>
  );
};

export default FullscreenPrompt;
