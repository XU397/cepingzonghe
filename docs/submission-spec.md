# 子模块数据提交规范（目标态）

> **本文档定义 HCI-Evaluation Platform 子模块数据提交的目标态规范。**
> 所有新建子模块 MUST 遵循本规范；遗留模块的偏差登记在 `docs/submission-legacy-deviations.md`。
>
> **权威等级**：本规范 > 遗留偏差登记 > 当前代码实现。代码仅作为现状证据和示例来源。

## 文档元信息

| 字段     | 值                                       |
| -------- | ---------------------------------------- |
| 版本     | 1.0                                      |
| 状态     | 生效                                     |
| 适用对象 | 新建标准子模块（Standard Submodule）      |
| 替代     | `docs/submodule-submission-guidelines.md`（已归档）、`docs/子模块数据规范1205.md`（已归档） |
| Schema   | `src/shared/services/submission/schema.ts` |
| 提交管道 | `src/shared/services/submission/usePageSubmission.js` |

---

## 1. 适用范围与术语

### 1.1 适用范围

- **新建标准子模块**：MUST 完全遵循本规范。
- **Legacy Wrapper 子模块**：SHOULD 以本规范为目标逐步迁移；偏差登记在 `docs/submission-legacy-deviations.md`。
- **旧模块内部实现**：不在本规范约束范围内，但 SHOULD 在迁移时参照执行。

### 1.2 术语

| 术语             | 定义                                                         |
| ---------------- | ------------------------------------------------------------ |
| MarkObject       | 提交至后端的页面数据结构，包含操作日志、答案、时间等信息       |
| operationList    | MarkObject 中记录用户操作事件的数组                           |
| answerList       | MarkObject 中记录用户答案的数组                               |
| 复合页码         | 格式为 `<submoduleIndex>.<pageIndexTwoDigits>`（如 `1.03`）的页码 |
| targetElement    | 操作或答案的目标元素标识符                                    |
| flow_context     | 标识当前页面所属 Flow/子模块/步骤的上下文操作事件              |
| 生命周期事件     | `page_enter`、`next_click`/`auto_submit`、`page_exit` 三类事件的统称 |
| 提交层           | `usePageSubmission` + `createMarkObject` + `schema.ts` 组成的共享提交管道 |
| 适配器层         | `submoduleAdapter/` 下提供的共享工具函数集                    |

---

## 2. MarkObject 结构

### 2.1 字段顺序与约束

MarkObject MUST 按以下字段顺序构建。所有字段 MUST 存在（不可缺省），集合类字段空时输出空数组。

```
pageNumber → pageDesc → operationList → answerList → beginTime → endTime → imgList
```

| 字段           | 类型     | 必需 | 约束                                                         |
| -------------- | -------- | ---- | ------------------------------------------------------------ |
| `pageNumber`   | string   | MUST | 符合 `^[1-9]\d*\.\d{2}$`（见 §2.2）                         |
| `pageDesc`     | string   | MUST | 非空字符串（见 §2.3）                                        |
| `operationList`| Array    | MUST | 至少 1 条；包含完整生命周期事件（见 §3.2）                    |
| `answerList`   | Array    | MUST | 可为空数组 `[]`；每条非空答案需通过 schema 校验                |
| `beginTime`    | string   | MUST | `YYYY-MM-DD HH:mm:ss` 或 ISO 8601                            |
| `endTime`      | string   | MUST | `YYYY-MM-DD HH:mm:ss` 或 ISO 8601                            |
| `imgList`      | Array    | MUST | 可为空数组 `[]`                                              |

### 2.2 pageNumber（复合页码）

**格式规则**：`<submoduleIndex>.<pageIndexTwoDigits>`

- `submoduleIndex`：从 1 开始，等于 `stepIndex + 1`
- `pageIndex`：从 1 开始，两位零填充

```
编码函数：encodeCompositePageNum(stepIndex + 1, subPageNum)
来源：src/shared/utils/pageMapping.ts → encodeCompositePageNum()
```

**MUST**：
- 满足正则 `^[1-9]\d*\.\d{2}$`
- 使用 `encodeCompositePageNum()` 编码，禁止手写

**MUST NOT**：
- 使用 `M*:` 前缀格式（如 `M1:5`）
- 使用 `0.*` 前缀格式（如 `0.3`）
- 使用无零填充格式（如 `1.3` 而非 `1.03`）

**示例**：

| stepIndex | subPageNum | pageNumber |
| --------- | ---------- | ---------- |
| 0         | 1          | `1.01`     |
| 0         | 3          | `1.03`     |
| 1         | 10         | `2.10`     |
| 2         | 5          | `3.05`     |

### 2.3 pageDesc（页面描述）

**MUST**：
- 为非空字符串
- 在 Flow 上下文中，MUST 添加前缀 `[flowId/submoduleId/stepIndex] `
- 无 Flow 上下文时，省略前缀

```
构建函数：buildPageDescPrefix(flowId, submoduleId, stepIndex)
来源：src/shared/utils/pageMapping.ts → buildPageDescPrefix()
```

**示例**：
- 有 Flow：`[flow-abc/g8-pv-sand/0] 任务封面`
- 无 Flow：`任务封面`

### 2.4 operationList

详见 §3（事件类型）和 §4（targetElement 命名）。

**结构**：

```typescript
interface Operation {
  code: number;         // MUST 从 1 开始连续递增
  targetElement: string; // MUST 符合前缀规则（见 §4）
  eventType: string;     // MUST 在允许列表中（见 §3.1）
  value: string | object; // 字符串或结构化对象（见 §3.4）
  time: string;          // MUST 为 YYYY-MM-DD HH:mm:ss 或 ISO 8601
  pageId?: string;       // SHOULD 填写当前页面 ID
}
```

**MUST**：
- `code` 从 1 开始连续递增（由提交层自动编号）
- 每页 MUST 包含最小事件集合（见 §3.2）
- `time` 由提交层自动归一化

### 2.5 answerList

详见 §5（答案格式）和 §4（targetElement 命名）。

**结构**：

```typescript
interface Answer {
  code: number;          // MUST 从 1 开始连续递增
  targetElement: string; // MUST 使用完整问题文本（见 §5）
  value: string;         // MUST 为非空字符串
}
```

**MUST**：
- 仅记录非空答案（空字符串、null、undefined 不入列）
- `value` 必须经过 `trim()` 处理后非空
- 超时占位符由提交层自动补齐（`"超时未回答"`）

### 2.6 beginTime / endTime

- 格式：`YYYY-MM-DD HH:mm:ss`（推荐）或 ISO 8601
- beginTime：页面进入时间
- endTime：页面提交时间
- 提交层 MUST 在缺失时自动填充当前时间

### 2.7 imgList

- 当前 MUST 为数组（可为 `[]`）
- 未来用于存储截图等附件数据

---

## 3. 事件类型（eventType）

### 3.1 允许列表

所有 `eventType` MUST 在以下允许列表中。列表由 `eventTypes.js` 和 `schema.ts` 的 `ALLOWED_EVENT_TYPES` 联合定义。

| 类别         | 事件类型                                                                                                               |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 生命周期     | `page_enter`, `page_exit`, `next_click`, `auto_submit`, `click_blocked`                                                |
| 提交系统     | `page_submit_success`, `page_submit_failed`                                                                            |
| Flow 上下文  | `flow_context`                                                                                                         |
| 通用交互     | `click`, `change`, `focus`, `blur`, `hover_enter`, `hover_leave`                                                       |
| 输入类       | `input`, `input_focus`, `input_change`, `input_blur`, `input_delete`                                                   |
| 选择类       | `select_change`, `radio_select`, `checkbox_check`, `checkbox_uncheck`                                                  |
| 模态/材料    | `modal_open`, `modal_close`, `view_material`                                                                           |
| 计时器       | `timer_start`, `timer_stop`, `timer_complete`                                                                          |
| 模拟实验     | `simulation_timing_started`, `simulation_run_result`, `simulation_operation`                                           |
| 问卷         | `questionnaire_answer`                                                                                                 |
| 会话/网络    | `session_expired`, `network_error`                                                                                     |
| 超时/阅读    | `timeout`, `reading_complete`                                                                                          |
| 拖拽（G4）   | `drag_start`, `drag_end`, `task_drop`, `task_remove`                                                                   |
| 对话/演示    | `dialogue_play`, `dialogue_replay`, `demo_play`, `demo_complete`                                                       |
| 虚拟键盘     | `key_press`                                                                                                            |

### 3.2 最小事件集合

每个页面的 `operationList` MUST 包含以下事件（通过提交层 `ensureLifecycleOperations` 自动保证）：

| 事件          | 条件                         | 说明             |
| ------------- | ---------------------------- | ---------------- |
| `page_enter`  | 始终必需                     | 页面进入         |
| `page_exit`   | 始终必需                     | 页面退出         |
| `next_click`  | 或 `auto_submit`（二选一）   | 用户主动下一步或系统自动提交 |

### 3.3 事件语义

#### page_enter
- targetElement：`page`
- value：`pageDesc` 或 `pageId`
- 时机：页面渲染时立即记录

#### page_exit
- targetElement：`page`
- value：正常导航为 `"navigate_next"`，超时为 `"timeout_auto_submit"`
- 时机：提交前自动追加

#### next_click
- targetElement：`next_button`
- value：`"下一页"`
- 时机：用户点击下一步按钮

#### auto_submit
- targetElement：`page`
- value：结构化对象 `{ reason, trigger, triggerTime, timeout?, pageNumber }`
- 时机：计时器超时时由提交层自动生成

#### click_blocked
- targetElement：被阻断的元素
- value：SHOULD 包含 `missing` 列表描述缺失项
- 时机：用户尝试提交但验证未通过时

#### flow_context
- targetElement：`flow_context`
- value：JSON 字符串，结构见 §7
- 时机：`page_enter` 之后自动注入

### 3.4 value 格式规则

| eventType 范围              | value 类型         | 格式说明                                                     |
| --------------------------- | ------------------ | ------------------------------------------------------------ |
| `input_change`              | string 或 object   | 对象时 MUST 为 `{ prev, next }`（前后快照）                   |
| `input_delete`              | string 或 object   | 对象时 MUST 为 `{ action: "delete", prevLength, nextLength }` |
| `flow_context`              | string 或 object   | 对象或有效 JSON 字符串（见 §7）                               |
| `auto_submit`               | object             | 结构化对象（见 §3.3）                                         |
| 其他                        | string             | MUST 转为字符串                                               |

---

## 4. targetElement 命名规范

### 4.1 前缀规则

所有非保留的 `targetElement` MUST 以页面前缀 `P<pageNumber>_` 开头。

```
构建函数：buildTargetElementPrefix(pageNumber) → "P<pageNumber>_"
来源：src/shared/utils/pageMapping.ts → buildTargetElementPrefix()
```

**示例**：

| pageNumber | 前缀      | 完整 targetElement 示例        |
| ---------- | --------- | ------------------------------ |
| `1.03`     | `P1.03_`  | `P1.03_实验按钮`               |
| `2.10`     | `P2.10_`  | `P2.10_Q3_风速选择`            |

**MUST**：
- 前缀由提交层自动添加（子模块仅需提供裸元素名）
- 前缀格式为 `P<pageNumber>_`，其中 `<pageNumber>` 符合 §2.2

### 4.2 系统保留元素

以下 `targetElement` 值为系统保留，**不添加**页面前缀：

| 保留值              | 用途               |
| ------------------- | ------------------ |
| `page`              | 生命周期事件目标   |
| `flow_context`      | Flow 上下文标识    |
| `page_submission`   | 提交系统事件目标   |

> 来源：`src/shared/services/submission/schema.ts` → `RESERVED_TARGET_ELEMENTS`

### 4.3 answerList.targetElement vs operationList.targetElement

两者语义不同：

| 维度         | operationList.targetElement        | answerList.targetElement      |
| ------------ | ---------------------------------- | ----------------------------- |
| 用途         | 追踪用户操作过程                   | 记录最终答案，供评分使用       |
| 格式         | 带前缀的元素 ID（如 `P1.05_选择`） | 完整问题文本（无前缀）         |
| 前缀         | 由提交层自动添加 `P<pageNumber>_`  | 由提交层自动添加 `P<pageNumber>_` |

> **注意**：两者的 `targetElement` 都会由提交层自动添加页面前缀。子模块在构建 answerList 时，SHOULD 使用完整问题文本（如 `"问题2：根据模拟实验..."`）而非简短键名（如 `"Q2_风速区域"`）。

---

## 5. 答案格式（answerList）

### 5.1 基本规则

- **MUST** 仅记录非空答案：空字符串、null、undefined 不入列
- **MUST** `value` 经过 `trim()` 后非空
- 超时占位符由提交层统一补齐（默认值：`"超时未回答"`）

### 5.2 单选题 value 格式

**MUST** 包含选项标签和选项内容：`"<选项ID>. <选项文本>"`

```
✅ "A. 8毫米"      ✅ "B. 镜头焦距"
❌ "A"             ❌ "B"（仅选项ID）
❌ "withPanel"     ❌ "noPanel"（内部值）
```

### 5.3 多选题 value 格式

**MUST** 使用逗号分隔的完整选项：`"<选项1>, <选项2>"`

```
✅ "A. 温度, C. 湿度, D. 光照"
❌ "A,C,D"
```

### 5.4 文本输入题 value 格式

直接记录用户输入的完整文本。

### 5.5 复杂数据（实验历史、截图元数据等）

- value 为 **JSON 字符串**
- targetElement SHOULD 使用描述性标识（如 `experiment_captures`）

**示例**：

```json
{
  "code": 100,
  "targetElement": "experiment_captures",
  "value": "[{\"height\":100,\"focalLength\":8,\"gsd\":3.01,\"timestamp\":\"2025-02-01 09:05:12\"}]"
}
```

---

## 6. 提交流水线

### 6.1 唯一入口

所有页面数据提交 MUST 通过共享提交层进行，不得绕过。

```
提交流径：
  页面交互 → context.logOperation() → operations[]
  页面答案 → context.answerDraft   → collectAnswers()
                                        ↓
  AssessmentPageFrame.onNext → validatePage()
    → defaultSubmit() → usePageSubmission → buildMark()
      → validateMarkObject() → createMarkObject() → createSubmissionPayload()
        → POST /stu/saveHcMark (FormData)
```

### 6.2 提交层职责

提交层（`usePageSubmission`）自动负责以下处理，子模块 MUST NOT 手动实现：

| 职责                     | 实现位置                                    |
| ------------------------ | ------------------------------------------- |
| 复合页码编码             | `pickPageNumber` → `encodeCompositePageNum` |
| pageDesc Flow 前缀       | `applyPageDescPrefixWithFlow`               |
| targetElement 前缀       | `applyOperationTargetPrefix` / `applyAnswerTargetPrefix` |
| flow_context 注入        | `injectFlowContextOperation`                |
| 生命周期事件补齐         | `ensureLifecycleOperations`                 |
| code 连续编号            | `normalizeOperations` / `normalizeAnswers`  |
| 时间格式归一化           | `formatTimestamp` / `normalizeTimeField`    |
| Schema 校验              | `validateMarkObject`                        |
| 空答案过滤               | `filterNonEmptyAnswers`                     |
| 超时占位                 | `appendTimeoutAnswers` / `appendTimeoutOperations` |
| 重试策略                 | 3 次指数退避（1000ms, 2000ms, 4000ms）      |

### 6.3 子模块职责

子模块仅需提供：

| 提供项         | 说明                                                   |
| -------------- | ------------------------------------------------------ |
| `getUserContext` | 返回 `{ batchCode, examNo }`                           |
| `getFlowContext` | 返回 `{ flowId, submoduleId, stepIndex, moduleName?, pageId? }` |
| `pageMeta`     | 返回 `{ stepIndex, subPageNum, pageId, pageTitle? }`   |
| `buildMark`    | 返回预构建的 MarkObject（推荐模式）                     |
| 或 `answers` + `operations` | 由提交层组装 MarkObject（简单模式）          |

### 6.4 禁止事项

**MUST NOT**：
- 直接调用 `/stu/saveHcMark` API
- 手写 `code` 编号（由提交层自动分配）
- 手写时间戳格式（由提交层 `formatTimestamp` 归一化）
- 手写 `targetElement` 前缀（由提交层自动添加）
- 手动注入 `flow_context` 事件（由提交层自动处理）
- 手动追加 `page_enter`/`page_exit`/`next_click`/`auto_submit`（由提交层 `ensureLifecycleOperations` 处理）

---

## 7. flow_context 注入

### 7.1 结构

`flow_context` 事件的 `value` MUST 为以下结构的 JSON 字符串或等价对象：

```json
{
  "flowId": "flow-abc",
  "submoduleId": "g8-pv-sand-experiment",
  "stepIndex": 0,
  "moduleName": "光伏治沙实验",
  "pageId": "page_03_experiment"
}
```

| 字段         | 类型    | 必需 | 说明                                  |
| ------------ | ------- | ---- | ------------------------------------- |
| `flowId`     | string  | MUST | Flow 定义 ID                          |
| `submoduleId`| string  | MUST | 子模块 ID                             |
| `stepIndex`  | number  | MUST | 步骤索引（从 0 开始）                  |
| `moduleName` | string  | SHOULD | 模块显示名称                          |
| `pageId`     | string  | SHOULD | 当前页面 ID                           |

### 7.2 注入时机

- 提交层在 `page_enter` 事件之后自动注入
- 每页 MUST 仅注入一条 `flow_context`
- 如果子模块已通过 context 层注入，提交层会归一化现有值

### 7.3 注入位置

- `flow_context` 插入在 `page_enter` 之后（`page_enter` 的下一个位置）
- 插入后 `code` 自动重新编号

---

## 8. mapping.ts 配置标准

### 8.1 必需导出

每个标准子模块的 `mapping.ts` MUST 导出以下常量：

```typescript
// 页面描述映射：pageId → 人类可读描述
export const PAGE_DESC_MAP: Record<PageId, string>;

// 每页问题列表：pageId → 标准化问题键名数组
export const PAGE_QUESTIONS: Record<PageId, string[]>;

// 问题编码映射：问题ID → code
export const QUESTION_CODE_MAP: Record<string, number>;

// 问题完整文本映射：问题ID → 完整问题文本（用于 answerList.targetElement）
export const QUESTION_TEXT_MAP: Record<string, string>;

// 答案键到问题ID的反向映射
export const ANSWER_KEY_TO_QUESTION: Record<string, string>;

// 页码获取函数
export function getSubPageNumByPageId(pageId: string): number;
```

### 8.2 推荐导出

有选择题的子模块 SHOULD 导出：

```typescript
// 选项文本映射（用于格式化单选/多选题 value）
export const QUESTION_OPTIONS_MAP: Record<string, Record<string, string>>;

// 内部键名到标准化键名的映射
export const INTERNAL_TO_STANDARD_KEY: Record<string, string>;

// 答案格式化函数
export function formatAnswer(questionId: string, rawValue: unknown): string;
```

### 8.3 SUBMODULE_MAPPING_CONFIG

每个子模块 MUST 导出 `SUBMODULE_MAPPING_CONFIG`，供适配器层工具函数使用：

```typescript
import type { SubmoduleMappingConfig } from '@shared/services/submission/submoduleAdapter';

export const SUBMODULE_MAPPING_CONFIG: SubmoduleMappingConfig = {
  PAGE_CONFIGS,        // 页面配置数组
  PAGE_DESC_MAP,       // 页面描述
  PAGE_QUESTIONS,      // 问题列表
  QUESTION_CODE_MAP,   // 问题编码
  QUESTION_TEXT_MAP,   // 问题文本
  ANSWER_KEY_TO_QUESTION,
  getSubPageNumByPageId,
  // 可选
  QUESTION_OPTIONS_MAP,
  INTERNAL_TO_STANDARD_KEY,
  HISTORY_CODE_BASE,
  getPageConfig,
  formatAnswer,
};
```

**类型定义**：`src/shared/services/submission/submoduleAdapter/types.ts` → `SubmoduleMappingConfig`

---

## 9. 验证与测试

### 9.1 Schema 校验

- 提交前 MUST 通过 `validateMarkObject()` 校验
- 校验内容：字段完整性、事件枚举、code 连续性、targetElement 前缀、时间格式、最小事件集合
- 来源：`src/shared/services/submission/schema.ts`

### 9.2 mapping 配置校验

- SHOULD 使用 `validateMappingConfig()` 验证 mapping 配置完整性
- 来源：`src/shared/services/submission/submoduleAdapter/validateMappingConfig.ts`

### 9.3 提交格式快照测试

每个子模块 SHOULD 为 2-3 个典型页面提供 MarkObject 快照测试，覆盖：
- 操作包含最小事件集合
- 答案仅含非空值
- 前缀和时间格式正确
- flow_context 结构正确

### 9.4 验证命令

```bash
npm run lint:submission        # 代码规范检查
npm run test:submission-format # 提交格式验证
npm run test:submission        # 完整提交测试套件
```

---

## 10. 共享适配器层（submoduleAdapter）

适配器层提供标准化工具函数，位于 `src/shared/services/submission/submoduleAdapter/`。

### 10.1 主要导出

| 导出项                    | 用途                                         |
| ------------------------- | -------------------------------------------- |
| `usePageMeta`             | Hook：获取 pageNumber 和 targetPrefix         |
| `useStableOperationLogger`| Hook：稳定的 logOperation（空依赖数组）        |
| `collectAnswers`          | 根据 mapping 配置收集并格式化答案              |
| `buildPageDesc`           | 构建带 Flow 前缀的页面描述                    |
| `appendExperimentHistory` | 向 answerList 追加实验历史记录                |
| `validateMarkBeforeSubmit`| 提交前验证 MarkObject                         |
| `validateMappingConfig`   | 验证 mapping 配置完整性                       |
| `createOperationSequence` | 创建序号生成器                                |
| `createPageStateResetter` | 创建页面状态重置器                            |
| `injectFlowContext`       | 注入 flow_context 操作                        |
| `shouldInjectFlowContext` | 判断是否需要注入 flow_context                 |

### 10.2 使用模式

```typescript
import {
  usePageMeta,
  collectAnswers,
  buildPageDesc,
  appendExperimentHistory,
} from '@shared/services/submission/submoduleAdapter';
```

---

## 11. 安全策略

### 11.1 敏感数据

- MarkObject 中 MUST NOT 包含用户凭证信息
- `batchCode` 和 `examNo` 仅通过 FormData 外层传递，不嵌入 MarkObject

### 11.2 重试策略

- 提交失败自动重试 3 次，延迟分别为 1000ms、2000ms、4000ms（指数退避）
- 会话过期（401）不重试，直接触发登录流程
- DEV 模式下可选允许提交失败后继续（`allowProceedOnFailureInDev`）

### 11.3 外层 Payload 格式

提交至后端的最终 payload 格式为 FormData：

```
batchCode: string
examNo: string
mark: JSON.stringify(MarkObject)  // MarkObject 序列化为 JSON 字符串
```

---

## 附录 A：完整 MarkObject 示例

```json
{
  "pageNumber": "1.03",
  "pageDesc": "[flow-abc/g8-pv-sand/0] 实验操作",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "[flow-abc/g8-pv-sand/0] 实验操作",
      "time": "2026-03-15 10:00:00",
      "pageId": "page_03_experiment"
    },
    {
      "code": 2,
      "targetElement": "flow_context",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-abc\",\"submoduleId\":\"g8-pv-sand-experiment\",\"stepIndex\":0,\"moduleName\":\"光伏治沙实验\",\"pageId\":\"page_03_experiment\"}",
      "time": "2026-03-15 10:00:01",
      "pageId": "page_03_experiment"
    },
    {
      "code": 3,
      "targetElement": "P1.03_风速选择",
      "eventType": "radio_select",
      "value": "A. 15m/s",
      "time": "2026-03-15 10:00:30",
      "pageId": "page_03_experiment"
    },
    {
      "code": 4,
      "targetElement": "next_button",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2026-03-15 10:01:00",
      "pageId": "page_03_experiment"
    },
    {
      "code": 5,
      "targetElement": "page",
      "eventType": "page_exit",
      "value": "navigate_next",
      "time": "2026-03-15 10:01:00",
      "pageId": "page_03_experiment"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P1.03_问题2：根据模拟实验，哪个风速区域的沙固定效果最好？",
      "value": "A. 15m/s"
    }
  ],
  "beginTime": "2026-03-15 10:00:00",
  "endTime": "2026-03-15 10:01:00",
  "imgList": []
}
```

---

## 附录 B：事件类型速查表

| 事件                         | targetElement        | value 格式               | 时机                     |
| ---------------------------- | -------------------- | ------------------------ | ------------------------ |
| `page_enter`                 | `page`               | pageDesc 或 pageId       | 页面渲染                 |
| `page_exit`                  | `page`               | `"navigate_next"` / `"timeout_auto_submit"` | 提交前 |
| `next_click`                 | `next_button`        | `"下一页"`               | 用户点击下一步           |
| `auto_submit`                | `page`               | `{ reason, trigger, triggerTime, timeout?, pageNumber }` | 超时 |
| `click_blocked`              | 被阻断元素           | SHOULD 含 missing 列表   | 验证未通过               |
| `flow_context`               | `flow_context`       | JSON 字符串或对象（见 §7）| page_enter 后            |
| `click`                      | 目标元素             | string                   | 通用点击                 |
| `radio_select`               | 目标元素             | `"A. 选项文本"`          | 单选                     |
| `checkbox_check`             | 目标元素             | string                   | 勾选                     |
| `checkbox_uncheck`           | 目标元素             | string                   | 取消勾选                 |
| `select_change`              | 目标元素             | string                   | 下拉选择变化             |
| `input_change`               | 目标元素             | `{ prev, next }` 或 string | 输入内容变化            |
| `input_focus`                | 目标元素             | string                   | 输入框聚焦               |
| `input_blur`                 | 目标元素             | string                   | 输入框失焦               |
| `input_delete`               | 目标元素             | `{ action:"delete", prevLength, nextLength }` | 删除 |
| `modal_open`                 | 目标元素             | string                   | 模态框打开               |
| `modal_close`                | 目标元素             | string                   | 模态框关闭               |
| `view_material`              | 目标元素             | string                   | 查看材料                 |
| `timer_start`                | 目标元素             | string                   | 计时开始                 |
| `timer_stop`                 | 目标元素             | string                   | 计时停止                 |
| `timer_complete`             | 目标元素             | string                   | 计时完成                 |
| `simulation_timing_started`  | 目标元素             | string 或 object         | 模拟计时开始             |
| `simulation_run_result`      | 目标元素             | string 或 object         | 模拟运行结果             |
| `simulation_operation`       | 目标元素             | string 或 object         | 模拟操作                 |
| `questionnaire_answer`       | 目标元素             | string                   | 问卷答案                 |
| `page_submit_success`        | `page_submission`    | object                   | 提交成功                 |
| `page_submit_failed`         | `page_submission`    | object                   | 提交失败                 |

---

## 附录 C：子模块一致性检查清单

### mapping.ts

- [ ] 定义 `PAGE_DESC_MAP`
- [ ] 定义 `PAGE_QUESTIONS`
- [ ] 定义 `QUESTION_CODE_MAP`（code 唯一且覆盖所有问题）
- [ ] 定义 `QUESTION_TEXT_MAP`（完整问题文本）
- [ ] 定义 `ANSWER_KEY_TO_QUESTION`
- [ ] 导出 `SUBMODULE_MAPPING_CONFIG`
- [ ] 有单选题时：定义 `QUESTION_OPTIONS_MAP` + `formatAnswer`
- [ ] 有内部键名时：定义 `INTERNAL_TO_STANDARD_KEY`

### Context

- [ ] 使用 `createOperationSequence` 管理序号
- [ ] `logOperation` 使用空依赖数组（稳定引用）
- [ ] 使用 ref 存储 flowContext
- [ ] 页面切换时重置序号和 `flowContextInjected` 标记

### Component.tsx

- [ ] 同步外部 flowContext 到内部 Context
- [ ] 使用 `buildMark` 模式提交
- [ ] 使用 `collectAnswers` 收集答案
- [ ] 有实验历史时：使用 `appendExperimentHistory`
- [ ] 提交成功后调用 `clearOperations()`

### 测试

- [ ] mapping 配置验证通过（`validateMappingConfig`）
- [ ] 典型页面提交格式快照测试
- [ ] 单选题 value 格式测试
- [ ] `npm run test:submission-format` 通过
