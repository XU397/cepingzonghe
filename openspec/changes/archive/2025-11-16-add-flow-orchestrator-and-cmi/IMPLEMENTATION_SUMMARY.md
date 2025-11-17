# Flow Orchestrator and CMI Implementation Summary

## 概述

本次实施完成了 Flow 编排运行时与 CMI（Composable Module Interface）子模块接口，支持拼装式测评流程。

## 已实现功能

### 1. 核心类型与接口

**文件：** `src/shared/types/flow.ts`

- ✅ `FlowDefinition` - Flow 定义结构（后端存储）
- ✅ `FlowProgress` - Flow 进度结构（后端返回 + 前端持久化）
- ✅ `FlowStep` - Flow 步骤定义
- ✅ `SubmoduleDefinition` - 子模块接口（CMI）
- ✅ `SubmoduleProps` - 子模块组件 Props
- ✅ `FlowStorageKeys` - Flow 存储键名约定
- ✅ `CompositePageNum` - 复合页码类型
- ✅ `parseCompositePageNum` / `encodeCompositePageNum` - 复合页码编解码
- ✅ `createFlowContextOperation` - 创建 Flow 上下文操作

### 2. Flow 编排器

**文件：** `src/flows/orchestrator/FlowOrchestrator.ts`

- ✅ 加载 Flow 定义与进度（支持后端 + 本地缓存）
- ✅ 解析进度，定位当前步骤与子模块
- ✅ 更新进度并持久化
- ✅ 进入下一步逻辑
- ✅ 完成标记
- ✅ 缓存管理

### 3. Flow Module

**文件：** `src/flows/FlowModule.jsx`

- ✅ 识别 `/flow/<flowId>` 路由
- ✅ 动态加载子模块组件
- ✅ 管理过渡页切换
- ✅ 一次性 `flow_context` 打点（防重复）
- ✅ 子模块生命周期钩子调用
- ✅ 集成心跳进度回写（useHeartbeat）
- ✅ 错误处理与重试

### 4. 过渡页组件

**文件：** `src/flows/TransitionPage.jsx`

- ✅ 完成提示 UI
- ✅ 自动跳转倒计时
- ✅ 手动继续按钮
- ✅ 配置化（title/content/autoNextSeconds）

### 5. 子模块注册表

**文件：** `src/submodules/registry.ts`

- ✅ 子模块注册与查找
- ✅ 动态导入机制
- ✅ 接口验证
- ✅ 单例模式

### 6. 子模块包装器（示例）

**目录：** `src/submodules/g7-experiment/`

- ✅ `mapping.ts` - 页码映射与配置
- ✅ `Component.jsx` - 子模块主组件
- ✅ `index.jsx` - 子模块定义导出
- ✅ `README.md` - 实现指南

### 7. PageDesc 增强

**文件：** `src/shared/services/submission/pageDescUtils.js`

- ✅ `enhancePageDesc` - 追加 Flow 上下文
- ✅ `extractFlowContext` - 提取 Flow 上下文
- ✅ `hasFlowContext` - 检查是否包含 Flow 上下文

### 8. 模块注册集成

**文件：** `src/modules/ModuleRegistry.js`

- ✅ FlowModule 注册到 ModuleRegistry
- ✅ URL 参数匹配（支持 `/flow/:flowId`）

### 9. 心跳进度回写

**文件：** `src/flows/FlowModule.jsx` (集成 `useHeartbeat`)

- ✅ 定时上报进度（15秒）
- ✅ 失败队列重试
- ✅ 本地队列持久化

## 文件清单

### 新增文件

```
src/
├── shared/
│   ├── types/
│   │   └── flow.ts                          # Flow 类型定义
│   └── services/
│       └── submission/
│           └── pageDescUtils.js             # PageDesc 增强工具
├── flows/
│   ├── orchestrator/
│   │   └── FlowOrchestrator.ts              # Flow 编排器
│   ├── FlowModule.jsx                       # Flow Module 主组件
│   ├── FlowModule.module.css                # 样式
│   ├── TransitionPage.jsx                   # 过渡页组件
│   └── TransitionPage.module.css            # 样式
└── submodules/
    ├── registry.ts                          # 子模块注册表
    └── g7-experiment/                       # 示例子模块
        ├── index.jsx                        # 子模块定义
        ├── Component.jsx                    # 主组件
        ├── mapping.ts                       # 页码映射
        └── README.md                        # 说明文档
```

### 修改文件

```
src/modules/ModuleRegistry.js                # 注册 FlowModule + 支持 URL 参数
```

## 架构亮点

### 1. 最小侵入性

- 现有模块无需修改
- 通过包装器适配 CMI 接口
- 渐进式迁移路径

### 2. 统一服务层

- 使用 `useHeartbeat` 统一进度回写
- 使用 `pageDescUtils` 统一 pageDesc 增强
- 与统一提交链路（usePageSubmission）协同

### 3. 防重设计

- `flow_context` 一次性打点（localStorage 去重）
- 心跳失败队列持久化
- 并发保护

### 4. 可配置性

- FlowStep.overrides 支持计时器等配置覆盖
- TransitionPage 可配置标题/内容/自动跳转
- 子模块可自定义生命周期钩子

### 5. 容错设计

- 后端失败降级本地缓存
- 心跳失败入队重试
- 子模块加载失败 fallback

## 待完成工作

### 1. 其他子模块包装器

目前仅实现了 `g7-experiment` 示例，待实现：

- `g7-questionnaire` - 7年级问卷
- `g7-tracking-experiment` - 7年级追踪实验
- `g7-tracking-questionnaire` - 7年级追踪问卷
- `g4-experiment` - 4年级实验

**实施方法：** 参照 `src/submodules/g7-experiment/README.md`

### 2. 子模块完整集成

子模块 Component 中需要补充：

- 集成 `TimerService`（跨刷新恢复）
- 完成时调用 `flowContext.onComplete()`
- 超时时调用 `flowContext.onTimeout()`
- 使用 `enhancePageDesc` 增强提交的 pageDesc

### 3. 后端 API 对接

需要后端实现：

- `GET /api/flow/:flowId` - 获取 Flow 定义与进度
- `POST /api/flow/:flowId/progress` - 更新进度（心跳）
- 登录返回结构化 progress（或兼容复合 pageNum）

**参考：** `src/shared/services/api/endpoints.ts`（已预留 flow 端点）

### 4. E2E 测试

建议测试场景：

- Flow 加载与子模块切换
- 过渡页自动/手动跳转
- 心跳进度回写（成功/失败队列）
- 刷新后恢复进度
- Flow 完成后跳转

## 使用示例

### 后端返回 Flow URL

```json
{
  "code": 200,
  "msg": "success",
  "obj": {
    "batchCode": "250619",
    "examNo": "1001",
    "url": "/flow/g7a-mix-001",
    "pageNum": "M0:2",  // 复合页码：第 0 步，子页码 2
    "studentName": "张三",
    "schoolName": "示例学校"
  }
}
```

### Flow Definition 示例

```json
{
  "flowId": "g7a-mix-001",
  "name": "7年级混合测评",
  "url": "/flow/g7a-mix-001",
  "steps": [
    {
      "submoduleId": "g7-experiment",
      "overrides": { "timers": { "task": 2400 } },
      "transitionPage": {
        "title": "实验部分已完成",
        "content": "请继续完成问卷部分",
        "autoNextSeconds": 3
      }
    },
    {
      "submoduleId": "g7-questionnaire"
    }
  ]
}
```

### localStorage 键名约定

```
flow.<flowId>.stepIndex                    # 当前步骤索引
flow.<flowId>.modulePageNum                # 当前子模块页码
flow.<flowId>.definition                   # Flow 定义缓存
flow.<flowId>.completed                    # 完成标志
flow.<flowId>.flags.flowContextLogged.<stepIndex>  # 一次性打点标志
flow.<flowId>.heartbeatQueue               # 心跳失败队列
```

## 验证清单

- [x] 构建成功（`npm run build`）
- [x] 类型定义完整
- [x] 子模块注册表可用
- [x] FlowModule 注册到 ModuleRegistry
- [x] 心跳集成完成
- [ ] E2E 测试通过（待实施）
- [ ] 后端 API 对接（待实施）
- [ ] 其他子模块包装器（待实施）

## 下一步行动

1. **完成其他子模块包装器**（参照 `g7-experiment` 示例）
2. **后端 API 实现**（Flow 定义/进度端点）
3. **子模块完整集成**（计时/完成回调/pageDesc 增强）
4. **E2E 测试**（验证完整流程）
5. **小流量试点**（单个 Flow 验证）

## 参考文档

- [Flow 类型定义](../../../src/shared/types/flow.ts)
- [FlowOrchestrator](../../../src/flows/orchestrator/FlowOrchestrator.ts)
- [FlowModule](../../../src/flows/FlowModule.jsx)
- [子模块示例](../../../src/submodules/g7-experiment/README.md)
- [PageDesc 增强](../../../src/shared/services/submission/pageDescUtils.js)

---

**实施日期：** 2025-11-07
**状态：** 核心框架完成，待完善子模块包装器与后端对接
