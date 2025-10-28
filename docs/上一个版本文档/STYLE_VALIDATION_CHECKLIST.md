# Grade 7 Tracking Module - Style Validation Checklist

## 📋 Purpose

Use this checklist to verify that your page implementation meets the unified style standards of the Grade 7 module system.

---

## 🎨 Visual Consistency

### Colors & Theming
- [ ] Uses CSS variables from `global.css` (no hardcoded colors)
- [ ] Primary actions use `var(--cartoon-primary)` blue
- [ ] Warnings/errors use `var(--cartoon-red)`
- [ ] Success states use `var(--cartoon-green)`
- [ ] Background matches `var(--cartoon-bg)` cream
- [ ] Borders use `var(--cartoon-border)` orange
- [ ] Text uses `var(--cartoon-dark)` for headings
- [ ] Shadows use `var(--cartoon-shadow)` consistently

### Typography
- [ ] Page title is 24px, bold with underline accent
- [ ] Section headers are 20px, bold
- [ ] Body text is 16px
- [ ] Input labels are 18px, bold
- [ ] Button text is 18px, bold
- [ ] Font family is 'PingFang SC', 'Microsoft YaHei', sans-serif

### Spacing
- [ ] Page container has 30px padding
- [ ] Content boxes have 20px padding
- [ ] Buttons have 12px vertical, 24px horizontal padding
- [ ] Form controls have 8px bottom margin
- [ ] Navigation has 30px top margin
- [ ] Consistent use of spacing scale (8px, 12px, 20px, 30px)

### Borders & Radius
- [ ] Buttons use 12px border-radius
- [ ] Content boxes use 15px border-radius
- [ ] Inputs use 12px border-radius
- [ ] Borders are 3px solid `var(--cartoon-border)`
- [ ] Timer has 30px border-radius (pill shape)

### Shadows
- [ ] Buttons have `0 4px 8px var(--cartoon-shadow)`
- [ ] Content boxes have `0 5px 15px var(--cartoon-shadow)`
- [ ] Hover states increase shadow depth
- [ ] No custom shadow colors (use CSS variable)

---

## 🧩 Component Usage

### Timer Component
- [ ] Uses `<CountdownTimer>` component (not custom implementation)
- [ ] Timer is fixed positioned at top-right (55px from top, 20px from right)
- [ ] Shows "剩余时间: MM:SS" format
- [ ] Has warning state for < 5 minutes (red, pulsing)
- [ ] Includes clock emoji (⏱️) by default
- [ ] Switches to warning emoji (⚠️) in warning state

### Button Component
- [ ] Uses `<Button>` component (not raw `<button>` tags)
- [ ] Primary variant for main actions
- [ ] Secondary variant for less important actions
- [ ] Disabled state properly applied when needed
- [ ] Loading state available if needed
- [ ] Proper onClick handlers attached
- [ ] Accessible labels provided

### Form Controls
- [ ] Text inputs use `.textInput` class
- [ ] Textareas use `.textInput` + `.textarea` classes
- [ ] Labels use `.inputLabel` class
- [ ] Radio buttons wrapped in `.radioContainer`
- [ ] Checkboxes wrapped in `.checkboxContainer`
- [ ] All inputs have associated labels
- [ ] Placeholder text provided where appropriate

---

## 📐 Layout Structure

### Page Container
- [ ] Wrapped in `.pageContainer` class
- [ ] Has `.pageFadeIn` for entrance animation
- [ ] Full height display
- [ ] Proper overflow handling

### Content Area
- [ ] Uses `.pageContent` for main content wrapper
- [ ] Maximum width of 1200px
- [ ] Centered with auto margins
- [ ] White background with cartoon border
- [ ] Proper padding applied

### Section Structure
- [ ] Page title uses `.pageTitle` class
- [ ] Section headers use `.sectionHeader` class
- [ ] Content boxes use `.contentBox` class
- [ ] Highlight boxes use `.highlightBox` class
- [ ] Navigation area uses `.navigation` class

### Multi-Column Layouts
- [ ] Uses `.twoColumnLayout` for two-column designs
- [ ] Columns use `.column` class
- [ ] Proper gap spacing (30px)
- [ ] Responsive collapse to single column on mobile

---

## 📱 Responsive Design

### Desktop (Default)
- [ ] Page displays correctly at 1920x1080
- [ ] All content visible without scrolling (within reason)
- [ ] Proper spacing maintained
- [ ] Images scaled appropriately

### Tablet (≤ 768px)
- [ ] Container padding reduces to 20px
- [ ] Button font-size reduces to 16px
- [ ] Two-column layouts collapse to single column
- [ ] Navigation sidebar reduces to 80px width
- [ ] Timer adjusts position and size

### Mobile (≤ 480px)
- [ ] Container padding reduces to 15px
- [ ] Page title reduces to 18px
- [ ] Input padding reduces to 12px
- [ ] All interactive elements remain tappable (min 44px)
- [ ] No horizontal scrolling

### Responsive Testing
- [ ] Tested on Chrome DevTools device emulation
- [ ] Tested on actual mobile device (if available)
- [ ] All breakpoints verified
- [ ] Images responsive (max-width: 100%)
- [ ] Text readable at all sizes

---

## ♿ Accessibility

### Keyboard Navigation
- [ ] All interactive elements focusable
- [ ] Tab order is logical
- [ ] Focus indicators visible (2px blue outline)
- [ ] No keyboard traps
- [ ] Enter/Space activates buttons

### Screen Readers
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] ARIA labels provided where needed
- [ ] Role attributes used appropriately
- [ ] Timer has aria-live region

### Color Contrast
- [ ] Text has minimum 4.5:1 contrast ratio
- [ ] Large text (18px+) has 3:1 minimum
- [ ] Focus indicators visible
- [ ] Error messages distinguishable
- [ ] Disabled states clearly indicated

### Motion & Animation
- [ ] Respects `prefers-reduced-motion`
- [ ] Animations can be disabled
- [ ] No auto-playing videos/animations
- [ ] Timer pulse optional for reduced motion

### Forms
- [ ] Required fields marked clearly
- [ ] Error messages descriptive
- [ ] Validation feedback immediate
- [ ] Labels clickable to focus inputs
- [ ] Help text provided where needed

---

## 🎭 Interactions

### Hover States
- [ ] Buttons lift on hover (`translateY(-3px)`)
- [ ] Buttons show enhanced shadow on hover
- [ ] Buttons show shine effect animation
- [ ] List items slide on hover (`translateX(5px)`)
- [ ] Checkboxes/radios highlight container on hover
- [ ] Proper cursor changes (pointer for clickable)

### Focus States
- [ ] Blue outline (2px) on all focusable elements
- [ ] Outline offset (2px) for clarity
- [ ] Focus visible on keyboard navigation
- [ ] No focus on click (only keyboard)
- [ ] Focus styles consistent across page

### Active/Pressed States
- [ ] Buttons compress on click (`translateY(-1px)`)
- [ ] Shadow reduces on active
- [ ] Feedback immediate and clear
- [ ] State resets on release

### Disabled States
- [ ] Gray background (#cccccc)
- [ ] Gray text (#888888)
- [ ] No-drop cursor
- [ ] No hover effects
- [ ] Cannot be activated

### Loading States
- [ ] Spinner animation visible
- [ ] Text opacity reduced
- [ ] Wait cursor shown
- [ ] Button disabled during loading
- [ ] Proper feedback on completion

---

## 🔧 Technical Implementation

### CSS Modules
- [ ] All styles in `.module.css` files
- [ ] No inline styles used
- [ ] Proper import statements
- [ ] CSS class names scoped
- [ ] No global style pollution

### Component Imports
- [ ] Button imported from `../../components/ui/Button`
- [ ] CountdownTimer imported from `../../components/ui/CountdownTimer`
- [ ] PageLayout styles imported correctly
- [ ] No duplicate component definitions

### State Management
- [ ] Proper useState hooks for form data
- [ ] Validation logic implemented
- [ ] Button disabled state tied to validation
- [ ] Form submission handled correctly
- [ ] Loading states managed

### Props & Callbacks
- [ ] onNext handler provided and called
- [ ] Data passed to parent on submission
- [ ] Timer callbacks implemented
- [ ] Proper prop types defined
- [ ] Default props set where needed

---

## 🧪 Testing

### Functional Testing
- [ ] Page loads without errors
- [ ] Timer counts down correctly
- [ ] Buttons respond to clicks
- [ ] Form validation works
- [ ] Data submission succeeds
- [ ] Navigation flows correctly

### Visual Testing
- [ ] Page matches design spec
- [ ] Colors correct across page
- [ ] Typography consistent
- [ ] Spacing even and balanced
- [ ] Animations smooth
- [ ] No visual glitches

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)
- [ ] Edge (latest)
- [ ] Mobile browsers

### Performance Testing
- [ ] Page loads quickly
- [ ] Animations don't lag
- [ ] No memory leaks
- [ ] Images optimized
- [ ] CSS efficient

---

## 📊 Code Quality

### Clean Code
- [ ] No console errors
- [ ] No console warnings
- [ ] ESLint passes
- [ ] No unused imports
- [ ] No unused variables
- [ ] Proper code formatting

### Documentation
- [ ] Component has JSDoc comment
- [ ] Props documented
- [ ] Complex logic explained
- [ ] TODO comments resolved
- [ ] File header present

### Maintainability
- [ ] Code is readable
- [ ] Variables named clearly
- [ ] Functions single-purpose
- [ ] No magic numbers
- [ ] Constants extracted

---

## 🎯 Final Validation

### Pre-Submission Checklist
- [ ] All above sections completed
- [ ] Peer review conducted
- [ ] Design approved
- [ ] QA testing passed
- [ ] Accessibility audit passed
- [ ] Performance benchmarks met

### Documentation Complete
- [ ] Component documented in README
- [ ] Migration notes added if needed
- [ ] Known issues documented
- [ ] Future enhancements noted

### Ready for Production
- [ ] Code committed to correct branch
- [ ] Pull request created
- [ ] CI/CD pipeline passes
- [ ] Staging environment tested
- [ ] Sign-off received

---

## 🔍 Common Issues to Check

### Visual Issues
- ⚠️ Timer not fixed positioned
- ⚠️ Buttons don't have shine effect
- ⚠️ Colors don't match CSS variables
- ⚠️ Spacing inconsistent
- ⚠️ Borders wrong thickness
- ⚠️ Border-radius not cartoon-style

### Component Issues
- ⚠️ Raw buttons instead of Button component
- ⚠️ Custom timer instead of CountdownTimer
- ⚠️ Inline styles instead of CSS modules
- ⚠️ Missing form labels
- ⚠️ Wrong CSS class names

### Layout Issues
- ⚠️ Page not full height
- ⚠️ Content not centered
- ⚠️ Improper responsive breakpoints
- ⚠️ Horizontal scrolling on mobile
- ⚠️ Text overflow issues

### Accessibility Issues
- ⚠️ Missing alt text on images
- ⚠️ No labels on form inputs
- ⚠️ Poor color contrast
- ⚠️ Keyboard navigation broken
- ⚠️ No focus indicators

### Performance Issues
- ⚠️ Large unoptimized images
- ⚠️ Too many re-renders
- ⚠️ Memory leaks from timers
- ⚠️ Slow animations
- ⚠️ Inefficient CSS selectors

---

## 📝 Validation Sign-Off

After completing all checks:

```
Page Name: _______________________________
Developer: _______________________________
Date: ____________________________________

Visual Consistency: ✓ / ✗
Component Usage: ✓ / ✗
Layout Structure: ✓ / ✗
Responsive Design: ✓ / ✗
Accessibility: ✓ / ✗
Interactions: ✓ / ✗
Technical Implementation: ✓ / ✗
Testing: ✓ / ✗
Code Quality: ✓ / ✗

Overall Status: PASS / NEEDS WORK

Notes:
_____________________________________________
_____________________________________________
_____________________________________________

Reviewer: _______________________________
Review Date: ____________________________
```

---

## 🎓 Pro Tips

1. **Use the Quick Reference** - Keep `STYLE_QUICK_REFERENCE.md` open for fast lookups
2. **Compare with Working Examples** - Look at successfully validated pages
3. **Test Early, Test Often** - Don't wait until the end to validate
4. **Use Browser DevTools** - Inspect elements to verify CSS application
5. **Ask for Help** - If stuck, consult the team or documentation

---

**Remember:** This checklist ensures consistency across the entire Grade 7 module system. Every checkmark brings us closer to a polished, professional, and accessible user experience!
