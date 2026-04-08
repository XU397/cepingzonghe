# Architectural Decision Records (ADR) - Project Level

**Project**: HCI Evaluation Platform  
**Purpose**: Track project-level architectural decisions  
**Last Updated**: 2026-02-07

---

## Format Guide

```markdown
### ADR-XXX: Decision Title (YYYY-MM-DD)

**Status**: Proposed / Accepted / Deprecated / Superseded

**Context:**

- Why the decision was needed
- What problem it solves

**Decision:**

- What was chosen

**Alternatives Considered:**

- Option 1 -> Why rejected
- Option 2 -> Why rejected

**Consequences:**

- Benefits
- Trade-offs

**Related:**

- Link to docs/DECISIONS.md for detailed ADRs
```

---

## Active Decisions

### ADR-001: Project Memory System (2026-02-07)

**Status**: Accepted

**Context:**

- Project has complex architecture (dual routing, flow system)
- Knowledge was scattered across AGENTS.md, docs/, and code comments
- Need consistent way to track bugs, decisions, and key facts across AI sessions

**Decision:**

- Implement structured project memory system in `docs/project_notes/`
- Four files: bugs.md, decisions.md, key_facts.md, issues.md
- Update AGENTS.md with memory protocols

**Alternatives Considered:**

- Single comprehensive wiki -> Too heavy, hard to maintain
- Only AGENTS.md -> Not enough structure for operational knowledge
- External documentation tool -> Adds complexity, not integrated

**Consequences:**

- ✅ Consistent knowledge tracking across sessions
- ✅ Easy to update during development
- ✅ AI can proactively search for known solutions
- ❌ Requires discipline to maintain
- ❌ Potential for outdated entries

### ADR-002: 子模块构建标准规范 (2026-02-08)

**Status**: Accepted

**Context:**

- 项目从独立模块迁移到 Flow 架构，通过子模块拼接
- 已完成的子模块实现方式不一致（wrapper bridge、分层、巨组件、标准模式）
- 需要统一的构建标准，避免未来子模块继续分裂
- AI 开发需要明确的规范和检查清单

**Decision:**

- 采用**标准子模块模式**作为未来新子模块的唯一推荐模式
- 采用**垂直切片**方式构建：每页任务必须同时包含 UI + 轨迹/提交合规
- 建立标准文档体系：
  - `docs/submodule-page-build-process.md` - 详细构建流程与检查清单
  - `docs/submodule-build-workflow.md` - 架构分析与决策依据
  - `docs/submission-spec.md` - 数据提交格式规范
- 强制使用 `AssessmentPageFrame` + `usePageSubmission` 统一提交
- 必须通过 `npm run lint:submission` 和 `npm run test:submission-format` 验证

**标准子模块架构蓝图：**

```
src/submodules/<submoduleId>/
  index.tsx|jsx           # SubmoduleDefinition
  Component.tsx|jsx       # Provider + Frame
  mapping.ts              # SUBMODULE_MAPPING_CONFIG
  context/<Name>Context.* # answers/operations + 稳定 logOperation
  pages/                  # 页面组件（只做语义与 UI）
  __tests__/              # mapping 合规 + submission 测试
```

**迁移策略：**

- Legacy 模块优先使用 Wrapper Bridge 模式快速上 Flow
- 存量模块逐步合规化，不强制一次性重写
- 新子模块必须从开始就符合标准

**Alternatives Considered:**

- 水平拆分（先 UI 后合规）-> 返工成本高，容易遗漏合规点
- 完全重写所有存量模块 -> 风险过高，不必要
- 不统一标准 -> 继续分裂，维护成本爆炸

**Consequences:**

- ✅ 新子模块实现方式统一
- ✅ 可预测的验收标准（guard 全绿）
- ✅ AI 可遵循明确规范自动构建
- ❌ 需要学习成本理解 schema 和 guards
- ❌ 部分存量模块需要逐步改造

---

## References

- **子模块构建流程**: `docs/submodule-page-build-process.md`
- **架构决策分析**: `docs/submodule-build-workflow.md`
- **数据提交规范**: `docs/submission-spec.md`
- **详细 ADRs**: See `docs/DECISIONS.md` for system-level architectural decisions
- **Architecture Overview**: See `docs/ARCHITECTURE.md` for system design
- **AGENTS.md**: See root `AGENTS.md` for coding conventions

---

**Note**: This file tracks project-level process decisions. For system architecture decisions, use `docs/DECISIONS.md`.
