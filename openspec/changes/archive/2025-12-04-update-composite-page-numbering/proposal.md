## Why

现有复合页码使用 `<stepIndex>.<subPageNum>` 格式（如 `0.3`、`1.10`），存在以下问题：

1. **后端解析歧义**：后端对 pageNumber 做 `*100` 转换时，`0.1` 和 `0.10` 都变成 `10`，无法区分第 1 页和第 10 页
2. **零前缀不直观**：`stepIndex` 从 0 开始，导致第一个子模块的页码为 `0.*`，不符合自然计数习惯
3. **格式不统一**：历史遗留 `M*:*` 格式仍存在于部分代码和数据中

## What Changes

### 新格式定义

**旧格式**：`<stepIndex>.<subPageNum>` → 示例 `0.3`、`1.10`

**新格式**：`<submoduleIndex>.<pageIndexTwoDigits>` → 示例 `1.03`、`2.10`

其中：
- `submoduleIndex = stepIndex + 1`（子模块顺序从 1 开始）
- `pageIndex` 为子模块内页面顺序（从 1 开始，两位零填充）
- 校验正则：`^[1-9]\d*\.\d{2}$`

### 变更内容

1. **核心编码函数**：更新 `encodeCompositePageNum(submoduleIndex, pageIndex)` 使用新格式
2. **提交层适配**：`usePageSubmission` 调用时使用 `stepIndex + 1` 作为 `submoduleIndex`
3. **格式校验**：添加正则校验，拒绝 `0.*`、`M*`、冒号分隔等旧格式
4. **规范文档**：输出子模块迁移规范文档，指导后续子模块适配

### 禁止的旧格式

- `0.*`（零前缀，如 `0.1`、`0.10`）
- `M*:*`（M 前缀冒号分隔，如 `M2:11`）
- 无零填充格式（如 `1.1` 应为 `1.01`）

## Impact

### Affected Specs
- `data-format`：MarkObject.pageNumber 格式定义
- `submission`：usePageSubmission 编码逻辑、校验规则
- `flow`：FlowOrchestrator 复合页码生成

### Affected Code

| 文件 | 变更类型 |
|------|----------|
| `src/shared/utils/pageMapping.ts` | 编码/解析函数修改 |
| `src/shared/services/submission/usePageSubmission.js` | 调用逻辑适配 |
| `src/shared/services/submission/schema.ts` | 格式校验规则 |
| `src/flows/orchestrator/FlowOrchestrator.ts` | 页码生成检查 |
| `docs/submodule-submission-guidelines.md` | 文档更新 |

### 子模块影响（后续独立任务）

以下子模块需要检查页码传递和更新测试快照：
- g8-drone-imaging
- g8-mikania-experiment
- g8-pv-sand-experiment
- g7-tracking-experiment
- g7-tracking-questionnaire
- grade-7-experiment
- grade-7-questionnaire

### 后端协调

- 后端需先部署兼容层，同时接受新旧格式
- 前端迁移完成后，后端可移除旧格式支持
- 历史数据转换由后端负责，本提案不涉及

## 术语定义与计数基准

| 术语 | 定义 | 计数基准 |
|------|------|----------|
| `stepIndex` | Flow 中子模块的索引 | 从 **0** 开始 |
| `submoduleIndex` | 用于页码的子模块序号 | 从 **1** 开始（`= stepIndex + 1`） |
| `modulePageNum` | Flow Progress 中的页面序号（字符串） | 从 **'1'** 开始 |
| `subPageNum` | 提交层接收的页面序号（数字） | 从 **1** 开始 |
| `pageIndex` | 编码函数参数（`= subPageNum`，无需额外转换） | 从 **1** 开始，两位零填充 |

**转换示例**：
```
{ stepIndex: 0, subPageNum: 3 } → encodeCompositePageNum(1, 3) → "1.03"
{ stepIndex: 1, modulePageNum: '10' } → encodeCompositePageNum(2, 10) → "2.10"
```

**旧格式兼容策略**：
- **禁止新生成**：`0.*`、`M*:*`、无零填充格式
- **允许读取**：解析层可接受旧格式用于历史数据和 Progress 恢复
