import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { loginUser } from '../shared/services/apiService';
import { useLoginPageConfig } from '../shared/services/loginPageConfig';
import '../styles/LoginPage.css';
import logoImage from '../assets/images/img_logo.png';
import demoImage from '../assets/images/logoinback.png';

const VALID_DISPLAY_TYPES = new Set(['none', 'image', 'text', 'image_text']);
const VALID_POSITIONS = new Set(['top_left', 'top_center', 'top_right']);
const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

function getAllowedLogoOrigins() {
  return String(import.meta.env.VITE_LOGIN_LOGO_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isSafeLogoImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false;

  const trimmedUrl = imageUrl.trim();
  if (!trimmedUrl || trimmedUrl.startsWith('//')) return false;
  if (trimmedUrl.startsWith('/') || trimmedUrl.startsWith('./') || trimmedUrl.startsWith('../')) {
    return true;
  }

  const baseOrigin = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'http://localhost';

  try {
    const parsedUrl = new URL(trimmedUrl, baseOrigin);
    const isAbsoluteUrl = URL_SCHEME_PATTERN.test(trimmedUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return false;
    if (!isAbsoluteUrl) return true;

    return parsedUrl.origin === baseOrigin || getAllowedLogoOrigins().includes(parsedUrl.origin);
  } catch {
    return false;
  }
}

function getLogoImageSrc(imageUrl) {
  return isSafeLogoImageUrl(imageUrl) ? imageUrl.trim() : logoImage;
}

const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownTime, setCooldownTime] = useState(0);
  const [logoImageError, setLogoImageError] = useState(false);
  const { handleLoginSuccess } = useAppContext();

  const config = useLoginPageConfig();

  const isPasswordFreeEnv = import.meta.env.VITE_PASSWORD_FREE === '1'
    || String(import.meta.env.VITE_PASSWORD_FREE).toLowerCase() === 'true';
  const hidePassword = config.password.hidden || isPasswordFreeEnv;

  const displayType = VALID_DISPLAY_TYPES.has(config.logo.displayType) ? config.logo.displayType : 'none';
  const position = VALID_POSITIONS.has(config.logo.position) ? config.logo.position : 'top_center';

  const highlightText = config.title.highlightText || '';
  const mainText = config.title.mainText || '';
  const subtitleText = config.title.subtitleText || '';
  const loginBoxTitle = config.loginBoxTitle || '登录';

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

  const handleLogoImageError = useCallback(() => {
    setLogoImageError(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (!userId || (!hidePassword && !password)) {
        setErrorMessage(hidePassword ? '请输入账号' : '请输入账号与密码');
        return;
      }

      const validPattern = /^[a-zA-Z0-9]+$/;
      if (!validPattern.test(userId)) {
        setErrorMessage('账号不符合规范，只允许输入英文字符和数字，请重新输入');
        return;
      }

      if (userId.length < 7 || userId.length > 20) {
        setErrorMessage('账号长度不符合规范，必须为7-20个字符，请重新输入');
        return;
      }

      if (!hidePassword && !validPattern.test(password)) {
        setErrorMessage('密码不符合规范，只允许输入英文字符和数字，请重新输入');
        return;
      }

      const actualPassword = hidePassword ? '1234' : password;
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

  const logoContainerClass = `login-logo-container login-logo--${position.replace('_', '-')}`;

  return (
    <div className="login-page">
      <header className="login-header">
        <div className={logoContainerClass}>
          {displayType !== 'none' && (displayType === 'image' || displayType === 'image_text') && (
            !logoImageError && (
              <img
                src={getLogoImageSrc(config.logo.imageUrl)}
                alt={config.logo.imageAlt || config.logo.text || 'Logo'}
                className="login-header-logo"
                onError={handleLogoImageError}
                referrerPolicy="no-referrer"
              />
            )
          )}
          {displayType !== 'none' && (displayType === 'text' || displayType === 'image_text') && (
            <span className="login-logo-text">{config.logo.text}</span>
          )}
        </div>
      </header>

      <main className="login-main-container">
        <div className="login-content-container">
          <section className="login-product-intro">
            <h1 className="login-product-title">
              {highlightText && <span className="login-product-highlight">{highlightText}</span>}
              {mainText}
            </h1>
            {subtitleText && <p className="login-product-subtitle">{subtitleText}</p>}
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
              <h2 className="login-welcome-title">{loginBoxTitle}</h2>
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

              {!hidePassword && (
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
                {cooldownTime > 0 ? `请等待 ${cooldownTime} 秒` : (isLoading ? '登录中…' : (hidePassword ? '快速登录' : '登录'))}
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
