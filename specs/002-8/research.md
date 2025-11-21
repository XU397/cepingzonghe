# Research: 无人机航拍交互课堂子模块

**Date**: 2025-11-19
**Status**: Complete

## Research Summary

本子模块基于详细的设计说明书（1200+行）实现，大部分技术决策已在设计阶段完成。研究重点为：确认现有平台模式、验证接口兼容性、识别前置任务。

## Research Items

### 1. SubmoduleDefinition接口规范

**Decision**: 遵循`src/shared/types/flow.ts`中的SubmoduleDefinition接口

**Rationale**:
- 现有子模块（如g7-experiment）已验证该接口可行
- 设计说明书3.1节定义的接口与平台规范一致
- 包含所有必需方法：Component, getInitialPage, getTotalSteps, getNavigationMode, getDefaultTimers

**Alternatives Considered**:
- 扩展ModuleDefinition接口 → 拒绝，SubmoduleDefinition是子模块标准
- 自定义接口 → 拒绝，违反模块标准化原则

### 2. 事件类型扩展

**Decision**: 扩展EventTypes枚举，添加3个新事件类型

**Rationale**:
- `CLICK_BLOCKED`: 用于记录校验未通过的点击尝试，便于用户行为分析
- `AUTO_SUBMIT`: 标记计时器到期的自动提交，区分主动和被动提交
- `READING_COMPLETE`: 标记强制阅读完成，可选复用TIMER_STOP

**Alternatives Considered**:
- 仅使用现有事件 → 拒绝，无法区分关键用户行为
- 使用自定义字符串 → 拒绝，违反EventTypes枚举规范

### 3. SVG动画实现方案

**Decision**: 使用纯SVG动画 + CSS filter: blur() 实现无人机模拟器，不使用真实图片

**Rationale**:
- 参考实现：[无人机交互动画.html](../../docs/SVG动画参考/无人机交互动画.html) 提供完整代码
- 直接从参考HTML转换为React组件，保持视觉效果一致
- CSS blur比Canvas重绘性能更好
- 支持60 FPS动画目标
- 无需额外依赖库
- 零网络请求（无图片加载）

**Implementation Approach**:
- DroneSimulator组件直接转换参考HTML中的SVG代码
- 保留原有的GSD查找表、高度动画、模糊滤镜逻辑
- 其他页面需要图片的部分使用占位符

**Alternatives Considered**:
- Canvas 2D绘制 → 拒绝，复杂度高，参考实现已用SVG
- WebGL → 拒绝，过度工程化
- 外部动画库（Framer Motion等）→ 拒绝，增加bundle大小
- 真实航拍图片 → 拒绝，增加资源大小，SVG更精确控制模糊效果

### 4. 状态管理方案

**Decision**: React Context + localStorage持久化

**Rationale**:
- 符合平台禁止Redux/MobX的约束
- 现有模块（grade-4, g7-experiment）已验证该模式
- localStorage命名空间`module.g8-drone-imaging.*`符合规范

**Alternatives Considered**:
- Zustand → 拒绝，非标准依赖
- useState + prop drilling → 拒绝，7页面深度传递复杂

### 5. 容器集成方式

**Decision**: 通过AssessmentPageFrame容器运行

**Rationale**:
- 设计说明书2节明确要求使用统一容器
- 容器提供导航、计时、错误托盘、下一页按钮
- 子模块仅实现主体内容区域

**Alternatives Considered**:
- 独立实现导航/计时 → 拒绝，违反容器约束

## Pre-Implementation Checklist

- [ ] 确认`src/shared/types/flow.ts`中SubmoduleDefinition接口定义
- [ ] 在eventTypes.js中添加CLICK_BLOCKED、AUTO_SUBMIT、READING_COMPLETE
- [ ] 更新openspec/specs/data-format/spec.md记录新事件
- [ ] 准备无人机图片和航拍示例图资源（压缩优化）
- [ ] 从设计说明书附录A提取SVG动画参考代码

## Dependencies Confirmed

| Dependency | Location | Purpose |
|------------|----------|---------|
| SubmoduleDefinition | src/shared/types/flow.ts | 子模块接口定义 |
| EventTypes | src/shared/services/submission/eventTypes.js | 事件类型枚举 |
| formatTimestamp | src/shared/services/dataLogger.js | 时间格式化 |
| createMarkObject | src/shared/services/submission/ | 数据对象构造 |
| AssessmentPageFrame | src/shared/components/ | 页面容器 |
| usePageSubmission | src/shared/hooks/ | 提交hook |

## Conclusion

技术方案已确认，无需额外研究。主要工作为：
1. 完成Pre-Implementation Checklist中的前置任务
2. 按设计说明书实现7个页面组件
3. 从参考HTML（docs/SVG动画参考/无人机交互动画.html）转换SVG动画到React组件
4. 实验模拟器使用纯SVG，其他页面图片使用占位符
