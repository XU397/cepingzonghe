# Tracking Components

可重用的埋点包装组件，统一 input / select / textarea / button 的操作日志格式，便于各个测评页面即插即用。

## 核心特性

- 自动生成 `targetElement`（`P{pageNumber}_{name}` 格式），避免各页重复字符串拼接
- 所有事件时间统一为 `ISO 8601`，与 `@/shared/services/submission/eventTypes.js` 中的标准事件保持一致
- 仅封装埋点逻辑，原生 HTML 属性（含 `aria-*`）全部透传
- TypeScript 完整类型：`TrackingOperation`、`LogOperationHandler`、`RequiredFieldState` 等

## 通用 Props

| Prop | 说明 |
| ---- | ---- |
| `name` | 元素唯一标识，同步写入原生 `name` |
| `pageNumber` | 当前业务页码（数字或字符串） |
| `logOperation` | `logOperation(operation)` 回调，通常来自 `AppContext` 或 `useTrackingContext` |

> ✅ 组件内部会调用 `logOperation({ targetElement, eventType, value, time })`，`time` 为 `new Date().toISOString()`。

## 组件说明

### `TrackedInput`

- 监听 `focus` / `change` / `blur`
- `input_change` 的 `value` 为 `{ prev: string, next: string }`
- 与原生 `<input>` 完全一致，可与受控/非受控模式搭配

### `TrackedTextarea`

- 同步 `TrackedInput` 的事件；额外检测删除行为
- 当 `nextLength < prevLength` 时追加 `input_delete`，`value = { action: 'delete', prevLength, nextLength }`

### `TrackedSelect`

- 记录 `select_change`
- 单选写入字符串，`multiple` 时写入 `{ selected: string[] }`

### `TrackedButton`

- 记录 `click`，当满足以下任一条件时改记 `click_blocked`
  - `disabled` 为 `true`
  - `requiredFields` 中存在未通过验证的字段
- 当 `isNext` 设为 `true` 时，正常点击会改为记录 `next_click`，便于追踪“下一页”触发点
- `value` 结构：`{ reason: 'disabled' }` 或 `{ reason: 'missing_fields', missing: string[] }`
- 为了捕获被阻止的点击，组件通过 `aria-disabled`+`tabIndex=-1` 模拟禁用状态；如需样式，可使用 `[data-disabled='true']` 选择器

#### `requiredFields`

```ts
const requiredFields: RequiredFieldState[] = [
  { name: 'student_name', value: form.name },
  { name: 'agreement', value: form.agree, validator: Boolean }, // 自定义校验
];
```

默认校验规则：字符串去空格后非空、数字不是 `NaN`、布尔值为 `true`、数组长度 > 0、对象拥有键、`Date` 有效。

## 使用示例

```tsx
import { useState, useMemo } from 'react';
import {
  TrackedInput,
  TrackedTextarea,
  TrackedSelect,
  TrackedButton,
  type RequiredFieldState,
} from '@/shared/components/tracking';
import { useTrackingContext } from '@/modules/grade-7-tracking/context/TrackingProvider.jsx';

export function QuestionnaireStep() {
  const { logOperation, session } = useTrackingContext();
  const [form, setForm] = useState({
    name: '',
    reason: '',
    option: '',
  });

  const requiredFields: RequiredFieldState[] = useMemo(
    () => [
      { name: 'answer_name', value: form.name },
      { name: 'answer_reason', value: form.reason },
    ],
    [form.name, form.reason],
  );

  return (
    <form>
      <TrackedInput
        name="answer_name"
        pageNumber={session.pageNum}
        logOperation={logOperation}
        value={form.name}
        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        placeholder="请输入答案"
      />

      <TrackedSelect
        name="answer_option"
        pageNumber={session.pageNum}
        logOperation={logOperation}
        value={form.option}
        onChange={(event) => setForm((prev) => ({ ...prev, option: event.target.value }))}
      >
        <option value="">请选择</option>
        <option value="A">选项 A</option>
        <option value="B">选项 B</option>
      </TrackedSelect>

      <TrackedTextarea
        name="answer_reason"
        pageNumber={session.pageNum}
        logOperation={logOperation}
        value={form.reason}
        onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
        rows={4}
      />

      <TrackedButton
        name="submit_question"
        pageNumber={session.pageNum}
        logOperation={logOperation}
        requiredFields={requiredFields}
        disabled={!form.option}
        type="submit"
      >
        提交
      </TrackedButton>
    </form>
  );
}
```

### 记录 `next_click` 的按钮示例

```tsx
<TrackedButton
  name="button_next"
  pageNumber={session.pageNum}
  logOperation={logOperation}
  isNext
  type="button"
>
  下一页
</TrackedButton>
```

## 集成提示

- 组件默认不会提交数据，仍需业务侧处理 `onChange` / `onClick`
- `logOperation` 常来自 `AppContext` / `useTrackingContext` / 子模块 `userContext.helpers`
- 如果页面需要额外的自定义事件，可继续直接调用 `logOperation`（本目录的类型也可复用）
- 当按钮被“禁用”时建议同步添加视觉样式，例如：

```css
button[data-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.5;
}
```

这样即可在不牺牲埋点精度的情况下保持与原生体验一致。
