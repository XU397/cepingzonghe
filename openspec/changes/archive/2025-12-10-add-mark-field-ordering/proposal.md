## Why
- 现有 MarkObject 输出字段顺序不固定，审计和对接外部工具不便。
- 希望统一由共享提交层控制序列化顺序，而非分散到各子模块。

## What Changes
- 在 submission 规格中新增对 MarkObject 序列化字段顺序（`pageNumber`→`pageDesc`→`operationList`→`answerList`→`beginTime`→`endTime`→`imgList`）的要求，并要求全字段输出（空集合也输出）。
- 在 data-format 规格中同步声明上述顺序，约束所有 MarkObject 生产方。
- 明确责任归属：由提交适配层/控制层负责排序，子模块无需自行处理。

## Impact
- 受影响规格：submission、data-format
- 受影响代码：usePageSubmission/createMarkObject 及相关序列化出口，以及任何直接序列化 MarkObject 的脚本/工具
