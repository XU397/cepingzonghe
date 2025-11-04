import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useMock = String(env.VITE_USE_MOCK ?? '1') === '1' || String(env.VITE_USE_MOCK).toLowerCase() === 'true'
  const apiTarget = env.VITE_API_TARGET || 'http://117.72.14.166:9002'

  // 简易 Mock：开发时拦截 /stu/login 与 /stu/saveHcMark，避免后端不可达
  const mockStuApi = {
    name: 'mock-stu-api',
    apply: 'serve',
    configureServer(server) {
      if (!useMock) return
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (url.startsWith('/stu/login')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({
            code: 200,
            msg: '成功',
            obj: {
              batchCode: '250619',
              examNo: '1001',
              pageNum: '0.1',
              pwd: '1234',
              schoolCode: '24146',
              schoolName: '开发环境（Mock）',
              studentCode: 'M001',
              studentName: '本地模拟用户',
              url: '/four-grade'
            }
          }))
          return
        }
        if (url.startsWith('/stu/saveHcMark')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ code: 200, msg: 'ok', obj: true }))
          return
        }
        if (url.startsWith('/stu/checkSession')) {
          // Mock session heartbeat - 95% success rate
          const isValid = Math.random() > 0.05
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          if (isValid) {
            res.end(JSON.stringify({ code: 200, msg: '会话有效', obj: true }))
          } else {
            res.statusCode = 401
            res.end(JSON.stringify({ code: 401, msg: '您的账号已在其他设备登录', obj: false }))
          }
          return
        }
        next()
      })
    }
  }

  return {
    // 构建基路径：默认相对路径，支持通过 VITE_BASE 覆盖
    base: env.VITE_BASE || './',
    plugins: [react(), mockStuApi],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
      }
    },
    build: {
      // Let Vite/Rollup decide chunks to avoid cyclic init issues
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 3000,
      proxy: useMock ? {} : {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              if (req.headers.cookie) proxyReq.setHeader('Cookie', req.headers.cookie)
            })
            proxy.on('proxyRes', (proxyRes, req, res) => {
              if (proxyRes.headers['set-cookie']) res.setHeader('Set-Cookie', proxyRes.headers['set-cookie'])
            })
          },
        },
        '/stu': {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              if (req.headers.cookie) proxyReq.setHeader('Cookie', req.headers.cookie)
              if (req.headers['content-type']) proxyReq.setHeader('Content-Type', req.headers['content-type'])
              if (req.headers['accept']) proxyReq.setHeader('Accept', req.headers['accept'])
            })
            proxy.on('proxyRes', (proxyRes, req, res) => {
              if (proxyRes.headers['set-cookie']) res.setHeader('Set-Cookie', proxyRes.headers['set-cookie'])
              res.setHeader('Access-Control-Allow-Credentials', 'true')
            })
          },
        }
      }
    }
  }
})
