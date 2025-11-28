# Submission CI Checks

统一提交通道需要在 CI 中快速识别危险接口调用、违规页码以及格式回退。本指南总结了新增的 ESLint 规则、快照测试和相关脚本，便于在本地或流水线上落地守卫。

## ESLint Submission Rules
对 `src/shared/services/submission` 目录执行 `npm run lint:submission`。规则通过 `no-restricted-syntax` 落地，错误信息均为中文并包含修复建议。

| 规则 | 意图 | 违规示例 | 修复建议 |
| --- | --- | --- | --- |
| 禁止 `/stu/saveHcMark` 直连 | 杜绝绕过 Hook 直接调用遗留接口，避免 payload 失控 | ```js
fetch('/stu/saveHcMark', payload);
``` | 使用 `usePageSubmission` 提供的 `submit`，或复用 `submitImpl` 注入。 |
| 禁止手写 `M` 前缀页码 | 所有页码必须来自 `encodeCompositePageNum(stepIndex, subPageNum)`，格式 `<step>.<sub>` | ```js
const pageNumber = 'M0:3';
``` | `const pageNumber = encodeCompositePageNum(0, 3); // "0.3"` |
| 禁止组件内 `fetch('/stu/*')` | 组件中直接 `fetch` 容易遗漏 flow_context、埋点与异常处理 | ```js
const res = await fetch('/stu/queryAnswer', options);
``` | 抽成 `usePageSubmission` 或 service 层 `submitImpl`，统一处理鉴权与 schema。 |
| 推荐 `usePageSubmission` Hook | Rule 与上一条共享 message，提示所有 `/stu` 访问必须通过 Hook | ```js
await fetch('https://api.xxx.com/stu/saveHcMark', payload);
``` | 创建/复用 `usePageSubmission` 并注入 `submitImpl`、flowContext、encodeCompositePageNum`。 |

> CI 中建议在常规 lint 之后追加 `npm run lint:submission`，确保两套配置都执行。

## Submission Snapshot & Validation Tests
运行 `npm run test:submission`，会执行以下检查：

- `submission-format.snapshot.test.js`：提供统一的 `MarkObject` 基线。校验 Zod Schema、页码编码（`0.3`）、`P{pageNumber}_` 目标前缀、`flow_context` 注入、非空答案、最小事件集以及输入事件格式。若需要更新基线，请运行：
  
  ```bash
  npm run test:submission-format -- -u
  ```
- `validate-prefixes.test.js`：批量扫描 `operationList` 的 `targetElement`，检测缺失的 `P<step.sub>_` 前缀或遗留 `M` 格式。
- `validate-events.test.js`：校验所有事件类型是否存在于 `eventTypes.js` + Schema 的枚举，输出允许列表并在发现拼写错误时列出详情。

## CI 集成说明 ✅ 已完成

### GitHub Actions 自动化守卫

项目已配置 GitHub Actions 工作流，在以下情况自动触发提交规范检查：

#### 1. 主 CI 流程 (`.github/workflows/ci.yml`)
- **触发条件**：Push 到 `main`, `develop`, `feature/**`, `fix/**` 分支或创建 PR
- **检查项**：
  - ESLint 代码检查
  - 单元测试
  - 构建验证

#### 2. 提交规范守卫 (`.github/workflows/submission-guard.yml`) 🔒
- **触发条件**：修改提交相关代码时自动触发
  - `src/shared/services/submission/**`
  - `src/shared/components/tracking/**`
  - `src/shared/ui/PageFrame/**`
  - `src/shared/utils/pageMapping.ts`
  - 模块 context 和子模块代码

- **检查步骤**（串行执行）：
  1. **Lint 检查**：`npm run lint:submission`
  2. **格式快照测试**：`npm run test:submission-format`
  3. **完整测试**：`npm run test:submission`
  4. **守卫总结**：汇总所有结果

- **阻断策略**：**任一检查失败都会阻止合并** ❌

### 本地验证流程

提交前建议本地运行（避免 CI 失败）：

```bash
# 快速检查（推荐）
npm run lint:submission && npm run test:submission

# 完整检查（包含构建）
npm run lint
npm run test
npm run build
```

### CI 失败处理

#### Lint 失败示例
```
❌ 禁止直接调用 '/stu/saveHcMark'，请使用 usePageSubmission Hook
```

**修复步骤**：
1. 查看 CI 日志中的具体违规文件和行号
2. 参考本文档的 "ESLint Submission Rules" 表格
3. 使用推荐的替代方案修复
4. 本地运行 `npm run lint:submission` 验证

#### 快照测试失败示例
```
❌ pageNumber 必须使用 Flow 统一格式 <stepIndex>.<subPageNum>（如 "0.3"）
```

**修复步骤**：
1. 检查 pageNumber 格式，确保使用点分格式
2. 不使用单数字（`'1'`）或 M 前缀（`'M1:5'`）
3. 本地运行 `npm run test:submission-format` 验证
4. 如需更新快照：`npm run test:submission-format -- -u`（需经过 Code Review）

### 保护分支设置

建议在 GitHub 仓库设置中配置以下保护规则：

1. **`main` 分支保护**：
   - ✅ 要求状态检查通过才能合并
   - ✅ 必需检查：`submission-lint`, `submission-format-test`, `submission-full-test`
   - ✅ 要求至少 1 位审核者批准
   - ✅ 禁止强制推送

2. **`develop` 分支保护**：
   - ✅ 要求状态检查通过才能合并
   - ✅ 必需检查：同上
   - ✅ 允许管理员绕过（紧急情况）

### CI 状态查看

在 GitHub 仓库中查看 CI 状态：
- **Actions 标签页**：查看所有 workflow 运行记录
- **PR 页面**：底部显示所有检查状态
- **提交历史**：每个提交旁边显示 CI 状态图标

### 快照文件审查

快照文件更新需特别注意：
- 📁 位置：`src/shared/services/submission/__tests__/**/__snapshots__`
- ⚠️  任何快照更新都需在 PR 中说明原因
- 🔍 Code Review 时重点检查快照变更的合理性
