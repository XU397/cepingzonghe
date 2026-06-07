## ADDED Requirements

### Requirement: Banana trace contracts use backend-published v2.2 literals
The frontend SHALL emit banana L2 trace events using backend-published `science-inquiry-trace-v2.2` contract literals and SHALL NOT compute registry hashes at runtime.

#### Scenario: START_PAGE contains v2.2 literal metadata
- **WHEN** a banana L2 trace page emits `START_PAGE`
- **THEN** `START_PAGE.value.metadata.schema_version` SHALL equal `science-inquiry-trace-v2.2`
- **AND** `field_registry_version` SHALL equal `science-inquiry-field-registry-v2.2`
- **AND** `field_registry_hash` SHALL equal `93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54`
- **AND** `content_registry_version` SHALL equal `science-inquiry-content-registry-banana-v2.2`
- **AND** `content_registry_hash` SHALL equal `2460fbe2bfea3036543ed10377f795d494797eea0cdcc8f0767843951cc97d35`.

#### Scenario: Rule config uses v2.2 idle threshold
- **WHEN** frontend trace runtime loads banana trace rule config
- **THEN** it SHALL expose `ruleConfigVersion=rule-config-v2.2`
- **AND** `ruleConfigHash=c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83`
- **AND** `pageIdleThresholdMs=5000` for `PAGE_IDLE` generation.

#### Scenario: Contract drift is detected locally
- **WHEN** frontend runtime contracts, docs contract mirrors, or backend v2.2 fixture expectations drift from each other
- **THEN** frontend tests SHALL fail or report the drift before Mark JSON is accepted as compliant.

### Requirement: START_PAGE records safe initial visible context
The frontend SHALL record default visible banana page context in `START_PAGE.value.metadata` and SHALL NOT treat default rendered instructions as active reading events.

#### Scenario: Initial visible content may be empty or registry-backed
- **WHEN** a banana L2 trace page starts
- **THEN** `START_PAGE.value.metadata.initial_visible_content_ids` MAY be omitted or empty
- **AND** every non-empty content id SHALL exist in backend v2.2 banana Content Registry.

#### Scenario: Safe viewport metadata is emitted
- **WHEN** a banana L2 trace page starts
- **THEN** `START_PAGE.value.metadata.main_instruction_visible` and `viewport_state` SHALL contain safe viewport context only
- **AND** they SHALL NOT contain raw DOM snapshots or raw student text.

#### Scenario: Default visible content is not active exposure
- **WHEN** main instructions, prompts, or constraints are visible by default on page load
- **THEN** the frontend SHALL NOT emit active `CONTENT_EXPOSE` solely because the page rendered them.

### Requirement: PAGE_IDLE is generated only for visible and focused idle
The frontend SHALL support `PAGE_IDLE` as an aggregated L2 event only for page-visible, window-focused gaps that exceed the backend v2.2 threshold.

#### Scenario: Compliant idle segment is recorded
- **WHEN** the page is visible, the window is focused, and no effective event occurs with `idle_duration_ms >= pageIdleThresholdMs` (`>= 5000ms`)
- **THEN** the frontend SHALL emit one aggregated `PAGE_IDLE` event
- **AND** `PAGE_IDLE.value.metadata` SHALL include `idle_duration_ms`, `idle_phase`, `page_visible=true`, `window_focused=true`, and `threshold_ms=5000`.

#### Scenario: Hidden or unfocused gap is not compliant idle
- **WHEN** the page is hidden or the window is unfocused during an idle candidate segment
- **THEN** the frontend SHALL NOT emit that segment as compliant `PAGE_IDLE`.

#### Scenario: Only first-version idle phases are used
- **WHEN** the frontend emits `PAGE_IDLE`
- **THEN** `idle_phase` SHALL be one of `initial_before_first_action`, `after_blocked_submit`, or `between_effective_events`
- **AND** the frontend SHALL NOT emit `finish_page_idle` in this change.

#### Scenario: PAGE_IDLE contains no labels
- **WHEN** the frontend emits `PAGE_IDLE`
- **THEN** the event SHALL NOT contain L3 labels, ability judgments, HMM/Viterbi observations, strategy conclusions, or L4 aggregate features.

### Requirement: Page02 records first-version active reading evidence
The frontend SHALL ensure Page02 (`page_02_question_generation`) can provide backend v2.2 active reading evidence through `CONTENT_ACTIVATE` and/or `CHAT_SCROLL`.

#### Scenario: Chat bubble activation is emitted
- **WHEN** the student actively clicks, touches, or otherwise activates a registered Page02 chat bubble
- **THEN** the frontend SHALL emit `CONTENT_ACTIVATE` with `value.page_id=page_02_question_generation`, `value.page_type=B1_TEXT_SINGLE`, and a registered `content_id`.

#### Scenario: User chat scroll is emitted
- **WHEN** the student scrolls the Page02 chat container through a user-originated interaction
- **THEN** the frontend SHALL emit aggregated `CHAT_SCROLL` evidence with backend fixture field names `scroll_delta`, `scroll_direction`, `visible_content_ids_before`, `visible_content_ids_after`, and `phase`
- **AND** programmatic auto-scroll or replay scrolling SHALL NOT be counted as user reading evidence.

#### Scenario: Active CONTENT_EXPOSE is not required
- **WHEN** Page02 produces `CONTENT_ACTIVATE` and/or `CHAT_SCROLL` evidence that satisfies backend v2.2 fixtures
- **THEN** the frontend SHALL NOT be required to emit active `CONTENT_EXPOSE` for this change.

### Requirement: Page02 text timing uses real collector cadence
The frontend SHALL preserve real `TEXT_FOCUS`, debounced/throttled `TEXT_CHANGE`, `TEXT_BLUR`, and submit flush boundaries without fabricating timing.

#### Scenario: Long answer preserves real TEXT_CHANGE cadence
- **WHEN** the student enters a longer Page02 answer with debounce or character-threshold boundaries
- **THEN** the frontend SHALL emit `TEXT_CHANGE` at the real collector boundary
- **AND** `TEXT_CHANGE.value_after` SHALL remain empty/null by default while character counts and deltas are carried in metadata.

#### Scenario: Short blur flush is allowed
- **WHEN** the student enters a short answer and blurs before a natural debounce/throttle boundary
- **THEN** the frontend MAY flush `TEXT_CHANGE` near or at `TEXT_BLUR`
- **AND** the frontend SHALL NOT fabricate intermediate `TEXT_CHANGE` events solely to avoid backend WARN-level collapsed timing diagnostics.

### Requirement: Frontend validation covers backend v2.2 fixtures
The frontend SHALL provide tests proving its Page02 and `PAGE_IDLE` output aligns with backend v2.2 fixtures after implementation.

#### Scenario: Page02 fixture aligns locally
- **WHEN** frontend tests build or validate a Page02 Mark JSON fixture
- **THEN** the fixture SHALL align with backend `page02_question_generation.json` for canonical registry metadata, `viewport_state` field names, `CHAT_SCROLL` field names, active reading evidence, text timing, and submit metadata.

#### Scenario: PAGE_IDLE fixture aligns locally
- **WHEN** frontend tests build or validate a PAGE_IDLE Mark JSON fixture
- **THEN** the fixture SHALL align with backend `page02_page_idle.json`
- **AND** `PAGE_IDLE` SHALL not appear as a frontend label or sequence projection.
