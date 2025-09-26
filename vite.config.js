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
              pageNum: '13',
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
        next()
      })
    }
  }

  return {
    plugins: [react(), mockStuApi],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'src/shared'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react'
              }
              return 'vendor'
            }
            if (id.includes('/modules/')) return 'module-system'
            if (id.includes('/questionnaire/')) return 'questionnaire-pages'
            if (id.includes('/materials/')) return 'materials'
            if (id.includes('/simulation/')) return 'simulation'
            if (id.includes('LoginPage')) return 'page-login'
            if (id.includes('/pages/') && !id.includes('/questionnaire/')) return 'page-components'
          }
        }
      },
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

