/**
 * 开发环境专用模块选择器（简化版）
 * 仅在开发模式下显示，用于快速切换不同测评模块
 */

import React from 'react';
import './DevModuleSelector.css';

const DevModuleSelector = ({ onModuleSelect }) => {
  // 可用模块列表
  const availableModules = [
    {
      id: 'grade-7',
      name: '7年级-蒸馒头',
      url: '/seven-grade',
      color: '#4CAF50',
      emoji: '🥖',
      pageNum: '1'
    },
    {
      id: 'grade-7-tracking',
      name: '7年级-蜂蜜探究',
      url: '/grade-7-tracking',
      color: '#FF9800',
      emoji: '🍯',
      pageNum: null  // 不指定pageNum，让模块使用默认逻辑（从注意事项页开始）
    }
  ];

  const handleSelectModule = (module) => {
    // 模拟登录数据
    const mockLoginData = {
      batchCode: '250619',
      examNo: `DEV${Date.now().toString().slice(-4)}`,
      pageNum: module.pageNum,
      pwd: '1234',
      schoolCode: '24146',
      schoolName: '开发环境（模块选择器）',
      studentCode: `M${module.id}`,
      studentName: `测试用户-${module.name}`,
      url: module.url
    };

    console.log('[DevModuleSelector] 选择模块:', module.name);
    console.log('[DevModuleSelector] 模拟登录数据:', mockLoginData);

    onModuleSelect(mockLoginData);
  };

  return (
    <div className="dev-module-selector">
      <div className="dev-selector-header">
        <span className="dev-badge">🔧 开发模式</span>
        <span className="dev-title">快速选择模块</span>
      </div>

      <div className="dev-button-group">
        {availableModules.map((module) => (
          <button
            key={module.id}
            className="dev-module-button"
            onClick={() => handleSelectModule(module)}
            style={{ '--module-color': module.color }}
          >
            <span className="dev-module-emoji">{module.emoji}</span>
            <span className="dev-module-name">{module.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DevModuleSelector;
