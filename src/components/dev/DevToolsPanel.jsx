import React, { useState, useEffect } from 'react';
import {
  DEV_TOOLS_STORAGE_KEYS,
  DEV_TOOLS_DEFAULTS,
  readDevBooleanPreference,
  writeDevBooleanPreference,
} from '../../utils/devTools';

/**
 * 开发工具面板
 * 仅在开发环境显示，提供快捷开关
 */
const DevToolsPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mockEnabled, setMockEnabled] = useState(
    readDevBooleanPreference(DEV_TOOLS_STORAGE_KEYS.mock, DEV_TOOLS_DEFAULTS.mock)
  );
  const [fullscreenEnabled, setFullscreenEnabled] = useState(
    readDevBooleanPreference(DEV_TOOLS_STORAGE_KEYS.fullscreen, DEV_TOOLS_DEFAULTS.fullscreen)
  );

  // 监听存储变化
  useEffect(() => {
    const handler = (event) => {
      if (event.key === DEV_TOOLS_STORAGE_KEYS.mock) {
        setMockEnabled(event.newValue === 'true');
      } else if (event.key === DEV_TOOLS_STORAGE_KEYS.fullscreen) {
        setFullscreenEnabled(event.newValue === 'true');
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleMockToggle = () => {
    const newValue = !mockEnabled;
    setMockEnabled(newValue);
    writeDevBooleanPreference(DEV_TOOLS_STORAGE_KEYS.mock, newValue);
    // 刷新页面以应用 mock 设置
    if (window.confirm('Mock 设置已更改，需要刷新页面才能生效。是否立即刷新？')) {
      window.location.reload();
    }
  };

  const handleFullscreenToggle = () => {
    const newValue = !fullscreenEnabled;
    setFullscreenEnabled(newValue);
    writeDevBooleanPreference(DEV_TOOLS_STORAGE_KEYS.fullscreen, newValue);
  };

  const panelStyle = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    zIndex: 99999,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '12px',
  };

  const buttonStyle = {
    padding: '8px 12px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  };

  const expandedPanelStyle = {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    minWidth: '200px',
  };

  const toggleRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const switchStyle = (enabled) => ({
    width: '40px',
    height: '20px',
    backgroundColor: enabled ? '#4caf50' : '#666',
    borderRadius: '10px',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  });

  const switchKnobStyle = (enabled) => ({
    width: '16px',
    height: '16px',
    backgroundColor: '#fff',
    borderRadius: '50%',
    position: 'absolute',
    top: '2px',
    left: enabled ? '22px' : '2px',
    transition: 'left 0.2s',
  });

  if (!isExpanded) {
    return (
      <div style={panelStyle}>
        <button
          style={buttonStyle}
          onClick={() => setIsExpanded(true)}
          title="开发工具"
        >
          🛠️ Dev
        </button>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={expandedPanelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <strong>开发工具</strong>
          <button
            style={{ ...buttonStyle, padding: '2px 8px', fontSize: '10px' }}
            onClick={() => setIsExpanded(false)}
          >
            ✕
          </button>
        </div>

        <div style={toggleRowStyle}>
          <span>Mock API</span>
          <div
            style={switchStyle(mockEnabled)}
            onClick={handleMockToggle}
            role="switch"
            aria-checked={mockEnabled}
          >
            <div style={switchKnobStyle(mockEnabled)} />
          </div>
        </div>

        <div style={toggleRowStyle}>
          <span>全屏检查</span>
          <div
            style={switchStyle(fullscreenEnabled)}
            onClick={handleFullscreenToggle}
            role="switch"
            aria-checked={fullscreenEnabled}
          >
            <div style={switchKnobStyle(fullscreenEnabled)} />
          </div>
        </div>

        <div style={{ fontSize: '10px', color: '#888', marginTop: '8px' }}>
          Mock: {mockEnabled ? '启用' : '禁用'}<br />
          全屏: {fullscreenEnabled ? '检查' : '跳过'}
        </div>
      </div>
    </div>
  );
};

export default DevToolsPanel;
