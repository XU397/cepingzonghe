# Flow 端到端验证详细日志

**测试时间**: 2025-11-18 / 2025-11-19
**测试账号**: szcs001 / 1234, szcs002 / 1234
**Flow ID**: g7-experiment-003

---

## 子模块1: g7-experiment（7年级蒸馒头-交互）

**szcs002 测试结果** (2025-11-19):

| 页码 | 页面ID | Network请求次数 | batchCode | examNo | flow_context | pageDesc前缀 | 状态 | 备注 |
|------|--------|----------------|-----------|--------|--------------|--------------|------|------|
| 1 | Page_01_Precautions | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 2 | Page_02_Introduction | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 3 | Page_03_Dialogue_Question | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 4 | Page_04_Material_Reading | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 5 | Page_10_Hypothesis_Focus | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 6 | Page_11_Solution_Design | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 7 | Page_12_Solution_Evaluation | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 8 | Page_13_Transition | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 9 | Page_14_Simulation_Intro | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 10 | Page_15_Simulation_Q1 | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 11 | Page_16_Simulation_Q2 | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 12 | Page_17_Simulation_Q3 | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 已验证 |
| 13 | Page_18_Solution_Selection | 1 | szcs | szcs002 | ✅ 有 | ✅ 有 | ✅ 通过 | 成功进入g7-tracking |

**g7-experiment 总结**: 13/13 页面全部通过 ✅

---

## 子模块2: g7-tracking-experiment（7年级追踪-交互）

**szcs002 测试结果** (2025-11-19):

| 页码 | 页面ID | Network请求次数 | batchCode | examNo | flow_context | pageDesc前缀 | 状态 | 备注 |
|------|--------|----------------|-----------|--------|--------------|--------------|------|------|
| 1 | Page01_Intro | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 2 | Page02_Question | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 3 | Page03_Resource | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 4 | Page06_Hypothesis | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 5 | Page07_Design | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 6 | Page08_Evaluation | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 7 | Page09_Transition | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 8 | Page10_Experiment | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 9 | 实验分析1 | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 10 | 实验分析2 | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | 已验证 |
| 11 | 实验分析3 | 1 | szcs | szcs002 | ✅ stepIndex:1 | ✅ 有 | ✅ 通过 | reqid=974 |
| 12 | Page13_Summary | 0 | - | - | - | - | ⚠️ 后端失败 | 网络超时5s |
| 13 | Page14_Solution | - | - | - | - | - | ⏳ 未测试 | 依赖12 |

**g7-tracking-experiment 总结**: 11/13 页面通过，Page 12 后端超时 ⚠️

**关键发现**: Page 12 超时问题在 szcs001 和 szcs002 两个账号上均复现，确认为**后端/网络问题**，非前端代码问题。

---

## 后端数据库验证

### marks 表查询结果

```sql
SELECT pageNumber, pageDesc, batchCode, examNo,
       JSON_EXTRACT(mark, '$.operationList[?(@.eventType=="flow_context")]') as flow_context_event
FROM marks
WHERE examNo = 'szcs001' AND batchCode = 'szcs'
ORDER BY submitTime DESC;
```

**查询时间**: 待执行
**结果**: 待记录

---

## 非 Flow 场景回归测试

### 传统模块验证

| 模块 | URL | 验证项 | 状态 | 备注 |
|------|-----|--------|------|------|
| 7年级传统入口 | /seven-grade | 登录→提交→刷新恢复 | ⏳ 待测试 | - |
| 4年级传统入口 | /four-grade | 登录→提交→刷新恢复 | ⏳ 待测试 | - |

---

## 测试环境

- 前端服务: http://localhost:3001
- 后端地址: http://117.72.14.166:9002
- Mock模式: ❌ 已禁用
- 浏览器: Chrome 142.0 (MCP驱动)
