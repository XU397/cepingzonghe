## ADDED Requirements

### Requirement: MarkObject 输出字段顺序
提交适配层（usePageSubmission / createMarkObject / PageFrame 提交管道）SHALL 在序列化 MarkObject 时按固定顺序输出字段，以便审计与外部工具读取。

#### Scenario: 固定字段排序
- GIVEN 需要输出或提交 MarkObject
- WHEN 进行序列化或构建提交 payload
- THEN 字段顺序 SHALL 按以下顺序输出：`pageNumber`，`pageDesc`，`operationList`，`answerList`，`beginTime`，`endTime`，`imgList`

#### Scenario: 字段全量输出
- GIVEN 需要输出 MarkObject
- THEN 所有字段 SHALL 始终存在（`imgList` 等空集合也需输出为空数组），并按上述顺序排列

#### Scenario: 统一责任归属
- GIVEN 需要满足字段排序规范
- WHEN 使用统一提交管道（usePageSubmission/PageFrame/createMarkObject）
- THEN 排序责任 SHALL 由共享提交/控制层统一处理
- AND 子模块/页面实现 SHALL NOT 手工重新排序字段

#### Scenario: 适用范围
- GIVEN 任何 MarkObject 序列化场景
- THEN 排序与全量输出规范 SHALL 适用于提交 payload、日志输出、快照/调试导出等所有落盘或传输的 MarkObject 表达
