# 后端协调完成总结

**日期**: 2025-10-14
**状态**: ✅ 已完成所有协调工作

---

## 协调结果概览

根据后端团队的反馈，前后端协调工作已全部完成。以下是确认的关键信息和完成的文档更新。

---

## 一、后端确认的关键信息

### 1.1 URL 路径 ✅

**确定的 URL**: `/grade-7-tracking`

**理由**:
- 与前端 moduleId 保持一致
- 语义清晰，便于扩展
- 与模块目录名对应

### 1.2 页面编号格式 ✅

**支持小数页码**: 是（如 `"0.1"`, `"3.5"`）

**后端存储格式**: 页码 × 100
- 示例：`"3.5"` 存储为 `350`
- 示例：`"0.1"` 存储为 `10`

**前端使用格式**: 字符串（如 `"3.5"`）
- 前端接收到的 `pageNum` 为字符串格式
- 直接使用即可，无需转换

### 1.3 数据提交接口 ✅

**接口**: `POST /stu/saveHcMark`

**确认结果**: 不需要新增字段

**请求参数** (FormData):
```
- batchCode (可选，可从 Session 获取)
- examNo (可选，可从 Session 获取)
- mark (必填，JSON 字符串 - 对象，非数组)
```

**关键修正**: `mark` 字段是单个 JSON 对象，不是数组
```javascript
// ✅ 正确格式
mark: JSON.stringify({
  pageNumber: "3.5",
  pageDesc: "资料阅读",
  operationList: [...],
  answerList: [...],
  beginTime: "2025-10-14T10:00:00Z",
  endTime: "2025-10-14T10:05:00Z",
  imgList: []
})

// ❌ 错误格式（不要使用数组）
mark: JSON.stringify([{...}])
```

### 1.4 会话检测机制 ✅

**后端实现方式**: 拦截器自动检测

**关键信息**:
- ❌ 不需要新增 `/stu/checkSession` 接口
- ❌ 不需要前端实现 30秒心跳轮询
- ✅ Session 失效时，所有 API 请求自动返回 `code === 401`
- ✅ 前端只需在全局拦截器中捕获 401，跳转登录页

**前端实现策略**:
```javascript
// axios 拦截器
axios.interceptors.response.use(
  (response) => {
    if (response.data.code === 401) {
      // 清空 Context 状态
      clearAuthState();
      // 显示提示
      showMessage('您的账号已在其他设备登录');
      // 跳转登录页
      navigate('/login');
    }
    return response;
  },
  (error) => {
    // 处理网络错误
    return Promise.reject(error);
  }
);
```

### 1.5 登录响应格式 ✅

**完整响应结构**（后端已确认）:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "batchCode": "375186",          // 评价批次
    "studentCode": "xxx",            // 学籍号
    "examNo": "xxx",                 // 考生号
    "studentName": "xxx",            // 学生姓名
    "schoolCode": "5101140006",      // 学校编码
    "schoolName": "蚕丛路小学",      // 学校名称
    "classCode": "xxx",              // 班级
    "url": "/grade-7-tracking",      // 🔑 前端路由URL
    "pageNum": "3.5"                 // 🔑 最后答题页码（支持小数）
  }
}
```

**新增字段**（相比之前的设计）:
- `studentCode`: 学籍号
- `schoolName`: 学校名称
- `classCode`: 班级

### 1.6 数据库配置 ✅

**已通过管理后端可视化完成**:
- ✅ 测评任务表配置（`module_url = '/grade-7-tracking'`）
- ✅ 学生任务关联配置
- ✅ 登录接口逻辑已实现

---

## 二、已完成的文档更新

### 2.1 review-and-integration.md ✅

**更新位置**: 第4章 - 后端协调清单

**更新内容**:
1. **4.1 需要后端提供的信息**:
   - 全部标记为 ✅ 已完成
   - 添加页码存储格式说明（页码×100）
   - 明确 session 失效检测机制

2. **4.2 需要后端配置的内容**:
   - 全部标记为 ✅ 已通过管理后端完成
   - 添加完整的登录响应格式（包含新增字段）
   - 更新伪代码示例

3. **4.3 API 契约确认**:
   - 修正 `mark` 字段描述（对象，非数组）
   - 添加详细的 FormData 参数说明
   - 明确不需要 `/stu/checkSession` 接口
   - 说明拦截器自动返回 401 的机制

**文件路径**: [d:\myproject\cp\specs\001-7\review-and-integration.md](./review-and-integration.md)

### 2.2 plan.md ✅

**更新位置**: Backend Configuration Agreement 章节

**更新内容**:
1. **登录响应契约**:
   - 更新为完整的响应结构（包含 10 个字段）
   - 添加 `studentCode`, `schoolName`, `classCode` 等新字段
   - 两个示例：首次登录 + 页面恢复
   - 添加后端存储说明（页码×100）

2. **响应示例标注**:
   ```json
   "pageNum": "3.5"  // 🔑 恢复到上次进度（支持小数页码，如 "3.5"）
   ```

**文件路径**: [d:\myproject\cp\specs\001-7\plan.md](./plan.md)

### 2.3 contracts/api.yaml ✅

**更新内容**:

**1. `/stu/saveHcMark` 接口**:
   - 添加 "✅ 后端已确认" 标注
   - 修正 `mark` 字段描述：
     ```yaml
     mark:
       type: string
       description: |
         ⚠️ 注意：这是 JSON 字符串（对象，非数组）。
         包含单个页面的操作记录、答案列表、时间戳等。

         **MarkObject 结构**：
         - pageNumber: string (如 "3.5")
         - pageDesc: string (页面描述)
         - beginTime: string (ISO 8601格式)
         - endTime: string (ISO 8601格式)
         - answerList: array<{key, value}>
         - imgList: array<{imgUrl}>
         - operationList: array<{code, targetElement, eventType, time, value?}>
     ```
   - 明确 `batchCode` 和 `examNo` 为可选参数（可从 Session 获取）
   - 修改 `content-type` 为 `application/x-www-form-urlencoded`

**2. `/stu/checkSession` 接口**:
   - 添加 "❌ 不需要新增" 标注
   - 标记为 `deprecated: true`
   - 添加详细说明：
     ```yaml
     description: |
       ✅ **后端已确认**：无需新增此接口，后端已通过拦截器实现 session 失效检测。

       **后端实现机制**：
       - 所有 API 请求经过统一拦截器检查 session 有效性
       - Session 失效时，任何 API 请求自动返回 `code === 401`
       - 前端无需单独调用心跳检测接口

       **前端实现策略**：
       - 在全局 axios 拦截器中捕获 `response.data.code === 401`
       - 401 响应时，清空 Context 状态并跳转到登录页
       - 显示提示："您的账号已在其他设备登录"

       **不需要的功能**：
       - ❌ 不需要 30秒轮询心跳检测
       - ❌ 不需要 Page Visibility API 优化
       - ❌ 不需要单独的 `/stu/checkSession` 接口
     ```

**文件路径**: [d:\myproject\cp\specs\001-7\contracts\api.yaml](./contracts/api.yaml)

---

## 三、前端需要注意的变更

### 3.1 数据提交格式修正 ⚠️

**之前的错误理解**:
```javascript
// ❌ 错误：以为 mark 是数组
const formData = new FormData();
formData.append('mark', JSON.stringify([markObject]));
```

**正确的实现**:
```javascript
// ✅ 正确：mark 是单个对象
const formData = new FormData();
formData.append('mark', JSON.stringify(markObject));

// 可选：添加 batchCode 和 examNo（后端可从 Session 获取）
formData.append('batchCode', authInfo.batchCode);
formData.append('examNo', authInfo.examNo);
```

### 3.2 会话检测实现简化 ✅

**删除的代码**:
- ❌ `useSessionHeartbeat` Hook（30秒轮询）
- ❌ `checkSession` API 调用
- ❌ Page Visibility API 优化

**保留的代码**:
- ✅ 全局 axios 拦截器（捕获 401）
- ✅ 401 响应时的跳转逻辑
- ✅ 用户提示（"您的账号已在其他设备登录"）

**tasks.md 中的任务调整**:
```markdown
- [ ] T012 ~~创建 useSessionHeartbeat Hook~~ → 改为：实现全局 401 拦截器
  - 在 axios 拦截器中捕获 `response.data.code === 401`
  - 清空 Context 状态
  - 显示提示并跳转登录页
```

### 3.3 登录响应字段更新 ✅

**新增字段处理**:
```javascript
// TrackingContext 或 AppContext 需要保存的字段
const authInfo = {
  batchCode: data.batchCode,       // 375186
  studentCode: data.studentCode,   // 学籍号（新增）
  examNo: data.examNo,             // 考生号
  studentName: data.studentName,   // 学生姓名
  schoolCode: data.schoolCode,     // 学校编码
  schoolName: data.schoolName,     // 学校名称（新增）
  classCode: data.classCode,       // 班级（新增）
  url: data.url,                   // /grade-7-tracking
  pageNum: data.pageNum            // "3.5" (字符串)
};
```

### 3.4 pageNum 映射逻辑 ✅

**后端存储与前端使用的转换**:
- 后端存储：页码 × 100 (整数)
- 后端返回：字符串格式（如 `"3.5"`）
- 前端使用：直接使用字符串（无需转换）

**映射函数实现**:
```javascript
// src/modules/grade-7-tracking/utils/pageMapping.js
export function getInitialPage(pageNum) {
  const mapping = {
    '0.1': 'Page_00_Precautions',
    '0.2': 'Questionnaire_00_Intro',
    '1': 'Page_01_Intro',
    '2': 'Page_02_Question',
    '3': 'Page_03_Resource',
    '3.5': 'Page_03_ResourceTransition',  // 如果有小数页
    // ... 其他映射
    '22': 'Page_22_Completion'
  };
  return mapping[pageNum] || 'Page_00_Precautions';
}
```

---

## 四、协调清单完成状态

### 4.1 需要后端提供的信息

- [x] **确认 URL 路径**: `/grade-7-tracking`
- [x] **确认页面编号格式**: 支持小数页码（页码×100 存储）
- [x] **确认 pageNum 映射逻辑**: 字符串格式，直接使用
- [x] **确认数据提交接口**: 不需要新增字段，`mark` 为对象
- [x] **确认会话检测接口**: 不需要新增，拦截器自动返回 401

### 4.2 需要后端配置的内容

- [x] **数据库 - 测评任务表**: 已通过管理后端配置
- [x] **数据库 - 学生任务关联**: 已通过管理后端配置
- [x] **登录接口 - 返回 URL 逻辑**: 已实现完整响应结构

### 4.3 API 契约确认

- [x] **POST /stu/saveHcMark**: 已确认，`mark` 为对象（非数组）
- [x] **GET /stu/checkSession**: 不需要，拦截器自动处理

### 4.4 前后端联调准备

- [x] **文档更新完成**: plan.md, review-and-integration.md, contracts/api.yaml
- [ ] **前端代码实现**: Phase 1-7 开发（tasks.md）
- [ ] **测试账号准备**: 后端提供测试学生账号
- [ ] **集成测试**: 验证登录跳转、页面恢复、数据提交

---

## 五、下一步工作

### 5.1 立即可以开始

**Phase 1 Setup** (T001-T004, T113-T115):
```bash
✅ T001 - 创建模块目录结构
✅ T002 - 安装 Recharts 依赖
✅ T003 - 配置 ESLint 规则
✅ T004 - 更新 Mock handlers
✅ T113 - 记录 URL 路径到 plan.md（已完成）
✅ T114 - 更新 ModuleRegistry 注释
✅ T115 - 验证 URL 参数测试
```

**Phase 2 Foundational** (T005-T017):
- 创建 config.js, physicsModel.js
- 创建 Context 和 Hooks
- ⚠️ 修改 T012：实现全局 401 拦截器（而非心跳检测）
- 创建模块入口并注册

### 5.2 需要协调的事项

**测试准备**:
- [ ] 后端提供测试学生账号（`studentCode` + `password`）
- [ ] 后端在测试环境配置 `/grade-7-tracking` 任务
- [ ] 确认测试环境的 API 基础 URL

**数据格式验证**:
- [ ] 前端提交一个 MarkObject 测试数据
- [ ] 后端验证能否正确解析
- [ ] 验证 `pageNum` 小数格式是否正确存储

### 5.3 开发测试方案

**方案 1: URL 参数测试** (推荐):
```
http://localhost:5173/?moduleUrl=/grade-7-tracking&pageNum=1
```

**方案 2: sessionStorage 测试**:
```javascript
sessionStorage.setItem('authInfo', JSON.stringify({
  batchCode: "375186",
  studentCode: "DEV001",
  examNo: "DEV_001",
  studentName: "测试学生",
  schoolCode: "5101140006",
  schoolName: "测试学校",
  classCode: "1班",
  url: "/grade-7-tracking",
  pageNum: "1"
}));
window.location.reload();
```

---

## 六、关键变更摘要

| 项目 | 原设计 | 后端确认 | 影响 |
|------|--------|----------|------|
| **mark 字段格式** | 数组 `[{...}]` | 对象 `{...}` | ⚠️ 需修正代码 |
| **会话检测方式** | 30秒轮询 `/stu/checkSession` | 拦截器自动返回 401 | ✅ 简化实现 |
| **登录响应字段** | 6个字段 | 10个字段（新增 4个） | ⚠️ 需更新 Context |
| **pageNum 存储** | 未明确 | 页码×100 | ✅ 前端直接使用字符串 |
| **batchCode/examNo** | 必填 | 可选（Session获取） | ✅ 简化请求 |

---

## 七、文档版本

**版本**: 1.0.0
**创建日期**: 2025-10-14
**状态**: ✅ 后端协调完成

**相关文档**:
- [review-and-integration.md](./review-and-integration.md) - 任务审查与集成方案
- [plan.md](./plan.md) - 实施计划（含后端配置约定）
- [contracts/api.yaml](./contracts/api.yaml) - API 契约定义
- [tasks.md](./tasks.md) - 任务分解（需调整 T012）

---

## 八、协调确认

**前端团队**: ✅ 已理解所有后端反馈，文档已更新完成
**后端团队**: ✅ 已确认所有配置完成，等待前端联调
**下次同步**: Phase 6 (US4 数据记录) 完成后，进行联调测试

---

**本文档标志着前后端协调工作的完成。现在可以安心开始 Phase 1-7 的开发工作！** 🚀
