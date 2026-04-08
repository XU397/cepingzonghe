# Bug Log

**Project**: HCI Evaluation Platform  
**Purpose**: Track bugs, their solutions, and prevention strategies  
**Last Updated**: 2026-02-07

---

## Format Guide

```markdown
### YYYY-MM-DD - Brief Bug Description

- **Issue**: What went wrong (1-2 sentences)
- **Root Cause**: Why it happened (technical explanation)
- **Solution**: How it was fixed (specific steps or code changes)
- **Prevention**: How to avoid it in the future (best practices)
```

---

## Active Bugs

_No active bugs currently tracked._

---

## Resolved Bugs

### 2026-02-06 - FlowOrchestrator Type Error

- **Issue**: Type 'SubmoduleDefinition | null | undefined' is not assignable to type 'SubmoduleDefinition | null'
- **Root Cause**: FlowOrchestrator.ts 第 160 行返回类型不匹配，可能返回 undefined 但类型只允许 null
- **Solution**: 需要修复类型定义或确保返回值不为 undefined
- **Prevention**: 启用 strict TypeScript 检查，避免隐式 undefined 返回

---

## Bug Patterns

### Common Categories

1. **Type Safety Issues** - TypeScript 类型不匹配
2. **Flow State Sync** - Flow 进度同步问题
3. **Timer Management** - 计时器启动/停止/清理问题
4. **Submission Failures** - 数据提交失败或格式错误
5. **Session Management** - 登录状态、401 处理

---

## Search Tips

```bash
# Find bugs by keyword
grep -i "timer" docs/project_notes/bugs.md

# Find bugs by date
grep "2026-01" docs/project_notes/bugs.md

# Find recent bugs
tail -50 docs/project_notes/bugs.md
```

---

**Note**: This file is maintained by the development team. Add new bugs as they are discovered and resolved.
