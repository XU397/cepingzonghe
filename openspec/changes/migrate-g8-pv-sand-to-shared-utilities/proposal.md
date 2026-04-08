# Proposal: 迁移 g8-pv-sand-experiment 至共享操作管理 Utility

## Summary

将 g8-pv-sand-experiment 子模块从自实现的答案收集和操作序号管理迁移到共享 Utility（`collectAnswers`、`createOperationSequence`、`injectFlowContext`、`createPageStateResetter`），以符合 `docs/子模块数据规范1205.md` 和 `openspec/specs/submission/spec.md` 的要求。

## Motivation

### 当前问题

1. **自实现 collectAnswers 逻辑**（Component.tsx:255-354）
   - 100 行代码手动处理答案键映射、选项格式化、实验历史追加
   - 不符合规范第 8.1 节"使用 collectAnswers 工具函数"
   - 与 g8-drone-imaging、g8-mikania-experiment 实现不一致

2. **手动注入 flow_context 和重设 code**（Component.tsx:384-418）
   - 在 buildMark 中手动检查并注入 flow_context
   - 使用 forEach 重新设置 operationList 的 code
   - 不符合规范第 10.5 节"使用共享 Utility 管理序号和注入"

3. **缺少 SUBMODULE_MAPPING_CONFIG 导出**（mapping.ts）
   - 所有映射配置零散定义，未聚合为规范化对象
   - 无法使用 `collectAnswers(pageId, answers, config)` 统一接口

4. **页面切换时未完整重置状态**
   - 仅重置操作列表，未重置 flowContextInjected 标记
   - 不符合规范第 10.5 节 createPageStateResetter 要求

5. **Mapping 测试未验证规范兼容性**
   - mapping.test.ts 使用旧的 pageId 格式（`page01b-task-cover`）
   - 与 mapping.ts 实际定义不一致（`instructions_cover`）
   - 缺少 validateMappingConfig 测试

### 预期收益

- 减少 ~100 行重复代码（collectAnswers 逻辑）
- 与其他子模块（g8-drone-imaging、g8-mikania-experiment）实现一致
- 降低维护成本，减少潜在 bug
- 符合规范要求，达到规范文档标注的参考实现级别

## Scope

### In Scope

- 导出 `SUBMODULE_MAPPING_CONFIG` 聚合对象（完整 PageConfig 字段）
- 重构 Component.tsx 使用 `collectAnswers` 共享函数
- 使用 `createOperationSequence` 管理操作序号
- 使用 `injectFlowContext` 注入 flow_context（**仅在 logger 时注入，移除 buildMark 备选路径**）
- 使用 `createPageStateResetter` 同时重置序号与 flowContextInjected 标记
- 同步 mapping.test.ts 使用正确的 pageId 格式
- 添加 validateMappingConfig 测试
- 更新快照测试

### Out of Scope

- 页面组件的业务逻辑
- Context 状态管理架构（保持 Provider 模式）
- 时间管理逻辑（已符合规范）

## Design Overview

采用**灵活组合模式**（模式 B），引入共享 Utility 替换自实现逻辑：

```
当前架构                          目标架构
┌─────────────────────┐          ┌─────────────────────┐
│  Component.tsx      │          │  Context.tsx        │
│  ├─ collectAnswers  │    →     │  ├─ sequenceRef     │
│  │   (100行自实现)   │          │  ├─ logOperation    │
│  ├─ buildMark注入   │          │  │   (自动注入flow) │
│  └─ 手动重设code    │          │  └─ pageResetter    │
└─────────────────────┘          └─────────────────────┘
                                           ↓
                                 ┌─────────────────────┐
                                 │  共享 Utility        │
                                 │  ├─ collectAnswers  │
                                 │  ├─ injectFlowCtx   │
                                 │  ├─ createOpSeq     │
                                 │  └─ pageResetter    │
                                 └─────────────────────┘
```

### 关键设计决策

1. **flow_context 注入路径**：仅在 logOperation 记录 page_enter 时自动注入，**移除 buildMark 中的备选注入逻辑**，避免双路径风险。

2. **页面切换重置**：使用 `createPageStateResetter(sequence, setFlowContextInjected)` 同时重置序号和注入标记。

3. **PAGE_CONFIGS 完整字段**：按规范 §3.1 导出完整 PageConfig（含 type、navigationMode、stepIndex、pageDesc）。

4. **选项格式化**：使用 QUESTION_OPTIONS_MAP 配合 formatAnswer 函数处理选项格式化。

## Impact Analysis

| 影响范围 | 文件 | 变更类型 |
|---------|------|---------|
| Mapping 配置 | `src/submodules/g8-pv-sand-experiment/mapping.ts` | 修改 |
| 主组件 | `src/submodules/g8-pv-sand-experiment/Component.tsx` | 修改 |
| Context | `src/submodules/g8-pv-sand-experiment/context/PvSandContext.tsx` | 修改 |
| Mapping 测试 | `src/submodules/g8-pv-sand-experiment/__tests__/mapping.test.ts` | 修改 |
| 快照测试 | `src/submodules/g8-pv-sand-experiment/__tests__/submission.snapshot.test.ts` | 更新 |

## Risks and Mitigations

| 风险 | 可能性 | 影响 | 缓解措施 |
|-----|-------|------|---------|
| 快照测试差异 | 高 | 低 | 更新快照，验证格式正确 |
| 选项格式化不一致 | 中 | 中 | 使用 QUESTION_OPTIONS_MAP 配合 formatAnswer |
| 实验历史追加逻辑 | 低 | 中 | 复用 appendExperimentHistory |

## Success Criteria

1. 所有现有测试通过（mapping.test.ts、submission.snapshot.test.ts）
2. 新增 validateMappingConfig 测试通过
3. 提交数据格式符合规范（pageNumber、targetElement、code 连续）
4. flow_context 仅注入一次且位于 page_enter 之后
5. collectAnswers 调用共享函数而非自实现
6. 页面切换时同时重置序号和 flowContextInjected 标记

## Related

- `openspec/specs/submission/spec.md` - 操作管理 Utility 规范
- `docs/子模块数据规范1205.md` - 子模块数据收集与提交规范
- `openspec/changes/migrate-g8-mikania-to-shared-utilities/` - 类似迁移参考
