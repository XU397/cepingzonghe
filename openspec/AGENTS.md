# OpenSpec Compatibility Guide

The legacy OpenSpec assistant instructions have moved to the OPSX command and skill set. This stub is kept so older tools that open `openspec/AGENTS.md` still find the current workflow entry points.

## Current Entry Points

- Explore requirements: `/opsx:explore` or `.claude/skills/openspec-explore/SKILL.md`
- Propose a change: `/opsx:propose` or `.claude/skills/openspec-propose/SKILL.md`
- Apply an approved change: `/opsx:apply` or `.claude/skills/openspec-apply-change/SKILL.md`
- Archive a completed change: `/opsx:archive` or `.claude/skills/openspec-archive-change/SKILL.md`

## Compatibility Guardrails

- Read `openspec/project.md` before capability-level or architecture changes.
- Do not implement proposal-stage changes until the proposal is approved.
- Keep changes scoped to the approved OpenSpec change and update `tasks.md` truthfully.
- Validate with the relevant `openspec validate ... --strict` command before handoff.
