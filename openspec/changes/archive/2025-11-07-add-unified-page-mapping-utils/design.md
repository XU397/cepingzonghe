## Context
- 各模块存在不同的页码到页面 ID 的映射方式；需要统一工具与复合页码解析。

## Goals / Non-Goals
- Goals:
  - `getTargetPageIdFromPageNum(n)` 与 `parseCompositePageNum(s)` 工具。
  - 越界与默认页（注意事项页）的一致策略。
  - 为 `submodules/*/mapping.ts` 提供类型与最小校验。
- Non-Goals:
  - 不强制改动历史映射表的命名，但统一输出接口。

## Decisions
- 工具位置：`shared/utils/pageMapping.ts`。
- 复合页码：支持 `M<stepIndex>:<subPageNum>` 与 `stepIndex.subPageNum` 两种形式。
- 默认页：当 `pageNum` 无效或缺失时返回注意事项页。

## APIs
- `getTargetPageIdFromPageNum(n, mapping): string`
- `parseCompositePageNum(s): { stepIndex: number, subPageNum: number } | null`
- `types`: `PageInfo`, `PageMapping`。

## Risks / Trade-offs
- 不同模块的边界页不同：通过 mapping 明确默认页 id；工具只负责策略与解析。

## Migration Plan
1) 提供工具与类型；
2) 包装器的 `mapping.ts` 统一使用；
3) 旧模块按需逐步替换。

