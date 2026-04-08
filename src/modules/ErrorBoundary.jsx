/**
 * 模块系统错误边界组件
 * 捕获模块加载和运行时错误，提供降级机制
 */

import React from 'react';
import STORAGE_KEYS, { removeStorageItem } from '@shared/services/storage/storageKeys.js';

class ModuleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 捕获错误信息
    console.error('[ModuleErrorBoundary] 捕获到模块错误:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 上报错误信息（可选）
    this.reportError(error, errorInfo);
  }

  /**
   * 上报错误信息到日志系统
   */
  reportError = (error, errorInfo) => {
    try {
      // 这里可以添加错误上报逻辑
      console.log('[ModuleErrorBoundary] 错误报告:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (reportError) {
      console.error('[ModuleErrorBoundary] 错误上报失败:', reportError);
    }
  };

  /**
   * 重试加载模块
   */
  handleRetry = () => {
    console.log('[ModuleErrorBoundary] 用户请求重试模块加载');
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  /**
   * 切换到传统模式
   */
  handleFallbackToTraditional = () => {
    console.log('[ModuleErrorBoundary] 用户选择切换到传统模式');
    
    try {
      // 清除模块系统标志
      localStorage.removeItem('useModuleSystem');
      removeStorageItem(STORAGE_KEYS.CORE_MODULE_URL);
      // 统一键名：优先清理 pageNum，兼容清理旧的 modulePageNum
      removeStorageItem(STORAGE_KEYS.CORE_PAGE_NUM);
      localStorage.removeItem('hci-pageNum');

      // 刷新页面以加载传统模式
      window.location.reload();
    } catch (error) {
      console.error('[ModuleErrorBoundary] 切换到传统模式失败:', error);
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const maxRetries = 3;
      
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff7875',
          borderRadius: '8px',
          backgroundColor: '#fff2f0',
          fontFamily: 'Arial, sans-serif'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '24px', marginRight: '8px' }}>⚠️</span>
            <h2 style={{ 
              margin: 0, 
              color: '#cf1322',
              fontSize: '18px'
            }}>
              模块系统遇到问题
            </h2>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#666' }}>
              测评模块加载时出现错误，您可以选择以下操作：
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            {retryCount < maxRetries && (
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 重试加载 ({retryCount}/{maxRetries})
              </button>
            )}
            
            <button
              onClick={this.handleFallbackToTraditional}
              style={{
                padding: '8px 16px',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✅ 使用传统模式
            </button>
          </div>

          {/* 开发环境显示详细错误信息 */}
          {import.meta.env.DEV && (
            <details style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                📋 详细错误信息 (开发模式)
              </summary>
              
              <div style={{ marginTop: '8px' }}>
                <strong>错误消息:</strong>
                <pre style={{ 
                  backgroundColor: '#fff', 
                  padding: '8px', 
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '11px'
                }}>
                  {error && error.toString()}
                </pre>
              </div>

              {errorInfo && (
                <div style={{ marginTop: '8px' }}>
                  <strong>组件堆栈:</strong>
                  <pre style={{ 
                    backgroundColor: '#fff', 
                    padding: '8px', 
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '11px',
                    maxHeight: '200px'
                  }}>
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </details>
          )}

          <div style={{ 
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#e6f7ff',
            border: '1px solid #91d5ff',
            borderRadius: '4px',
            fontSize: '13px'
          }}>
            <strong>💡 说明:</strong> 选择"使用传统模式"将切换到稳定的原版界面，
            您的学习进度和数据不会丢失。
          </div>
        </div>
      );
    }

    // 如果没有错误，正常渲染子组件
    return this.props.children;
  }
}

export default ModuleErrorBoundary;
