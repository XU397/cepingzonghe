import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import '../styles/LoginPage.css';

// 极简登录页（开发可用）：避免编码与语法问题，直接进入模块
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
      const mockUser = {
        batchCode: 'DEV',
        examNo: 'D0001',
        pageNum: '9',
        url: '/four-grade',
        studentName: '开发用户',
        schoolName: '本地开发'
      };
      await handleLoginSuccess(mockUser);
      localStorage.setItem('moduleUrl', mockUser.url);
      localStorage.setItem('modulePageNum', mockUser.pageNum);
      window.location.reload();
    } catch (err) {
      setErrorMessage(err?.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ padding: 24 }}>
      <h2>登录</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
        <div className="login-input-container">
          <label className="login-input-label">账号</label>
          <input className="login-input-field" value={userId} onChange={(e) => setUserId(e.target.value)} />
        </div>
        <div className="login-input-container">
          <label className="login-input-label">密码</label>
          <input className="login-input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {errorMessage && <div className="login-error-message">{errorMessage}</div>}
        <button className="login-submit-button" type="submit" disabled={isLoading}>
          {isLoading ? '登录中…' : '登录并进入四年级模块'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;

