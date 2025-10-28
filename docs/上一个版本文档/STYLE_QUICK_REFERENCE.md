# Grade 7 Tracking Module - Style Quick Reference Card

## 🎨 Color Palette

```css
/* Primary Actions & Highlights */
--cartoon-primary: #59c1ff      /* Blue buttons, active states */
--cartoon-secondary: #ffce6b     /* Yellow timer, badges */
--cartoon-accent: #ff7eb6        /* Pink dots, highlights */

/* Backgrounds */
--cartoon-bg: #fff9f0            /* Page background (cream) */
--cartoon-light: #e6f7ff         /* Container background (light blue) */

/* Status Colors */
--cartoon-green: #67d5b5         /* Success, completed */
--cartoon-red: #ff8a80           /* Warning, error */

/* Text & Borders */
--cartoon-dark: #2d5b8e          /* Headings, dark text */
--cartoon-border: #ffd99e        /* Border orange */
--cartoon-shadow: rgba(255, 188, 97, 0.3)
```

## 📐 Spacing Scale

```css
Small:  8px   /* Tight spacing, icon gaps */
Medium: 12px  /* Button padding, form gaps */
Large:  20px  /* Section margins */
XLarge: 30px  /* Page padding */
```

## 🔤 Typography

```css
Page Title:      24px bold
Section Header:  20px bold
Button Text:     18px bold
Input Label:     18px bold
Body Text:       16px normal
Small Text:      14px normal
```

## 🎯 Component Quick Copy

### Timer (Fixed Top-Right)
```jsx
<CountdownTimer
  seconds={2400}           // 40 minutes
  onComplete={handleDone}
  showWarning={true}       // Red at < 5 min
  warningThreshold={300}   // 5 minutes
/>
```

### Primary Button
```jsx
<Button
  variant="primary"
  onClick={handleNext}
  disabled={!isValid}
>
  下一页
</Button>
```

### Page Layout
```jsx
import styles from '../../styles/PageLayout.module.css';

<div className={`${styles.pageContainer} ${styles.pageFadeIn}`}>
  <div className={styles.pageContent}>
    <h1 className={styles.pageTitle}>标题</h1>

    <div className={styles.highlightBox}>
      提示信息
    </div>

    <div className={styles.contentBox}>
      主要内容
    </div>

    <div className={styles.navigation}>
      <Button variant="primary">下一页</Button>
    </div>
  </div>
</div>
```

### Form Input
```jsx
<div className={styles.formControl}>
  <label className={styles.inputLabel}>
    问题标题
  </label>
  <input
    type="text"
    className={styles.textInput}
    value={answer}
    onChange={(e) => setAnswer(e.target.value)}
  />
</div>
```

### Textarea
```jsx
<textarea
  className={`${styles.textInput} ${styles.textarea}`}
  value={answer}
  onChange={(e) => setAnswer(e.target.value)}
  placeholder="请输入你的想法..."
/>
```

### Radio Group
```jsx
<div className={styles.radioGroup}>
  {options.map((option) => (
    <label
      key={option.value}
      className={styles.radioContainer}
    >
      <input
        type="radio"
        className={styles.radio}
        name="question"
        value={option.value}
        checked={selected === option.value}
        onChange={(e) => setSelected(e.target.value)}
      />
      <span className={styles.radioLabel}>
        {option.label}
      </span>
    </label>
  ))}
</div>
```

### Checkbox
```jsx
<div className={styles.checkboxContainer}>
  <input
    type="checkbox"
    className={styles.checkbox}
    id="agree"
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
  />
  <label htmlFor="agree" className={styles.checkboxLabel}>
    我已阅读注意事项
  </label>
</div>
```

### Two-Column Layout
```jsx
<div className={styles.twoColumnLayout}>
  <div className={styles.column}>
    左侧内容
  </div>
  <div className={styles.column}>
    右侧内容
  </div>
</div>
```

### Navigation Sidebar
```jsx
import navStyles from '../../styles/NavigationBar.module.css';

<div className={navStyles.navigationContainer}>
  <div className={navStyles.stepIndicator}>
    {currentStep}/{totalSteps}
  </div>
  <ul className={navStyles.stepList}>
    {Array.from({ length: totalSteps }, (_, i) => (
      <li
        key={i + 1}
        className={`
          ${navStyles.stepItem}
          ${i + 1 === currentStep ? navStyles.active : ''}
          ${i + 1 < currentStep ? navStyles.completed : ''}
        `}
      >
        {i + 1}
      </li>
    ))}
  </ul>
</div>
```

### Message Boxes
```jsx
{/* Error Message */}
<div className={styles.errorMessage}>
  <span>⚠️</span>
  <span>请填写所有必填项</span>
</div>

{/* Success Message */}
<div className={styles.successMessage}>
  <span>✓</span>
  <span>提交成功！</span>
</div>

{/* Info Message */}
<div className={styles.infoMessage}>
  <span>ℹ️</span>
  <span>请仔细阅读说明</span>
</div>
```

## 🎭 Common CSS Class Patterns

### Hover Effects
```css
/* Button hover */
transform: translateY(-3px);
box-shadow: 0 6px 12px var(--cartoon-shadow);

/* List item hover */
transform: translateX(5px);
background-color: var(--cartoon-light);
```

### Focus States
```css
outline: 2px solid #4a90e2;
outline-offset: 2px;
box-shadow: 0 0 0 4px rgba(89, 193, 255, 0.2);
```

### Border Styles
```css
/* Content box */
border: 3px solid var(--cartoon-border);
border-radius: 15px;

/* Button */
border: none;
border-radius: 12px;

/* Input */
border: 3px solid var(--cartoon-border);
border-radius: 12px;
```

## 🔄 Animation Keyframes

### Pulse (Timer Warning)
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
/* Usage: animation: pulse 2s infinite; */
```

### Fade In (Page Load)
```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
/* Usage: animation: fadeIn 0.6s ease-in-out; */
```

### Spinner (Loading)
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
/* Usage: animation: spin 0.6s linear infinite; */
```

## 📱 Responsive Breakpoints

```css
/* Desktop (default) */
Container padding: 30px
Font sizes: Full scale

/* Tablet (≤ 768px) */
@media (max-width: 768px) {
  Container padding: 20px
  Button font: 16px
  Navigation width: 80px
}

/* Mobile (≤ 480px) */
@media (max-width: 480px) {
  Container padding: 15px
  Page title: 18px
  Input padding: 12px
}
```

## 🎯 Common Mistakes to Avoid

❌ **Don't:**
- Use inline styles instead of CSS modules
- Use raw `<button>` tags (use Button component)
- Hardcode colors (use CSS variables)
- Skip responsive breakpoints
- Forget focus states for accessibility

✅ **Do:**
- Import and use CSS modules
- Use Button/CountdownTimer components
- Reference CSS variables (var(--cartoon-*))
- Test on mobile screens
- Add aria-labels for accessibility

## 🚀 Quick Start Checklist

For each new page:

1. [ ] Import PageLayout styles
2. [ ] Wrap in `.pageContainer` with `.pageFadeIn`
3. [ ] Use `.pageTitle` for heading
4. [ ] Use `.contentBox` for main content
5. [ ] Use Button component for actions
6. [ ] Add `.navigation` section at bottom
7. [ ] Use form control classes for inputs
8. [ ] Test responsive design
9. [ ] Check keyboard navigation
10. [ ] Verify color contrast

## 📚 Related Files

**Style Files:**
- `styles/PageLayout.module.css` - Main layout system
- `styles/Button.module.css` - Button styles
- `styles/CountdownTimer.module.css` - Timer styles
- `styles/NavigationBar.module.css` - Sidebar navigation

**Component Files:**
- `components/ui/Button.jsx`
- `components/ui/CountdownTimer.jsx`

**Reference:**
- `src/styles/global.css` - Global CSS variables
- `src/components/common/Timer.jsx` - Reference timer
- `src/components/common/StepNavigation.jsx` - Reference navigation

---

**Pro Tip:** Keep this file open in a second editor tab while developing pages for quick copy-paste access!
