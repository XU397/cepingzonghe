import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { loginUser } from '../shared/services/apiService';
import '../styles/LoginPage.css';
import logoImage from '../assets/images/img_logo.png';
import demoImage from '../assets/images/logoinback.png';
import DevModuleSelector from '../components/dev/DevModuleSelector';

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { handleLoginSuccess } = useAppContext();

  // 检测是否为开发环境
  const isDevelopment = import.meta.env.DEV;

  // Images are bundled via Vite asset imports

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!userId || !password) {
        setErrorMessage('请输入账号与密码');
        return;
      }

      const result = await loginUser({ userId, password });
      if (!result || result.code !== 200 || !result.obj) {
        setErrorMessage(result?.msg || '登录失败');
        return;
      }

      const userData = result.obj;
      await handleLoginSuccess(userData);
    } catch (err) {
      setErrorMessage(err?.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理开发环境模块选择
  const handleDevModuleSelect = async (mockUserData) => {
    console.log('[LoginPage] 开发模式快速登录:', mockUserData);
    setIsLoading(true);
    setErrorMessage('');

    try {
      await handleLoginSuccess(mockUserData);
    } catch (err) {
      setErrorMessage(err?.message || '模块加载失败');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-logo-container">
          <img
            src={logoImage}
            alt="Logo"
            className="login-header-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      </header>

      <main className="login-main-container">
        <div className="login-content-container">
          <section className="login-product-intro">
            <h1 className="login-product-title">
              <span className="login-product-highlight">学生问题解决能力</span>监测平台
            </h1>
            <p className="login-product-subtitle">数据驱动的监测与分析平台</p>
            <div className="login-product-demo">
              <img
                src={demoImage}
                alt="平台演示"
                className="login-demo-image"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="400"%3E%3Crect fill="%23f0f0f0" width="500" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-size="20"%3E演示图片%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          </section>

          <section className="login-form-container">
            {/* 开发环境：显示模块选择器 */}
            {isDevelopment && (
              <DevModuleSelector onModuleSelect={handleDevModuleSelect} />
            )}

            <div className="login-welcome-section">
              <h2 className="login-welcome-title">
                {isDevelopment ? '传统登录方式' : '请登录，开启你的思维探究之旅'}
              </h2>
            </div>

            {errorMessage && (
              <div className="login-error-message">
                <span className="error-icon">⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-input-container">
                <label className="login-input-label">账号</label>
                <input
                  className="login-input-field"
                  type="text"
                  placeholder="请输入账号"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="login-input-container">
                <label className="login-input-label">密码</label>
                <input
                  className="login-input-field"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button type="submit" className="login-submit-button" disabled={isLoading}>
                {isLoading && <div className="login-loading-spinner"></div>}
                {isLoading ? '登录中…' : '登录'}
              </button>
            </form>
          </section>
        </div>
      </main>

      <footer className="login-footer">
        <div className="login-footer-links">
          <span className="login-footer-link">内部使用，不提供外部访问支持</span>
        </div>
        <p className="login-copyright">版权所有 © 2025</p>
      </footer>
    </div>
  );
};

export default LoginPage;
