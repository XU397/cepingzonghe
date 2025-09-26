import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Optional aliases for future use
      '@shared': path.resolve(__dirname, 'src/shared'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for external dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
          
          // Module system
          if (id.includes('/modules/')) {
            return 'module-system';
          }
          
          // Questionnaire pages
          if (id.includes('/questionnaire/')) {
            return 'questionnaire-pages';
          }
          
          // Material components
          if (id.includes('/materials/')) {
            return 'materials';
          }
          
          // Simulation components
          if (id.includes('/simulation/')) {
            return 'simulation';
          }
          
          // Login page
          if (id.includes('LoginPage')) {
            return 'page-login';
          }
          
          // Page components
          if (id.includes('/pages/') && !id.includes('/questionnaire/')) {
            return 'page-components';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: "http://117.72.14.166:9002", // 实际后端API地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 确保转发Cookie�?
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 确保返回Set-Cookie�?
            if (proxyRes.headers['set-cookie']) {
              res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
            }
          });
        },
      },
      '/stu': {
        target: 'http://117.72.14.166:9002',
        changeOrigin: true, // 🔑 关键配置：确保Host头正确处�?
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 确保转发Cookie�?
            if (req.headers.cookie) {
              proxyReq.setHeader('Cookie', req.headers.cookie);
            }
            // 🔑 确保Content-Type头正确设�?
            if (req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            // 确保其他重要请求头被转发
            if (req.headers['accept']) {
              proxyReq.setHeader('Accept', req.headers['accept']);
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 确保返回Set-Cookie�?
            if (proxyRes.headers['set-cookie']) {
              res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
            }
            // 确保CORS头正确设�?
            res.setHeader('Access-Control-Allow-Credentials', 'true');
          });
        },
      }
    }
  }
}) 
