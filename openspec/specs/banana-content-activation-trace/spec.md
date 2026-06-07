# banana-content-activation-trace Specification

## Purpose
TBD - created by archiving change enhance-banana-content-activation-trace. Update Purpose after archive.
## Requirements
### Requirement: Page03 material cards are complete and modal-traced
The banana frontend SHALL render five Page03 material-reading cards and SHALL trace every card modal open and close using registry-backed content IDs.

#### Scenario: Five material cards are visible
- **WHEN** the student views Page03 material reading / factor selection
- **THEN** the page SHALL display five material cards/options available for opening
- **AND** each material card SHALL have a stable `content_id` registered in the banana v2.2 Content Registry.

#### Scenario: Material card open is traced
- **WHEN** the student opens any Page03 material card layer
- **THEN** the frontend SHALL emit `OPEN_MODAL` with `value.page_id=page_03_factor_selection`
- **AND** the event metadata SHALL identify the opened registered material-card `content_id`
- **AND** the event SHALL NOT serialize the full material body copy.

#### Scenario: Material card close is traced
- **WHEN** the student closes an opened Page03 material card layer
- **THEN** the frontend SHALL emit `CLOSE_MODAL` with the same registered material-card `content_id`
- **AND** the event metadata SHALL include modal dwell duration.

### Requirement: Page05 guidance text activation is traced
The banana frontend SHALL trace active reading of the Page05 guidance text above the three plan/idea inputs as aggregated content activation evidence.

#### Scenario: Page05 guidance hover reaches activation threshold
- **WHEN** the student hovers over or touches the Page05 guidance text for the effective activation threshold
- **THEN** the frontend SHALL emit one aggregated `CONTENT_ACTIVATE` event with `value.page_id=page_05_plan_generation`
- **AND** the event SHALL use a registered Page05 guidance `content_id`
- **AND** the event metadata SHALL include safe activation metadata such as activation type and dwell duration.

#### Scenario: Page05 short hover is ignored
- **WHEN** the student briefly passes over the Page05 guidance text below the effective activation threshold
- **THEN** the frontend SHALL NOT emit `CONTENT_ACTIVATE` for that pass.

### Requirement: Page06 method materials activation is traced
The banana frontend SHALL trace active reading of each Page06 method material block, including the method text and image content, as aggregated content activation evidence.

#### Scenario: Page06 method block hover reaches activation threshold
- **WHEN** the student hovers over or touches any Page06 method text/image material block for the effective activation threshold
- **THEN** the frontend SHALL emit `CONTENT_ACTIVATE` with `value.page_id=page_06_method_evaluation`
- **AND** the event SHALL use the registered `content_id` for that method material block
- **AND** the event metadata SHALL identify the method material without serializing raw method content.

#### Scenario: Page06 method blocks are individually identifiable
- **WHEN** the student activates different Page06 method material blocks
- **THEN** each emitted `CONTENT_ACTIVATE` event SHALL carry the corresponding registered method material `content_id`
- **AND** the three methods SHALL remain distinguishable in trace data.

### Requirement: Page12 decision guidance activation is traced
The banana frontend SHALL trace active reading of the Page12 top decision guidance text as aggregated content activation evidence.

#### Scenario: Page12 top guidance hover reaches activation threshold
- **WHEN** the student hovers over or touches the Page12 top guidance text for the effective activation threshold
- **THEN** the frontend SHALL emit `CONTENT_ACTIVATE` with `value.page_id=page_12_solution_selection`
- **AND** the event SHALL use a registered Page12 guidance `content_id`
- **AND** the event SHALL NOT include raw guidance copy in metadata.

### Requirement: Content activation remains low-noise and contract-valid
The banana frontend SHALL use Page02-style effective activation rules for added content areas and SHALL keep emitted content IDs aligned with v2.2 contracts.

#### Scenario: Mouse movement is aggregated
- **WHEN** the student moves the mouse over traced Page05, Page06, or Page12 content areas
- **THEN** the frontend SHALL aggregate the interaction into at most meaningful `CONTENT_ACTIVATE` events
- **AND** it SHALL NOT emit raw high-frequency `mousemove` operations.

#### Scenario: Content registry validation succeeds
- **WHEN** the frontend emits `OPEN_MODAL`, `CLOSE_MODAL`, or `CONTENT_ACTIVATE` for the added Page03, Page05, Page06, or Page12 content areas
- **THEN** every emitted `content_id` SHALL exist in the runtime banana v2.2 Content Registry
- **AND** the docs mirror SHALL contain the same content IDs and registry hash.

