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

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ModuleFallback from './ModuleFallback';
import { performanceMonitor } from './config/performance.js';
import STORAGE_KEYS, { setStorageItem, removeStorageItem } from '@shared/services/storage/storageKeys.js';
import { createModuleUserContext } from './utils/createModuleUserContext.js';

// 缓存 ModuleRegistry 动态导入结果，避免重复请求
let moduleRegistryPromise = null;

const loadModuleRegistryInstance = () => {
  if (!moduleRegistryPromise) {
    moduleRegistryPromise = import('./ModuleRegistry.js').then(mod => mod.default);
  }
  return moduleRegistryPromise;
};

const ensureRegistryReady = async (existingRegistry = null) => {
  const registry = existingRegistry || (await loadModuleRegistryInstance());

  if (typeof registry.initialize === 'function' && !registry.initialized) {
    await registry.initialize();
  }

  return registry;
};

const FLOW_URL_PATTERN = /^\/flow\/.+/;

const buildSerializableFlowContext = (context) => {
  if (!context) {
    return null;
  }

  return {
    batchCode: context.batchCode || '',
    examNo: context.examNo || '',
    url: context.url || context.moduleUrl || '',
    moduleUrl: context.moduleUrl || context.url || '',
    pageNum: context.pageNum ?? null,
    ...(context.studentName ? { studentName: context.studentName } : {}),
  };
};

const persistModuleSnapshot = ({ url, pageNum }) => {
  if (!url) {
    return;
  }

  try {
    setStorageItem(STORAGE_KEYS.CORE_MODULE_URL, url, true);

    if (pageNum === null || pageNum === undefined) {
      removeStorageItem(STORAGE_KEYS.CORE_PAGE_NUM);
    } else {
      setStorageItem(STORAGE_KEYS.CORE_PAGE_NUM, String(pageNum), true);
    }
  } catch (err) {
    console.warn('[ModuleRouter] ⚠️ 无法持久化模块状态:', err);
  }
};

const logContextConstruction = (globalContext, authInfo) => {
  performanceMonitor.start('context_construction_time');

  console.log('[ModuleRouter] 🔧 构造模块用户上下文', {
    globalContext: globalContext ? 'present' : 'missing',
    authInfo: authInfo ? 'present' : 'missing',
    hasStartQuestionnaireTimer: !!globalContext?.startQuestionnaireTimer,
    hasIsQuestionnaireStarted: globalContext?.isQuestionnaireStarted !== undefined,
    globalContextKeys: globalContext ? Object.keys(globalContext).filter(k => k.includes('questionnaire') || k.includes('Timer')) : []
  });
};

const logContextConstructionEnd = (moduleUserContext) => {
  const constructionTime = performanceMonitor.end('context_construction_time');

  console.log('[ModuleRouter] ✅ 用户上下文构造完成', {
    examNo: moduleUserContext?.examNo,
    url: moduleUserContext?.url,
    pageNum: moduleUserContext?.pageNum,
    hasLogOperation: typeof moduleUserContext?.logOperation === 'function',
    hasCollectAnswer: typeof moduleUserContext?.collectAnswer === 'function',
    constructionTime: `${constructionTime.toFixed(2)}ms`
  });
};

/**
 * 对外暴露的纯函数解析器，供登录/恢复逻辑直接计算模块与初始页面
 * @param {{ url: string, pageNum?: string|number|null }} params
 * @param {Object|null} registryOverride - 已初始化的 ModuleRegistry（可选）
 * @returns {Promise<{ module: Object, ModuleComponent: React.ComponentType, initialPageId: string|null }>}
 */
export async function resolveModuleRoute(params, registryOverride = null) {
  const { url, pageNum = null } = params || {};

  if (!url) {
    throw new Error('ModuleRouter.resolve 需要有效的 url');
  }

  const registry = await ensureRegistryReady(registryOverride);
  const lookup = typeof registry.getByUrl === 'function'
    ? registry.getByUrl.bind(registry)
    : registry.getModuleByUrl.bind(registry);
  const module = lookup(url);

  if (!module) {
    throw new Error(`未找到URL对应的模块: ${url}`);
  }

  let initialPageId = null;
  try {
    initialPageId = module.getInitialPage(pageNum ?? null);
  } catch (err) {
    console.warn('[ModuleRouter] ⚠️ 解析初始页面失败，返回 null:', err.message);
    initialPageId = null;
  }

  persistModuleSnapshot({ url, pageNum });

  return {
    module,
    ModuleComponent: module.ModuleComponent,
    initialPageId,
  };
}

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
  const navigate = useNavigate();
  
  // 性能优化：使用 ref 避免重复初始化
  const initializationRef = useRef(false);
  const moduleCleanupRef = useRef(null);
  const moduleUserContextRef = useRef(null);
  const flowDelegationRef = useRef(false);

  // 性能优化：记忆化用户上下文 - 使用更稳定的依赖
  const moduleUserContext = useMemo(() => {
    console.log('[ModuleRouter] 🔄 useMemo重新计算moduleUserContext:', {
      isTimeUp: globalContext?.isTimeUp,
      isQuestionnaireTimeUp: globalContext?.isQuestionnaireTimeUp,
      currentPageId: globalContext?.currentPageId
    });

    logContextConstruction(globalContext, authInfo);
    const context = createModuleUserContext(globalContext, authInfo);
    logContextConstructionEnd(context);

    console.log('[ModuleRouter] 📦 构造的context包含:', {
      hasIsTimeUp: 'isTimeUp' in (context || {}),
      isTimeUpValue: context?.isTimeUp,
      hasIsQuestionnaireTimeUp: 'isQuestionnaireTimeUp' in (context || {}),
      isQuestionnaireTimeUpValue: context?.isQuestionnaireTimeUp
    });

    moduleUserContextRef.current = context; // 保存到ref中
    return context;
  }, [
    // 只依赖真正会变化的关键字段
    authInfo?.examNo,
    authInfo?.batchCode,
    authInfo?.url,
    authInfo?.pageNum,
    globalContext?.currentPageId,
    globalContext?.isAuthenticated,
    globalContext?.isTimeUp,                     // 监听实验倒计时状态
    globalContext?.isQuestionnaireTimeUp,        // 监听问卷超时标志
    globalContext?.questionnaireRemainingTime    // 监听问卷剩余时间变化
  ]);

  /**
   * 初始化模块系统
   * 使用 ref 确保只初始化一次，优化加载速度
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
      
      const registry = await ensureRegistryReady();
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

  const delegateFlowNavigation = useCallback(async (moduleContext) => {
    if (!moduleContext?.url) {
      return;
    }

    if (flowDelegationRef.current) {
      return;
    }

    flowDelegationRef.current = true;

    try {
      const registry = moduleRegistry || (await ensureRegistryReady());
      console.log('[ModuleRouter] 🚦 Flow URL detected, delegating to router:', moduleContext.url);
      const { initialPageId: resolvedInitialPageId } = await resolveModuleRoute(
        {
          url: moduleContext.url,
          pageNum: moduleContext.pageNum,
        },
        registry
      );

      const serializableContext = buildSerializableFlowContext(moduleContext);

      navigate(moduleContext.url, {
        replace: true,
        state: {
          // Only pass serializable fields to satisfy the History API structuredClone contract.
          userContext: serializableContext,
          initialPageId: resolvedInitialPageId,
        },
      });
    } catch (err) {
      console.error('[ModuleRouter] ❌ Flow 路由失败:', err);
      setError(`Flow 路由失败: ${err.message}`);
      flowDelegationRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [moduleRegistry, navigate]);

  /**
   * 根据用户上下文加载对应的模块
   */
  const loadModuleForUser = useCallback(async () => {
    const currentContext = moduleUserContextRef.current;
    if (!moduleRegistry || !currentContext) {
      return;
    }

    const isFlowUrl = FLOW_URL_PATTERN.test(currentContext.url || '');
    if (isFlowUrl) {
      await delegateFlowNavigation(currentContext);
      return;
    }

    try {
      console.log('[ModuleRouter] 🔍 开始加载用户模块...', {
        url: currentContext.url,
        pageNum: currentContext.pageNum,
        examNo: currentContext.examNo
      });

      // 性能监控：开始模块加载计时
      performanceMonitor.start('module_load_time');

      const { module, initialPageId } = await resolveModuleRoute(
        {
          url: currentContext.url,
          pageNum: currentContext.pageNum,
        },
        moduleRegistry
      );

      console.log('[ModuleRouter] 📦 找到对应模块:', {
        moduleId: module.moduleId,
        displayName: module.displayName,
        url: module.url,
        version: module.version || 'unknown',
        initialPageId,
      });

      // 🚀 优化：模块初始化改为异步并行
      const initPromises = [];
      if (typeof module.onInitialize === 'function') {
        try {
          // 确保初始化函数返回Promise，如果不是则包装
          const initResult = module.onInitialize();
          const initPromise = initResult && typeof initResult.then === 'function' 
            ? initResult 
            : Promise.resolve(initResult);
            
          initPromises.push(
            initPromise.catch(err => {
              console.warn('[ModuleRouter] ⚠️ 模块初始化失败:', err.message);
            })
          );
        } catch (err) {
          console.warn('[ModuleRouter] ⚠️ 模块初始化同步执行失败:', err.message);
        }
      }
      
      // 并行执行初始化操作
      if (initPromises.length > 0) {
        await Promise.allSettled(initPromises);
        console.log('[ModuleRouter] ✅ 模块初始化完成');
      }

      // 保存清理函数引用
      moduleCleanupRef.current = module.onDestroy;

      // 设置当前模块和初始页面
      setCurrentModule(module);
      setInitialPageId(initialPageId);
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
  }, [moduleRegistry, delegateFlowNavigation]); // 移除moduleUserContext依赖，在函数内直接访问

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

  // 模块注册表准备就绪后加载用户模块 - 优化依赖
  useEffect(() => {
    const currentContext = moduleUserContextRef.current;
    if (!currentContext?.url) {
      return;
    }

    if (FLOW_URL_PATTERN.test(currentContext.url)) {
      delegateFlowNavigation(currentContext);
      return;
    }

    if (moduleRegistry) {
      // 🚀 优化：立即设置loading为false，先显示组件再执行加载
      setLoading(false);
      loadModuleForUser();
    }
  }, [moduleRegistry, authInfo?.url, loadModuleForUser, delegateFlowNavigation]); // 使用稳定的authInfo.url

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
            {authInfo?.url && `目标模块: ${authInfo.url}`}
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
                  authInfo: authInfo,
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
            目标URL: {authInfo?.url || 'unknown'}
          </div>
        )}
      </div>
    </div>
  );
};

// 使用React.memo优化，减少不必要的重新渲染
export default React.memo(ModuleRouter, (prevProps, nextProps) => {
  // 自定义比较函数，只比较关键字段
  const prevAuth = prevProps.authInfo;
  const nextAuth = nextProps.authInfo;
  
  const authChanged = (
    prevAuth?.url !== nextAuth?.url ||
    prevAuth?.pageNum !== nextAuth?.pageNum ||
    prevAuth?.examNo !== nextAuth?.examNo ||
    prevAuth?.batchCode !== nextAuth?.batchCode
  );
  
  // 如果认证信息变化，则需要重新渲染
  if (authChanged) {
    return false; // 返回false表示需要重新渲染
  }
  
  // 其他情况下，避免重新渲染
  return true; // 返回true表示跳过重新渲染
});
