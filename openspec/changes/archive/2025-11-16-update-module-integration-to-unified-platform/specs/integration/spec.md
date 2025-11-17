## ADDED Requirements

### Requirement: 模块接入统一平台规范
各模块 SHALL 通过“开关化/隐藏/包装器”策略接入统一提交/计时/页面框架与导航，确保行为一致且可灰度发布。

#### Scenario: 接入与灰度
- WHEN 模块接入统一平台
- THEN DEV 环境可配置失败放行；PROD 环境失败 SHALL 阻断并提示；
- AND 旧导航/计时器 SHALL 关闭或仅展示态，避免重复驱动逻辑。

