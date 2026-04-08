# 子模块数据提交遗留偏差登记

> **本文档记录已知子模块实现与目标态规范（`docs/submission-spec.md`）之间的偏差。**
> 每条偏差包含：描述、影响范围、迁移触发条件和建议修复方案。
>
> **权威等级**：目标态规范（`docs/submission-spec.md`）> 本文档 > 当前代码实现。

## 文档元信息

| 字段     | 值                                          |
| -------- | ------------------------------------------- |
| 版本     | 1.0                                         |
| 状态     | 生效                                        |
| 对应规范 | `docs/submission-spec.md`                   |
| 更新策略 | 每次修复偏差后更新状态；新增偏差随时追加     |

---

## 偏差总览

| 编号  | 子模块              | 偏差摘要                                         | 严重程度 | 状态   |
| ----- | ------------------- | ------------------------------------------------ | -------- | ------ |
| D-001 | g7-experiment        | 使用 PageRouter 旧路径，不经过 AssessmentPageFrame | 中       | 开放   |
| D-002 | g7-experiment        | pageNumber 可能存在 0.* 格式                      | 高       | 开放   |
| D-003 | g7-questionnaire     | 注意事项页使用 0.2 页码，不符合 `^[1-9]\d*\.\d{2}$` | 高     | 开放   |
| D-004 | g7-tracking-experiment | config.js 时间配置(40min)与 mapping.ts(30min) 不一致 | 低    | 开放   |
| D-005 | g7-tracking-experiment | 使用旧 config.js PAGE_MAPPING 而非标准 mapping.ts | 中     | 开放   |
| D-006 | g8-drone-imaging     | buildMark 中 imgList 缺失                         | 低       | 开放   |
| D-007 | g8-drone-imaging     | 时间格式使用 pageStartTime 字符串直接传递，未统一归一化 | 低 | 开放   |
| D-008 | g8-mikania-experiment | buildMark 中缺少 flowContext 时仅 warn 不阻断     | 中       | 开放   |
| D-009 | g8-mikania-experiment | clearOperations 时机：在 reducer 中通过 SET_PAGE 重置 | 低  | 开放   |
| D-010 | 多个 Legacy 子模块   | targetElement 使用简短键名而非完整问题文本          | 中       | 开放   |
| D-011 | g7-experiment        | 通过 PageRouter 路由，不使用 SubmoduleDefinition 接口 | 高   | 开放   |
| D-012 | g7-tracking 系列      | 部分页面 code 从 0 开始而非 1                      | 中       | 开放   |
| D-013 | 多个旧文档           | `appendExperimentHistory` API 参数描述不一致        | 低       | 已确认 |

---

## 详细偏差记录

### D-001：g7-experiment 使用 PageRouter 旧路径

- **规范要求**（§6.1）：所有提交 MUST 通过共享提交层（usePageSubmission）进行
- **当前行为**：g7-experiment 通过 `PageRouter` + 旧 `wrapper.jsx` 路由，不经过 `AssessmentPageFrame`
- **影响范围**：`src/submodules/g7-experiment/`、`src/modules/grade-7/wrapper.jsx`
- **迁移触发**：当 g7-experiment 需要修复提交格式或接入新的共享提交层时
- **建议修复**：迁移至标准 SubmoduleDefinition 接口，接入 AssessmentPageFrame

### D-002：g7-experiment pageNumber 可能存在 0.* 格式

- **规范要求**（§2.2）：pageNumber MUST 满足 `^[1-9]\d*\.\d{2}$`
- **当前行为**：PageRouter 和旧配置中可能生成 `0.3`、`0.2` 等不符合规范的页码
- **影响范围**：`src/pages/` 下的旧页面
- **迁移触发**：当需要对这些页面数据进行可靠分析时
- **建议修复**：更新 PAGE_MAPPING，确保使用 `encodeCompositePageNum(stepIndex + 1, subPageNum)` 生成页码

### D-003：g7-questionnaire 注意事项页页码不符合新格式

- **规范要求**（§2.2）：pageNumber MUST 满足 `^[1-9]\d*\.\d{2}$`
- **当前行为**：`Page_20_Questionnaire_Intro` 使用页码 `0.2`，格式不合规
- **影响范围**：`src/submodules/g7-questionnaire/mapping.ts`
- **迁移触发**：当该子模块接入共享提交层时
- **建议修复**：在 mapping.ts 中为注意事项页分配标准页码（如 `1.01`），使用 `hidden` 导航模式

### D-004：g7-tracking-experiment 时间配置不一致

- **规范要求**：mapping.ts 为配置单一真相源
- **当前行为**：`config.js` 定义 40 分钟，`mapping.ts` 定义 30 分钟
- **影响范围**：`src/modules/grade-7-tracking/config.js`、`src/submodules/g7-tracking-experiment/mapping.ts`
- **迁移触发**：当下次修改计时器行为时
- **建议修复**：统一为 mapping.ts 中的值，删除 config.js 中的重复定义

### D-005：g7-tracking-experiment 使用旧 config.js PAGE_MAPPING

- **规范要求**（§8）：子模块 MUST 导出标准 `SUBMODULE_MAPPING_CONFIG`
- **当前行为**：使用 `config.js` 中的旧 `PAGE_MAPPING` 格式
- **影响范围**：`src/modules/grade-7-tracking/config.js`
- **迁移触发**：当需要使用共享适配器工具（collectAnswers 等）时
- **建议修复**：将 PAGE_MAPPING 迁移至标准 mapping.ts 格式

### D-006：g8-drone-imaging buildMark 中 imgList 缺失

- **规范要求**（§2.1）：imgList MUST 存在（可为空数组）
- **当前行为**：buildMark 返回对象中未包含 imgList 字段
- **影响范围**：`src/submodules/g8-drone-imaging/Component.tsx`
- **迁移触发**：当需要添加截图功能时，或下次重构该子模块时
- **建议修复**：在 buildMark 中添加 `imgList: []`

### D-007：g8-drone-imaging 时间格式未统一归一化

- **规范要求**（§2.6）：beginTime/endTime MUST 为 `YYYY-MM-DD HH:mm:ss` 或 ISO 8601
- **当前行为**：直接使用 pageStartTime 字符串，可能存在格式不一致
- **影响范围**：`src/submodules/g8-drone-imaging/Component.tsx`
- **迁移触发**：当提交层 schema 校验捕获到时间格式错误时
- **建议修复**：使用 `formatTimestamp()` 包装时间值

### D-008：g8-mikania-experiment 缺少 flowContext 仅 warn

- **规范要求**（§7.1）：flow_context MUST 在每次提交中注入
- **当前行为**：buildMark 检测到缺少 flowContext 时仅打印 warn，不阻断提交
- **影响范围**：`src/submodules/g8-mikania-experiment/Component.jsx`
- **迁移触发**：当该子模块接入 Flow 编排时
- **建议修复**：确保 Component 正确同步 flowContext，或由提交层自动注入

### D-009：g8-mikania-experiment clearOperations 通过 reducer 重置

- **规范要求**：提交成功后 SHOULD 调用 clearOperations()
- **当前行为**：通过 reducer 中 SET_PAGE action 隐式重置 operations
- **影响范围**：`src/submodules/g8-mikania-experiment/` context/reducer
- **迁移触发**：当出现操作序列残留 bug 时
- **建议修复**：在 Component 的 onNext 流水线中显式调用 clearOperations

### D-010：多个 Legacy 子模块 targetElement 使用简短键名

- **规范要求**（§4.3, §5）：answerList.targetElement SHOULD 使用完整问题文本
- **当前行为**：部分旧模块使用简短键名（如 `P1.05_最小GSD焦距`）作为 answerList.targetElement
- **影响范围**：g7 系列、部分 g8 早期实现
- **迁移触发**：当后端评分系统需要可读的问题上下文时
- **建议修复**：使用 `QUESTION_TEXT_MAP` 生成完整问题文本

### D-011：g7-experiment 不使用 SubmoduleDefinition 接口

- **规范要求**（§6.1）：子模块 MUST 通过 SubmoduleDefinition 注册
- **当前行为**：g7-experiment 是 Legacy Wrapper，内部委托给 PageRouter
- **影响范围**：`src/submodules/g7-experiment/index.jsx`
- **迁移触发**：当需要独立维护或重构 g7-experiment 时
- **建议修复**：长期目标是迁移为标准子模块结构；短期内保持 Legacy Wrapper 稳定

### D-012：g7-tracking 系列部分页面 code 从 0 开始

- **规范要求**（§2.4）：code MUST 从 1 开始连续递增
- **当前行为**：部分操作记录的 code 可能从 0 开始
- **影响范围**：g7-tracking-experiment、g7-tracking-questionnaire
- **迁移触发**：当 schema 校验失败时
- **建议修复**：确保使用 `createOperationSequence()` 或提交层自动编号

### D-013：旧文档中 appendExperimentHistory API 参数描述不一致

- **规范要求**（§10.1）：适配器层 API 签名以实际代码为准
- **当前行为**：
  - `子模块数据规范1205.md` 记录参数为 `{targetElement, historyCodeBase}`
  - `submodule-submission-guidelines.md` 记录参数为 `{targetPrefix, historyCodeBase, targetElementName}`
  - 实际代码支持 `{targetPrefix, historyCodeBase, targetElementName}`
- **影响范围**：文档已归档，不影响新实现
- **迁移触发**：N/A（已通过本规范统一）
- **建议修复**：已通过 `docs/submission-spec.md` 统一描述

---

## 迁移优先级建议

| 优先级 | 偏差编号       | 理由                                           |
| ------ | -------------- | ---------------------------------------------- |
| P0     | D-002, D-003   | 页码格式不合规导致数据无法通过 schema 校验      |
| P1     | D-011, D-001   | 架构偏差，影响提交层统一管理                    |
| P2     | D-010          | 影响评分系统的数据可读性                        |
| P3     | D-004, D-005   | 配置不一致，可能导致计时行为不可预测            |
| P4     | D-006, D-007   | 格式细节，不影响核心功能                        |
| P5     | D-008, D-009   | 边缘场景，仅在特定条件下触发                    |

---

## 更新日志

- **2026-04-08**：初始版本，基于代码审查和双文档对齐分析创建 13 条偏差记录
