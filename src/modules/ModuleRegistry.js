/**
 * 模块注册中心
 * 管理所有测评模块的注册、查找和路由
 */

import React, { lazy } from 'react';

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    this.urlToModuleMap = new Map();
    this.initialized = false;
    this.initializingPromise = null;
  }

  register(module) {
    return this.registerModule(module);
  }

  /**
   * 注册一个测评模块
   * @param {Object} module - 模块定义对象
   * @param {string} module.moduleId - 模块唯一标识
   * @param {string} module.displayName - 模块显示名称
   * @param {string} module.url - 模块URL路径 (例如: "/seven-grade", "/four-grade", "/grade-7-tracking")
   * @param {string} module.version - 模块版本
   * @param {React.Component} module.ModuleComponent - 模块主组件
   * @param {Function} module.getInitialPage - 获取初始页面的函数
   *
   * 已注册模块URL列表:
   * - /seven-grade: 7年级传统评估模块 (蒸馒头)
   * - /four-grade: 4年级互动评估模块 (火车票订购)
   * - /grade-7-tracking: 7年级追踪测评模块 (蜂蜜黏度探究)
   */
  registerModule(module) {
    // 验证模块结构
    if (!this.validateModule(module)) {
      throw new Error(`Invalid module structure: ${module.moduleId || 'unknown'}`);
    }

    // 检查模块ID冲突
    if (this.modules.has(module.moduleId)) {
      console.warn(`[ModuleRegistry] Module ${module.moduleId} already registered, overwriting...`);
    }

    // 检查URL冲突
    if (this.urlToModuleMap.has(module.url)) {
      console.warn(`[ModuleRegistry] URL ${module.url} already mapped, overwriting...`);
    }

    // 注册模块
    this.modules.set(module.moduleId, module);
    this.urlToModuleMap.set(module.url, module);

    console.log(`[ModuleRegistry] ✅ 注册模块: ${module.displayName} (${module.moduleId}) -> ${module.url}`);
  }

  /**
   * 根据URL获取模块
   * @param {string} url - URL路径 (如 "/seven-grade", "/flow/abc123")
   * @returns {Object} 模块定义对象，如果未找到则返回默认回退模块
   */
  getModuleByUrl(url) {
    // 首先尝试精确匹配
    let module = this.urlToModuleMap.get(url);
    if (module) {
      return module;
    }

    // 尝试匹配带参数的路由（如 /flow/:flowId）
    for (const [pattern, mod] of this.urlToModuleMap.entries()) {
      if (pattern.includes(':')) {
        // 将 URL 模式转换为正则表达式
        const regexPattern = pattern.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(url)) {
          return mod;
        }
      }
    }

    console.warn(`[ModuleRegistry] ⚠️ 未找到URL对应的模块: ${url}，返回默认回退模块`);
    return this.getDefaultFallbackModule();
  }

  getByUrl(url) {
    return this.getModuleByUrl(url);
  }

  /**
   * 获取默认回退模块
   * 当请求的URL无效时返回此模块
   * @returns {Object} 默认模块定义对象
   * @private
   */
  getDefaultFallbackModule() {
    return {
      moduleId: 'fallback',
      displayName: '默认回退模块',
      url: '/fallback',
      version: '1.0.0',
      ModuleComponent: () => React.createElement(
        'div',
        { style: { padding: '20px', textAlign: 'center' } },
        React.createElement('h2', null, '模块未找到'),
        React.createElement('p', null, '请求的模块不存在，请检查URL路径。'),
        React.createElement('p', null, '可用模块：'),
        React.createElement('ul', null,
          this.getAllUrlMappings().map(mapping =>
            React.createElement('li', { key: mapping.url },
              `${mapping.displayName} (${mapping.url})`
            )
          )
        )
      ),
      getInitialPage: () => 'fallback-page'
    };
  }

  /**
   * 根据模块ID获取模块
   * @param {string} moduleId - 模块ID
   * @returns {Object|null} 模块定义对象
   */
  getModuleById(moduleId) {
    const module = this.modules.get(moduleId);
    if (!module) {
      console.warn(`[ModuleRegistry] ⚠️ 未找到模块: ${moduleId}`);
      return null;
    }
    return module;
  }

  /**
   * 获取所有已注册的模块
   * @returns {Array} 模块列表
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }

  /**
   * 获取所有URL映射
   * @returns {Array} URL映射列表
   */
  getAllUrlMappings() {
    return Array.from(this.urlToModuleMap.entries()).map(([url, module]) => ({
      url,
      moduleId: module.moduleId,
      displayName: module.displayName
    }));
  }

  /**
   * 验证模块结构是否符合规范
   * @param {Object} module - 模块定义对象
   * @returns {boolean} 是否有效
   */
  validateModule(module) {
    const requiredFields = ['moduleId', 'displayName', 'url', 'version', 'ModuleComponent', 'getInitialPage'];

    for (const field of requiredFields) {
      if (!module[field]) {
        console.error(`[ModuleRegistry] ❌ 模块缺少必需字段: ${field}`);
        return false;
      }
    }

    // 验证URL格式
    if (!module.url.startsWith('/')) {
      console.error(`[ModuleRegistry] ❌ 模块URL必须以/开头: ${module.url}`);
      return false;
    }

    // 验证组件是否可调用
    if (typeof module.ModuleComponent !== 'function') {
      console.error(`[ModuleRegistry] ❌ ModuleComponent必须是React组件`);
      return false;
    }

    // 验证getInitialPage是否为函数
    if (typeof module.getInitialPage !== 'function') {
      console.error(`[ModuleRegistry] ❌ getInitialPage必须是函数`);
      return false;
    }

    return true;
  }

  /**
   * 初始化模块注册表
   * 注册所有可用的模块
   */
  async initialize() {
    if (this.initialized) {
      console.log('[ModuleRegistry] 已初始化，跳过重复初始化');
      return;
    }

    // 并发防护：如果已有进行中的初始化，复用该 Promise
    if (this.initializingPromise) {
      console.log('[ModuleRegistry] ⏳ 正在初始化，等待完成...');
      return this.initializingPromise;
    }

    console.log('[ModuleRegistry] 🚀 开始初始化模块系统...');

    this.initializingPromise = (async () => {
      try {
        // 动态导入并注册7年级模块（包装器）
        const { Grade7Module } = await import('./grade-7/index.jsx');
        this.register(Grade7Module);

        // 动态导入并注册4年级模块
        const { Grade4Module_Definition } = await import('./grade-4/index.jsx');
        this.register(Grade4Module_Definition);

        // 动态导入并注册7年级追踪测评模块
        const { Grade7TrackingModule_Definition } = await import('./grade-7-tracking/index.jsx');
        this.register(Grade7TrackingModule_Definition);

        // 动态导入并注册 Flow 模块
        const { FlowModule_Definition } = await import('../flows/FlowModule.jsx');
        this.register(FlowModule_Definition);

        this.initialized = true;
        console.log('[ModuleRegistry] ✅ 模块系统初始化完成');
        console.log('[ModuleRegistry] 📋 已注册模块:', this.getAllUrlMappings());
      } catch (error) {
        console.error('[ModuleRegistry] ❌ 模块系统初始化失败:', error);
        throw error;
      } finally {
        this.initializingPromise = null;
      }
    })();

    return this.initializingPromise;
  }

  /**
   * 获取模块系统状态信息
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      initialized: this.initialized,
      moduleCount: this.modules.size,
      modules: this.getAllUrlMappings()
    };
  }
}

// 创建单例实例
const moduleRegistry = new ModuleRegistry();

export default moduleRegistry;

// 导出类用于测试
export { ModuleRegistry };
