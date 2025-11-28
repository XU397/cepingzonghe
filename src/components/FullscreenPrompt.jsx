import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/FullscreenPrompt.css';
import {
  onFullscreenPreferenceChange,
  shouldEnforceFullscreen
} from '../utils/fullscreenPreference';

/**
 * 全屏提示组件
 * 当用户退出全屏时显示，提示用户重新进入全屏
 * 使用 React Portal 渲染到 document.body，确保在所有内容之上
 */
const FullscreenPrompt = ({ onEnterFullscreen }) => {
  const [fullscreenCheckEnabled, setFullscreenCheckEnabled] = useState(() => {
    const shouldEnforce = shouldEnforceFullscreen();
    console.log('[FullscreenPrompt] 初始化全屏检查:', shouldEnforce);
    return shouldEnforce;
  });

  useEffect(() => {
    const unsubscribe = onFullscreenPreferenceChange((enabled) => {
      console.log('[FullscreenPrompt] 全屏偏好变化:', enabled);
      setFullscreenCheckEnabled(Boolean(enabled));
    });

    return unsubscribe;
  }, []);

  console.log('[FullscreenPrompt] 渲染检查:', { fullscreenCheckEnabled });

  if (!fullscreenCheckEnabled) {
    console.log('[FullscreenPrompt] 不显示：全屏检查未启用');
    return null;
  }

  console.log('[FullscreenPrompt] 显示退出全屏提示');

  // 创建一个容器元素来确认Portal是否工作
  useEffect(() => {
    console.log('[FullscreenPrompt] 组件已挂载，准备显示Portal');
    // 在body中添加一个标记来确认
    const marker = document.createElement('div');
    marker.id = 'fullscreen-prompt-marker';
    marker.style.cssText = 'position: fixed; top: 0; left: 0; background: yellow; color: black; padding: 5px; z-index: 2147483647;';
    marker.textContent = 'FullscreenPrompt组件已渲染';
    document.body.appendChild(marker);

    return () => {
      // 清理标记
      const existingMarker = document.getElementById('fullscreen-prompt-marker');
      if (existingMarker) {
        existingMarker.remove();
      }
    };
  }, []);

  // 使用 React Portal 将内容渲染到 document.body
  // 这样可以绕过所有中间容器，确保显示在最顶层
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
        zIndex: 2147483646, // 接近最大值
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

  // 使用 React Portal 渲染到 document.body
  return ReactDOM.createPortal(content, document.body);
};

export default FullscreenPrompt;
