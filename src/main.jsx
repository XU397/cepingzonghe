import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/global.css';

const routerBasename = (import.meta.env.VITE_ROUTER_BASENAME && import.meta.env.VITE_ROUTER_BASENAME !== '/')
  ? import.meta.env.VITE_ROUTER_BASENAME
  : undefined;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
); 
