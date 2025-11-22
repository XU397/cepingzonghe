## ADDED Requirements
### Requirement: Flow Completion Page
Flow orchestration SHALL render an in-app completion page after all steps finish, instead of redirecting to login.

#### Scenario: Render and stop timers
- **WHEN** FlowOrchestrator detects no remaining steps
- **THEN** FlowModule SHALL render a completion page inside the frame (no external navigation)
- **AND** task/questionnaire timers SHALL be stopped/reset and heartbeat SHALL be disabled while on this page

#### Scenario: Content and CTA
- **WHEN** the completion page is shown
- **THEN** it SHALL support configured title/content and a primary CTA button
- **AND** the CTA SHALL default to navigating to login if no custom link is provided
- **AND** the layout SHALL follow the provided design (祝贺语、说明文本、按钮文案“继续完成问卷调查”、提示语“问卷大约需要10分钟时间。”)
