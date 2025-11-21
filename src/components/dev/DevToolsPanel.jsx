import React, { useEffect, useRef, useState } from 'react';
import styles from './DevToolsPanel.module.css';
import {
  DEV_TOOLS_STORAGE_KEYS,
  DEV_TOOLS_DEFAULTS,
  readDevBooleanPreference,
  writeDevBooleanPreference,
  notifyFullscreenPreferenceChange
} from '../../utils/devTools';

const isDevEnvironment = () => {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV === 'development';
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return Boolean(import.meta.env.DEV);
  }
  return false;
};

const DevToolsPanel = () => {
  if (!isDevEnvironment()) {
    return null;
  }

  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mockEnabled, setMockEnabled] = useState(() =>
    readDevBooleanPreference(DEV_TOOLS_STORAGE_KEYS.mock, DEV_TOOLS_DEFAULTS.mock)
  );
  const [fullscreenCheckEnabled, setFullscreenCheckEnabled] = useState(() =>
    readDevBooleanPreference(
      DEV_TOOLS_STORAGE_KEYS.fullscreen,
      DEV_TOOLS_DEFAULTS.fullscreen
    )
  );
  const [showMockNotice, setShowMockNotice] = useState(false);
  const mockNoticeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (mockNoticeTimeoutRef.current) {
        clearTimeout(mockNoticeTimeoutRef.current);
      }
    };
  }, []);

  const handleMockToggle = () => {
    const nextValue = !mockEnabled;
    setMockEnabled(nextValue);
    writeDevBooleanPreference(DEV_TOOLS_STORAGE_KEYS.mock, nextValue);

    setShowMockNotice(true);
    if (mockNoticeTimeoutRef.current) {
      clearTimeout(mockNoticeTimeoutRef.current);
    }
    mockNoticeTimeoutRef.current = window.setTimeout(() => {
      setShowMockNotice(false);
    }, 3200);
  };

  const handleFullscreenToggle = () => {
    const nextValue = !fullscreenCheckEnabled;
    setFullscreenCheckEnabled(nextValue);
    writeDevBooleanPreference(DEV_TOOLS_STORAGE_KEYS.fullscreen, nextValue);
    notifyFullscreenPreferenceChange(nextValue);
  };

  const renderCollapsed = () => (
    <button
      type="button"
      className={styles.fabButton}
      onClick={() => setIsCollapsed(false)}
      aria-label="展开开发者工具"
    >
      ⚙️
    </button>
  );

  const renderPanel = () => (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>开发者工具</span>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={() => setIsCollapsed(true)}
          aria-label="折叠开发者工具"
        >
          ×
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <div>
              <div className={styles.controlTitle}>Mock 模式</div>
              <div className={styles.controlStatus}>
                {mockEnabled ? '✅ 已启用（前端独立调试）' : '⛔ 已禁用（真实后端联调）'}
              </div>
            </div>
            <button
              type="button"
              className={`${styles.toggleButton} ${mockEnabled ? styles.toggleOn : ''}`}
              onClick={handleMockToggle}
              aria-pressed={mockEnabled}
              aria-label="切换 Mock 模式"
            />
          </div>
          <p className={styles.controlDescription}>
            Mock 模式会拦截 /stu/* 请求并返回模拟数据；禁用后会直接访问真实后端接口。
          </p>
          {showMockNotice && (
            <div className={styles.notice}>设置已保存，刷新页面生效。</div>
          )}
        </div>

        <div className={styles.controlGroup}>
          <div className={styles.controlHeader}>
            <div>
              <div className={styles.controlTitle}>全屏检查</div>
              <div className={styles.controlStatus}>
                {fullscreenCheckEnabled ? '🔔 已启用全屏提醒' : '😌 已禁用全屏提醒'}
              </div>
            </div>
            <button
              type="button"
              className={`${styles.toggleButton} ${
                fullscreenCheckEnabled ? styles.toggleOn : ''
              }`}
              onClick={handleFullscreenToggle}
              aria-pressed={fullscreenCheckEnabled}
              aria-label="切换全屏检查"
            />
          </div>
          <p className={styles.controlDescription}>
            关闭后不会再弹出 FullscreenPrompt；重新开启后立即恢复提示。
          </p>
        </div>

        <div className={styles.divider} />

        <p className={styles.footer}>
          设置保存在 localStorage，仅在开发环境生效。Mock 模式需刷新后生效，全屏检查切换后即时生效。
        </p>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {isCollapsed ? renderCollapsed() : renderPanel()}
    </div>
  );
};

export default DevToolsPanel;
