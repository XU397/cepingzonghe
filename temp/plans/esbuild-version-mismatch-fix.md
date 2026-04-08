# 修复 Vite 启动时报错：esbuild Host/Binary 版本不匹配

## TL;DR

> **Quick Summary**: 通过“依赖状态重建”修复本地 `esbuild` 主包与二进制版本漂移，恢复 `vite` 开发与构建链路。
>
> **Deliverables**:
>
> - 清理并重装依赖（允许重建 lock）
> - 完成 `esbuild` 烟测、`npm run dev` 启动验证、`npm run build` 构建验证
> - 输出证据（终端日志）并确认未触碰业务代码
>
> **Estimated Effort**: Short
> **Parallel Execution**: NO - sequential
> **Critical Path**: Task 1 -> Task 2 -> Task 3 -> Task 4

---

## Context

### Original Request

运行 `npm run dev` 时出现：`Host version "0.18.20" does not match binary version "0.25.4"`，导致 Vite 启动失败。

### Interview Summary

**Key Discussions**:

- 用户选择修复路径：清理并重装（删除 `node_modules` 与 lock 后重装）。
- 验收范围：`npm run dev` 可启动 + `npm run build` 成功。
- 范围约束：仅修复依赖一致性，不改业务逻辑。

**Research Findings**:

- `package-lock.json` 中存在 `esbuild@0.18.20`（Vite 4 链路）与 `vitest` 子树中的 `esbuild@0.25.12`（测试链路），多版本并存可存在。
- 当前报错提到的 `0.25.4` 不在 lock 内，说明本地 `node_modules` 安装状态污染概率高。

### Metis Review

**Identified Gaps** (addressed):

- 缺少“依赖漂移边界”说明 -> 已明确允许 lock 重建，但禁止顺手升级技术栈。
- 缺少“环境基线核验” -> 已加入 Node/npm/registry 与包管理器一致性检查。
- 缺少“可执行验收细则” -> 已加入 `esbuild` 直接烟测与失败关键字断言。

---

## Work Objectives

### Core Objective

修复本地开发环境依赖损坏，消除 `esbuild` Host/Binary 版本不匹配错误，确保项目开发与构建命令恢复可用。

### Concrete Deliverables

- 可复现的修复步骤（清理、重装、验证）
- 验收日志：`esbuild` 烟测日志、`npm run dev` 启动日志、`npm run build` 日志
- 变更范围确认（不改 `src/**`、`vite.config.*`、`package.json`）

### Definition of Done

- [x] `node -e "const e=require('esbuild'); e.transformSync('const x=1'); console.log(e.version)"` 成功，且无 mismatch 报错
- [x] `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` 启动成功并输出 Local 地址
- [x] `npm run build` 退出码为 0
- [x] `git status --porcelain` 不包含业务代码改动

### Must Have

- 仅执行依赖一致性修复，不进行业务功能修改。
- 所有验证必须由执行 agent 自动完成，无人工手测步骤。

### Must NOT Have (Guardrails)

- 不改 `src/**`、`vite.config.*`、`package.json`。
- 不执行 `npm audit fix`、不顺手升级 major 依赖。
- 不混用 `pnpm/yarn`（仅使用 npm）。

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> 所有任务均由 agent 自动执行并断言结果，禁止“用户手动验证”。

### Test Decision

- **Infrastructure exists**: YES（npm scripts + vitest 已存在）
- **Automated tests**: None（本次为环境修复，不新增单测）
- **Framework**: npm scripts（`dev` / `build`）

### Agent-Executed QA Scenarios (MANDATORY — ALL tasks)

Scenario: esbuild binary 对齐烟测
Tool: Bash
Preconditions: 依赖安装完成
Steps: 1. 执行 `node -e "const e=require('esbuild'); e.transformSync('const x=1'); console.log('esbuild-ok', e.version)"` 2. 断言 stdout 包含 `esbuild-ok` 3. 断言输出不包含 `Host version` 与 `does not match binary version`
Expected Result: esbuild API 可正常调用且无版本错配
Failure Indicators: 命令报错、输出包含 mismatch 关键字
Evidence: `.sisyphus/evidence/task-3-esbuild-smoke.txt`

Scenario: dev 服务成功启动
Tool: Bash
Preconditions: 端口 `5173` 未占用
Steps: 1. 执行 `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` 2. 等待启动日志（超时 20s）3. 断言日志包含 `Local` 与 `127.0.0.1:5173` 4. 断言日志不包含 `Host version` mismatch 错误
Expected Result: vite dev server 可启动
Failure Indicators: 进程提前退出、日志包含 esbuild mismatch
Evidence: `.sisyphus/evidence/task-3-dev-start.txt`

Scenario: build 成功且无范围外改动
Tool: Bash
Preconditions: dev 验证通过
Steps: 1. 执行 `npm run build` 2. 断言退出码 0 3. 执行 `git status --porcelain` 4. 断言无 `src/`、`vite.config.*`、`package.json` 变更
Expected Result: 构建通过且修复范围受控
Failure Indicators: build 失败、出现范围外改动
Evidence: `.sisyphus/evidence/task-4-build-and-scope.txt`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1:
└── Task 1: 环境基线与约束检查

Wave 2:
└── Task 2: 清理并重装依赖

Wave 3:
└── Task 3: 烟测与 dev 启动验证

Wave 4:
└── Task 4: build 验证与范围确认

Critical Path: 1 -> 2 -> 3 -> 4
Parallel Speedup: none（强依赖顺序）
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
| ---- | ---------- | ------ | -------------------- |
| 1    | None       | 2      | None                 |
| 2    | 1          | 3      | None                 |
| 3    | 2          | 4      | None                 |
| 4    | 3          | None   | None                 |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents                                                            |
| ---- | ----- | ----------------------------------------------------------------------------- |
| 1    | 1     | `task(category="quick", load_skills=["git-master"], run_in_background=false)` |
| 2    | 2     | `task(category="quick", load_skills=["git-master"], run_in_background=false)` |
| 3    | 3     | `task(category="quick", load_skills=["git-master"], run_in_background=false)` |
| 4    | 4     | `task(category="quick", load_skills=["git-master"], run_in_background=false)` |

---

## TODOs

- [x] 1. 建立环境基线与执行边界

  **What to do**:
  - 记录 `node -v`、`npm -v`、`npm config get registry`。
  - 检查是否存在 `ESBUILD_BINARY_PATH` 环境变量。
  - 检查当前仓库是否仅使用 npm（不混用其他包管理器）。

  **Must NOT do**:
  - 不修改任何项目文件。

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯检查类、低复杂度任务。
  - **Skills**: [`git-master`]
    - `git-master`: 便于后续基于 git 范围断言。
  - **Skills Evaluated but Omitted**:
    - `playwright`: 非浏览器交互任务。

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 2
  - **Blocked By**: None

  **References**:
  - `package.json:7` - `dev` 命令入口，决定后续启动验收命令。
  - `package.json:8` - `build` 命令入口，决定后续构建验收命令。
  - `package-lock.json:3864` - 根 `esbuild` 版本基线（0.18.20）。
  - `package-lock.json:8330` - `vitest` 子树 `esbuild` 版本（0.25.12），用于解释多版本并存。

  **Acceptance Criteria**:
  - [x] 输出 Node/npm/registry 基线信息。
  - [x] 明确记录是否存在 `ESBUILD_BINARY_PATH`。
  - [x] 明确记录包管理器策略为“仅 npm”。

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Baseline environment collected
    Tool: Bash
    Preconditions: 仓库根目录可访问
    Steps:
      1. 执行 node -v && npm -v && npm config get registry
      2. 执行 node -e "console.log(process.env.ESBUILD_BINARY_PATH || 'EMPTY')"
      3. 断言输出包含版本信息且 registry 非空
    Expected Result: 环境基线完整输出
    Evidence: .sisyphus/evidence/task-1-baseline.txt

  Scenario: Detect risky override variable
    Tool: Bash
    Preconditions: 同上
    Steps:
      1. 读取 ESBUILD_BINARY_PATH
      2. 若值非 EMPTY，标记为风险并记录
    Expected Result: 明确是否存在二进制路径覆盖风险
    Evidence: .sisyphus/evidence/task-1-esbuild-env.txt
  ```

  **Commit**: NO

- [x] 2. 清理并重装依赖（允许 lock 重建）

  **What to do**:
  - 删除 `node_modules` 与 `package-lock.json`。
  - （可选）清理 npm cache（`npm cache verify`，必要时 `npm cache clean --force`）。
  - 执行 `npm install` 重建依赖树与 lock。

  **Must NOT do**:
  - 不修改 `package.json`。
  - 不执行依赖升级类附加操作。

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 标准化依赖修复动作，路径清晰。
  - **Skills**: [`git-master`]
    - `git-master`: 便于确认仅依赖文件变化。
  - **Skills Evaluated but Omitted**:
    - `ultrabrain`: 不需要复杂推理。

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 3
  - **Blocked By**: Task 1

  **References**:
  - `package-lock.json:3864` - 当前根 esbuild 版本来源。
  - `package-lock.json:8413` - `vitest` 嵌套 vite 链路位置。
  - `package-lock.json:8420` - 嵌套 vite 对 `esbuild` 的版本区间要求。

  **Acceptance Criteria**:
  - [x] `npm install` 成功完成。
  - [x] 新的 `package-lock.json` 已生成。
  - [x] 无业务代码文件改动。

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Clean reinstall succeeds
    Tool: Bash
    Preconditions: Task 1 已完成
    Steps:
      1. 删除 node_modules 与 package-lock.json
      2. 执行 npm install
      3. 断言退出码 0
      4. 断言 package-lock.json 已重新生成
    Expected Result: 依赖重建成功
    Evidence: .sisyphus/evidence/task-2-reinstall.txt

  Scenario: Reinstall failure is captured
    Tool: Bash
    Preconditions: npm install 失败时
    Steps:
      1. 捕获 stderr 与退出码
      2. 记录失败点（网络/权限/锁文件冲突）
    Expected Result: 失败可诊断，不进入后续任务
    Evidence: .sisyphus/evidence/task-2-reinstall-failure.txt
  ```

  **Commit**: NO

- [x] 3. 执行 esbuild 烟测与 dev 启动验证

  **What to do**:
  - 运行 `esbuild` 直接调用脚本，验证主包与二进制一致。
  - 启动 `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`。
  - 捕获日志并断言无 mismatch 关键字。

  **Must NOT do**:
  - 不改 Vite 配置或源码绕过问题。

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 命令式验证，反馈快速。
  - **Skills**: [`git-master`]
    - `git-master`: 辅助输出范围控制与状态核对。
  - **Skills Evaluated but Omitted**:
    - `playwright`: 非 UI 验证。

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 4
  - **Blocked By**: Task 2

  **References**:
  - `package.json:7` - dev 启动命令规范。
  - `vite.config.js` - 仅用于确认未改动，不作为修复入口。

  **Acceptance Criteria**:
  - [x] `node -e "const e=require('esbuild'); e.transformSync('const x=1'); console.log('esbuild-ok', e.version)"` 成功。
  - [x] `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` 日志出现 Local 地址。
  - [x] 全程未出现 `Host version` mismatch 关键字。

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: esbuild smoke test passes
    Tool: Bash
    Preconditions: Task 2 完成
    Steps:
      1. 执行 node -e "const e=require('esbuild'); e.transformSync('const x=1'); console.log('esbuild-ok', e.version)"
      2. 断言输出包含 esbuild-ok
      3. 断言不包含 Host version mismatch
    Expected Result: 主包与二进制一致
    Evidence: .sisyphus/evidence/task-3-esbuild-smoke.txt

  Scenario: dev startup mismatch check (negative)
    Tool: Bash
    Preconditions: 同上
    Steps:
      1. 执行 npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
      2. 在 20s 内监听输出
      3. 若出现 Host version mismatch，立即判定失败并停止
    Expected Result: 未出现 mismatch，服务成功启动
    Evidence: .sisyphus/evidence/task-3-dev-start.txt
  ```

  **Commit**: NO

- [x] 4. 构建验证与变更范围封板

  **What to do**:
  - 运行 `npm run build`。
  - 运行 `npm ls esbuild vite vitest --depth=3` 检查依赖树状态。
  - 运行 `git status --porcelain` 做范围封板。

  **Must NOT do**:
  - 不因无关 warning 扩展修复范围。

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 收尾验证类任务。
  - **Skills**: [`git-master`]
    - `git-master`: 保证变更范围检查严谨。
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: 非界面设计任务。

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: Task 3

  **References**:
  - `package.json:8` - build 命令验收入口。
  - `package.json:13` - 项目已有测试命令（本次不新增单测，仅作为信息参考）。

  **Acceptance Criteria**:
  - [x] `npm run build` 退出码 0。
  - [x] `npm ls esbuild vite vitest --depth=3` 不含 `invalid`/`extraneous`/`ELSPROBLEMS`。
  - [x] `git status --porcelain` 无 `src/`、`vite.config.*`、`package.json` 改动。

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: production build passes
    Tool: Bash
    Preconditions: Task 3 通过
    Steps:
      1. 执行 npm run build
      2. 断言退出码 0
      3. 记录构建摘要日志
    Expected Result: 生产构建成功
    Evidence: .sisyphus/evidence/task-4-build.txt

  Scenario: scope guard violation detection (negative)
    Tool: Bash
    Preconditions: 同上
    Steps:
      1. 执行 git status --porcelain
      2. 检查是否出现 src/、vite.config.*、package.json 改动
      3. 若出现任一项，任务判定失败
    Expected Result: 无范围外改动
    Evidence: .sisyphus/evidence/task-4-scope.txt
  ```

  **Commit**: NO

---

## Commit Strategy

| After Task | Message        | Files | Verification |
| ---------- | -------------- | ----- | ------------ |
| N/A        | 本次不要求提交 | N/A   | N/A          |

---

## Success Criteria

### Verification Commands

```bash
node -v
npm -v
npm config get registry
node -e "const e=require('esbuild'); e.transformSync('const x=1'); console.log('esbuild-ok', e.version)"
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
npm run build
npm ls esbuild vite vitest --depth=3
git status --porcelain
```

### Final Checklist

- [x] `npm run dev` 启动成功且无 esbuild mismatch
- [x] `npm run build` 成功
- [x] 修复范围仅限依赖文件与安装状态
- [x] 证据文件完整保存在 `.sisyphus/evidence/`
