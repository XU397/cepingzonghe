import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { loginUser } from '../shared/services/apiService';
import '../styles/LoginPage.css';
import logoImage from '../assets/images/img_logo.png';
import demoImage from '../assets/images/logoinback.png';

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);  // 冷却剩余秒数
  const { handleLoginSuccess } = useAppContext();

  const isPasswordFreeMode = import.meta.env.VITE_PASSWORD_FREE === '1' || import.meta.env.VITE_PASSWORD_FREE === 'true';

  useEffect(() => {
    if (cooldownTime <= 0) return;
    const timer = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownTime]);

  // 注意：由于浏览器安全策略，不能自动进入全屏
  // 必须由用户交互触发，全屏提示将由 App.jsx 全局控制

  // Images are bundled via Vite asset imports

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!userId || (!isPasswordFreeMode && !password)) {
        setErrorMessage(isPasswordFreeMode ? '请输入账号' : '请输入账号与密码');
        return;
      }

      // 验证账号格式：只允许英文字符和数字
      const validPattern = /^[a-zA-Z0-9]+$/;
      if (!validPattern.test(userId)) {
        setErrorMessage('账号不符合规范，只允许输入英文字符和数字，请重新输入');
        return;
      }

      // 验证账号长度：7-15个字符
      if (userId.length < 7 || userId.length > 15) {
        setErrorMessage('账号长度不符合规范，必须为7-15个字符，请重新输入');
        return;
      }

      // 验证密码格式（非免密模式下）
      if (!isPasswordFreeMode && !validPattern.test(password)) {
        setErrorMessage('密码不符合规范，只允许输入英文字符和数字，请重新输入');
        return;
      }

      const actualPassword = isPasswordFreeMode ? '1234' : password;
      const result = await loginUser({ userId, password: actualPassword });
      if (result?.code === 429) {
        setCooldownTime(60);
        setErrorMessage(result.msg || '请求过于频繁，请稍后再试');
        return;
      }
      if (!result || result.code !== 200 || !result.obj) {
        setErrorMessage(result?.msg || '登录失败');
        return;
      }

      const userData = {
        ...(result.obj || {}),
        progress: result.progress || result.obj?.progress || null,
      };
      await handleLoginSuccess(userData);
    } catch (err) {
      // 检测 429 限流错误（可能在错误消息中）
      const errorMsg = err?.message || '';
      if (errorMsg.includes('429') || errorMsg.includes('请求过于频繁')) {
        setCooldownTime(60);
        setErrorMessage('请求过于频繁，请稍后再试');
      } else {
        setErrorMessage(errorMsg || '登录失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* 全屏提示已由 App.jsx 全局控制，此处无需重复渲染 */}

      <header className="login-header">
        <div className="login-logo-container">
          深圳市教育督导评估监测中心
          {/* <img
            src={logoImage}
            alt="Logo"
            className="login-header-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />  */}
        </div>
      </header>

      <main className="login-main-container">
        <div className="login-content-container">
          <section className="login-product-intro">
            <h1 className="login-product-title">
              <span className="login-product-highlight">深圳市“三有”青少年幸福成长</span>专项监测项目
            </h1>
            {/* <p className="login-product-subtitle">数据驱动的监测与分析平台</p> */}
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
            <div className="login-welcome-section">
              <h2 className="login-welcome-title">
                学生科学探究能力监测平台
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

              {!isPasswordFreeMode && (
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
              )}

              <button type="submit" className="login-submit-button" disabled={isLoading || cooldownTime > 0}>
                {isLoading && <div className="login-loading-spinner"></div>}
                {cooldownTime > 0 ? `请等待 ${cooldownTime} 秒` : (isLoading ? '登录中…' : (isPasswordFreeMode ? '快速登录' : '登录'))}
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
