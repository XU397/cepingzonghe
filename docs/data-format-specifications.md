# 数据格式规范文档

## 概述

本文档定义了7年级测评系统各模块的数据提交格式规范，确保前后端数据交互的一致性和可维护性。

**版本**: 1.0.0
**最后更新**: 2025-11-05
**适用范围**: 7年级蒸馒头模块、7年级追踪测评模块

---

## 一、通用数据结构

### 1.1 MarkObject 顶层结构

所有模块提交到后端的数据都必须遵循以下结构：

```typescript
interface MarkObject {
  pageNumber: string;           // 页面编号（字符串格式）
  pageDesc: string;             // 页面描述
  operationList: Operation[];   // 用户操作列表
  answerList: Answer[];         // 用户答案列表
  beginTime: string;            // 页面开始时间 "YYYY-MM-DD HH:mm:ss"
  endTime: string;              // 页面结束时间 "YYYY-MM-DD HH:mm:ss"
  imgList: ImageInfo[];         // 图片列表（通常为空数组）
}
```

**示例**:
```json
{
  "pageNumber": "10",
  "pageDesc": "模拟实验",
  "operationList": [...],
  "answerList": [...],
  "beginTime": "2025-11-05 14:23:12",
  "endTime": "2025-11-05 14:28:45",
  "imgList": []
}
```

---

## 二、operationList 结构规范

### 2.1 Operation 对象定义

```typescript
interface Operation {
  code: number;              // 操作序号，从1开始递增
  targetElement: string;     // 目标元素描述
  eventType: string;         // 事件类型（标准化后的值）
  value: string | object;    // 操作值（字符串或对象）
  time: string;              // 操作时间 "YYYY-MM-DD HH:mm:ss"
  pageId: string;            // 页面标识符，如 "Page_10"
}
```

**示例**:
```json
{
  "code": 5,
  "targetElement": "计时开始按钮",
  "eventType": "simulation_timing_started",
  "value": "温度40°C",
  "time": "2025-11-05 14:25:30",
  "pageId": "Page_10"
}
```

### 2.2 标准事件类型清单

| eventType | 描述 | 适用场景 |
|-----------|------|---------|
| `page_enter` | 页面进入 | 所有页面 |
| `page_exit` | 页面离开 | 所有页面 |
| `click` | 点击操作 | 按钮、链接 |
| `input` | 文本输入 | 文本框、文本域 |
| `input_blur` | 输入框失焦 | 文本框、文本域 |
| `radio_select` | 单选按钮选择 | 单选题 |
| `checkbox_check` | 复选框选中 | 复选题 |
| `checkbox_uncheck` | 复选框取消 | 复选题 |
| `modal_open` | 模态框打开 | 资料查看、提示框 |
| `modal_close` | 模态框关闭 | 资料查看、提示框 |
| `view_material` | 查看资料 | 资料阅读 |
| `timer_start` | 计时器启动 | 倒计时、计时功能 |
| `timer_stop` | 计时器停止 | 倒计时、计时功能 |
| `simulation_timing_started` | 模拟实验计时开始 | **实验页面** |
| `simulation_run_result` | 模拟实验运行结果 | **实验页面** |
| `simulation_operation` | 模拟实验操作 | 实验交互 |
| `questionnaire_answer` | 问卷答题 | 问卷调查 |

**⚠️ 重要**：
- 实验相关事件（`simulation_*`）的 `value` 字段通常为**对象类型**
- 普通操作的 `value` 字段通常为**字符串类型**

---

## 三、answerList 结构规范

### 3.1 Answer 对象定义

```typescript
interface Answer {
  code: number;              // 答案序号，从1开始递增
  targetElement: string;     // 答题元素描述
  value: string;             // 答案值（字符串格式）
}
```

**示例**:
```json
{
  "code": 1,
  "targetElement": "analysis_q1",
  "value": "15%"
}
```

### 3.2 问卷答案特殊格式

问卷页面（14-21）的答案格式：

```json
{
  "code": 2,
  "targetElement": "P14_问题2",
  "value": "非常同意"
}
```

---

## 四、实验数据格式规范

### 4.1 simulation_run_result 通用结构

实验结果数据使用对象格式，包含以下核心字段：

```typescript
interface SimulationResult {
  Run_ID: string;            // 运行唯一标识符
  Set_<Variable>: number;    // 设定的自变量（字段名因实验而异）
  Results: ExperimentResult[]; // 实验结果数组
}
```

### 4.2 模块间实验数据字段映射

#### 🍞 蒸馒头模块（面团发酵实验）

**实验设计**:
- **自变量**: 发酵时间（1-8小时）
- **因变量**: 面团体积（mL）
- **控制变量**: 5个恒温箱温度（20°C, 25°C, 30°C, 35°C, 40°C）

**数据格式**:
```json
{
  "code": 15,
  "targetElement": "模拟实验运行结果",
  "eventType": "simulation_run_result",
  "value": {
    "Run_ID": "run_Page_14_Simulation_Intro_Exploration_3",
    "Set_Time": 5,
    "Results": [
      { "Temp": 20, "Volume": 85 },
      { "Temp": 25, "Volume": 102 },
      { "Temp": 30, "Volume": 123 },
      { "Temp": 35, "Volume": 145 },
      { "Temp": 40, "Volume": 132 }
    ]
  },
  "time": "2025-11-05 14:23:45",
  "pageId": "Page_14_Simulation_Intro_Exploration"
}
```

**字段说明**:
| 字段 | 类型 | 描述 | 单位 |
|------|------|------|------|
| `Set_Time` | number | 设定的发酵时间 | 小时 (h) |
| `Temp` | number | 恒温箱温度 | 摄氏度 (°C) |
| `Volume` | number | 面团体积 | 毫升 (mL) |

---

#### 🍯 追踪测评模块（蜂蜜粘度实验）

**实验设计**:
- **自变量**: 恒温箱温度（25°C, 30°C, 35°C, 40°C, 45°C）
- **因变量**: 小钢球下落时间（秒）
- **控制变量**: 4个含水量的蜂蜜（15%, 17%, 19%, 21%）

**数据格式**:
```json
{
  "code": 8,
  "targetElement": "模拟实验运行结果",
  "eventType": "simulation_run_result",
  "value": {
    "Run_ID": "run_Page_10_Experiment_1",
    "Set_Temperature": 40,
    "Results": [
      { "WaterContent": 15, "FallTime": 23.5 },
      { "WaterContent": 17, "FallTime": 18.2 },
      { "WaterContent": 19, "FallTime": 14.8 },
      { "WaterContent": 21, "FallTime": 11.3 }
    ]
  },
  "time": "2025-11-05 14:23:45",
  "pageId": "Page_10"
}
```

**字段说明**:
| 字段 | 类型 | 描述 | 单位 |
|------|------|------|------|
| `Set_Temperature` | number | 设定的恒温箱温度 | 摄氏度 (°C) |
| `WaterContent` | number | 蜂蜜含水量 | 百分比 (%) |
| `FallTime` | number | 小钢球下落时间 | 秒 (s) |

---

### 4.3 字段映射对照表

| 模块 | 自变量字段 | 因变量1 | 因变量2 | Results数组长度 |
|------|-----------|---------|---------|----------------|
| **蒸馒头** | `Set_Time` (小时) | `Temp` (°C) | `Volume` (mL) | 5 |
| **追踪测评** | `Set_Temperature` (°C) | `WaterContent` (%) | `FallTime` (s) | 4 |

**⚠️ 后端处理建议**：

由于字段名差异，后端需要根据 `pageId` 或模块标识动态选择解析逻辑：

```javascript
function parseExperimentResult(pageId, value) {
  if (pageId.includes('Simulation_Intro_Exploration') ||
      pageId.includes('Simulation_Question')) {
    // 蒸馒头模块
    return {
      variable: value.Set_Time,
      variableType: 'Time',
      unit: 'hours',
      results: value.Results.map(r => ({
        temperature: r.Temp,
        volume: r.Volume
      }))
    };
  } else if (pageId.startsWith('Page_') &&
             (pageId.includes('Experiment') || pageId.includes('Analysis'))) {
    // 追踪测评模块
    return {
      variable: value.Set_Temperature,
      variableType: 'Temperature',
      unit: 'celsius',
      results: value.Results.map(r => ({
        waterContent: r.WaterContent,
        fallTime: r.FallTime
      }))
    };
  }

  throw new Error('Unknown experiment type');
}
```

---

## 五、时间格式规范

### 5.1 标准时间格式

所有时间字段必须使用以下格式：

```
YYYY-MM-DD HH:mm:ss
```

**示例**:
- `"2025-11-05 14:23:45"`
- `"2025-12-31 23:59:59"`

### 5.2 时区处理

- 所有时间均为**客户端本地时间**
- 后端需记录用户时区或转换为UTC存储
- 分析时需考虑时区差异

---

## 六、数据验证规范

### 6.1 前端验证

在调用 `submitPageData` 前，必须确保：

1. **MarkObject 结构完整**
   - 所有必需字段存在
   - `operationList` 和 `answerList` 为数组
   - 时间格式正确

2. **operationList 验证**
   - 每个操作包含 `code`, `targetElement`, `eventType`, `value`, `time`, `pageId`
   - `code` 从1开始递增
   - `eventType` 为标准事件类型之一

3. **answerList 验证**
   - 每个答案包含 `code`, `targetElement`, `value`
   - `code` 从1开始递增

4. **实验数据验证**
   - `simulation_run_result` 的 `value` 必须包含 `Run_ID`, `Set_*`, `Results`
   - `Results` 数组不为空
   - 数值字段类型正确

### 6.2 后端验证

后端应实现以下验证逻辑：

```typescript
interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'enum' | 'range';
  constraint?: any;
}

const MARK_OBJECT_RULES: ValidationRule[] = [
  { field: 'pageNumber', type: 'required' },
  { field: 'pageDesc', type: 'required' },
  { field: 'operationList', type: 'type', constraint: 'array' },
  { field: 'answerList', type: 'type', constraint: 'array' },
  { field: 'beginTime', type: 'required' },
  { field: 'endTime', type: 'required' }
];
```

---

## 七、版本兼容性

### 7.1 向后兼容性承诺

- ✅ 新增字段不影响旧版本后端
- ✅ 字段类型保持不变
- ⚠️ 删除字段需提前通知（至少2个版本周期）

### 7.2 已知兼容性变更

| 版本 | 变更内容 | 影响范围 | 迁移建议 |
|------|---------|---------|---------|
| v1.0.0 | 初始版本 | - | - |
| v1.0.1 | `operationList` 添加 `code` 和 `pageId` | 追踪测评模块 | 后端兼容两种格式 |
| v1.0.2 | `answerList` 添加 `code` 字段 | 追踪测评模块 | 后端兼容两种格式 |

---

## 八、最佳实践

### 8.1 前端开发建议

1. **使用 TypeScript 类型定义**
   ```typescript
   import type { MarkObject, Operation, Answer } from '@/types/data-format';
   ```

2. **集中管理事件类型**
   ```typescript
   export const EventTypes = {
     PAGE_ENTER: 'page_enter',
     PAGE_EXIT: 'page_exit',
     SIMULATION_TIMING_STARTED: 'simulation_timing_started',
     // ...
   } as const;
   ```

3. **实现数据验证函数**
   ```typescript
   function validateMarkObject(data: unknown): data is MarkObject {
     // 实现验证逻辑
   }
   ```

### 8.2 后端开发建议

1. **实现灵活的字段解析**
   - 根据 `pageId` 或模块标识识别数据格式
   - 支持多种实验数据结构

2. **记录原始数据**
   - 保存完整的JSON原文
   - 便于后续数据迁移和格式调整

3. **提供数据校验API**
   - 前端可在开发时验证数据格式
   - 返回详细的错误信息

---

## 九、常见问题

### Q1: 为什么实验数据的字段名不统一？

**A**: 字段名反映了不同的实验设计和物理意义：
- 蒸馒头实验：自变量是时间 (`Set_Time`)
- 蜂蜜实验：自变量是温度 (`Set_Temperature`)

统一字段名会丧失语义清晰性，后端通过模块识别可灵活处理。

### Q2: answerList 的 code 字段是必需的吗？

**A**: **推荐添加**，但不强制：
- 蒸馒头模块包含 `code` 字段
- 追踪测评模块 v1.0.2+ 已添加
- 后端应兼容有无 `code` 的两种格式

### Q3: 如何处理大量的操作记录？

**A**:
- 前端限制 `operationList` 最大长度（建议1000条）
- 超出限制时只保留重要操作
- 后端分页存储和查询

### Q4: 时间格式能否使用 ISO 8601？

**A**: 当前标准为 `YYYY-MM-DD HH:mm:ss`，修改需要：
- 前后端同步升级
- 至少2个版本的兼容期
- 明确的迁移方案

---

## 十、联系与反馈

**文档维护**: 前端开发团队
**技术支持**: backend-team@example.com
**问题反馈**: GitHub Issues

**最后更新**: 2025-11-05
**下次审查**: 2025-12-05
