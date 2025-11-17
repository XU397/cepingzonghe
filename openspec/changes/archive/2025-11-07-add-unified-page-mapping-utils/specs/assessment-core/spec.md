## ADDED Requirements

### Requirement: 页面映射与复合页码解析
平台 MUST 提供统一的页面映射工具与复合页码解析，以保证各模块行为一致。

#### Scenario: 工具与边界
- WHEN 根据 `pageNum` 或 `M<stepIndex>:<subPageNum>` 恢复页面
- THEN 工具函数 SHALL 返回稳定的 `pageId`；
- AND 越界 SHALL 回落到“注意事项页”作为默认。

