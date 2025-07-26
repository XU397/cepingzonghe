# 数据记录规范文档

## 1. 概述

本规范定义了蒸馒头科学探究任务系统中用户行为数据的记录标准和实施方法。系统需要记录用户从登录到任务完成的所有交互行为，并以标准格式提交给后端。

## 2. 数据记录格式

### 2.1 页面数据提交格式

每个页面的数据提交格式如下：

```json
{
  "batchCode": "测评批次号",
  "examNo": "学生考号", 
  "mark": {
    "pageNumber": "页面编号",
    "pageDesc": "页面描述",
    "operationList": [
      {
        "code": 1,
        "targetElement": "交互元素描述",
        "value": "操作值/结果",
        "eventType": "交互类型",
        "time": "2025-05-16 09:41:26"
      }
    ],
    "answerList": [
      {
        "code": 1,
        "targetElement": "问题/答案元素描述", 
        "value": "答案值"
      }
    ],
    "beginTime": "2025-05-16 09:41:11",
    "endTime": "2025-05-16 09:41:27",
    "imgList": []
  }
}
```

### 2.2 页面编号和描述规则

| 页面ID | pageNumber | pageDesc | 是否在进度中 |
|--------|------------|----------|-------------|
| Page_Login | "Login" | "用户登录" | 否 |
| Page_01_Precautions | "1" | "注意事项" | 否 |
| Page_02_Introduction | "2" | "第一题" | 是（进度1） |
| Page_03_Dialogue_Question | "3" | "第二题" | 是（进度2） |
| Page_04_Material_Reading_Factor_Selection | "4" | "第三题" | 是（进度3） |
| Page_10_Hypothesis_Focus | "10" | "第四题" | 是（进度4） |
| Page_11_Solution_Design_Measurement_Ideas | "11" | "第五题" | 是（进度5） |
| Page_12_Solution_Evaluation_Measurement_Critique | "12" | "第六题" | 是（进度6） |
| Page_13_Transition_To_Simulation | "13" | "第七题" | 是（进度7） |
| Page_14_Simulation_Intro_Exploration | "14" | "第八题" | 是（进度8） |
| Page_15_Simulation_Question_1 | "15" | "第九题" | 是（进度9） |
| Page_16_Simulation_Question_2 | "16" | "第十题" | 是（进度10） |
| Page_17_Simulation_Question_3 | "17" | "第十一题" | 是（进度11） |
| Page_18_Solution_Selection | "18" | "第十二题" | 是（进度12） |
| Page_19_Task_Completion | "19" | "第十三题" | 是（进度13） |

## 3. 交互类型定义

### 3.1 基础交互类型

| eventType | 描述 | 适用场景 |
|-----------|------|---------|
| `input` | 文本输入 | 输入框输入内容 |
| `input_blur` | 输入框失焦 | 输入框失去焦点时 |
| `click` | 点击操作 | 按钮点击、链接点击 |
| `checkbox_check` | 复选框选中 | 勾选复选框 |
| `checkbox_uncheck` | 复选框取消 | 取消复选框 |
| `radio_select` | 单选按钮选择 | 选择单选按钮 |
| `modal_open` | 模态框打开 | 打开弹窗/模态框 |
| `modal_close` | 模态框关闭 | 关闭弹窗/模态框 |
| `timer_start` | 计时开始 | 模拟实验计时开始 |
| `timer_stop` | 计时停止 | 模拟实验计时停止 |
| `page_enter` | 页面进入 | 进入页面时 |
| `page_exit` | 页面退出 | 离开页面时 |
| `submit` | 数据提交 | 提交页面数据 |

### 3.2 特殊交互类型

| eventType | 描述 | 适用场景 |
|-----------|------|---------|
| `view_material` | 查看资料 | 点击资料链接 |
| `simulation_operation` | 模拟实验操作 | 模拟实验中的操作 |
| `table_cell_edit` | 表格单元格编辑 | 编辑表格数据 |
| `drag_drop` | 拖拽操作 | 拖拽排序等 |

## 4. 数据记录实施规范

### 4.1 页面级别记录

每个页面组件必须实现：

1. **页面进入记录**：组件挂载时记录 `beginTime`
2. **交互操作记录**：每个用户交互都要调用 `logOperation`
3. **答案收集**：收集用户的答案调用 `collectAnswer`
4. **页面退出记录**：页面卸载/导航时记录 `endTime` 并提交数据

### 4.2 输入框记录规范

所有输入框必须记录：

1. **输入过程记录**：`onChange` 事件记录输入内容
2. **失焦记录**：`onBlur` 事件必须记录，eventType 为 `input_blur`
3. **最终答案收集**：失焦时收集最终答案

示例代码：
```jsx
const handleInputChange = (e) => {
  const value = e.target.value;
  setValue(value);
  
  logOperation({
    targetElement: '问题输入框',
    eventType: 'input',
    value: value
  });
};

const handleInputBlur = (e) => {
  const value = e.target.value;
  
  logOperation({
    targetElement: '问题输入框',
    eventType: 'input_blur',
    value: value
  });
  
  collectAnswer({
    targetElement: '问题答案',
    value: value
  });
};
```

### 4.3 复选框/单选框记录规范

```jsx
const handleCheckboxChange = (e) => {
  const checked = e.target.checked;
  const elementName = e.target.name;
  
  logOperation({
    targetElement: `${elementName}复选框`,
    eventType: checked ? 'checkbox_check' : 'checkbox_uncheck',
    value: checked ? '选中' : '取消选中'
  });
  
  collectAnswer({
    targetElement: elementName,
    value: checked
  });
};
```

### 4.4 按钮点击记录规范

```jsx
const handleButtonClick = (buttonName, action) => {
  logOperation({
    targetElement: `${buttonName}按钮`,
    eventType: 'click',
    value: action
  });
};
```

### 4.5 模态框记录规范

```jsx
const openModal = (modalId) => {
  setModalOpen(true);
  setModalOpenTime(new Date());
  
  logOperation({
    targetElement: `${modalId}模态框`,
    eventType: 'modal_open',
    value: modalId
  });
};

const closeModal = () => {
  const viewDuration = Math.floor((new Date() - modalOpenTime) / 1000);
  
  logOperation({
    targetElement: `${modalId}模态框`,
    eventType: 'modal_close',
    value: `查看时长${viewDuration}秒`
  });
  
  setModalOpen(false);
};
```

## 5. 数据提交规范

### 5.1 提交时机

1. **页面切换时**：离开当前页面时自动提交
2. **任务完成时**：到达最后一页时提交
3. **异常情况**：页面刷新、关闭时尝试提交

### 5.2 API调用规范

使用POST方法提交到 `/stu/submitPageMarkData` 端点：

```javascript
const response = await fetch('/stu/submitPageMarkData', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    batchCode,
    examNo,
    mark: {
      pageNumber,
      pageDesc,
      operationList,
      answerList,
      beginTime,
      endTime,
      imgList: []
    }
  })
});
```

### 5.3 错误处理

1. **网络错误**：重试机制，最多重试3次
2. **数据完整性**：提交前验证数据格式
3. **用户反馈**：提交失败时显示友好提示

## 6. 时间格式规范

所有时间记录使用统一格式：`YYYY-MM-DD HH:mm:ss`

示例：`2025-05-16 09:41:26`

## 7. 数据验证规范

### 7.1 必填字段验证

- `pageNumber`、`pageDesc`：不能为空
- `beginTime`、`endTime`：必须是有效时间格式
- `batchCode`、`examNo`：必须来自登录响应

### 7.2 数据类型验证

- `operationList`、`answerList`：必须是数组
- `code`：必须是正整数
- `time`：必须符合时间格式规范

## 8. 性能优化建议

1. **批量提交**：避免频繁的单次操作提交
2. **数据压缩**：大量数据时考虑压缩
3. **本地缓存**：提交失败时本地缓存，待网络恢复后重试
4. **异步处理**：数据记录不阻塞用户交互

## 9. 安全和隐私

1. **数据加密**：敏感数据传输时加密
2. **数据最小化**：只记录必要的用户行为数据
3. **数据清理**：定期清理本地缓存的数据
4. **用户同意**：确保用户知情并同意数据收集

## 10. 测试验证

1. **单元测试**：每个数据记录函数的单元测试
2. **集成测试**：整个数据流的集成测试
3. **用户测试**：真实用户场景下的数据完整性测试
4. **性能测试**：大量数据记录时的性能测试 