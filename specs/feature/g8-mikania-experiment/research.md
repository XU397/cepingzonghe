# Research: 薇甘菊防治实验子模块

**Date**: 2025-11-19
**Status**: Complete (no unknowns)

## Overview

本模块的技术决策均已在详细设计说明书中明确定义，无需额外研究。以下记录关键技术决策及其依据。

## Technical Decisions

### 1. CMI接口实现模式

**Decision**: 实现SubmoduleDefinition接口，导出标准化的子模块定义对象

**Rationale**:
- 符合openspec/specs/flow/spec.md中定义的CMI规范
- 与现有Flow框架无缝集成
- 支持动态加载和页面恢复

**Alternatives considered**:
- 直接导出React组件 → 拒绝，缺少元数据和生命周期钩子
- 使用class-based模块定义 → 拒绝，项目统一使用函数式组件

### 2. SVG动画实现方案

**Decision**: 使用CSS动画+SVG结构实现滴管和种子发芽动画

**Rationale**:
- 参考文档`docs/SVG动画参考/薇甘菊实验.html`已提供完整实现
- CSS动画性能好，可达60FPS目标
- SVG矢量图形缩放无损

**Alternatives considered**:
- Canvas 2D动画 → 拒绝，不便于DOM操作和状态管理
- Lottie动画 → 拒绝，增加依赖，现有方案已满足需求
- React动画库(framer-motion) → 拒绝，项目未使用该依赖

### 3. 状态管理方案

**Decision**: 使用React Context + useReducer管理模块内状态

**Rationale**:
- 符合项目技术栈约束（禁用Redux/MobX）
- 状态仅在模块内使用，无需全局状态管理
- Reducer模式便于处理复杂状态更新

**Alternatives considered**:
- useState多个独立状态 → 拒绝，状态关联性强，难以维护
- Zustand/Jotai → 拒绝，项目禁止引入新状态管理库

### 4. 数据提交机制

**Decision**: 使用项目统一的usePageSubmission Hook

**Rationale**:
- Hook自动注入flow_context事件
- 内置重试机制（指数退避，最多3次）
- 统一的错误处理和401检测

**Alternatives considered**:
- 直接调用apiService → 拒绝，缺少自动埋点和重试逻辑
- 自定义提交Hook → 拒绝，重复造轮子，不符合规范

### 5. 页码编码方案

**Decision**: 使用encodeCompositePageNum生成复合页码，格式M{stepIndex}:{subPageNum}

**Rationale**:
- 符合openspec/specs/data-format/spec.md规范
- 支持Flow多步骤场景下的唯一页面标识
- 便于后端解析和数据分析

**Alternatives considered**:
- 简单数字页码 → 拒绝，无法区分不同Flow步骤
- 自定义格式 → 拒绝，不符合统一规范

### 6. 本地存储命名空间

**Decision**: 使用`module.g8-mikania-experiment.*`前缀

**Rationale**:
- 符合运行环境约束（第2节）
- 避免与其他模块冲突
- 便于清理和调试

**Alternatives considered**:
- 无前缀 → 拒绝，可能与其他模块冲突
- sessionStorage → 拒绝，刷新后需要保持状态

## Data Model Validation

### 发芽率数据表

详细设计说明书附录A已提供完整数据表，经验证：
- 数据范围：7天 × 3浓度 = 21个数据点
- 数值范围：0-78%
- 趋势：浓度越高发芽率越低，天数增加发芽率增加

### 事件结构

详细设计说明书6.2节已定义完整的operationList事件类型，包括：
- 页面事件：page_enter, page_exit
- 答题事件：change, click_blocked
- 实验事件：exp_start, exp_reset, exp_param_change

## Integration Points

### flowContext API

已明确定义（第7.1节）：
- flowId, stepIndex, submoduleId, modulePageNum
- onComplete(), onTimeout(), updateModuleProgress()

### 统一组件

运行在AssessmentPageFrame中，不需自行实现：
- 全局导航（LeftStepperNav）
- 计时器显示
- 错误托盘
- 下一页按钮

## Conclusion

无需额外研究。所有技术决策已在详细设计说明书中明确，可直接进入Phase 1设计阶段。
