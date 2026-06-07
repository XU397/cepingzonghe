# OpenSpec 变更交接说明：PAGE_IDLE 与初始可见内容上下文

版本状态（2026-06-06）：本文最初用于说明 v2.1 系列是否引入 PAGE_IDLE；当前 cp 香蕉变黑前端已经按 OpenSpec `support-banana-trace-page-idle-compliance` 采用 v2.2 合同实施。新联调应优先读取 `engineering_contracts/*.v2.2.json`；v2.1 引用仅保留为历史兼容补丁背景，且 `event_schema.v2.1.json` 已包含 `PAGE_IDLE` 回补。

## 1. 是否需要前端和后端再次同步修改

需要，但这是一次增量契约变更，不是推翻之前改造。

本次规范新增 / 调整了以下前后端共同契约：

- 新增 L2 标准事件 `PAGE_IDLE`，用于记录页面可见、窗口聚焦、无有效交互持续达到阈值的长停顿。
- `START_PAGE.metadata` 增加 `initial_visible_content_ids`、`main_instruction_visible`、`viewport_state`。
- 默认可见的主说明文字、题干、约束提示不再单独生成 `CONTENT_EXPOSE`；只作为页面初始上下文写入 `START_PAGE.metadata.initial_visible_content_ids`。
- `CONTENT_EXPOSE` / `CONTENT_ACTIVATE` 主要用于非默认可见内容，例如聊天旧气泡、资料卡、tooltip、折叠/滚动后才可见内容、小屏遮挡内容。
- `PAGE_IDLE` 默认不生成强 L3 行为标签，不直接进入 HMM / Viterbi；后端可进入 `pageMetadata.idleSegments`、`strategyFlags` 或未来 L4 特征。
- 前端实现 `PAGE_IDLE` 不允许高频轮询、不逐秒上报、不记录 `mousemove`；只在有效事件发生时回算上一个有效事件到当前事件之间的无操作间隔。

因此：

- 前端仓库需要同步采集与上报契约。
- 后端仓库需要同步解析、校验、存储 / 打标边界。
- 历史背景：如果其他仓库仍有 v2.1 实现，应创建 OpenSpec 变更并评估是否跟随当前 cp 香蕉实现升级到 v2.2；无论保留 v2.1 兼容补丁镜像还是升级，都必须保证前后端使用同一份契约文件和 hash。

## 2. 已调整的规范文件

请两个仓库 agent 读取以下文件作为需求来源：

- `01轨迹上报规范.md`
- `02打标规范.md`
- `03香蕉变黑每页L0-L1轨迹清单.md`
- `engineering_contracts/event_schema.v2.2.json`
- `engineering_contracts/field_registry.v2.2.json`
- `engineering_contracts/content_registry.banana.v2.2.json`
- `engineering_contracts/rule_config.v2.2.json`
- `engineering_contracts/event_schema.v2.1.json`
- `engineering_contracts/content_registry.banana.v2.1.json`

核心变化验证点：

- `01轨迹上报规范.md` 已新增 `PAGE_IDLE` 事件与轻量实现规则。
- `02打标规范.md` 已明确 `PAGE_IDLE` 默认不进入 L3 / HMM。
- `event_schema.v2.2.json` 已将 `PAGE_IDLE` 加入 `eventType.enum` 并约束空闲 metadata。
- `content_registry.banana.v2.2.json` 已覆盖当前 v2.2 会解释的默认可见主说明 / 题干 / 约束提示。

## 3. 建议 OpenSpec change id

建议两个仓库使用同一个语义一致的 change id，便于跨仓库追踪：

```text
support-page-idle-and-initial-visible-content
```

如果仓库要求 change id 带模块名，可分别使用：

```text
frontend-support-page-idle-and-initial-visible-content
backend-support-page-idle-and-initial-visible-content
```

## 4. 前端仓库责任边界

前端 OpenSpec 需求重点：

- 读取 / 使用更新后的 `event_schema` 与 `content_registry`。
- `START_PAGE.value.metadata` 增加：
  - `initial_visible_content_ids`
  - `main_instruction_visible`
  - `viewport_state`
- 新增 `PAGE_IDLE` 聚合事件：
  - 页面加载后到首次有效操作前；
  - `SUBMIT_ATTEMPT.validation_status=blocked` 后到补救操作前；
  - 普通有效操作之间达到阈值时，可条件记录。
- `PAGE_IDLE.metadata` 至少包含：
  - `idle_duration_ms`
  - `idle_phase`
  - `idle_start_event`
  - `idle_end_event` / `next_event_type`
  - `page_visible`
  - `window_focused`
  - `initial_visible_content_ids`
  - `cursor_region` 可选
- 实现约束：
  - 不高频轮询；
  - 不逐秒上报；
  - 不记录高频 `mousemove`；
  - 只在有效事件发生时回算无操作间隔；
  - 页面结束时随 `operationList` 批量上报。
- 默认可见主说明、题干、约束提示不再额外生成 `CONTENT_EXPOSE`。
- 非默认可见内容仍使用 `CONTENT_EXPOSE` / `CONTENT_ACTIVATE` / `CONTENT_VIEW`。

前端验收重点：

- Page01-13 的 `START_PAGE.metadata.initial_visible_content_ids` 能与 Content Registry 对齐。
- `PAGE_IDLE` 只在页面可见、窗口聚焦、超过阈值时生成。
- 页面隐藏 / 窗口失焦期间不生成有效 `PAGE_IDLE`，或标记为离开 / 分心候选。
- `PAGE_IDLE` 不包含能力判断、策略结论或 L3 标签。
- 旧有文本、实验、选择、图表、方案表事件不被破坏。

## 5. 后端仓库责任边界

后端 OpenSpec 需求重点：

- 更新事件解析 / 校验，允许 `eventType=PAGE_IDLE`。
- 校验 `PAGE_IDLE.metadata` 最低字段：
  - `idle_duration_ms`
  - `idle_phase`
  - `page_visible`
  - `window_focused`
- 解析并保留 `START_PAGE.metadata.initial_visible_content_ids`。
- 默认可见主说明内容不因缺少 `CONTENT_EXPOSE` 而触发数据质量告警。
- `PAGE_IDLE` 默认进入页面状态，例如：
  - `pageMetadata.idleSegments`
  - `strategyFlags`
  - 后续 L4 候选特征
- `PAGE_IDLE` 默认不生成强 L3 标签，不进入 `sequence_json` / HMM / Viterbi。
- 后端仍可根据 `TEXT_FOCUS`、`TEXT_CHANGE`、`TEXT_BLUR` 计算输入框内部细粒度停顿。
- 对超长停顿进行降权或标记，例如 `long_absence_candidate`，避免误判为深度思考。

后端验收重点：

- 能通过包含 `PAGE_IDLE` 的事件样例。
- `PAGE_IDLE` 不出现在 L3 `labels` / `sequence_json` 中。
- 生命周期、页面状态、L3 标签边界仍然清晰。
- 现有 Page02、Page05、Page08、Page09、Page12、Page13 验收样例不回归。
- 新增至少一个包含 `PAGE_IDLE` 的验收样例：
  - `START_PAGE -> PAGE_IDLE -> TEXT_FOCUS`
  - `SUBMIT_ATTEMPT(blocked) -> PAGE_IDLE -> TEXT_FOCUS`

## 6. 跨仓库协作顺序建议

推荐顺序：

1. 前后端 agent 可并行创建 OpenSpec proposal。
2. 两边 proposal 都必须显式引用同一组契约文件和 change id。
3. 在进入 apply 前，先确认：
   - 当前 cp 香蕉实现已升级到 v2.2；其他仓库若仍停留 v2.1，需要先确认兼容策略；
   - `PAGE_IDLE` metadata 字段名是否一致；
   - `initial_visible_content_ids` 的 content id 是否由同一份 Content Registry 生成；
   - 后端是否接受前端“不再对默认可见主说明生成 CONTENT_EXPOSE”的行为。
4. 建议前端先完成上报样例或契约测试样例，后端再用同样样例更新解析 / 打标验收。

## 7. 可直接发给前端仓库 agent 的 prompt

```text
请基于当前仓库创建一个 OpenSpec 需求变更，change id 建议使用：

support-page-idle-and-initial-visible-content

背景：
我们更新了轨迹上报规范，新增页面长停顿 PAGE_IDLE 与 START_PAGE 初始可见内容上下文。请先只做 OpenSpec propose，不要进入代码实现。

请阅读以下规范文件：
- 01轨迹上报规范.md
- 03香蕉变黑每页L0-L1轨迹清单.md
- engineering_contracts/event_schema.v2.2.json
- engineering_contracts/content_registry.banana.v2.2.json

前端需要在 proposal/design/tasks 中覆盖：
1. START_PAGE.value.metadata 新增 initial_visible_content_ids、main_instruction_visible、viewport_state。
2. 新增 PAGE_IDLE 聚合事件：页面加载后到首次有效操作前、blocked 提交后到补救操作前、普通有效操作之间达到阈值时条件记录。
3. PAGE_IDLE 必须轻量实现：不高频轮询、不逐秒上报、不记录 mousemove；只在有效事件发生时回算无操作间隔；随 operationList 批量上报。
4. PAGE_IDLE.metadata 至少包含 idle_duration_ms、idle_phase、idle_start_event、idle_end_event/next_event_type、page_visible、window_focused、initial_visible_content_ids，cursor_region 可选。
5. 默认可见主说明文字、题干、约束提示不再单独生成 CONTENT_EXPOSE；只写入 START_PAGE.metadata.initial_visible_content_ids。
6. CONTENT_EXPOSE / CONTENT_ACTIVATE 仍用于非默认可见内容：聊天旧气泡、资料卡、tooltip、折叠/滚动后才可见内容、小屏遮挡内容。
7. 不上报 L3 标签、能力判断、策略结论或 L4 聚合特征。
8. 使用 schema / registry v2.2；如果目标仓库必须兼容 v2.1 历史样本，请在 proposal 中说明兼容策略。

请在 OpenSpec 中明确前端验收标准，并说明哪些工作可以和后端并行，哪些需要等后端确认契约字段后再 apply。如果发现当前代码或规范有冲突，请记录为 open questions，不要静默改变需求范围。
```

## 8. 可直接发给后端仓库 agent 的 prompt

```text
请基于当前仓库创建一个 OpenSpec 需求变更，change id 建议使用：

support-page-idle-and-initial-visible-content

背景：
我们更新了轨迹上报规范，新增页面长停顿 PAGE_IDLE 与 START_PAGE 初始可见内容上下文。请先只做 OpenSpec propose，不要进入代码实现。

请阅读以下规范文件：
- 01轨迹上报规范.md
- 02打标规范.md
- 03香蕉变黑每页L0-L1轨迹清单.md
- engineering_contracts/event_schema.v2.2.json
- engineering_contracts/content_registry.banana.v2.2.json

后端需要在 proposal/design/tasks 中覆盖：
1. 事件解析 / schema 校验允许 eventType=PAGE_IDLE。
2. PAGE_IDLE.metadata 至少校验 idle_duration_ms、idle_phase、page_visible、window_focused。
3. 解析并保留 START_PAGE.metadata.initial_visible_content_ids、main_instruction_visible、viewport_state。
4. 默认可见主说明文字不再要求 CONTENT_EXPOSE；不能因为缺少默认说明文字曝光事件而产生数据质量告警。
5. PAGE_IDLE 默认进入 pageMetadata.idleSegments、strategyFlags 或未来 L4 候选特征。
6. PAGE_IDLE 默认不生成强 L3 标签，不进入 labels、sequence_json、HMM / Viterbi。
7. 后端仍根据 TEXT_FOCUS、TEXT_CHANGE、TEXT_BLUR 计算输入框内部细粒度停顿。
8. 超长停顿应降权或标记 long_absence_candidate，避免误判为深度思考。
9. 使用 schema / registry v2.2；如果目标仓库必须兼容 v2.1 历史样本，请在 proposal 中说明兼容策略。

请在 OpenSpec 中明确后端验收标准，至少包含一个 PAGE_IDLE 样例：
- START_PAGE -> PAGE_IDLE -> TEXT_FOCUS
- SUBMIT_ATTEMPT(blocked) -> PAGE_IDLE -> TEXT_FOCUS

请说明哪些工作可以和前端并行，哪些需要等前端确认上报样例后再 apply。如果发现当前代码或规范有冲突，请记录为 open questions，不要静默改变需求范围。
```

## 9. 给两个 agent 的统一提醒

```text
这次变更的核心不是要前端判断学生是否阅读或理解，而是新增一个低成本、弱证据的页面长停顿上下文 PAGE_IDLE。PAGE_IDLE 只表示“页面可见且窗口聚焦下的长时间无有效操作”，可作为阅读 / 思考 / 犹豫 / 补救前停顿候选证据。默认可见说明文字只进入 START_PAGE.metadata.initial_visible_content_ids，不再重复生成 CONTENT_EXPOSE。任何能力判断、策略判断、L3 标签和 HMM 观测结论都必须由后端或后续模型层处理，前端不能直接上报。
```
