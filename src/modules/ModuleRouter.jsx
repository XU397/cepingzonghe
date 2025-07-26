/**
 * 顶层模块路由器组件
 * 
 * 负责根据用户认证信息中的URL字段，动态加载和渲染对应的测评模块
 * 支持页面恢复功能，确保用户可以从上次停止的地方继续
 * 
 * 核心功能：
 * - 模块动态加载与路由
 * - 用户上下文构造与传递
 * - 页面恢复机制
 * - 模块生命周期管理
 * - 性能优化与错误边界
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ModuleFallback from './ModuleFallback';
import { performanceMonitor } from './config/performance.js';

/**
 * 构造模块专用的用户上下文
 * 基于全局上下文和认证信息，为模块提供所需的上下文数据
 * 
 * @param {Object} globalContext - 全局应用上下文
 * @param {Object} authInfo - 用户认证信息
 * @returns {Object} 模块用户上下文
 */
const constructModuleUserContext = (globalContext, authInfo) => {
  // 性能监控：开始上下文构造计时
  performanceMonitor.start('context_construction_time');
  
  console.log('[ModuleRouter] 🔧 构造模块用户上下文', {
    globalContext: globalContext ? 'present' : 'missing',
    authInfo: authInfo ? 'present' : 'missing'
  });

  // 基础用户信息（来自认证）
  const baseUserInfo = {
    examNo: authInfo?.examNo || '',
    batchCode: authInfo?.batchCode || '',
    url: authInfo?.url || '',
    pageNum: authInfo?.pageNum || '1'
  };

  // 应用状态信息（来自全局上下文）
  const appStateInfo = globalContext ? {
    currentPageId: globalContext.currentPageId,
    remainingTime: globalContext.remainingTime,
    taskStartTime: globalContext.taskStartTime,
    pageEnterTime: globalContext.pageEnterTime,
    isLoggedIn: globalContext.isLoggedIn,
    isAuthenticated: globalContext.isAuthenticated,
    authToken: globalContext.authToken,
    currentUser: globalContext.currentUser,
    moduleUrl: globalContext.moduleUrl,
    isTaskFinished: globalContext.isTaskFinished,
    isTimeUp: globalContext.isTimeUp
  } : {};

  // 问卷状态信息（如果存在）
  const questionnaireInfo = globalContext ? {
    questionnaireData: globalContext.questionnaireData,
    questionnaireAnswers: globalContext.questionnaireAnswers,
    isQuestionnaireCompleted: globalContext.isQuestionnaireCompleted
  } : {};

  // 操作方法（来自全局上下文）
  const contextMethods = globalContext ? {
    logOperation: globalContext.logOperation,
    collectAnswer: globalContext.collectAnswer
  } : {};

  const moduleUserContext = {
    ...baseUserInfo,
    ...appStateInfo,
    ...questionnaireInfo,
    ...contextMethods,
    
    // 模块特定的元数据
    _moduleMetadata: {
      constructedAt: new Date().toISOString(),
      sourceContext: 'global',
      hasGlobalContext: !!globalContext,
      hasAuthInfo: !!authInfo
    }
  };

  // 性能监控：结束上下文构造计时
  const constructionTime = performanceMonitor.end('context_construction_time');

  console.log('[ModuleRouter] ✅ 用户上下文构造完成', {
    examNo: moduleUserContext.examNo,
    url: moduleUserContext.url,
    pageNum: moduleUserContext.pageNum,
    hasLogOperation: typeof moduleUserContext.logOperation === 'function',
    hasCollectAnswer: typeof moduleUserContext.collectAnswer === 'function',
    constructionTime: `${constructionTime.toFixed(2)}ms`
  });

  return moduleUserContext;
};

/**
 * 模块路由器组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.globalContext - 全局应用上下文
 * @param {Object} props.authInfo - 用户认证信息
 * @param {string} props.authInfo.url - 服务器返回的模块URL (如 "/seven-grade")
 * @param {string} props.authInfo.pageNum - 服务器返回的页面编号 (如 "13")
 * @param {string} props.authInfo.examNo - 学生考号
 * @param {string} props.authInfo.batchCode - 批次号
 */
const ModuleRouter = ({ globalContext, authInfo }) => {
  // 组件状态
  const [currentModule, setCurrentModule] = useState(null);
  const [initialPageId, setInitialPageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleRegistry, setModuleRegistry] = useState(null);
  
  // 性能优化：使用 ref 避免重复初始化
  const initializationRef = useRef(false);
  const moduleCleanupRef = useRef(null);

  // 性能优化：记忆化用户上下文
  const moduleUserContext = useMemo(() => {
    return constructModuleUserContext(globalContext, authInfo);
  }, [globalContext, authInfo]);

  /**
   * 初始化模块系统
   * 使用 ref 确保只初始化一次
   */
  const initializeModuleSystem = useCallback(async () => {
    // 防止重复初始化
    if (initializationRef.current) {
      console.log('[ModuleRouter] ⚠️ 模块系统已初始化，跳过重复初始化');
      return;
    }

    try {
      console.log('[ModuleRouter] 🚀 开始初始化模块系统...');
      
      // 性能监控：开始初始化计时
      performanceMonitor.start('initialization_time');
      
      initializationRef.current = true;
      
      // 导入并初始化模块注册表
      const registry = (await import('./ModuleRegistry.js')).default;
      await registry.initialize();
      
      setModuleRegistry(registry);
      
      // 性能监控：结束初始化计时
      const initTime = performanceMonitor.end('initialization_time');
      
      console.log('[ModuleRouter] ✅ 模块系统初始化完成', {
        initializationTime: `${initTime.toFixed(2)}ms`
      });
      
    } catch (err) {
      console.error('[ModuleRouter] ❌ 模块系统初始化失败:', err);
      initializationRef.current = false; // 重置标志以允许重试
      
      // 性能监控：记录初始化失败
      performanceMonitor.end('initialization_time');
      
      setError(`模块系统初始化失败: ${err.message}`);
    }
  }, []);

  /**
   * 根据用户上下文加载对应的模块
   */
  const loadModuleForUser = useCallback(async () => {
    if (!moduleRegistry || !moduleUserContext) {
      return;
    }

    try {
      console.log('[ModuleRouter] 🔍 开始加载用户模块...', {
        url: moduleUserContext.url,
        pageNum: moduleUserContext.pageNum,
        examNo: moduleUserContext.examNo
      });

      // 性能监控：开始模块加载计时
      performanceMonitor.start('module_load_time');

      // 根据URL查找对应的模块
      const module = moduleRegistry.getModuleByUrl(moduleUserContext.url);
      
      if (!module) {
        throw new Error(`未找到URL对应的模块: ${moduleUserContext.url}`);
      }

      console.log('[ModuleRouter] 📦 找到对应模块:', {
        moduleId: module.moduleId,
        displayName: module.displayName,
        url: module.url,
        version: module.version || 'unknown'
      });

      // 获取初始页面ID（用于页面恢复）
      let pageId = null;
      if (moduleUserContext.pageNum) {
        try {
          pageId = module.getInitialPage(moduleUserContext.pageNum);
          console.log('[ModuleRouter] 🔄 页面恢复:', {
            pageNum: moduleUserContext.pageNum,
            initialPageId: pageId
          });
        } catch (err) {
          console.warn('[ModuleRouter] ⚠️ 页面恢复失败，使用默认页面:', err.message);
          pageId = null;
        }
      }

      // 执行模块初始化
      if (typeof module.onInitialize === 'function') {
        try {
          await module.onInitialize();
          console.log('[ModuleRouter] ✅ 模块初始化完成');
        } catch (err) {
          console.warn('[ModuleRouter] ⚠️ 模块初始化失败:', err.message);
        }
      }

      // 保存清理函数引用
      moduleCleanupRef.current = module.onDestroy;

      // 设置当前模块和初始页面
      setCurrentModule(module);
      setInitialPageId(pageId);
      setError(null);

      // 性能监控：结束模块加载计时
      const loadTime = performanceMonitor.end('module_load_time');
      
      console.log('[ModuleRouter] ✅ 模块加载完成', {
        moduleId: module.moduleId,
        loadTime: `${loadTime.toFixed(2)}ms`
      });

    } catch (err) {
      console.error('[ModuleRouter] ❌ 模块加载失败:', err);
      
      // 性能监控：记录加载失败
      performanceMonitor.end('module_load_time');
      
      setError(`模块加载失败: ${err.message}`);
      setCurrentModule(null);
      setInitialPageId(null);
    } finally {
      setLoading(false);
    }
  }, [moduleRegistry, moduleUserContext]);

  /**
   * 清理当前模块
   */
  const cleanupCurrentModule = useCallback(async () => {
    if (moduleCleanupRef.current && typeof moduleCleanupRef.current === 'function') {
      try {
        console.log('[ModuleRouter] 🧹 开始清理当前模块...');
        
        // 性能监控：开始清理计时
        performanceMonitor.start('module_cleanup_time');
        
        await moduleCleanupRef.current();
        
        // 性能监控：结束清理计时
        const cleanupTime = performanceMonitor.end('module_cleanup_time');
        
        console.log('[ModuleRouter] ✅ 模块清理完成', {
          cleanupTime: `${cleanupTime.toFixed(2)}ms`
        });
        
      } catch (err) {
        console.warn('[ModuleRouter] ⚠️ 模块清理失败:', err.message);
        
        // 性能监控：记录清理失败
        performanceMonitor.end('module_cleanup_time');
      }
      
      moduleCleanupRef.current = null;
    }
  }, []);

  /**
   * 重试加载模块
   */
  const retryLoading = useCallback(() => {
    console.log('[ModuleRouter] 🔄 用户请求重试加载模块');
    
    // 清理当前状态
    setError(null);
    setLoading(true);
    setCurrentModule(null);
    setInitialPageId(null);
    
    // 重新初始化
    initializationRef.current = false;
    initializeModuleSystem();
  }, [initializeModuleSystem]);

  // 组件挂载时初始化模块系统
  useEffect(() => {
    initializeModuleSystem();
    
    // 组件卸载时清理
    return () => {
      cleanupCurrentModule();
    };
  }, [initializeModuleSystem, cleanupCurrentModule]);

  // 模块注册表准备就绪后加载用户模块
  useEffect(() => {
    if (moduleRegistry) {
      loadModuleForUser();
    }
  }, [moduleRegistry, loadModuleForUser]);

  // 当模块发生变化时，清理旧模块
  useEffect(() => {
    return () => {
      cleanupCurrentModule();
    };
  }, [currentModule, cleanupCurrentModule]);

  // 加载中状态
  if (loading) {
    return (
      <div className="module-router-loading">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '200px',
          padding: '20px'
        }}>
          <div style={{ 
            fontSize: '18px', 
            marginBottom: '10px' 
          }}>
            正在加载测评模块...
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#666' 
          }}>
            {moduleUserContext?.url && `目标模块: ${moduleUserContext.url}`}
          </div>
          {/* 性能优化：显示加载进度 */}
          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            color: '#999'
          }}>
            {!moduleRegistry ? '初始化模块系统...' : '加载模块组件...'}
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="module-router-error">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '200px',
          padding: '20px',
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '4px',
          margin: '20px'
        }}>
          <div style={{ 
            fontSize: '18px', 
            color: '#cf1322',
            marginBottom: '10px' 
          }}>
            ❌ 模块加载失败
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#666',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={retryLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 重试
            </button>
            <button 
              onClick={() => {
                // 切换到传统模式
                localStorage.removeItem('useModuleSystem');
                window.location.reload();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✅ 使用传统模式
            </button>
          </div>
          
          {/* 开发环境显示详细错误信息 */}
          {import.meta.env.DEV && (
            <details style={{
              marginTop: '20px',
              width: '100%',
              maxWidth: '600px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                📋 详细错误信息 (开发模式)
              </summary>
              <pre style={{
                backgroundColor: '#f5f5f5',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto',
                marginTop: '10px'
              }}>
                {JSON.stringify({
                  error: error,
                  moduleUserContext: moduleUserContext,
                  hasModuleRegistry: !!moduleRegistry,
                  timestamp: new Date().toISOString()
                }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  // 渲染模块组件
  if (currentModule && currentModule.ModuleComponent) {
    const { ModuleComponent } = currentModule;
    
    return (
      <div className="module-router-container">
        {/* 开发环境显示模块信息 */}
        {import.meta.env.DEV && (
          <div style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '3px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px'
          }}>
            <div>📦 {currentModule.displayName}</div>
            {initialPageId && <div>📄 {initialPageId}</div>}
            <div>🔗 {currentModule.url}</div>
            {currentModule.version && <div>📋 v{currentModule.version}</div>}
          </div>
        )}
        
        {/* 渲染模块组件 */}
        <ModuleComponent 
          userContext={moduleUserContext}
          initialPageId={initialPageId}
        />
      </div>
    );
  }

  // 未找到模块的情况
  return (
    <div className="module-router-not-found">
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '200px',
        padding: '20px'
      }}>
        <div style={{ 
          fontSize: '18px', 
          marginBottom: '10px' 
        }}>
          ⚠️ 未找到对应的测评模块
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#666',
          marginBottom: '10px'
        }}>
          请联系管理员检查系统配置
        </div>
        {import.meta.env.DEV && (
          <div style={{
            fontSize: '12px',
            color: '#999',
            textAlign: 'center'
          }}>
            目标URL: {moduleUserContext?.url || 'unknown'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleRouter;