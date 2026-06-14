## ADDED Requirements

### Requirement: Science Inquiry Module Definition of Ready

科学探究 13 页同构类子模块（含 banana / honey / steamed-bread 及后续同构主题）进入代码实施前，MUST 以 `science-inquiry-13page-trace-contract` 规约为门禁输入。模块实施 MUST 满足：13 页 page_instance_confirmation 全部存在、每页 `user_confirmation_status=approved`、所有 V2/V3 差异已用户确认或拆分为标准升级需求、Field Registry / Content Registry / rule_config / acceptance cases 的来源和版本已记录、cp 对事件 schema 和 registry hash 的自检方式已明确。

未满足上述条件的模块 SHALL NOT 进入代码实现。该门禁 MUST 在 cp proposal/apply 阶段与 `science-inquiry-experiment-handbook.md` 的实施前检查清单中同时生效。

#### Scenario: 同构模块实施前必须完成逐页确认

- **WHEN** agent 启动蜂蜜黏度或蒸馒头等同构模块的代码实施
- **THEN** 实施前检查清单 MUST 验证 13 页 page_instance_confirmation 全部存在且 `approved`
- **AND** 任一未确认页 MUST 阻断该页代码实施

#### Scenario: V2/V3 差异未决不得实施

- **WHEN** 某页 variance_report.level 为 V2 或 V3 且未完成用户确认或标准升级
- **THEN** 该模块 MUST NOT 进入代码实现
- **AND** MUST 在确认门禁报告中显式列出未决差异
