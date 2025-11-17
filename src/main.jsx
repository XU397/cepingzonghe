import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppShell from '@app/AppShell.jsx';
import './styles/global.css';

const routerBasename = (import.meta.env.VITE_ROUTER_BASENAME && import.meta.env.VITE_ROUTER_BASENAME !== '/')
  ? import.meta.env.VITE_ROUTER_BASENAME
  : undefined;

ReactDOM.createRoot(document.getElementById('root')).render(
  // 方案 D: 路由级 StrictMode 切换
  // - 顶层不包裹 StrictMode，由 AppShell 内按路由决定
  // - 非 /flow/* 路径在 AppShell 中启用 StrictMode；/flow/* 默认禁用
  <BrowserRouter basename={routerBasename}>
    <AppShell />
  </BrowserRouter>
); 
