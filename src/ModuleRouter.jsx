/**
 * 模块路由器组件
 * 
 * 负责根据用户认证信息中的URL字段，动态加载和渲染对应的测评模块
 * 支持页面恢复功能，确保用户可以从上次停止的地方继续
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * 模块路由器组件
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.userContext - 用户上下文信息
 * @param {string} props.userContext.url - 服务器返回的模块URL (如 "/seven-grade")
 * @param {string} props.userContext.pageNum - 服务器返回的页面编号 (如 "13")
 * @param {string} props.userContext.examNo - 学生考号
 * @param {string} props.userContext.batchCode - 批次号
 */
const ModuleRouter = ({ userContext }) => {
  // 组件状态
  const [currentModule, setCurrentModule] = useState(null);
  const [initialPageId, setInitialPageId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moduleRegistry, setModuleRegistry] = useState(null);

  /**
   * 初始化模块系统
   */
  const initializeModuleSystem = useCallback(async () => {
    try {
      console.log('[ModuleRouter] 🚀 开始初始化模块系统...');
      
      // 导入并初始化模块注册表
      const registry = (await import('./modules/ModuleRegistry.js')).default;
      await registry.initialize();
      
      setModuleRegistry(registry);
      
      console.log('[ModuleRouter] ✅ 模块系统初始化完成');
      
    } catch (err) {
      console.error('[ModuleRouter] ❌ 模块系统初始化失败:', err);
      setError(`模块系统初始化失败: ${err.message}`);
    }
  }, []);

  /**
   * 根据用户上下文加载对应的模块
   */
  const loadModuleForUser = useCallback(async () => {
    if (!moduleRegistry || !userContext) {
      return;
    }

    try {
      console.log('[ModuleRouter] 🔍 开始加载用户模块...', {
        url: userContext.url,
        pageNum: userContext.pageNum,
        examNo: userContext.examNo
      });

      // 根据URL查找对应的模块
      const module = moduleRegistry.getModuleByUrl(userContext.url);
      
      if (!module) {
        throw new Error(`未找到URL对应的模块: ${userContext.url}`);
      }

      console.log('[ModuleRouter] 📦 找到对应模块:', {
        moduleId: module.moduleId,
        displayName: module.displayName,
        url: module.url
      });

      // 获取初始页面ID（用于页面恢复）
      let pageId = null;
      if (userContext.pageNum) {
        try {
          pageId = module.getInitialPage(userContext.pageNum);
          console.log('[ModuleRouter] 🔄 页面恢复:', {
            pageNum: userContext.pageNum,
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

      // 设置当前模块和初始页面
      setCurrentModule(module);
      setInitialPageId(pageId);
      setError(null);

    } catch (err) {
      console.error('[ModuleRouter] ❌ 模块加载失败:', err);
      setError(`模块加载失败: ${err.message}`);
      setCurrentModule(null);
      setInitialPageId(null);
    } finally {
      setLoading(false);
    }
  }, [moduleRegistry, userContext]);

  // 组件挂载时初始化模块系统
  useEffect(() => {
    initializeModuleSystem();
  }, [initializeModuleSystem]);

  // 模块注册表准备就绪后加载用户模块
  useEffect(() => {
    if (moduleRegistry) {
      loadModuleForUser();
    }
  }, [moduleRegistry, loadModuleForUser]);

  // 组件卸载时清理当前模块
  useEffect(() => {
    return () => {
      if (currentModule && typeof currentModule.onDestroy === 'function') {
        try {
          currentModule.onDestroy();
          console.log('[ModuleRouter] 🧹 模块清理完成');
        } catch (err) {
          console.warn('[ModuleRouter] ⚠️ 模块清理失败:', err.message);
        }
      }
    };
  }, [currentModule]);

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
            {userContext?.url && `目标模块: ${userContext.url}`}
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
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              initializeModuleSystem();
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            重试
          </button>
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
            zIndex: 9999
          }}>
            📦 {currentModule.displayName}
            {initialPageId && ` | 📄 ${initialPageId}`}
          </div>
        )}
        
        {/* 渲染模块组件 */}
        <ModuleComponent 
          userContext={userContext}
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
          color: '#666' 
        }}>
          请联系管理员检查系统配置
        </div>
      </div>
    </div>
  );
};

export default ModuleRouter;