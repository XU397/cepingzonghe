import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import '../styles/LoginPage.css';

/**
 * 登录页面 - 完整版
 * 包含左侧产品介绍和右侧登录表单
 */
const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { handleLoginSuccess } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!userId || !password) {
        setErrorMessage('请输入账号与密码');
        return;
      }

      // 调用登录API
      const response = await fetch('/stu/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          examNo: userId,
          pwd: password
        })
      });

      const result = await response.json();

      if (result.code !== 200) {
        setErrorMessage(result.msg || '登录失败');
        return;
      }

      const userData = result.obj;
      await handleLoginSuccess(userData);
      localStorage.setItem('moduleUrl', userData.url);
      localStorage.setItem('modulePageNum', userData.pageNum || '0.1');
      window.location.reload();
    } catch (err) {
      setErrorMessage(err?.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* 背景装饰 */}
      <div className="login-bg-decoration login-bg-decoration-1"></div>
      <div className="login-bg-decoration login-bg-decoration-2"></div>

      {/* 顶部Header */}
      <header className="login-header">
        <div className="login-logo-container">
          <img
            src="/logo.svg"
            alt="成都市新都区教育科学研究院"
            className="login-header-logo"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      </header>

      {/* 主内容区 */}
      <main className="login-main-container">
        <div className="login-content-container">
          {/* 左侧产品介绍 */}
          <section className="login-product-intro">
            <h1 className="login-product-title">
              <span className="login-product-highlight">学生问题解决能力</span>监测平台
            </h1>
            <p className="login-product-subtitle">
              数据驱动的监测与分析平台，科学评估助力成长
            </p>

            <div className="login-product-slogans">
              <span className="login-slogan-item">科学建模，精准评估</span>
              <span className="login-slogan-item">真实情境，挑战未来</span>
              <span className="login-slogan-item">交互探究，洞见思维</span>
            </div>

            <div className="login-product-demo">
              <img
                src="/demo-image.png"
                alt="平台演示"
                className="login-demo-image"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="400"%3E%3Crect fill="%23f0f0f0" width="500" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-size="20"%3E演示图片%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          </section>

          {/* 右侧登录表单 */}
          <section className="login-form-container">
            <div className="login-welcome-section">
              <h2 className="login-welcome-title">请登录，开启你的思维探究之旅</h2>
            </div>

            {/* 会话过期提示 */}
            {errorMessage && errorMessage.includes('过期') && (
              <div className="login-session-expired">
                <span className="warning-icon">⚠️</span>
                <span>会话已过期，检测到您有未完成的任务，请重新登录继续</span>
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

              {/* 错误信息提示 */}
              {errorMessage && !errorMessage.includes('过期') && (
                <div className="login-error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="login-submit-button"
                disabled={isLoading}
              >
                {isLoading && <div className="login-loading-spinner"></div>}
                {isLoading ? '登录中…' : '登录'}
              </button>
            </form>

            <div className="login-help-text">
              如有账号问题，请联系老师或管理员
            </div>
          </section>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="login-footer">
        <div className="login-footer-links">
          <span className="login-footer-link">内部使用，不提供外部访问支持</span>
        </div>
        <p className="login-copyright">
          版权所有 © 成都市新都区教育科学研究院2025
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
