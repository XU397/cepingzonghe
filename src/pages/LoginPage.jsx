import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { loginUser } from '../services/apiService';
import { useDataLogging } from '../hooks/useDataLogging';
import { getTargetPageIdFromPageNum, isTaskCompletedByPageNum } from '../utils/pageMappings';
import logoImage from '../assets/images/img_logo.png';
import demoImage from '../assets/images/logoinback.png';
import '../styles/LoginPage.css';

/**
 * 登录页面组件
 * 提供用户登录界面，包含账号密码输入和登录验证
 */
const LoginPage = () => {
  // 状态管理
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSessionExpired, setIsSessionExpired] = useState(false);

  // 获取全局上下文
  const { 
    handleLoginSuccess, 
    navigateToPage, 
    setPageEnterTime,
    submitPageData,
    currentPageId,
    isAuthenticated,
    currentUser,
    batchCode,
    examNo
  } = useAppContext();

  // 数据记录Hook
  const {
    logInput,
    logInputBlur,
    logButtonClick,
    logPageEnter,
    logSubmit,
    collectDirectAnswer
  } = useDataLogging('Page_Login');

  // 页面进入时记录
  useEffect(() => {
    setPageEnterTime(new Date());
    logPageEnter('用户登录页面');
    
    // 检测是否存在session过期的情况
    // 如果有batchCode和examNo但isAuthenticated为false，说明session过期了
    const savedBatchCode = localStorage.getItem('batchCode');
    const savedExamNo = localStorage.getItem('examNo');
    const savedCurrentPageId = localStorage.getItem('currentPageId');
    const savedTaskStartTime = localStorage.getItem('taskStartTime');
    
    if ((savedBatchCode && savedExamNo) || (batchCode && examNo)) {
      if (!isAuthenticated && (savedCurrentPageId || savedTaskStartTime)) {
        console.log('检测到session过期情况:', {
          savedBatchCode: !!savedBatchCode,
          savedExamNo: !!savedExamNo,
          savedCurrentPageId,
          savedTaskStartTime: !!savedTaskStartTime,
          isAuthenticated
        });
        setIsSessionExpired(true);
        setErrorMessage('登录会话已过期，请重新登录以继续您的任务');
        
        // 自动填充之前的账号（如果有的话）
        const savedUserId = localStorage.getItem('lastUserId');
        if (savedUserId) {
          setUserId(savedUserId);
        }
      }
    }
    
    // 移除页面卸载时的自动提交逻辑，因为此时用户还未登录
    // 登录页面的数据将在登录成功后手动提交
  }, [setPageEnterTime, logPageEnter, batchCode, examNo, isAuthenticated]);

  /**
   * 处理账号输入变化
   * @param {Event} e - 输入事件
   */
  const handleUserIdChange = (e) => {
    const value = e.target.value;
    setUserId(value);
    
    // 记录输入操作
    logInput('账号输入框', value);
    
    // 输入时清除错误信息
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  /**
   * 处理账号输入框失焦
   * @param {Event} e - 失焦事件
   */
  const handleUserIdBlur = (e) => {
    const value = e.target.value;
    logInputBlur('账号输入框', value, '登录账号');
  };

  /**
   * 处理密码输入变化
   * @param {Event} e - 输入事件
   */
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // 记录密码输入操作（不记录具体密码内容，只记录长度）
    logInput('密码输入框', `密码长度${value.length}位`);
    
    // 输入时清除错误信息
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  /**
   * 处理密码输入框失焦
   * @param {Event} e - 失焦事件
   */
  const handlePasswordBlur = (e) => {
    const value = e.target.value;
    // 密码失焦时不记录具体内容，只记录是否已输入
    logInputBlur('密码输入框', value.length > 0 ? '已输入密码' : '未输入密码', '登录密码状态');
  };

  /**
   * 处理表单提交
   * @param {Event} e - 表单提交事件
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 记录登录按钮点击
    logButtonClick('登录', '尝试登录');
    
    // 清除之前的错误信息
    setErrorMessage('');
    
    // 基础验证
    if (!userId.trim()) {
      setErrorMessage('请输入账号');
      logSubmit('登录验证', false, '账号为空');
      return;
    }
    
    if (!password.trim()) {
      setErrorMessage('请输入密码');
      logSubmit('登录验证', false, '密码为空');
      return;
    }
    
    // 开始登录流程
    setIsLoading(true);
    logSubmit('登录请求', true, '开始登录验证');
    
    try {
      // 收集登录尝试的答案数据
      collectDirectAnswer('登录尝试次数', '1');
      collectDirectAnswer('登录时间', new Date().toISOString());
      
      // 调用登录API
      const response = await loginUser({
        userId: userId.trim(),
        password: password.trim()
      });
      
      // 登录成功，处理响应数据
      if (response.code === 200 && response.obj) {
        logSubmit('登录API', true, '登录成功');
        
        // 保存用户账号以便session过期后自动填充
        localStorage.setItem('lastUserId', userId.trim());
        
        // 收集登录成功的答案数据
        collectDirectAnswer('登录结果', '成功');
        collectDirectAnswer('用户信息', JSON.stringify({
          studentName: response.obj.studentName,
          schoolName: response.obj.schoolName,
          batchCode: response.obj.batchCode,
          examNo: response.obj.examNo,
          pageNum: response.obj.pageNum
        }));
        
        // 先完成登录流程，设置登录信息
        await handleLoginSuccess(response.obj);
        
        // 登录成功记录
        logSubmit('登录流程', true, '登录状态设置完成');
        
        // 🔑 检查是否启用模块系统
        const enableModuleSystem = import.meta.env.REACT_APP_ENABLE_MODULE_SYSTEM === 'true';
        const moduleUrl = response.obj.url; // 服务器返回的模块URL (如 "/seven-grade")
        
        console.log('[LoginPage] 🎯 登录成功，检查路由模式:', {
          enableModuleSystem,
          moduleUrl,
          pageNum: response.obj.pageNum
        });

        if (enableModuleSystem && moduleUrl) {
          // 🆕 模块系统模式：根据URL路由到对应模块
          console.log('[LoginPage] 📦 使用模块系统路由:', moduleUrl);
          
          // 记录模块路由信息
          collectDirectAnswer('模块路由信息', JSON.stringify({
            moduleUrl: moduleUrl,
            pageNum: response.obj.pageNum,
            routingMode: 'module'
          }));
          
          logSubmit('模块路由', true, `路由到模块: ${moduleUrl}, pageNum: ${response.obj.pageNum}`);
          
          // 触发模块路由（这里我们需要通知App.jsx切换到模块系统）
          // 通过设置一个标志来告诉App.jsx使用ModuleRouter
          localStorage.setItem('useModuleSystem', 'true');
          localStorage.setItem('moduleUrl', moduleUrl);
          localStorage.setItem('modulePageNum', response.obj.pageNum || '');
          
          // 刷新页面以触发模块系统加载
          // 注意：这是临时方案，最终会通过状态管理来实现无刷新切换
          window.location.reload();
          return;
          
        } else {
          // 🔄 传统模式：使用现有的页面路由逻辑
          console.log('[LoginPage] 🔄 使用传统页面路由模式');
          
          const pageNum = response.obj.pageNum;
          let targetPageId = 'Page_01_Precautions'; // 默认跳转页面
          
          if (pageNum !== undefined && pageNum !== null) {
            console.log(`[LoginPage] 后端返回pageNum: ${pageNum}`);
            
            // 直接根据pageNum获取目标页面，让getTargetPageIdFromPageNum处理所有逻辑
            targetPageId = getTargetPageIdFromPageNum(pageNum);
            console.log(`[LoginPage] 根据pageNum ${pageNum}，跳转到页面: ${targetPageId}`);
            
            if (isTaskCompletedByPageNum(pageNum)) {
              logSubmit('任务状态', true, `所有任务已完成，pageNum: ${pageNum}, 跳转到: ${targetPageId}`);
            } else {
              logSubmit('页面恢复', true, `恢复到pageNum: ${pageNum}, 页面: ${targetPageId}`);
            }
            
            // 记录自动跳转信息
            collectDirectAnswer('自动跳转信息', JSON.stringify({
              pageNum: pageNum,
              targetPageId: targetPageId,
              isCompleted: isTaskCompletedByPageNum(pageNum),
              routingMode: 'traditional'
            }));
          } else {
            console.log(`[LoginPage] 后端未返回pageNum，使用默认跳转页面: ${targetPageId}`);
            logSubmit('页面跳转', true, '使用默认页面，从注意事项开始');
          }
          
          // 登录页面的数据记录相对不重要，跳过提交避免session问题
          // 根据pageNum跳转到相应页面，跳过登录页面数据提交
          await navigateToPage(targetPageId, { skipSubmit: true });
        }
      } else {
        const errorMsg = response.msg || '登录失败，请检查账号和密码';
        setErrorMessage(errorMsg);
        logSubmit('登录API', false, errorMsg);
        
        // 收集登录失败的答案数据
        collectDirectAnswer('登录结果', '失败');
        collectDirectAnswer('失败原因', errorMsg);
      }
    } catch (error) {
      console.error('登录失败:', error);
      const errorMsg = error.message || '登录失败，请稍后重试';
      setErrorMessage(errorMsg);
      logSubmit('登录API', false, errorMsg);
      
      // 收集登录错误的答案数据
      collectDirectAnswer('登录结果', '错误');
      collectDirectAnswer('错误信息', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* 背景装饰 */}
      <div className="login-bg-decoration login-bg-decoration-1"></div>
      <div className="login-bg-decoration login-bg-decoration-2"></div>
      
      {/* 顶部导航 */}
      <header className="login-header">
        <div className="login-logo-container">
          <img src={logoImage} alt="平台Logo" className="login-header-logo" />
        </div>
      </header>
      
      {/* 主内容区 */}
      <main className="login-main-container">
        <div className="login-content-container">
          {/* 左侧产品介绍 */}
          <div className="login-product-intro">
            <h1 className="login-product-title">
              学生问题解决能力监测平台
            </h1>
            <p className="login-product-subtitle">
              数据驱动的监测与分析平台，科学评估助力成长
            </p>
            <div className="login-product-slogans">
              <div className="login-slogan-item">科学建模，精准评估</div>
              <div className="login-slogan-item">真实情境，挑战未来</div>
              <div className="login-slogan-item">交互探究，洞见思维</div>
            </div>
            <div className="login-product-demo">
              <img src={demoImage} 
                   alt="平台演示" 
                   className="login-demo-image" />
            </div>
          </div>
          
          {/* 右侧登录表单 */}
          <div className="login-form-container">
            <div className="login-welcome-section">
               <h2 className="login-welcome-title">请登录，开启你的思维探究之旅</h2>              
            </div>
            
            {/* 会话过期提示 */}
            {isSessionExpired && (
              <div className="login-session-expired">
                <i className="warning-icon">🔄</i>
                <span>会话已过期，检测到您有未完成的任务，请重新登录继续</span>
              </div>
            )}
            
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-input-container">
                <label htmlFor="userId" className="login-input-label">
                  账号
                </label>
                <input
                  id="userId"
                  type="text"
                  className="login-input-field"
                  value={userId}
                  onChange={handleUserIdChange}
                  onBlur={handleUserIdBlur}
                  placeholder="请输入账号"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              
              <div className="login-input-container">
                <label htmlFor="password" className="login-input-label">
                  密码
                </label>
                <input
                  id="password"
                  type="password"
                  className="login-input-field"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  placeholder="请输入密码"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
              
              {errorMessage && (
                <div className="login-error-message">
                  <i className="error-icon">⚠️</i>
                  {errorMessage}
                </div>
              )}
              
              <button
                type="submit"
                className="login-submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="login-loading-spinner"></span>
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </form>
            
            <div className="login-help-text">
              如有账号问题，请联系老师或管理员
            </div>
          </div>
        </div>
      </main>
      
      {/* 页脚 */}
      <footer className="login-footer">
        <div className="login-footer-links">
          <a href="#" className="login-footer-link">内部使用，不提供外部访问支持</a>
        </div>
        <div className="login-copyright">版权所有 © 成都市新都区教育局教科院2025</div>
      </footer>
    </div>
  );
};

export default LoginPage; 