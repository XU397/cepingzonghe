---
title: page_00 notice (out of trace topology)
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
out_of_trace_topology: true
---

# 注意事项页（不计入 13 页 trace 拓扑）

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 0  # 不计入 13 页
  standard_page_id: intro_notice
  legacy_page_id: intro_notice
  page_number: "1"  # subPageNum=1
  pageDesc: 注意事项

  out_of_trace_topology: true
  navigation_mode: hidden
  loads_submodule_timer: false

  rationale: >
    注意事项页是任务前置说明，采用 hidden 导航模式，不加载 Flow 全局倒计时组件，
    不产生 L2 trace 事件，不计入 13 页科学探究 trace 拓扑。
    参见 AGENTS.md "Flow 子模块计时器策略"。

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: banana 注意事项页，hidden 模式，无 trace。
```
