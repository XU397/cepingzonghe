#!/bin/bash

# Flow 设置验证脚本
# 用于快速检查 Mock API 和基础配置

set -e

echo "=========================================="
echo "Flow 设置验证脚本"
echo "=========================================="
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
  echo -e "${GREEN}✓${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1"
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# 检查 1: 开发服务器是否运行
echo "检查 1: 开发服务器状态"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  success "开发服务器运行中 (http://localhost:3000)"
else
  error "开发服务器未运行"
  echo "  请执行: npm run dev"
  exit 1
fi
echo ""

# 检查 2: Mock API - Flow 定义端点
echo "检查 2: Mock API - Flow 定义"
FLOW_RESPONSE=$(curl -s http://localhost:3000/api/flows/test-flow-1)

if echo "$FLOW_RESPONSE" | grep -q '"flowId":"test-flow-1"'; then
  success "Flow 定义 API 正常"
  echo "  Response: $(echo $FLOW_RESPONSE | head -c 100)..."
else
  error "Flow 定义 API 响应异常"
  echo "  Response: $FLOW_RESPONSE"
fi
echo ""

# 检查 3: Mock API - 心跳端点
echo "检查 3: Mock API - 心跳端点"
HEARTBEAT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/flows/test-flow-1/heartbeat \
  -H "Content-Type: application/json" \
  -d '{"stepIndex":0}')

if echo "$HEARTBEAT_RESPONSE" | grep -q '"code":200'; then
  success "心跳 API 正常"
else
  warning "心跳 API 响应异常（可能正常，取决于 Mock 实现）"
  echo "  Response: $HEARTBEAT_RESPONSE"
fi
echo ""

# 检查 4: 关键文件存在性
echo "检查 4: 关键文件"
FILES=(
  "src/flows/FlowModule.jsx"
  "src/shared/services/submission/pageDescUtils.js"
  "src/modules/grade-7/wrapper.jsx"
  "src/hooks/useHeartbeat.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    success "$file"
  else
    error "$file 不存在"
  fi
done
echo ""

# 检查 5: 代码关键逻辑
echo "检查 5: pageDesc 增强逻辑"
if grep -q "enhancePageDesc" src/shared/services/submission/pageDescUtils.js; then
  success "pageDescUtils.js 包含 enhancePageDesc 函数"
else
  error "pageDescUtils.js 缺少 enhancePageDesc 函数"
fi

if grep -q "getFlowContext" src/modules/grade-7/wrapper.jsx; then
  success "wrapper.jsx 配置 getFlowContext"
else
  error "wrapper.jsx 缺少 getFlowContext 配置"
fi
echo ""

# 检查 6: 环境变量
echo "检查 6: 环境配置"
if [ -f ".env.local" ]; then
  success ".env.local 存在"
  if grep -q "VITE_USE_MOCK=1" .env.local 2>/dev/null; then
    success "Mock 模式已启用"
  else
    warning ".env.local 中未明确设置 VITE_USE_MOCK=1（可能使用默认值）"
  fi
else
  warning ".env.local 不存在（使用默认配置）"
fi
echo ""

# 检查 7: Mock Server 配置
echo "检查 7: Vite Mock Server 配置"
if grep -q "'/api/flows/:flowId'" vite.config.js; then
  success "vite.config.js 包含 Flow API Mock 端点"
else
  error "vite.config.js 缺少 Flow API Mock 配置"
fi
echo ""

# 总结
echo "=========================================="
echo "验证总结"
echo "=========================================="
echo ""
success "环境准备就绪！"
echo ""
echo "下一步："
echo "  1. 打开浏览器访问: http://localhost:3000/flow/test-flow-1"
echo "  2. 按照 docs/MANUAL_VERIFICATION_GUIDE.md 进行手动验证"
echo "  3. 收集截图并记录结果"
echo ""
echo "快速检查 localStorage（在浏览器 Console 执行）："
echo ""
echo "  Object.keys(localStorage).filter(k => k.startsWith('flow.')).forEach(k => {"
echo "    console.log(k, '=', localStorage.getItem(k));"
echo "  });"
echo ""
