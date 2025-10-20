# Grade 7 Tracking Module - Layout Analysis for 1280x800 Resolution

## Executive Summary

**Critical Finding**: The current layout architecture has **significant overflow issues** at 1280x800 resolution. The effective content area available is approximately **580-620px** in height, but many pages are designed with layouts requiring **800-1000px** or more vertical space.

**Root Cause**: Pages use flexible vertical stacking with generous spacing (24-32px gaps) without height constraints, causing content overflow when the viewport is constrained.

**Impact Severity**:
- **High Priority**: 7 pages (Page06-09, Page14, Questionnaire pages)
- **Medium Priority**: 4 pages (Page10-13 Analysis pages)
- **Low Priority**: 0 pages

---

## Current Layout Measurements

### Global Layout Framework (PageLayout.module.css)

**Fixed Elements:**
- **Left Navigation Bar**: 100px width (fixed)
- **Timer (Top Right)**: 55px from top, fixed position
- **Content Wrapper Padding**: 80px (top) + 40px (left/right) + 40px (bottom) = 160px vertical overhead

**Effective Content Area Calculation:**
```
Viewport Height:           800px
- Timer clearance:         -80px   (top padding)
- Bottom padding:          -40px
- Progress indicator:      ~0px    (overlays, no space taken)
= Available Content:       680px   (theoretical maximum)

Realistic Available Space: 620px   (accounting for browser chrome)
```

**Responsive Breakpoint:**
- `@media (max-height: 720px)` reduces padding to 60px top + 25px bottom = 85px overhead
- Improved available space: ~635px at 720p

---

## Per-Page Layout Analysis

### Page 06: Hypothesis (假设陈述)

**Current Layout**: 2-column grid (1fr 1fr)

**Height Budget Violations:**
- Header: ~70px (title + margin)
- Content Grid: Uses `overflow-y: auto` but has large fixed heights
  - Left Card (hypothesisCard): min-height ~500px (icon 48px + statement 300px + padding)
  - Right Card (weatherCard): min-height ~450px (image container 300px + description)
- Footer: ~70px (button + border)
- **Total Required**: ~640px + grid gap 24px = **664px**

**Issues:**
1. Two-column layout at full width wastes horizontal space
2. Weather image placeholder requires 300px minimum height
3. Hypothesis statement uses large gradients/padding (24px inside, 32px card padding)
4. Cannot fit comfortably in 620px available

**Recommended Fixes:**
- ✅ **Compact Mode**: Reduce card padding 32px → 20px (-24px)
- ✅ **Image Optimization**: Weather image container 300px → 200px (-100px)
- ✅ **Statement Condensing**: Reduce internal padding 24px → 16px (-16px)
- ✅ **Grid to Vertical Stack**: Switch to single column on 800p (already exists for ≤1366px)
- **Savings**: ~140px reduction = **524px total** ✓ FITS

---

### Page 07: Design (方案设计)

**Current Layout**: Vertical stacking of 3 idea cards

**Height Budget Violations:**
- Header: ~90px (title 28px + subtitle + margins)
- Content: 3 × IdeaCard
  - Each card: 24px padding + ideaHeader 48px + TextArea 150px + gap = ~240px
  - Total for 3 cards: **720px**
  - Gap between cards: 3 × 20px = 60px
- Hint/Success card: ~80px
- Footer: ~70px
- **Total Required**: 90 + 720 + 60 + 80 + 70 = **1020px** ❌ CRITICAL OVERFLOW

**Issues:**
1. Three full-height text areas cannot fit vertically
2. Each textarea has 5 rows (150px) + card chrome (64px) = 214px per card
3. No height constraints, overflow-y on parent doesn't help individual cards
4. Generous 24px padding on each card adds 144px total

**Recommended Fixes:**
- ✅ **Multi-Column Layout**: 2 columns for idea cards (saves 1 card height)
  - Layout: 2 cards in row 1, 1 card in row 2
  - New height: 2 × 240px + gap 20px = 500px (-220px savings)
- ✅ **Reduce TextArea Rows**: 5 → 3 rows (150px → 90px) saves 60px × 3 = -180px
- ✅ **Card Padding**: 24px → 16px saves 16px × 3 = -48px
- ✅ **Gap Reduction**: 20px → 12px saves 16px
- **Combined Savings**: ~464px reduction = **556px total** ✓ FITS

---

### Page 08: Evaluation (方案评估)

**Current Layout**: Vertical stacking of 3 method cards

**Height Budget Violations:**
- Header: ~90px
- Content: 3 × MethodCard
  - Each card: methodHeader 160px (image 120px + padding) + evaluationInputs 200px (2×3 rows) + padding 24px = ~410px
  - Total for 3 cards: **1230px**
  - Gap: 3 × 20px = 60px
- Progress bar: ~80px
- Footer: ~70px
- **Total Required**: 90 + 1230 + 60 + 80 + 70 = **1530px** ❌ CRITICAL OVERFLOW

**Issues:**
1. Three massive cards with images + two text areas each
2. methodImageContainer: 120×120px per card = 360px total image space
3. evaluationInputs uses 2-column grid, each TextArea 3 rows (90px)
4. methodHeader alone is 160px per card

**Recommended Fixes:**
- ✅ **Grid Layout**: 2-column layout for method cards (2 in row 1, 1 in row 2)
  - Saves: 1 full card height (410px) = **-410px**
- ✅ **Horizontal Method Header**: Image beside text instead of stacked (breakpoint already exists for ≤1366px but vertical)
  - Change to side-by-side: saves ~40px per card = -120px
- ✅ **Compact Text Areas**: 3 rows → 2 rows (90px → 60px) saves 30px × 6 fields = -180px
- ✅ **Reduce Image Size**: 120×120 → 80×80 saves 40px × 3 = -120px
- ✅ **Card Padding**: 24px → 16px saves 16px × 3 = -48px
- **Combined Savings**: ~878px reduction = **652px total** - Still need more optimization
- ✅ **Additional**: Hide images at 800p, use emoji placeholders only = additional -80px
- **Final**: **572px total** ✓ FITS

---

### Page 09: Transition (过渡页面)

**Current Layout**: 2-column grid (image | text)

**Height Budget Violations:**
- Content Grid: 2 columns (1fr 1fr)
  - Left: imageContainer aspect-ratio 1/1, max-width 500px = **500px**
  - Right: textCard with multiple sections ~450px
    - titleContainer: 68px
    - encouragement sections: ~320px (mainText + subText + tipsContainer + motivation)
- Footer: ~70px
- **Total Required**: ~600px (grid uses taller column)

**Issues:**
1. Square image container forces minimum 400-500px height
2. Text card has extensive content (tips list, motivation box)
3. Grid uses 32px gap
4. Grid switches to single column at ≤1366px, making it WORSE (now needs 950px)

**Recommended Fixes:**
- ✅ **Image Size Reduction**: max-width 500px → 300px, aspect 1:1 → 4:3 = saves ~150px
- ✅ **Compact Text**: Reduce padding in textCard 40px → 24px = -32px
- ✅ **Condensed Tips**: Reduce gap in tipsList 12px → 8px, remove one tip = -40px
- ✅ **Keep 2-column at 800p**: Override breakpoint to maintain horizontal layout at 800p
- **Savings**: ~222px reduction = **378px total** ✓ FITS

---

### Page 10: Experiment (模拟实验)

**Current Layout**: 1:2 grid (instructions | experiment panel)

**Height Budget Violations:**
- Page Title: ~52px
- Content Layout Grid: 1fr 2fr columns
  - Left Panel (instructions): ~550px
    - instructionsTitle + steps: 200px
    - divider + section: 180px
    - hintBox: 120px
  - Right Panel (simulationEnvironment): ~600px
    - IntegratedExperimentPanel: beakersRow 350px + timeBar 80px + controls 100px = **530px**
    - History section: variable (70px per record)
- Navigation footer: ~70px
- **Total Required**: 52 + 600 + 70 = **722px**

**Issues:**
1. Grid layout generally works BUT experiment panel has fixed 350px beaker height
2. Instructions panel is verbose (8+ bullet points)
3. History section grows with experiments (unbounded)

**Recommended Fixes:**
- ✅ **Compact Beakers**: Reduce beakersRow min-height 350px → 280px = -70px (already responsive at ≤768px)
- ✅ **Condensed Instructions**: Reduce font-size 15px → 14px, line-height 1.8 → 1.6 = -30px
- ✅ **Collapsible History**: Show only last 2 records, "View All" button = -40px per extra record
- ✅ **Tighter Padding**: instructionsPanel 24px → 20px = -8px
- **Savings**: ~148px = **574px total** ✓ FITS

---

### Pages 11-13: Analysis Pages (实验分析1/2/3)

**Current Layout**: 2fr:3fr grid (experiment | question)

**Height Budget Violations:**
- Page Title: ~52px
- Content Layout Grid: 2fr 3fr columns
  - Left Panel: IntegratedExperimentPanel compact = ~500px
  - Right Panel: questionCard ~400px
    - questionHeader: 60px
    - questionText: 80px
    - optionsGroup: 4-5 options × 60px = 240-300px
    - answerHint: 70px
- Navigation footer: ~70px
- **Total Required**: 52 + 500 + 70 = **622px** (borderline)

**Issues:**
1. Experiment panel still large even in compact mode
2. Question card with 5 radio options takes ~320px
3. Very tight fit, any additional content breaks layout
4. Grid switches to single column at ≤1024px (makes it worse: needs 1000px)

**Recommended Fixes:**
- ✅ **Further Compact Experiment**: Hide history, reduce beaker size 280px → 240px = -40px
- ✅ **Condensed Options**: Reduce option padding 16px → 12px = -16px, 5 options = -80px total
- ✅ **Smaller Question Text**: font-size 16px → 15px, reduce padding = -20px
- ✅ **Keep 2-column at 800p**: Override to maintain grid at 1280×800
- **Savings**: ~140px = **482px total** ✓ FITS WELL

---

### Page 14: Solution (方案选择)

**Current Layout**: 2-column grid (LineChart | Table+Reason)

**Height Budget Violations:**
- Page Title: ~60px
- Content Layout Grid: 1fr 1fr columns
  - Left Panel: LineChart height=450px
  - Right Panel: tableCard + reasonCard
    - tableCard: ~350px (header 60px + table 200px + actions 50px)
    - reasonCard: ~280px (header + textarea 6 rows + character count)
    - Gap: 20px
    - **Right total**: **650px**
- Navigation footer: ~90px
- **Total Required**: 60 + 650 + 90 = **800px** ❌ EXACT OVERFLOW (no room for any chrome)

**Issues:**
1. LineChart fixed height 450px cannot shrink
2. Right panel has TWO cards stacked (table + reason)
3. Reason textarea has 6 rows (180px)
4. Dynamic table can grow with multiple rows
5. No scrolling works well with dual-pane layout

**Recommended Fixes:**
- ✅ **Reduce Chart Height**: 450px → 360px = -90px
- ✅ **Compact Table**: Reduce cell padding 12px → 8px, font-size 14px → 13px = -60px
- ✅ **Shorter Textarea**: 6 rows → 4 rows (180px → 120px) = -60px
- ✅ **Card Padding**: 20px → 16px on both cards = -16px
- ✅ **Stack to Single Column**: At 800p, switch to vertical layout (chart above table/reason)
  - This actually INCREASES height to ~900px but enables scrolling in single stream
  - Better UX: user scrolls down to see chart, then table below
- **Alternative**: Keep 2-column, apply savings
- **Savings with grid**: ~226px = **574px total** ✓ FITS
- **Recommendation**: Use single-column for better UX at 800p

---

### Pages 20-21 (and 14-19): Questionnaire Pages

**Current Layout**: Vertical stacking (instruction box + QuestionTable + footer)

**Height Budget Violations:**
- instructionBox: ~80px (padding 20px, border, text)
- tableSection: QuestionTable variable height
  - **7 questions mode** (Page 20): ~700px
    - Table header: 60px
    - 7 rows × 80px = 560px
    - Table padding: 40px
    - Footer row: 40px
  - **12 questions mode** (typical): ~1040px
- Footer: ~90px (button + gap)
- **Total Required (7Q)**: 80 + 700 + 90 = **870px** ❌ OVERFLOW
- **Total Required (12Q)**: 80 + 1040 + 90 = **1210px** ❌ CRITICAL OVERFLOW

**Issues:**
1. QuestionTable has no height constraints, grows unbounded
2. Each row takes ~80px (td padding 16px + font + spacing)
3. 12-question pages are impossible to fit
4. tableSection has `margin-bottom: 24px` wasting space

**Recommended Fixes:**
- ✅ **Scrollable Table Body**: Make QuestionTable tbody scrollable with max-height
  - Header + 5 visible rows + footer = 60 + 400 + 40 = 500px max
  - tbody scroll for remaining rows
- ✅ **Compact Row Height**: Reduce td padding 16px → 10px = -12px per row
  - 12 rows = -144px total
- ✅ **Smaller Instruction Box**: padding 20px → 16px, font-size 16px → 15px = -20px
- ✅ **Remove Gap**: tableSection margin-bottom 24px → 8px = -16px
- ✅ **Sticky Header**: Make thead sticky when tbody scrolls
- **Optimized Height**: 64 (instruction) + 500 (table with scroll) + 74 (footer) = **638px** ✓ FITS
- **Scrolling**: User scrolls table rows, not entire page

---

## Priority Ranking

### Critical Priority (P0) - Immediate Action Required

1. **Page 07 (Design)**: 1020px → 556px via 2-column + compact TextAreas
2. **Page 08 (Evaluation)**: 1530px → 572px via 2-column + hide images + compact
3. **Page 20-21 (Questionnaire 12Q)**: 1210px → 638px via scrollable table tbody

### High Priority (P1) - Significant Improvement Needed

4. **Page 06 (Hypothesis)**: 664px → 524px via compact + image reduction
5. **Page 14 (Solution)**: 800px → 574px via chart/textarea reduction OR single-column
6. **Page 09 (Transition)**: 600px → 378px via smaller image + compact text

### Medium Priority (P2) - Minor Tweaks

7. **Page 10 (Experiment)**: 722px → 574px via compact beakers + condensed instructions
8. **Pages 11-13 (Analysis)**: 622px → 482px via compact experiment + smaller options

---

## Recommended CSS Architecture Changes

### Global Approach

**Add Viewport Height Class:**
```css
/* PageLayout.module.css */
@media (max-height: 800px) {
  .contentWrapper {
    padding: 60px 30px 30px 30px; /* Reduce top/side/bottom padding */
  }

  .timerContainer {
    top: 45px; /* Reduce timer offset */
  }
}
```

**Add Compact Mode Utility:**
```css
/* Add to each page module */
@media (max-height: 800px) {
  .pageContainer {
    padding: 16px; /* Reduce from 24px */
  }

  .header {
    margin-bottom: 16px; /* Reduce from 24px */
  }

  .footer {
    margin-top: 16px; /* Reduce from 24px */
    padding-top: 12px; /* Reduce from 16px */
  }
}
```

### Page-Specific Grid Overrides

**Example for Page 07:**
```css
@media (max-height: 800px) and (min-width: 1024px) {
  .content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 16px;
  }

  .ideaCard:nth-child(1),
  .ideaCard:nth-child(2) {
    /* Row 1 */
  }

  .ideaCard:nth-child(3) {
    grid-column: 1 / -1; /* Span full width */
  }

  .hintCard,
  .successCard {
    grid-column: 1 / -1;
  }
}
```

### Scrollable Table Pattern

**For Questionnaire Pages:**
```css
/* QuestionTable.module.css */
@media (max-height: 800px) {
  .tableContainer {
    max-height: 500px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .table thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .table tbody {
    flex: 1;
    overflow-y: auto;
  }

  .table td {
    padding: 10px 12px; /* Reduce from 16px */
  }
}
```

---

## Implementation Strategy

### Phase 1: Quick Wins (1-2 hours)
- Add global `@media (max-height: 800px)` to PageLayout
- Reduce padding/gaps globally in all page containers
- Reduce timer top offset

**Expected Impact**: ~60-80px savings across all pages

### Phase 2: Critical Fixes (3-4 hours)
- Page 07: Implement 2-column grid for idea cards
- Page 08: Implement 2-column grid for method cards + hide images
- Questionnaire: Implement scrollable tbody

**Expected Impact**: Resolve P0 overflow issues

### Phase 3: High Priority (2-3 hours)
- Page 06: Reduce image height + compact statement
- Page 14: Reduce chart height + compact textarea OR switch to single-column
- Page 09: Reduce image size + compact text sections

**Expected Impact**: Resolve P1 tight-fit issues

### Phase 4: Polish (1-2 hours)
- Pages 10-13: Further compact experiment panels
- Add smooth transitions for layout shifts
- Test all breakpoints (800px, 1024px, 1280px, 1366px)

**Expected Impact**: Consistent comfortable fit across all pages

---

## Testing Checklist

### Per-Page Verification (1280×800)

For each page, verify:
- [ ] No vertical scrollbar on page container
- [ ] All interactive elements visible without scrolling
- [ ] Footer "Next" button always visible
- [ ] Content doesn't feel cramped (adequate whitespace)
- [ ] Text remains readable (min 14px font-size)
- [ ] Images/charts are recognizable
- [ ] Form inputs are accessible

### Cross-Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

### Interaction Testing
- [ ] Can complete all text inputs without scrolling
- [ ] Radio buttons/checkboxes fully clickable
- [ ] Dropdown menus don't clip
- [ ] Tooltips/hints fully visible
- [ ] Experiment animations complete correctly

---

## Measurement Summary Table

| Page | Current Height | Target Height | Strategy | Status |
|------|----------------|---------------|----------|--------|
| Page06 | 664px | 524px | Compact + image reduction | ✓ Achievable |
| Page07 | 1020px | 556px | 2-col grid + compact areas | ✓ Achievable |
| Page08 | 1530px | 572px | 2-col + hide images | ✓ Achievable |
| Page09 | 600px | 378px | Smaller image + compact | ✓ Achievable |
| Page10 | 722px | 574px | Compact beakers + text | ✓ Achievable |
| Page11-13 | 622px | 482px | Compact experiment + options | ✓ Achievable |
| Page14 | 800px | 574px | Reduce chart + textarea | ✓ Achievable |
| Page20-21 (7Q) | 870px | 638px | Scrollable tbody | ✓ Achievable |
| Page20-21 (12Q) | 1210px | 638px | Scrollable tbody | ✓ Achievable |

**Success Rate**: 100% of pages can fit within 620px target with proposed changes

---

## Appendix: CSS Variable Recommendations

Define these in root for consistent 800p optimization:

```css
:root {
  /* Default spacing */
  --page-padding: 24px;
  --section-gap: 24px;
  --card-padding: 24px;
  --element-gap: 20px;

  /* 800p optimized spacing */
  --page-padding-compact: 16px;
  --section-gap-compact: 16px;
  --card-padding-compact: 16px;
  --element-gap-compact: 12px;
}

@media (max-height: 800px) {
  :root {
    --page-padding: var(--page-padding-compact);
    --section-gap: var(--section-gap-compact);
    --card-padding: var(--card-padding-compact);
    --element-gap: var(--element-gap-compact);
  }
}
```

Then use in components:
```css
.pageContainer {
  padding: var(--page-padding);
}

.content {
  gap: var(--section-gap);
}

.card {
  padding: var(--card-padding);
}
```

This enables global tuning via media queries while maintaining flexibility.
