/**
 * 7年级蒸馒头测评模块
 * 采用包装器模式，封装现有的PageRouter和相关功能
 * 保持所有现有导入路径不变，确保零风险迁移
 */

import React from 'react';
import { Grade7Wrapper } from './wrapper.jsx';
import { grade7Config } from './config.js';

/**
 * 7年级模块定义
 * 实现标准的模块接口，包装现有功能
 */
export const Grade7Module = {
  // 模块基本信息
  moduleId: 'grade-7',
  displayName: '7年级蒸馒头科学探究测评',
  url: '/seven-grade',
  version: '1.0.0',

  // 模块配置
  config: grade7Config,

  /**
   * 模块主组件
   * 使用包装器组件来渲染现有的PageRouter系统
   * @param {Object} props - 组件属性
   * @param {Object} props.userContext - 用户上下文信息
   * @param {string} props.initialPageId - 初始页面ID（用于页面恢复）
   */
  ModuleComponent: ({ userContext, initialPageId }) => {
    console.log('[Grade7Module] 📄 渲染7年级模块组件', {
      userContext: userContext ? 'present' : 'missing',
      initialPageId
    });

    return (
      <Grade7Wrapper 
        userContext={userContext}
        initialPageId={initialPageId}
      />
    );
  },

  /**
   * 根据服务器返回的pageNum获取初始页面ID
   * 使用现有的页面恢复逻辑，保持向后兼容
   * @param {string|number} pageNum - 服务器返回的页面编号
   * @returns {string} 页面ID
   */
  getInitialPage: (pageNum) => {
    console.log('[Grade7Module] 🔄 获取初始页面', { pageNum });

    try {
      // 使用现有的页面映射逻辑（不修改现有文件）
      // 这里我们需要导入现有的工具函数
      const { getTargetPageIdFromPageNum } = require('../../utils/pageMappings.js');
      
      const targetPageId = getTargetPageIdFromPageNum(pageNum);
      
      console.log('[Grade7Module] ✅ 页面恢复', {
        inputPageNum: pageNum,
        targetPageId
      });

      return targetPageId;
    } catch (error) {
      console.error('[Grade7Module] ❌ 页面恢复失败', error);
      
      // 降级处理：如果页面映射失败，返回默认页面
      return 'Page_01_Precautions';
    }
  },

  /**
   * 模块生命周期：初始化
   * 可以在这里执行模块特定的初始化逻辑
   */
  onInitialize: () => {
    console.log('[Grade7Module] 🚀 初始化7年级模块');
    
    // 可以在这里添加模块特定的初始化逻辑
    // 例如：预加载资源、设置全局配置等
  },

  /**
   * 模块生命周期：清理
   * 在模块卸载时执行清理工作
   */
  onDestroy: () => {
    console.log('[Grade7Module] 🧹 清理7年级模块');
    
    // 可以在这里添加清理逻辑
    // 例如：清理定时器、取消网络请求等
  },

  /**
   * 获取模块支持的功能特性
   * @returns {Array} 功能特性列表
   */
  getFeatures: () => {
    return [
      'page-resume',        // 支持页面恢复
      'timer-system',       // 支持计时器系统
      'data-logging',       // 支持数据日志
      'questionnaire',      // 支持问卷调查
      'simulation',         // 支持仿真实验
      'material-reading'    // 支持材料阅读
    ];
  }
};

export default Grade7Module;