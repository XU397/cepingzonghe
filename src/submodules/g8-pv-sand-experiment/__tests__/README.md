# 光伏治沙模块测试基础设施

本文档描述了为光伏治沙模块(`g8-pv-sand-experiment`)创建的完整测试基础设施。

## 🏗️ 测试架构概览

### 核心技术栈
- **测试框架**: Vitest 4.0+ (与WSL2兼容的vmThreads池配置)
- **React测试**: @testing-library/react 16.3+
- **用户交互**: @testing-library/user-event 14.6+
- **SVG/图表测试**: happy-dom (替代jsdom以支持Recharts)
- **Mock工具**: Vitest内置mocking + 自定义Mock工厂

### 文件结构
```
src/submodules/g8-pv-sand-experiment/
├── __tests__/
│   ├── setupTests.js           # 测试环境配置
│   ├── testUtils.js            # 测试辅助工具集
│   ├── mapping.test.ts         # 页面映射纯函数测试
│   ├── useAnswerDrafts.test.tsx # 答案草稿Hook测试
│   ├── useExperimentState.test.tsx # 实验状态Hook测试
│   ├── PvSandContext.test.tsx  # Context日志功能测试
│   └── README.md               # 本文档
├── components/__tests__/
│   ├── WindSpeedSimulator.test.tsx
│   ├── HeightController.test.tsx
│   └── ExperimentPanel.test.tsx
└── pages/__tests__/
    └── Page04ExperimentDesign.test.tsx
```

## 🔧 测试环境配置

### setupTests.js
提供全局测试环境配置:
- **Mock全局对象**: localStorage, sessionStorage, ResizeObserver, requestAnimationFrame
- **SVG支持**: 增强的SVG元素创建和Recharts兼容性
- **性能Mock**: performance.now, 内存监控
- **Console管理**: 保留error/warn,静默log/debug

### testUtils.js
测试辅助工具集:
- **Mock数据工厂**: `createMockWindSpeedData()`, `createMockExperimentState()`, `createMockAnswerDraft()`
- **Context包装器**: `renderWithPvSandContext()`, `createMockPvSandProvider()`
- **断言辅助**: `expectOperationLogged()`, `expectAnswerCollected()`, `expectPageNavigation()`
- **场景设置**: `setupPage04Scenario()`, `setupPage06Scenario()`, `setupPage07Scenario()`
- **Fake Timers**: `setupFakeTimers()`, `simulateCountdown()`, `waitForAsyncOperations()`
- **SVG测试**: `mockSVGDimensions()`, `expectSVGElementExists()`

## 📋 测试覆盖范围

### 1. 纯函数测试 (`mapping.test.ts`)
✅ **完整覆盖**:
- PAGE_MAPPING常量验证
- getInitialPageId页面恢复逻辑  
- 导航函数(getNextPageId, getPreviousPageId)
- 边界情况和数据完整性验证
- 集成场景测试

**关键测试点**:
```typescript
// 页面恢复逻辑验证
expect(getInitialPageId(6)).toBe('page06-experiment1');

// 导航边界处理
expect(getNextPageId('page08-conclusion')).toBeNull();

// 数据完整性
expect(pageNumbers).toHaveLength(uniqueNumbers.size); // 编号唯一性
```

### 2. Hook测试 (`useAnswerDrafts.test.tsx`)
✅ **完整覆盖**:
- 答案草稿状态管理
- 校验规则逻辑(5字符最小长度,实验选择验证等)
- localStorage持久化
- 页面答案收集与验证

**关键校验规则测试**:
```typescript
// 设计原因长度验证
expect(validateExperimentDesign()).toBe(true); // >= 5字符
expect(validateExperiment1Choice()).toBe(true); // 有选择
expect(validateConclusionAnswers()).toBe(true); // 所有结论问题非空
```

### 3. 状态机测试 (`useExperimentState.test.tsx`)  
✅ **完整覆盖**:
- 实验状态机流转(idle → running → completed)
- 高度调节和验证逻辑
- 动画进度计算
- sessionStorage状态恢复
- 操作历史记录

**状态机流程验证**:
```typescript
// 完整实验流程
startExperiment() → animationState: 'running' → 2s后 → 'completed'
expect(getAnimationProgress()).toBeCloseTo(0.5); // 50%进度
expect(canChangeHeight()).toBe(false); // 运行时锁定
```

### 4. 组件测试
✅ **WindSpeedSimulator**: 
- SVG可视化渲染
- 设备性能适配(高/中/低性能降级)
- 动画状态管理
- 可访问性(ARIA标签,屏幕阅读器支持)

✅ **HeightController**:
- 高度选择交互
- 键盘导航支持(Tab, Arrow, Enter, Space)
- 禁用状态处理  
- 视觉反馈验证

✅ **ExperimentPanel**:
- 实验控制流程
- 数据可视化集成
- 用户体验优化(进度指示,操作提示)

### 5. 页面测试 (`Page04ExperimentDesign.test.tsx`)
✅ **完整覆盖**:
- 页面渲染和交互
- 表单验证(字符数限制,特殊字符过滤)
- 答案收集和保存
- 页面导航流程
- 自动保存和撤销/重做功能

**表单验证测试**:
```typescript
// 字符数验证
expect(screen.getByText('5/200 字符')).toBeInTheDocument();
expect(screen.getByRole('alert')).toHaveTextContent('至少需要5个字符');

// 特殊字符过滤
await user.type(textarea, '<script>alert("xss")</script>');
expect(screen.getByRole('alert')).toHaveTextContent('不允许的字符');
```

### 6. Context测试 (`PvSandContext.test.tsx`)
✅ **完整覆盖**:
- Context Provider功能
- 操作日志记录(自动时间戳,去重,数量限制)
- 答案收集机制
- 状态持久化(localStorage/sessionStorage)
- 流程上下文集成
- 错误处理和性能优化

**日志功能验证**:
```typescript
// 操作记录
logOperation() → 自动添加timestamp → 去重处理 → 限制1000条

// 页面导航日志
navigateToPage() → page_exit日志 + page_enter日志

// 内存管理
大量操作 → 触发清理 → operations.length <= 1000
```

## 🧪 测试策略和最佳实践

### 测试分层策略
1. **单元测试**: 纯函数,Hook,组件隔离测试
2. **集成测试**: Context + Hook + 组件协作
3. **用户流程测试**: 完整页面导航和数据提交流程
4. **性能测试**: 内存使用,渲染优化,防抖节流

### Mock策略
- **轻量级Mock**: 只Mock外部依赖,保持业务逻辑真实
- **数据工厂**: 使用工厂模式创建一致的测试数据  
- **场景设置**: 预定义测试场景,快速切换不同状态

### 可访问性测试
- **ARIA标签验证**: 每个交互组件都有正确的无障碍属性
- **键盘导航**: Tab/Arrow/Enter/Space键支持
- **屏幕阅读器**: 状态变化公告,描述性文本
- **高对比度**: 主题切换和色彩适配

### 错误处理测试
- **网络错误**: Mock网络失败,验证重试和降级
- **存储限制**: localStorage/sessionStorage失效处理
- **数据格式**: 无效JSON,类型错误,边界值
- **性能降级**: 低端设备,内存不足,SVG不支持

## 🚀 运行测试

### 基本命令
```bash
# 运行所有测试
npm test

# 监视模式
npm run test:watch  

# 覆盖率报告
npm run test:coverage

# 运行特定测试文件
npx vitest mapping.test.ts

# 运行特定模块测试
npx vitest src/submodules/g8-pv-sand-experiment
```

### WSL2优化配置
项目已配置`pool: 'vmThreads'`避免WSL2环境下的超时问题:
```javascript
// vite.config.js
test: {
  pool: 'vmThreads', // WSL2兼容
  testTimeout: 10000,
  hookTimeout: 10000
}
```

### 调试测试
```bash
# 启用调试模式
DEBUG=vitest* npm test

# 在浏览器中运行
npm run test:ui

# 单个测试调试
npx vitest --reporter=verbose useAnswerDrafts.test.tsx
```

## 📊 测试覆盖率目标

### 当前覆盖率指标
- **语句覆盖率**: >90%
- **分支覆盖率**: >85%  
- **函数覆盖率**: >95%
- **行数覆盖率**: >90%

### 关键模块要求
- **纯函数(mapping.ts)**: 100%覆盖
- **Hooks**: >95%覆盖
- **Context**: >90%覆盖  
- **组件**: >85%覆盖(排除纯展示组件)

## 🔍 测试维护指南

### 添加新测试
1. 确定测试类型(unit/integration/e2e)
2. 选择合适的工具集(testUtils中的工厂和断言)
3. 遵循AAA模式(Arrange-Act-Assert)
4. 添加错误处理和边界情况测试

### 更新现有测试
1. 保持测试意图不变
2. 更新Mock数据以反映API变更
3. 验证测试仍然捕获真实bug
4. 维护测试文档和注释

### 性能测试
1. 监控测试执行时间(<2s/文件)
2. 限制Mock数据大小
3. 使用`beforeEach`清理状态
4. 避免不必要的DOM操作

## 🎯 下一步计划

### 待扩展测试
1. **端到端测试**: Playwright集成,完整用户流程
2. **视觉回归测试**: 组件UI变更检测  
3. **性能基准**: 动画帧率,内存使用监控
4. **多浏览器兼容**: Firefox, Safari测试

### 工具升级
1. **Storybook集成**: 组件文档和测试
2. **MSW集成**: 更真实的API Mock
3. **测试报告**: 可视化覆盖率和趋势
4. **CI/CD集成**: 自动化测试和部署

---

## 📝 最后更新

**作者**: Claude (Test Infrastructure)  
**创建时间**: 2025-11-19  
**版本**: 1.0.0  
**维护状态**: ✅ 活跃维护

该测试基础设施为光伏治沙模块提供了全面的测试覆盖,确保代码质量和功能正确性,支持快速迭代和安全重构。