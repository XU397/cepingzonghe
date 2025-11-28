# 统一提交管道迁移基线样例

本指南提供面向 Flow 流程框架的统一提交管道基线样例，供后续提案直接引用或裁剪。所有示例与约束均来源于 `src/shared/services/submission/schema.ts`、`usePageSubmission.js`、`AssessmentPageFrame.jsx`、`tracking/README.md` 等目录的最新实现。

## 1. 迁移概述

### 1.1 统一提交管道的目标和好处
- **单一数据入口**：所有页面提交都通过 `usePageSubmission` 创建的 MarkObject，实现 `flow_context` 注入、答题超时补齐和重试策略。
- **一致的 Schema 验证**：Zod Schema (`MarkObjectSchema`) 包含事件类型、时间格式和代码自增校验，可在提交前阻止脏数据进入接口。
- **统一埋点语义**：`buildTargetElementPrefix` 和 `buildPageDescPrefix` 确保跨页面的 `targetElement`、`pageDesc` 在 Flow 步骤间可聚合。
- **CI 守卫**：`docs/submission-ci-checks.md` 中的 `lint:submission` 与 `test:submission` 作为渗透测试，能在合入前发现旧接口、非法页码或事件缺失。

### 1.2 BREAKING CHANGES
- **页码格式**：所有页码必须通过 `encodeCompositePageNum(stepIndex, subPageNum)` 生成 `"0.3"`、`"1.5"` 形式；禁止再使用 `"M0:3"`、`"M"` 前缀、`pageNum + '-' + child` 拼接以及任何单数字写法（例如 `"1"`）。
- **`targetElement` 前缀**：事件与答案统一使用 `P{pageNumber}_` 前缀（例：`P1.5_input_username`）。缺失前缀视为无效埋点。
- **Schema 校验**：`validateMarkObject` 会拦截无 `page_enter/page_exit/next_click` 的页面、时间格式不符合 `YYYY-MM-DD HH:mm:ss`/ISO8601 的记录、以及输入事件 `value` 非 `{prev,next}`/`delete` 结构的情况。

### 1.3 迁移时间表建议
| 周次 | 里程碑 | 交付内容 |
| --- | --- | --- |
| 第 1 周 | Baseline | 梳理页面列表，补齐 `page_enter/page_exit/next_click`/`auto_submit` 最小事件集，保留旧页码。 |
| 第 2 周 | 编码规范 | 完成 `encodeCompositePageNum` 页码切换、`targetElement` 前缀化、`pageDesc` Flow 前缀。 |
| 第 3 周 | 框架落地 | 将核心页面包裹进 `AssessmentPageFrame` + `usePageSubmissionContext`，迁移 1–2 个输入页到 `Tracked*` 组件。 |
| 第 4 周 | 完整迁移 | 全局替换为新 API，跑通 `npm run lint:submission && npm run test:submission`，结合手动验收。 |

## 2. 最小事件集合要求

### 2.1 每页必需事件
- **生命周期**：`page_enter`（页面渲染）、`page_exit`（离开、超时、跳转）。
- **离开事件**：`next_click` 或 `auto_submit` 至少其一（`schema.ts` 中的 `ensureRequiredEvents` 校验）。

### 2.2 输入/选择/阻断事件
- **输入类**：页面含输入框时必须记录 `input_focus` → `input_change` → `input_blur`；删除行为会产生 `input_delete`。
- **选择类**：存在 `<select>` 或自定义下拉时记录 `select_change`，多选可在 `value` 中传 `{ selected: string[] }`。
- **阻断事件**：表单验证失败、按钮 disable 时触发 `click_blocked`（`TrackedButton` 自动处理）。

### 2.3 完整事件类型与使用场景
| 事件 | 场景 | 示例 |
| --- | --- | --- |
| `page_enter` | 页面装载/聚焦 | value = `页面标题`；由 `AssessmentPageFrame` 自动写入。 |
| `page_exit` | 离开原因 | value = `navigate_next`、`timeout_auto_submit`。 |
| `flow_context` | Flow 元信息 | value = `{ flowId, submoduleId, stepIndex, pageId }`。 |
| `next_click` | 手动下一步 | target = `P0.3_button_next`。 |
| `auto_submit` | 超时自动提交 | `appendTimeoutOperations` 自动生成，value 包含 `reason`。 |
| `input_focus/input_change/input_blur/input_delete` | 输入框 | `TrackedInput` 自动序列化 `{ prev, next }` 或 `{ action: 'delete', prevLength, nextLength }`。 |
| `select_change` | 下拉切换 | value = 选项值或 `{ selected: [] }`。 |
| `radio_select/checkbox_*` | 单选/多选 | value 为选项标识。 |
| `click/click_blocked` | 按钮点击或阻断 | value = `{ reason }`。 |
| `timer_start/timer_stop/timer_complete` | 计时器 | Flow 模式使用 `TimerContainer` 自动记录。 |
| `page_submit_success/page_submit_failed` | 系统事件 | `usePageSubmission` 自动写入 `pendingSubmitEventsRef`。 |

### 2.4 事件示例
```json
{
  "operationList": [
    { "code": 1, "eventType": "page_enter", "targetElement": "page_flow_step_1", "value": "[g7a-mix-001/g7-experiment/0] 问题1页面", "time": "2024-11-18T08:00:01Z" },
    { "code": 2, "eventType": "input_focus", "targetElement": "P0.3_input_username", "value": "P0.3_input_username", "time": "2024-11-18T08:00:05Z" },
    { "code": 3, "eventType": "input_change", "targetElement": "P0.3_input_username", "value": { "prev": "", "next": "alice" }, "time": "2024-11-18T08:00:09Z" },
    { "code": 4, "eventType": "input_blur", "targetElement": "P0.3_input_username", "value": "blur", "time": "2024-11-18T08:00:10Z" },
    { "code": 5, "eventType": "next_click", "targetElement": "P0.3_button_next", "value": "下一页", "time": "2024-11-18T08:00:15Z" },
    { "code": 6, "eventType": "page_exit", "targetElement": "page_exit", "value": "navigate_next", "time": "2024-11-18T08:00:15Z" }
  ]
}
```

## 3. 前缀规范示例

### 3.1 `pageNumber` 格式
- 统一 Data Format Spec：必须通过 `encodeCompositePageNum(stepIndex, subPageNum)` 生成 `<stepIndex>.<subPageNum>`（例：`'0.3'`、`'2.10'`）。任何单数字或自定义格式都会被 `schema.ts` 拒绝。

```ts
import { encodeCompositePageNum } from '@shared/utils/pageMapping.ts';
const pageNumber = encodeCompositePageNum(0, 3); // "0.3"
```

### 3.2 `targetElement` 前缀
- `buildTargetElementPrefix(pageNumber)` 返回 `P{pageNumber}_`。
- 示例：`P1_input_code`、`P0.3_button_next`、`P2.5_select_role`。

### 3.3 `pageDesc` 前缀
- Flow 模式由 `buildPageDescPrefix(flowId, submoduleId, stepIndex)` 生成 `[flow/submodule/step] `，示例：`[g7a-mix-001/g7-experiment/0] 问题1页面`。

### 3.4 迁移前后对比
| 项目 | 迁移前 | 迁移后 |
| --- | --- | --- |
| 页码 | `const pageNumber = 'M0:3';` | `const pageNumber = encodeCompositePageNum(0, 3); // "0.3"` |
| targetElement | `const target = 'btn_next';` | `const target = \`${buildTargetElementPrefix(pageNumber)}button_next\`; // P0.3_button_next` |
| pageDesc | `'问题1'` | `\`${buildPageDescPrefix(flowId, 'g7-experiment', 0)}问题1页面\`` |

## 4. 使用 AssessmentPageFrame 的最佳实践

### 4.1 基础用法
- 至少提供 `pageId`, `pageTitle`, `getUserContext`（或依赖 `AppContext` 自动注入）。
- `submission` prop 可注入 `buildMark`, `onBefore`, `onAfter`, `onError` 钩子。

### 4.2 Flow 模式增强
- 传入 `stepIndex`, `subPageNum`，`AssessmentPageFrame` 会调用 `encodeCompositePageNum`。
- 设置 `getFlowContext`，返回 `{ flowId, submoduleId, stepIndex, pageId }`，`usePageSubmission` 会写入 `flow_context` 事件并给 `pageDesc` 添加 `[flow/.../step]` 前缀。

### 4.3 子组件提交与上下文
- 子组件通过 `usePageSubmissionContext()` 获取 `submitPage`, `logOperation`, `pageNumber`，避免 prop drilling。
- 超时 submit：使用 `onTimeout={({ submitOnTimeout }) => submitOnTimeout({ missingAnswerTargets }) }` 或直接用 `TimerContainer` 的 `timerOnTimeout`。

### 4.4 完整可运行示例
```tsx
import { useState, useMemo } from 'react';
import { AssessmentPageFrame, usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
import { TrackedInput, TrackedSelect, TrackedButton } from '@shared/components/tracking';
import { buildTargetElementPrefix } from '@shared/utils/pageMapping.ts';

function FlowStepForm() {
  const { submitPage, logOperation, pageNumber } = usePageSubmissionContext();
  const targetPrefix = useMemo(() => buildTargetElementPrefix(pageNumber), [pageNumber]);
  const [form, setForm] = useState({ username: '', role: '' });

  const answers = useMemo(() => [
    { targetElement: 'answer_username', value: form.username },
    { targetElement: 'answer_role', value: form.role },
  ], [form]);

  const handleSubmit = async () => {
    logOperation({ eventType: 'click', targetElement: `${targetPrefix}button_submit`, value: 'submit_form' });
    await submitPage({
      answers,
      operations: [
        { eventType: 'next_click', targetElement: 'button_next', value: '下一页' },
      ],
    });
  };

  return (
    <form onSubmit={(event) => { event.preventDefault(); handleSubmit(); }}>
      <TrackedInput
        name="input_username"
        pageNumber={pageNumber}
        logOperation={logOperation}
        placeholder="请输入用户名"
        value={form.username}
        onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
      />
      <TrackedSelect
        name="select_role"
        pageNumber={pageNumber}
        logOperation={logOperation}
        value={form.role}
        onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
      >
        <option value="">请选择角色</option>
        <option value="A">选项 A</option>
        <option value="B">选项 B</option>
      </TrackedSelect>
      <TrackedButton
        name="button_submit"
        pageNumber={pageNumber}
        logOperation={logOperation}
        type="submit"
        requiredFields={[{ name: 'input_username', value: form.username }]}
      >提交</TrackedButton>
    </form>
  );
}

export default function FlowStepPage() {
  return (
    <AssessmentPageFrame
      pageId="flow_step_1"
      pageTitle="[Flow] 问题 1"
      stepIndex={0}
      subPageNum={3}
      getUserContext={() => ({ batchCode: 'B001', examNo: 'E001' })}
      getFlowContext={() => ({ flowId: 'g7a-mix-001', submoduleId: 'g7-experiment', stepIndex: 0, pageId: 'flow_step_1' })}
      onTimeout={({ submitOnTimeout }) => submitOnTimeout({
        missingAnswerTargets: ['answer_username', 'answer_role'],
        autoSubmitReason: 'timer_expired',
      })}
      submission={{
        onBefore: () => console.info('即将提交'),
        onAfter: ({ response }) => console.info('提交完成', response),
        onError: (err) => console.error('提交失败', err),
      }}
    >
      <FlowStepForm />
    </AssessmentPageFrame>
  );
}
```
> 示例中 `answers`/`operations` 仅传 `answer_username`、`button_next` 等逻辑名称，`usePageSubmission` 会自动补全 `P{pageNumber}_` 前缀与顺序编码。

## 5. 使用埋点包装组件

### 5.1 组件列表与用途
- `TrackedInput` / `TrackedTextarea`：注入输入事件序列与 `input_delete`。
- `TrackedSelect`：统一 `select_change`。
- `TrackedButton`：自动生成 `click` 与 `click_blocked`，并追加 `requiredFields` 校验。

### 5.2 集成步骤
1. 从 `@shared/components/tracking` 引入组件；通过 `AppContext` 或 `usePageSubmissionContext` 获取 `logOperation` 和 `pageNumber`。
2. 用受控表单值替换原生 `<input>`/`<select>`，保留 `onChange`/`onClick` 逻辑。
3. 将原 `name` 用于 `RequiredFieldState.name`，保持与答案键一致。

### 5.3 迁移前后代码对比

**迁移前**
```jsx
<input
  name="username"
  value={form.username}
  onFocus={() => logOperation({ eventType: 'focus', targetElement: 'username' })}
  onChange={(event) => {
    logOperation({ eventType: 'input', targetElement: 'username', value: event.target.value });
    setForm((prev) => ({ ...prev, username: event.target.value }));
  }}
/>
<button disabled={!form.username} onClick={handleSubmit}>下一步</button>
```

**迁移后**
```jsx
<TrackedInput
  name="input_username"
  pageNumber={pageNumber}
  logOperation={logOperation}
  value={form.username}
  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
/>
<TrackedButton
  name="button_next"
  pageNumber={pageNumber}
  logOperation={logOperation}
  requiredFields={[{ name: 'input_username', value: form.username }]}
  type="button"
  onClick={handleSubmit}
>
  下一步
</TrackedButton>
```
- 迁移后不再手写事件序列，组件自动写入 `P{pageNumber}_` 前缀与 `click_blocked`。

## 6. 手动使用 `usePageSubmission`

### 6.1 适用场景
- 历史子模块暂时无法切换 `AssessmentPageFrame`，但希望提前使用统一提交 Schema。
- 独立弹窗、非 React 入口或 Node 脚本，需要直接调用 Hook 产出的 `submit` 函数。

### 6.2 完整配置示例
```jsx
import { useState } from 'react';
import { usePageSubmission } from '@shared/services/submission/usePageSubmission.js';
import { encodeCompositePageNum } from '@shared/utils/pageMapping.ts';

export function LegacyPage() {
  const [form, setForm] = useState({ username: '' });
  const pageNumber = encodeCompositePageNum(1, 0);

  const { submit, isSubmitting, lastError } = usePageSubmission({
    getUserContext: () => ({ batchCode: 'B001', examNo: 'E002' }),
    getFlowContext: () => ({ flowId: 'g7a-mix-001', submoduleId: 'legacy', stepIndex: 1, pageId: 'legacy_1' }),
    pageMeta: {
      pageId: 'legacy_1',
      pageTitle: '旧模块-问题1',
      pageNumber,
    },
    answers: () => ([
      { targetElement: 'input_username', value: form.username },
    ]),
    operations: () => ([
      { eventType: 'page_enter', targetElement: 'legacy_1', value: '旧模块-问题1' },
      { eventType: 'next_click', targetElement: 'button_next', value: '下一页' },
    ]),
    onBefore: () => console.info('legacy submit start'),
    onAfter: ({ response }) => console.info('legacy submit ok', response),
    onError: (error) => console.error('legacy submit failed', error),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="username"
        value={form.username}
        onChange={(event) => setForm({ username: event.target.value })}
        placeholder="输入用户名"
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '提交中…' : '提交'}
      </button>
      {lastError && <p role="alert">{lastError.message}</p>}
    </form>
  );
}
```

### 6.3 新旧 API 对比
| 项目 | 旧实现 | 统一提交 |
| --- | --- | --- |
| 接口 | `fetch('/stu/saveHcMark', payload)` | `usePageSubmission` 内部调用 `submitPageMarkData` 并处理重试/401。 |
| 页码 | 手写 `M1:2` 或 `1-2` | `encodeCompositePageNum(stepIndex, subPageNum)`。 |
| Flow 信息 | 仅 `mark.flowId` | `flow_context` 事件自动写入 `{ flowId, submoduleId, stepIndex, pageId }`。 |
| 校验 | 无 | `validateMarkObject` 保证 Schema、事件与代码自增。 |
| 超时 | 手写 `auto_submit` | `submitOnTimeout({ autoSubmitReason, missingAnswerTargets })` 自动追加事件与占位答案。 |

## 7. Schema 校验错误处理

### 7.1 常见错误
- `operationList 必须包含 page_enter/page_exit/next_click 或 auto_submit` → 缺少最小事件集。
- `operationList[i].code 必须为 i+1` → 代码未按顺序自增。
- `input_change value` 必须是 `{prev,next}` 或字符串 → 未使用 `TrackedInput` 或 value 写错结构。
- `flow_context 事件的 value 必须为对象` → 传入字符串/空对象，需要改为 `{ flowId, submoduleId, stepIndex, pageId }`。
- `pageNumber/pageDesc 不能为空` → 未传 `pageMeta` 或 `AssessmentPageFrame` 未设置 `pageTitle`。

### 7.2 调试 Zod 错误
```ts
import { validateMarkObject } from '@shared/services/submission/schema.ts';

try {
  validateMarkObject(mark);
} catch (error) {
  console.error('MarkObject 校验失败：', error.message);
  error.issues?.forEach((issue) => {
    console.error(issue.path.join('.'), issue.message);
  });
}
```
- 使用 `npm run test:submission-format -- -u` 更新快照前，确保错误全部修复。
- 调试输入事件时可打印 `operation.value` 确认结构，必要时复用 `Tracked*` 组件生成正确值。

### 7.3 开发模式调试技巧
- 打开 `debug-data-submit.html`，使用 `window.__submission__.validate(mark)`（若暴露）快速验证。
- 启用 `import.meta.env.DEV` 时可设置 `allowProceedOnFailureInDev`，但仍需在最终提交前修复所有错误。
- 在浏览器 Network 面板查看 payload，确认 `pageNumber`、`targetElement` 前缀与 `flow_context`。

## 8. 分步迁移策略

1. **Step 1: 添加最小事件集合（保持旧格式）**  
   - 行动：通过 `logOperation` 或 `usePageSubmission` 在每页补齐 `page_enter/page_exit/next_click`。  
   - 验证：`npm run test:submission` 中 `validate-events.test.js` 不再提示缺失事件。
2. **Step 2: 切换到新的页码格式**  
   - 行动：引入 `encodeCompositePageNum`，替换所有 `M`/字符串拼接逻辑。  
   - 验证：`npm run lint:submission` 不再出现 “禁止手写 M 前缀页码”。
3. **Step 3: 添加前缀（使用工具函数）**  
   - 行动：`buildTargetElementPrefix` / `buildPageDescPrefix` 统一处理 `targetElement` 与 `pageDesc`。  
   - 验证：`test:submission-format` 不再报缺失 `P` 前缀，Network payload 中的 `pageDesc` 带 `[flow/.../step]`。
4. **Step 4: 集成 `usePageSubmission` 新 API**  
   - 行动：替换 `/stu/saveHcMark` 直连，统一使用 Hook；注入 `getFlowContext`, `pageMeta`, `onBefore/onAfter`。  
   - 验证：本地 `console` 观察 `queueSubmitEvent` 生成的 `page_submit_success`/`failed`；Schema 校验通过。
5. **Step 5: 使用埋点包装组件**  
   - 行动：将手写 input/select/button 逐步替换为 `Tracked*`，释放手动事件维护。  
   - 验证：`operationList` 中自动出现 `input_focus/input_change/input_blur`；按钮禁用时出现 `click_blocked`。
6. **Step 6: 运行 lint 和快照测试**  
   - 行动：执行 `npm run lint && npm run lint:submission && npm run test:submission-format && npm run test:submission`。  
   - 验证：所有命令 0 exit，快照差异（如 Schema 更新）需附带说明；再进行一次手动登录→完成流程→提交成功验证。

## 9. 测试和验证清单
- [ ] 所有页面包含最小事件集合（page_enter/page_exit/next_click 或 auto_submit）。
- [ ] 页码格式符合规范（`encodeCompositePageNum`，无 `M` 前缀）。
- [ ] `targetElement` 均包含 `P` 前缀（`P{pageNumber}_*`）。
- [ ] Schema 校验通过（`validateMarkObject` 或 `test:submission-format`）。
- [ ] `npm run lint:submission` 通过。
- [ ] `npm run test:submission` 通过。
- [ ] 手动测试：登录 → 完成流程 → 提交成功。

## 10. FAQ 和常见问题
- **Q: 为什么要淘汰 `M` 前缀？**  
  **A**：`M` 格式在 `pageMapping.ts` 中仅作为兼容路径，已经打印 warning。统一采用点分格式可直接由 `encodeCompositePageNum` 解析，避免前后端重复规则。
- **Q: 如何处理现有数据？**  
  **A**：迁移前保留旧页码字段入库；迁移后将 `pageNumber` 映射到新的 dot 格式，并在大盘查询中使用 `parseCompositePageNum` 同时兼容旧值，逐步清洗历史记录。
- **Q: 性能影响如何？**  
  **A**：`usePageSubmission` 仅在提交时运行；主要开销是 Zod 校验与 JSON 深拷贝。对于页数少的测评可忽略，对长流程建议批量提交前缓存 `operationList`。重试策略仅在失败时触发（1s/2s/4s），不阻塞主线程。
- **Q: 如何调试提交失败？**  
  **A**：检查 `lastError`、Network Response、`queueSubmitEvent` 中的 `page_submit_failed`。若返回 401，`handleSessionExpired` 会自动触发重新登录。可在 DEV 模式启用 `allowProceedOnFailureInDev` 观察后续流程，但最终仍需修复根因。
- **Q: Flow 模式和独立模块的区别？**  
  **A**：Flow 模式需要 `stepIndex`、`subPageNum`、`getFlowContext` 来生成复合页码与 `[flow/submodule/step]` 前缀；独立模块可使用简单页码（`'1'`）且可省略 `getFlowContext`，但依旧需通过 `AssessmentPageFrame` 或 `usePageSubmission` 统一提交。

---
如需在提案中扩展，请以此样例为基线并补充各子模块特定流程。EOF
