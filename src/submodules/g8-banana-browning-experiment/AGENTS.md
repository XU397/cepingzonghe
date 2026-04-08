# G8 BANANA BROWNING SUBMODULE KNOWLEDGE BASE

## OVERVIEW

标准 Flow 子模块骨架。当前阶段仅提供可运行 shell：第一页为内置提示页，后续 13 个业务页面均为占位页，后续再按页面规格逐步填充。

## WHERE TO LOOK

| Task         | Location                                                                           | Notes                                        |
| ------------ | ---------------------------------------------------------------------------------- | -------------------------------------------- |
| 子模块定义   | `src/submodules/g8-banana-browning-experiment/index.tsx`                           | registry-facing contract                     |
| 运行时入口   | `src/submodules/g8-banana-browning-experiment/Component.tsx`                       | frame wiring + next pipeline                 |
| 页面映射     | `src/submodules/g8-banana-browning-experiment/mapping.ts`                          | 页面元数据单一真相源；phase-1 题目映射为空   |
| Context 状态 | `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx` | stable logOperation + flow_context injection |
| 页面组件     | `src/submodules/g8-banana-browning-experiment/pages/`                              | Page01Notice 可运行，其余为 placeholder      |

## CONVENTIONS

- 页面元数据统一维护在 `mapping.ts`。
- 仅通过 `AssessmentPageFrame` 走提交流程。
- 页面交互日志统一通过 context 的 `logOperation` 记录，页面组件不得直连提交 API。

## ANTI-PATTERNS

- 在页面组件里手写 pageNumber 或 target prefix。
- 直接调用 `/stu/saveHcMark`。
- 用页面局部不稳定函数替换 context 的 stable `logOperation`。
