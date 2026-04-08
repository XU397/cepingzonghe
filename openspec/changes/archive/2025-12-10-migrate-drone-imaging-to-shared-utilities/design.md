# 设计：迁移 g8-drone-imaging 到共享操作管理 Utility

## 目标
- 统一使用共享 Utility 管理 code、flow_context 注入与翻页重置。
- 在操作发生时记录时间戳，避免提交阶段兜底。
- 保持现有业务逻辑与接口契约（AppContext、Frame）不变。

## 接入模式选择
- **优先方案**：useOperationLogger 全托管，减少自管逻辑。
- **备选（渐进）**：保留自定义 logOperation，但用 createOperationSequence + injectFlowContext + createPageStateResetter 组合，提交前重排 code。

## 关键决策

### 时间戳策略
- logOperation 内统一兜底：`time ?? formatTimestamp(new Date())`。
- 禁止依赖提交阶段回填时间。

### flow_context 策略
- 注入位置：紧跟首个 page_enter；无 page_enter 时按规范 fallback（或抛 MissingPageEnterError，视实现路径）。
- value：`JSON.stringify`，包含 flowId、submoduleId、stepIndex，moduleName 为字符串（`typeof moduleName === 'string' ? moduleName : 'g8-drone-imaging'`），pageId 可选。
- 重复注入：若已存在 flow_context，跳过。

### 序号与重置
- 使用 createOperationSequence 管理 code，翻页时通过 createPageStateResetter 重置序列与注入标记。
- 提交前重排 operationList 的 code（1…n）确保连续。

### page_exit 记录时机
- 仅在真实离开（提交/导航）时记录 exit，移除 useEffect cleanup 提前写 exit 的路径。

## 实施要点
- 替换自管 logOperation 为 useOperationLogger，或在现有 logOperation 中注入共享序列与注入逻辑。
- 切页时调用 resetter；clearOperations 也调用 resetter。
- moduleName 统一转字符串，避免数值落入日志。
- 如 FlowModule 仍会注入 flow_context，需在本模块忽略非规范事件或关闭上游注入，确保单一来源。

## 测试策略
- 单测：flow_context 位置、value JSON 字符串、moduleName 兜底、时间戳兜底、翻页重置、code 连续。
- 快照：更新 submission/格式快照，确认顺序与时间。
- 集成：跑 submission 测试与 schema/validateMark 校验。

## 验收清单（对应验收标准）
- [ ] flow_context 紧跟 page_enter，value 为 JSON 字符串且含 moduleName 字符串。
- [ ] code 连续、翻页重置生效。
- [ ] 所有 operation time 在发生时记录。
- [ ] 测试/快照通过，无功能回归。
