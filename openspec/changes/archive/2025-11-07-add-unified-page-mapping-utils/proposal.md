## Proposal: add-unified-page-mapping-utils

## Why
- 统一 `pageNum → pageId → pageInfo` 映射与复合页码解析，减少各模块各自实现的差异与缺陷。

## What Changes
- 新增 `shared/utils/pageMapping.ts` 工具与约定；
- `submodules/*/mapping.ts` 只维护表，解析与边界处理复用工具。

## Impact
- 映射稳定、边界一致、便于测试。
