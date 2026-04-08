# 子模块页码格式迁移任务

> **目标**：将 4 个子模块的页码格式从旧格式 `<stepIndex>.<subPageNum>` 迁移到新格式 `<submoduleIndex>.<pageIndexTwoDigits>`
>
> **核心变更**：`submoduleIndex = stepIndex + 1`，pageIndex 使用两位零填充
>
> **验证正则**：`^[1-9]\d*\.\d{2}$`

---

## 快速参考

| 旧格式 | 新格式 | 说明 |
|--------|--------|------|
| `0.1`  | `1.01` | stepIndex=0, subPageNum=1 |
| `0.3`  | `1.03` | stepIndex=0, subPageNum=3 |
| `1.5`  | `2.05` | stepIndex=1, subPageNum=5 |
| `2.10` | `3.10` | stepIndex=2, subPageNum=10 |

**转换公式**：
```javascript
// 旧代码
const pageNumber = `${stepIndex}.${subPageNum}`;

// 新代码
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
const pageNumber = encodeCompositePageNum(stepIndex + 1, parseInt(subPageNum, 10) || 1);
```

---

## 1. g8-drone-imaging

### 1.1 需修改的文件

#### 1.1.1 `src/submodules/g8-drone-imaging/Component.tsx`

**位置 1 - 第 158 行**：
```typescript
// 旧代码
const currentPageNumber = encodeCompositePageNum(stepIndex, subPageNum);

// 新代码
const currentPageNumber = encodeCompositePageNum(stepIndex + 1, subPageNum);
```

**位置 2 - 第 369 行**：
```typescript
// 旧代码
const currentPageNumber = encodeCompositePageNum(stepIndex, subPageNum);

// 新代码
const currentPageNumber = encodeCompositePageNum(stepIndex + 1, subPageNum);
```

**位置 3 - 第 497 行**：
```typescript
// 旧代码
pageNumber: encodeCompositePageNum(stepIndex, subPageNum),

// 新代码
pageNumber: encodeCompositePageNum(stepIndex + 1, subPageNum),
```

#### 1.1.2 `src/submodules/g8-drone-imaging/context/DroneImagingContext.tsx`

**位置 - 第 148 行**：
```typescript
// 旧代码
export const getPagePrefix = (subPageNum: number, stepIndex: number) => {
  const pageNumber = encodeCompositePageNum(stepIndex, subPageNum);
  return `P${pageNumber}_`;
};

// 新代码
export const getPagePrefix = (subPageNum: number, stepIndex: number) => {
  const pageNumber = encodeCompositePageNum(stepIndex + 1, subPageNum);
  return `P${pageNumber}_`;
};
```

### 1.2 测试文件更新

需要更新以下测试文件中的 `STEP_INDEX` 使用方式：

- `src/submodules/g8-drone-imaging/pages/__tests__/Page03_Hypothesis.test.tsx:40`
- `src/submodules/g8-drone-imaging/pages/__tests__/Page05_FocalAnalysis.test.tsx:40`
- `src/submodules/g8-drone-imaging/pages/__tests__/Page06_HeightAnalysis.test.tsx:40`
- `src/submodules/g8-drone-imaging/pages/__tests__/Page07_Conclusion.test.tsx:33`

**修改模式**：
```typescript
// 旧代码
const STEP_INDEX = 0;
const PREFIX = `P${encodeCompositePageNum(STEP_INDEX, 7)}_`;

// 新代码
const STEP_INDEX = 0;
const PREFIX = `P${encodeCompositePageNum(STEP_INDEX + 1, 7)}_`;
// 结果：P1.07_（而非 P0.7_）
```

### 1.3 验证检查清单

- [ ] Component.tsx 中 3 处 `encodeCompositePageNum` 调用已添加 `+ 1`
- [ ] DroneImagingContext.tsx 中 `getPagePrefix` 已添加 `+ 1`
- [ ] 4 个测试文件已更新
- [ ] 运行 `npm test -- src/submodules/g8-drone-imaging` 通过
- [ ] 本地测试提交数据格式正确（如 `1.01` 而非 `0.1`）

---

## 2. g8-mikania-experiment

### 2.1 需修改的文件

此子模块使用内联模板字符串生成页码，需要改为使用 `encodeCompositePageNum` 函数。

#### 2.1.1 `src/submodules/g8-mikania-experiment/Component.jsx`

**位置 - 第 318-322 行**：
```javascript
// 旧代码
const pageNumber = useMemo(() => {
  return typeof flowStepIndex === 'number'
    ? `${flowStepIndex}.${subPageNum}`
    : String(subPageNum);
}, [flowStepIndex, subPageNum]);

// 新代码
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
// ...
const pageNumber = useMemo(() => {
  return typeof flowStepIndex === 'number'
    ? encodeCompositePageNum(flowStepIndex + 1, parseInt(subPageNum, 10) || 1)
    : String(subPageNum).padStart(2, '0');
}, [flowStepIndex, subPageNum]);
```

#### 2.1.2 页面组件（共 7 个文件，相同模式）

需要修改的文件列表：
- `src/submodules/g8-mikania-experiment/pages/Page00_Notice.jsx:29-31`
- `src/submodules/g8-mikania-experiment/pages/Page01_Intro.jsx:20-22`
- `src/submodules/g8-mikania-experiment/pages/Page02_Step_Q1.jsx:30-32`
- `src/submodules/g8-mikania-experiment/pages/Page03_Sim_Exp.jsx:27-29`
- `src/submodules/g8-mikania-experiment/pages/Page04_Q2_Data.jsx:30-32`
- `src/submodules/g8-mikania-experiment/pages/Page05_Q3_Trend.jsx:30-32`
- `src/submodules/g8-mikania-experiment/pages/Page06_Q4_Conc.jsx:38-40`

**统一修改模式**：
```javascript
// 旧代码
const pageNumber = useMemo(() => {
  return typeof flowStepIndex === 'number' ? `${flowStepIndex}.${subPageNum}` : String(subPageNum);
}, [flowStepIndex, subPageNum]);

// 新代码
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
// ...
const pageNumber = useMemo(() => {
  return typeof flowStepIndex === 'number'
    ? encodeCompositePageNum(flowStepIndex + 1, parseInt(subPageNum, 10) || 1)
    : String(subPageNum).padStart(2, '0');
}, [flowStepIndex, subPageNum]);
```

#### 2.1.3 `src/submodules/g8-mikania-experiment/components/ExperimentPanel/index.jsx`

**位置 - 第 69-73 行**：
```javascript
// 旧代码
const computedPageNumber = useMemo(() => {
  return typeof flowStepIndex === 'number'
    ? `${flowStepIndex}.${subPageNum}`
    : String(subPageNum);
}, [flowStepIndex, subPageNum]);

// 新代码
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
// ...
const computedPageNumber = useMemo(() => {
  return typeof flowStepIndex === 'number'
    ? encodeCompositePageNum(flowStepIndex + 1, parseInt(subPageNum, 10) || 1)
    : String(subPageNum).padStart(2, '0');
}, [flowStepIndex, subPageNum]);
```

### 2.2 验证检查清单

- [ ] Component.jsx 已更新
- [ ] 7 个页面组件已更新（Page00-Page06）
- [ ] ExperimentPanel/index.jsx 已更新
- [ ] 所有文件已添加 `import { encodeCompositePageNum } from '@shared/utils/pageMapping';`
- [ ] 运行 `npm test -- src/submodules/g8-mikania-experiment` 通过
- [ ] 本地测试提交数据格式正确

---

## 3. g8-pv-sand-experiment

### 3.1 需修改的文件

#### 3.1.1 `src/submodules/g8-pv-sand-experiment/Component.tsx`

**位置 - 第 62-64 行**：
```typescript
// 旧代码
const formatPageNumber = (stepIndex: number | undefined, subPageNum: number) => {
  const safeStep = typeof stepIndex === 'number' ? stepIndex : 0;
  return `${safeStep}.${subPageNum}`;
};

// 新代码
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
// ...
const formatPageNumber = (stepIndex: number | undefined, subPageNum: number) => {
  const safeStep = typeof stepIndex === 'number' ? stepIndex + 1 : 1;
  return encodeCompositePageNum(safeStep, subPageNum);
};
```

**注意**：此函数在第 174 行被调用，无需修改调用处。

### 3.2 验证检查清单

- [ ] `formatPageNumber` 函数已更新
- [ ] 已添加 `import { encodeCompositePageNum } from '@shared/utils/pageMapping';`
- [ ] 运行 `npm test -- src/submodules/g8-pv-sand-experiment` 通过
- [ ] 本地测试提交数据格式正确（如 `1.01` 而非 `0.1`）

---

## 4. g7-experiment (grade-7 wrapper)

### 4.1 需修改的文件

#### 4.1.1 `src/modules/grade-7/wrapper.jsx`

**位置 - 第 142 行**：
```javascript
// 旧代码
const pageNumber = encodeCompositePageNum(stepIndex, parseInt(subPageNum, 10) || 1);

// 新代码
const pageNumber = encodeCompositePageNum(stepIndex + 1, parseInt(subPageNum, 10) || 1);
```

### 4.2 验证检查清单

- [ ] wrapper.jsx 已添加 `+ 1`
- [ ] 运行 `npm test -- src/modules/grade-7` 通过
- [ ] 本地测试提交数据格式正确

---

## 通用验证步骤

每个子模块迁移完成后执行：

### 1. 单元测试
```bash
npm test -- src/submodules/<submodule-name>
# 或
npm test -- src/modules/<module-name>
```

### 2. 格式验证

在浏览器开发者工具的 Network 面板中检查 `/stu/saveHcMark` 请求：

```javascript
// 解析 FormData 中的 mark 字段
const markData = JSON.parse(formData.get('mark'));

// 验证 pageNumber 格式
const isValid = /^[1-9]\d*\.\d{2}$/.test(markData.pageNumber);
console.log('pageNumber:', markData.pageNumber, 'valid:', isValid);

// 验证 targetElement 前缀格式
markData.answerList.forEach(answer => {
  const prefixValid = /^P[1-9]\d*\.\d{2}_.+/.test(answer.targetElement);
  console.log('targetElement:', answer.targetElement, 'valid:', prefixValid);
});
```

### 3. 预期输出示例

对于 stepIndex=0, subPageNum=3：

| 字段 | 旧格式 | 新格式 |
|------|--------|--------|
| pageNumber | `0.3` | `1.03` |
| targetElement | `P0.3_按钮` | `P1.03_按钮` |
| pageDesc | `P0.3_页面描述` | `P1.03_页面描述` |

---

## 常见问题

### Q1: 为什么 submoduleIndex 从 1 开始？
后端要求页码格式不以 0 开头，便于区分和解析。

### Q2: 如果子模块不在 Flow 中运行怎么办？
当 `flowStepIndex` 为 `undefined` 时，使用 fallback 格式 `String(subPageNum).padStart(2, '0')`。

### Q3: 如何处理旧数据？
`parseCompositePageNum` 函数保留了对 `0.*` 格式的读取兼容，但不再生成此格式。

---

## 参考文档

- [复合页码格式迁移指南](./composite-page-numbering-migration-guide.md)
- [子模块数据提交规范](./submodule-submission-guidelines.md)
- [页码映射工具源码](../src/shared/utils/pageMapping.ts)
