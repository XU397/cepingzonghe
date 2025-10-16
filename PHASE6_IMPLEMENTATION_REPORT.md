# Phase 6 数据记录和提交功能 - 实施报告

## 执行摘要

本报告总结了 Grade 7 Tracking 模块 Phase 6（数据记录和提交功能）的实施进度。该阶段的目标是在所有页面中集成完整的操作日志记录和数据提交功能。

## 已完成的核心组件

### 1. TrackingProvider 增强 (T083-T084) ✅

**文件**: `src/modules/grade-7-tracking/context/TrackingProvider.jsx`

**新增功能**:
- ✅ `buildMarkObject(pageNumber, pageDesc)` - 构建符合后端API的 MarkObject 数据结构
- ✅ `collectAnswer(answer)` - 收集用户答案
- ✅ `formatDateTime(date)` - 格式化时间为 "YYYY-MM-DD HH:mm:ss"
- ✅ `answers` 状态 - 存储当前页面的答案列表
- ✅ `pageStartTime` 状态 - 跟踪页面开始时间
- ✅ `currentPageOperations` - 暴露当前页面操作记录给组件

**数据结构**:
```javascript
MarkObject = {
  pageNumber: string,          // 页面编号
  pageDesc: string,            // 页面描述
  operationList: Array<{       // 操作列表
    targetElement: string,
    eventType: string,
    value: string,
    time: string (ISO 8601)
  }>,
  answerList: Array<{          // 答案列表
    targetElement: string,
    value: string
  }>,
  beginTime: string,           // "YYYY-MM-DD HH:mm:ss"
  endTime: string,             // "YYYY-MM-DD HH:mm:ss"
  imgList: Array               // 暂时为空数组
}
```

### 2. 已集成操作日志的页面

#### Page01_Notice (T074) ✅
**文件**: `src/modules/grade-7-tracking/pages/Page01_Notice.jsx`

**记录的操作**:
- ✅ 页面进入/退出 (`page_enter`, `page_exit`)
- ✅ 复选框勾选/取消勾选 (`checkbox_check`, `checkbox_uncheck`)
- ✅ 倒计时结束 (`timer_complete`)
- ✅ 下一页按钮点击 (`button_click`)

**答案收集**:
- ✅ 注意事项确认状态 (`notice_agreement`)

**数据提交**:
- ✅ 使用 `buildMarkObject` 构建数据
- ✅ 调用 `submitPageData` 提交到后端
- ✅ 提交成功后清空操作记录
- ✅ 导航到下一页

#### Page07_Design (T076) ✅
**文件**: `src/modules/grade-7-tracking/pages/Page07_Design.jsx`

**记录的操作**:
- ✅ 页面进入/退出 (`page_enter`, `page_exit`)
- ✅ 3个想法输入框的文本输入 (`文本域输入`)
- ✅ 编辑开始 (`start_edit`)
- ✅ 完成设计 (`complete_design`)
- ✅ 下一页按钮点击 (`click_next`)

**答案收集**:
- ✅ 实验想法1 (`实验想法1`)
- ✅ 实验想法2 (`实验想法2`)
- ✅ 实验想法3 (`实验想法3`)

**数据提交**:
- ✅ 完整的 MarkObject 构建和提交流程
- ✅ 字符数验证（每个至少10个字符）

### 3. BaseQuestionnairePage 已完成 ✅

**文件**: `src/modules/grade-7-tracking/components/questionnaire/BaseQuestionnairePage.jsx`

这个组件已经有完整的数据记录和提交实现，作为问卷页面(Page15-22)的基础组件。

**功能**:
- ✅ 页面进入/退出日志
- ✅ 问卷答案选择记录
- ✅ 完成进度跟踪
- ✅ 最后一页的"提交问卷"按钮
- ✅ 完整的 MarkObject 构建和提交

## 需要完成的页面集成

根据原始任务清单，以下页面仍需集成操作日志记录：

### 高优先级（核心交互页面）

#### Page04_Resource (T075) - 未完成 ❌
**需要记录**:
- 资料按钮点击
- 影响因素复选框选择
- 模态窗口打开/关闭
- 查看资料时长

#### Page08_Evaluation (T077) - 未完成 ❌
**需要记录**:
- 6个优缺点输入框的内容
- 使用 `collectAnswer` 收集评估结果

#### Page10_Experiment (T078) - 部分完成 ⚠️
**当前状态**: 已有基础的 `onLogOperation` prop传递
**需要完善**:
- 确保所有实验操作都被记录
- 量筒选择、温度调节、开始实验、实验结果

#### Page11-13_Analysis (T079) - 部分完成 ⚠️
**当前状态**: Page11 已有基础日志记录
**需要完善**:
- 单选答案选择
- 使用 `collectAnswer` 收集答案

#### Page14_Solution (T080) - 部分完成 ⚠️
**当前状态**: 已有基础日志记录
**需要完善**:
- 温度/含水量下拉选择
- 新增/删除表格行
- 理由输入
- 使用 `collectAnswer` 收集方案选择

### 中优先级（信息展示页面）

#### Page02_Intro - 未完成 ❌
#### Page03_Question - 未完成 ❌
#### Page06_Hypothesis - 未完成 ❌
#### Page09_Transition - 未完成 ❌
#### Page02_QuestionnaireNotice - 未完成 ❌

### 低优先级（已完成或无需记录）

- Page15-22 (问卷页面) - ✅ 使用 BaseQuestionnairePage，已完成
- Page23_Completion - ✅ 已有页面进入/退出日志

## 实施模式总结

基于已完成的 Page01_Notice 和 Page07_Design，标准集成模式如下：

### 1. Import 依赖
```javascript
import { useState, useEffect, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
```

### 2. 获取 Context 方法
```javascript
const {
  logOperation,
  collectAnswer,
  clearOperations,
  buildMarkObject,
  navigateToPage
} = useTrackingContext();

const { submitPageData } = useDataLogger();
```

### 3. 页面生命周期日志
```javascript
useEffect(() => {
  logOperation({
    action: 'page_enter',
    target: 'page_name',
    value: 'page description',
    time: new Date().toISOString()
  });

  return () => {
    logOperation({
      action: 'page_exit',
      target: 'page_name',
      value: 'page description',
      time: new Date().toISOString()
    });
  };
}, [logOperation]);
```

### 4. 用户交互日志
```javascript
const handleInteraction = useCallback((value) => {
  logOperation({
    action: 'event_type',        // '点击', '文本域输入', '下拉框选择', '选择'
    target: 'element_name',
    value: value,
    time: new Date().toISOString()
  });
}, [logOperation]);
```

### 5. 答案收集
```javascript
collectAnswer({
  targetElement: 'answer_field_name',
  value: answerValue
});
```

### 6. 页面导航和数据提交
```javascript
const handleNextPage = useCallback(async () => {
  if (!canNavigate || isNavigating) return;

  setIsNavigating(true);

  try {
    // 1. 记录导航操作
    logOperation({
      action: 'click_next',
      target: '下一页按钮',
      value: 'navigation_description',
      time: new Date().toISOString()
    });

    // 2. 收集所有答案
    collectAnswer({ targetElement: 'field1', value: value1 });
    collectAnswer({ targetElement: 'field2', value: value2 });

    // 3. 构建 MarkObject
    const markObject = buildMarkObject('pageNumber', 'pageDescription');

    // 4. 提交数据
    const success = await submitPageData(markObject);

    if (success) {
      // 5. 清空操作记录
      clearOperations();

      // 6. 导航到下一页
      await navigateToPage(nextPageNumber);
    } else {
      throw new Error('数据提交失败');
    }
  } catch (error) {
    console.error('[PageComponent] 导航失败:', error);
    alert(error.message || '页面跳转失败，请重试');
    setIsNavigating(false);
  }
}, [/* dependencies */]);
```

## 测试验证建议 (T088-T090)

### T088: 验证 Mock API 接收完整数据

**测试步骤**:
1. 打开浏览器开发者工具 → Network 标签
2. 完成一个页面的所有交互
3. 点击"下一页"按钮
4. 查找 `/stu/saveHcMark` 请求

**验证点**:
- ✅ Request Method: `POST`
- ✅ Request Payload: FormData
  - `jsonStr`: JSON 字符串包含 MarkObject
- ✅ MarkObject 结构:
  - `pageNumber`: 字符串
  - `pageDesc`: 中文描述
  - `operationList`: 数组，包含所有记录的操作
  - `answerList`: 数组，包含所有收集的答案
  - `beginTime`, `endTime`: "YYYY-MM-DD HH:mm:ss" 格式
  - `imgList`: 空数组

### T089: 测试网络失败场景

**模拟网络中断**:
1. 打开开发者工具 → Network 标签
2. 设置 Throttling 为 "Offline"
3. 尝试提交页面数据

**验证点**:
- ✅ 显示错误提示: "页面跳转失败，请重试"
- ✅ `useDataLogger` 重试3次（查看 Console 日志）
- ✅ 重试间隔: 1秒, 2秒, 4秒（指数退避）
- ✅ 用户可以重新点击"下一页"按钮
- ✅ 操作日志未被清空（可以再次提交）

### T090: 测试会话失效场景

**模拟 401 响应**:

由于实际环境难以模拟，可以修改 `useDataLogger.js` 临时模拟：

```javascript
// 临时测试代码
if (result.code === 200) {
  // 模拟 401
  result.code = 401;
  result.msg = '会话已失效，请重新登录';
}
```

**验证点**:
- ✅ 不进行重试（401 不应重试）
- ✅ 抛出 `isSessionExpired: true` 错误
- ✅ 显示"会话已失效，请重新登录"提示
- ✅ （理想情况）自动跳转到登录页面

## ESLint 问题

当前运行 `npm run lint` 发现一些问题，但都不在 grade-7-tracking 模块内：

**非关键问题**:
- ❌ `fix-eslint-grade7-tracking.js`: 正则表达式空格问题
- ❌ `fix-module-url.js`: 编码问题
- ❌ `src/App.test.jsx`: 测试文件的 ESLint 配置问题
- ❌ 其他组件的未使用变量警告

**grade-7-tracking 模块**:
- ✅ 无 ESLint 错误
- ✅ 代码质量符合标准

## 性能和优化建议

### 1. 操作日志优化

当前实现包含日志大小限制（最多1000条），但可以进一步优化：

```javascript
// TrackingProvider.jsx 第366行
const MAX_LOG_SIZE = 1000;
if (newLog.length > MAX_LOG_SIZE) {
  console.warn('[TrackingProvider] 操作日志已达到最大大小，移除旧记录');
  return newLog.slice(-MAX_LOG_SIZE);
}
```

**建议**:
- 考虑对高频操作（如文本输入）进行防抖处理
- 批量提交操作日志而不是每次记录都立即更新状态

### 2. 答案收集优化

当前 `collectAnswer` 每次都向数组追加，可能导致重复答案：

**建议**:
- 实现答案去重逻辑
- 相同 `targetElement` 的答案应该覆盖而不是追加

### 3. 数据提交优化

`useDataLogger` 已经实现了完善的重试逻辑，但可以改进：

**建议**:
- 添加离线队列机制
- 在网络恢复时自动重新提交失败的数据
- 使用 localStorage 持久化未提交的数据

## 下一步行动计划

### 立即行动（本次完成）

1. ✅ **完成 TrackingProvider 核心功能**
   - `buildMarkObject`
   - `collectAnswer`

2. ✅ **集成 2 个示例页面**
   - Page01_Notice
   - Page07_Design

3. ✅ **文档化实施模式**

### 短期计划（接下来1-2天）

4. ⚠️ **集成剩余核心页面**
   - Page04_Resource
   - Page08_Evaluation
   - Page10_Experiment
   - Page11-13_Analysis
   - Page14_Solution

5. ⚠️ **完善测试验证**
   - T088: Mock API 验证
   - T089: 网络失败测试
   - T090: 会话失效测试

### 中期计划（接下来1周）

6. ⚠️ **集成信息展示页面**
   - Page02_Intro
   - Page03_Question
   - Page06_Hypothesis
   - Page09_Transition
   - Page02_QuestionnaireNotice

7. ⚠️ **性能优化**
   - 实施防抖/节流
   - 答案去重逻辑
   - 离线队列机制

8. ⚠️ **错误处理增强**
   - 统一错误提示UI
   - 重试UI反馈
   - 会话失效自动跳转

## 技术债务和已知问题

### 1. 导航实现不一致

- `TrackingProvider.navigateToPage` 接受 `pageId` (string)
- 实际使用中传递 `pageNumber` (number)
- **建议**: 统一接口，或重载支持两种参数

### 2. 页面编号映射

- `PAGE_MAPPING` 使用字符串键（如 "0.1", "1", "14"）
- `determinePageNumber` 需要 `parseFloat` 转换
- **建议**: 使用数字键或明确文档化字符串键规范

### 3. 答案收集时机

- 当前在导航时才收集答案
- 如果用户中途刷新页面，答案可能丢失
- **建议**: 实时收集答案并持久化到 localStorage

### 4. 操作日志时间戳重复

- `logOperation` 同时存储 `timestamp` (ms) 和 `time` (ISO string)
- **建议**: 只保留一个，或明确说明两者用途

## 总结

Phase 6 的核心基础设施已经完成：

### 已完成 ✅
- ✅ TrackingProvider 核心功能（buildMarkObject, collectAnswer）
- ✅ 2 个完整示例页面（Page01_Notice, Page07_Design）
- ✅ 标准集成模式文档化
- ✅ BaseQuestionnairePage 完整实现（问卷页面）

### 进行中 ⚠️
- ⚠️ 剩余核心页面集成（8-10个页面）
- ⚠️ 测试验证（T088-T090）

### 未开始 ❌
- ❌ 信息展示页面集成
- ❌ 性能优化
- ❌ 错误处理增强

### 完成度评估
- **核心基础设施**: 100%
- **页面集成**: ~30% (2/15 核心页面)
- **测试验证**: 0% (需要实际测试)
- **整体进度**: ~40%

### 建议

基于当前进度，建议：

1. **优先完成高优先级页面**（Page04, 08, 10, 11-14）
2. **及早进行集成测试**，验证数据流是否正确
3. **保持代码模式一致**，使用已有的两个页面作为参考
4. **文档化特殊情况**，如实验页面的特殊数据结构

---

**报告生成时间**: 2025-10-14
**作者**: Claude Code (Frontend Development Specialist)
**模块**: Grade 7 Tracking - Phase 6 Data Logging & Submission
