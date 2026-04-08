# Proposal: 迁移 g8-mikania-experiment 至共享操作管理 Utility

## Summary

将 g8-mikania-experiment 子模块从自实现的操作序号管理和 flow_context 注入迁移到共享 Utility（`createOperationSequence`、`injectFlowContext`、`shouldInjectFlowContext`），以符合 `docs/子模块数据规范1205.md` 第 10 节和 `openspec/specs/submission/spec.md` 的要求。

## Motivation

### 当前问题

1. **自实现操作序号管理**（Component.jsx:221-259）
   - 在 Reducer 中手动管理 `operationSequence` 和 `flowContextInjected`
   - 不符合规范第 10.5 节"禁止自实现递增或手动插入 flow_context"

2. **targetElement 保留元素加前缀**（Page00_Notice.jsx:30-31）
   - `页面` 是保留元素，当前实现错误地添加了前缀
   - 不符合规范第 4.1.3 节保留元素规则

3. **备用注入逻辑重映射 code**（Component.jsx:427-444）
   - buildMark 中的备用注入逻辑会重新映射所有 code
   - 可能导致数据不一致

4. **缺少 validateMappingConfig 测试**
   - mapping.test.js 未调用 validateMappingConfig

### 预期收益

- 与其他子模块（g8-drone-imaging、g8-pv-sand-experiment）实现一致
- 降低维护成本，减少潜在 bug
- 符合规范要求，通过合规检查

## Scope

### In Scope

- 扩展共享层 `RESERVED_ELEMENTS` 支持中文（前置依赖）
- 重构 Component.jsx 的操作管理逻辑，使用共享 Utility
- 修复页面组件中保留元素的前缀问题
- 移除 buildMark 中的备用注入逻辑
- 添加 validateMappingConfig 测试
- 更新快照测试

### Out of Scope

- mapping.ts 配置结构（已符合规范）
- 时间管理逻辑（已符合规范，使用 Reducer 同步更新）
- 页面组件的业务逻辑

## Design Overview

采用**灵活组合模式**（模式 B），保持现有 Reducer 架构，引入共享 Utility：

```
当前架构                          目标架构
┌─────────────────────┐          ┌─────────────────────┐
│  mikaniaReducer     │          │  mikaniaReducer     │
│  ├─ operationSeq    │    →     │  ├─ sequence (ref)  │
│  ├─ flowCtxInjected │          │  └─ flowCtxInjected │
│  └─ 手动注入逻辑     │          └─────────────────────┘
└─────────────────────┘                    ↓
                                 ┌─────────────────────┐
                                 │  共享 Utility        │
                                 │  ├─ createOpSeq     │
                                 │  ├─ injectFlowCtx   │
                                 │  └─ shouldInject    │
                                 └─────────────────────┘
```

## Impact Analysis

| 影响范围 | 文件 | 变更类型 |
|---------|------|---------|
| 主组件 | `src/submodules/g8-mikania-experiment/Component.jsx` | 修改 |
| 页面组件 | `src/submodules/g8-mikania-experiment/pages/*.jsx` | 修改 |
| 测试 | `src/submodules/g8-mikania-experiment/__tests__/*.test.*` | 修改 |

## Risks and Mitigations

| 风险 | 可能性 | 影响 | 缓解措施 |
|-----|-------|------|---------|
| 快照测试失败 | 高 | 低 | 更新快照，验证格式正确 |
| 操作序号不连续 | 中 | 中 | 单元测试验证 code 连续性 |
| flow_context 重复注入 | 低 | 中 | 使用 shouldInjectFlowContext 检查 |

## Success Criteria

1. 所有现有测试通过（mapping.test.js、submission.snapshot.test.ts）
2. 新增 validateMappingConfig 测试通过
3. 提交数据格式符合规范（pageNumber、targetElement、code 连续）
4. flow_context 仅注入一次且位于 page_enter 之后

## Timeline

本变更为技术债务清理，不涉及新功能，建议尽快完成以保持与其他子模块一致。

## Related

- `openspec/specs/submission/spec.md` - 操作管理 Utility 规范
- `docs/子模块数据规范1205.md` - 子模块数据收集与提交规范
- `openspec/changes/archive/2025-12-10-extract-operation-management-utilities/` - 共享 Utility 实现变更
- `openspec/changes/migrate-drone-imaging-to-shared-utilities/` - 类似迁移参考
