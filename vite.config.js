import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useMock =
    String(env.VITE_USE_MOCK ?? '1') === '1' || String(env.VITE_USE_MOCK).toLowerCase() === 'true';
  const apiTarget = env.VITE_API_TARGET || 'http://117.72.14.166:9002';
  const isPasswordFreeMode =
    String(env.VITE_PASSWORD_FREE ?? '0') === '1' ||
    String(env.VITE_PASSWORD_FREE).toLowerCase() === 'true';
  const basePath = (() => {
    const rawBase = env.VITE_BASE;
    if (!rawBase) return '/';
    if (rawBase.startsWith('.')) return '/';
    return rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  })();

  // 启动时打印 Mock 状态
  console.log('\n🔧 ==================== Vite 配置 ====================');
  console.log(`📦 运行模式: ${mode}`);
  console.log(`🎭 Mock 模式: ${useMock ? '✅ 启用（前端独立调试）' : '❌ 禁用（真实后端联调）'}`);
  console.log(`🌐 后端地址: ${useMock ? 'N/A (使用 Mock)' : apiTarget}`);
  console.log(`🔑 登录模式: ${isPasswordFreeMode ? '🔓 无密码（默认1234）' : '🔒 标准密码'}`);
  console.log('====================================================\n');

  // 简易 Mock：开发时拦截 /stu/login 与 /stu/saveHcMark，避免后端不可达
  const mockStuApi = {
    name: 'mock-stu-api',
    apply: 'serve',
    configureServer(server) {
      if (!useMock) return;
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // Flow 编排 mock 端点（供 FlowOrchestrator 在 dev 模式下使用）
        if (url.startsWith('/api/flows/') || url.startsWith('/stu/api/flows/')) {
          const method = (req.method || 'GET').toUpperCase();

          const respondJson = (statusCode, payload) => {
            res.statusCode = statusCode;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(payload));
          };
          const logFlow = (...args) => console.log('[Mock Flow API]', ...args);
          const logFlowError = (error, context = {}) => {
            console.error('[Mock Flow API] Error', { ...context, error });
          };

          (async () => {
            try {
              const urlObj = new URL(req.url || '', 'http://localhost');
              const segments = urlObj.pathname.split('/').filter(Boolean);
              // 判断是 /api/flows/ 还是 /stu/api/flows/ 来确定flowId位置
              const flowIdIndex = segments[0] === 'stu' ? 3 : 2;
              const flowIdSegment = segments[flowIdIndex];
              if (!flowIdSegment) {
                logFlow('Missing flowId segment', { pathname: urlObj.pathname });
                respondJson(400, { code: 400, msg: 'Flow ID is required', obj: null });
                return;
              }
              let flowId = '';
              try {
                flowId = decodeURIComponent(flowIdSegment).trim();
              } catch (err) {
                logFlowError(err, { detail: 'Failed to decode flowId' });
                respondJson(400, { code: 400, msg: 'Invalid flow ID encoding', obj: null });
                return;
              }
              if (!flowId) {
                logFlow('Flow ID resolved empty value', { raw: flowIdSegment });
                respondJson(400, { code: 400, msg: 'Invalid flow ID', obj: null });
                return;
              }

              const isProgressEndpoint = segments[flowIdIndex + 1] === 'progress';

              if (!isProgressEndpoint && method === 'GET') {
                logFlow('Fetching flow definition', { flowId });
                const { getMockFlowDefinition } =
                  await import('./src/flows/orchestrator/mockFlowDefinitions.js');
                const definition =
                  typeof getMockFlowDefinition === 'function'
                    ? getMockFlowDefinition(flowId)
                    : undefined;
                if (!definition) {
                  logFlow('Flow definition not found', { flowId });
                  respondJson(404, { code: 404, msg: `Flow ${flowId} not found`, obj: null });
                  return;
                }
                respondJson(200, { code: 200, msg: 'ok', obj: definition });
                return;
              }

              if (isProgressEndpoint && method === 'GET') {
                const progress = {
                  stepIndex: 0,
                  modulePageNum: null,
                  lastUpdated: new Date().toISOString(),
                };
                logFlow('Returning default progress', { flowId });
                respondJson(200, { code: 200, msg: 'ok', obj: progress });
                return;
              }

              if (isProgressEndpoint && method === 'POST') {
                logFlow('Received progress heartbeat (mock)', { flowId });
                respondJson(200, { code: 200, msg: 'Progress saved (mock)', obj: true });
                return;
              }

              logFlow('Method not supported for flow mock endpoint', {
                method,
                flowId,
                isProgressEndpoint,
              });
              respondJson(405, { code: 405, msg: 'Method not allowed', obj: null });
            } catch (error) {
              logFlowError(error, { url });
              respondJson(500, { code: 500, msg: 'Flow mock server error', obj: null });
            }
          })();
          return;
        }

        if (url.startsWith('/stu/login')) {
          console.log('🎭 [Mock API] 拦截登录请求: /stu/login');

          // 解析 URL 查询参数获取 accountName
          const urlObj = new URL(req.url || '', 'http://localhost');
          const accountName = urlObj.searchParams.get('accountName') || '1001';

          console.log('🎭 [Mock API] 登录账号:', accountName);

          // 根据 accountName 返回不同的模块
          const mockUsers = {
            g4test: {
              batchCode: '250619',
              examNo: 'g4test',
              pageNum: '0.1',
              pwd: '1234',
              schoolCode: '24146',
              schoolName: 'G4测试环境',
              studentCode: 'G4001',
              studentName: 'G4测试用户',
              url: '/flow/g4-train-ticket',
            },
            g7track: {
              batchCode: '250619',
              examNo: 'g7track',
              pageNum: '0',
              pwd: '1234',
              schoolCode: '24146',
              schoolName: 'G7测试环境',
              studentCode: 'G7001',
              studentName: 'G7蜂蜜探究用户',
              url: '/grade-7-tracking',
            },
            default: {
              batchCode: '250619',
              examNo: '1001',
              pageNum: '0.1',
              pwd: '1234',
              schoolCode: '24146',
              schoolName: '开发环境（Mock）',
              studentCode: 'M001',
              studentName: '本地模拟用户',
              url: '/flow/g8-physics-assessment',
            },
          };

          const userInfo = mockUsers[accountName] || mockUsers['default'];

          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              code: 200,
              msg: '成功',
              obj: userInfo,
            })
          );
          return;
        }
        if (url.startsWith('/stu/saveHcMark')) {
          console.log('🎭 [Mock API] ✅ 拦截数据提交: /stu/saveHcMark');
          console.log('   📦 请求方法:', req.method);
          console.log('   ✨ 返回 Mock 成功响应');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ code: 200, msg: 'Mock提交成功', obj: true }));
          return;
        }
        if (url.startsWith('/stu/checkSession')) {
          // Mock session heartbeat - 95% success rate
          const isValid = Math.random() > 0.05;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          if (isValid) {
            res.end(JSON.stringify({ code: 200, msg: '会话有效', obj: true }));
          } else {
            res.statusCode = 401;
            res.end(JSON.stringify({ code: 401, msg: '您的账号已在其他设备登录', obj: false }));
          }
          return;
        }
        next();
      });
    },
  };

  return {
    // 构建基路径：默认使用绝对根路径 /，可通过 VITE_BASE 设置（需要以 / 开头）
    base: basePath,
    plugins: [react(), mockStuApi],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@app': path.resolve(__dirname, 'src/app'),
        '@flows': path.resolve(__dirname, 'src/flows'),
        '@submodules': path.resolve(__dirname, 'src/submodules'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@modules': path.resolve(__dirname, 'src/modules'),
        '@pages': path.resolve(__dirname, 'src/pages'),
        '@services': path.resolve(__dirname, 'src/services'),
      },
    },
    build: {
      // Let Vite/Rollup decide chunks to avoid cyclic init issues
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 3000,
      proxy: useMock
        ? {}
        : {
            '/api': {
              target: apiTarget,
              changeOrigin: true,
              rewrite: p => p.replace(/^\/api/, ''),
              configure: proxy => {
                proxy.on('proxyReq', (proxyReq, req) => {
                  if (req.headers.cookie) proxyReq.setHeader('Cookie', req.headers.cookie);
                });
                proxy.on('proxyRes', (proxyRes, req, res) => {
                  if (proxyRes.headers['set-cookie'])
                    res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
                });
              },
            },
            '/stu': {
              target: apiTarget,
              changeOrigin: true,
              secure: false,
              configure: proxy => {
                proxy.on('proxyReq', (proxyReq, req) => {
                  if (req.headers.cookie) proxyReq.setHeader('Cookie', req.headers.cookie);
                  if (req.headers['content-type'])
                    proxyReq.setHeader('Content-Type', req.headers['content-type']);
                  if (req.headers['accept']) proxyReq.setHeader('Accept', req.headers['accept']);
                });
                proxy.on('proxyRes', (proxyRes, req, res) => {
                  if (proxyRes.headers['set-cookie'])
                    res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
                  res.setHeader('Access-Control-Allow-Credentials', 'true');
                });
              },
            },
          },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/submodules/g8-pv-sand-experiment/__tests__/setupTests.js'],
      // WSL2 兼容性：使用 vmThreads 避免 forks/threads 超时问题
      pool: 'vmThreads',
      // 增加超时时间
      testTimeout: 10000,
      hookTimeout: 10000,
      // 如果还有问题，可以禁用并行
      // fileParallelism: false,
      deps: {
        inline: ['react-router', 'react-router-dom'],
      },
      server: {
        deps: {
          inline: ['react-router', 'react-router-dom'],
        },
      },
    },
  };
});
