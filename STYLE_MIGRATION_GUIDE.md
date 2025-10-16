# Grade 7 Tracking Module - Style Migration Guide

## 📋 Overview

This guide helps you migrate existing Grade 7 Tracking pages to the unified style system that matches the Grade 7 traditional module.

## 🎯 Migration Goals

- Replace inline styles with CSS modules
- Use unified Button component
- Apply consistent timer styling
- Implement page layout patterns
- Ensure responsive design
- Maintain accessibility standards

## 🔄 Step-by-Step Migration Process

### Step 1: Update Imports

**Before:**
```jsx
import React, { useState } from 'react';
import './MyPage.css'; // Local CSS file
```

**After:**
```jsx
import React, { useState } from 'react';
import styles from '../../styles/PageLayout.module.css';
import Button from '../../components/ui/Button';
import CountdownTimer from '../../components/ui/CountdownTimer';
```

### Step 2: Migrate Container Structure

**Before:**
```jsx
<div style={{ padding: '20px', height: '100vh' }}>
  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '24px', color: '#333' }}>
      页面标题
    </h1>
    {/* content */}
  </div>
</div>
```

**After:**
```jsx
<div className={`${styles.pageContainer} ${styles.pageFadeIn}`}>
  <div className={styles.pageContent}>
    <h1 className={styles.pageTitle}>
      页面标题
    </h1>
    {/* content */}
  </div>
</div>
```

### Step 3: Migrate Buttons

**Before:**
```jsx
<button
  onClick={handleNext}
  disabled={!isValid}
  style={{
    padding: '10px 20px',
    backgroundColor: isValid ? '#4a90e2' : '#ccc',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: isValid ? 'pointer' : 'not-allowed'
  }}
>
  下一页
</button>
```

**After:**
```jsx
<Button
  variant="primary"
  onClick={handleNext}
  disabled={!isValid}
>
  下一页
</Button>
```

### Step 4: Migrate Form Inputs

**Before:**
```jsx
<div style={{ marginBottom: '20px' }}>
  <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
    问题标题
  </label>
  <input
    type="text"
    value={answer}
    onChange={(e) => setAnswer(e.target.value)}
    style={{
      width: '100%',
      padding: '12px',
      border: '2px solid #ddd',
      borderRadius: '8px'
    }}
  />
</div>
```

**After:**
```jsx
<div className={styles.formControl}>
  <label className={styles.inputLabel}>
    问题标题
  </label>
  <input
    type="text"
    value={answer}
    onChange={(e) => setAnswer(e.target.value)}
    className={styles.textInput}
  />
</div>
```

### Step 5: Migrate Textareas

**Before:**
```jsx
<textarea
  value={answer}
  onChange={(e) => setAnswer(e.target.value)}
  style={{
    width: '100%',
    minHeight: '100px',
    padding: '12px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    resize: 'vertical'
  }}
/>
```

**After:**
```jsx
<textarea
  value={answer}
  onChange={(e) => setAnswer(e.target.value)}
  className={`${styles.textInput} ${styles.textarea}`}
/>
```

### Step 6: Migrate Radio Buttons

**Before:**
```jsx
<div>
  {options.map((option) => (
    <div key={option.value} style={{ marginBottom: '10px' }}>
      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <input
          type="radio"
          name="question"
          value={option.value}
          checked={selected === option.value}
          onChange={(e) => setSelected(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <span>{option.label}</span>
      </label>
    </div>
  ))}
</div>
```

**After:**
```jsx
<div className={styles.radioGroup}>
  {options.map((option) => (
    <label key={option.value} className={styles.radioContainer}>
      <input
        type="radio"
        name="question"
        value={option.value}
        checked={selected === option.value}
        onChange={(e) => setSelected(e.target.value)}
        className={styles.radio}
      />
      <span className={styles.radioLabel}>{option.label}</span>
    </label>
  ))}
</div>
```

### Step 7: Migrate Checkboxes

**Before:**
```jsx
<div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
  <input
    type="checkbox"
    id="agree"
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
    style={{ marginRight: '10px' }}
  />
  <label htmlFor="agree" style={{ cursor: 'pointer' }}>
    我已阅读注意事项
  </label>
</div>
```

**After:**
```jsx
<div className={styles.checkboxContainer}>
  <input
    type="checkbox"
    id="agree"
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
    className={styles.checkbox}
  />
  <label htmlFor="agree" className={styles.checkboxLabel}>
    我已阅读注意事项
  </label>
</div>
```

### Step 8: Migrate Timer Component

**Before:**
```jsx
<div style={{
  position: 'fixed',
  top: '20px',
  right: '20px',
  padding: '10px 20px',
  background: '#ffce6b',
  borderRadius: '20px',
  fontWeight: 'bold'
}}>
  剩余时间: {formatTime(timeLeft)}
</div>
```

**After:**
```jsx
<CountdownTimer
  seconds={40}
  onComplete={() => setCanProceed(true)}
  showWarning={false}
/>
```

### Step 9: Migrate Content Boxes

**Before:**
```jsx
<div style={{
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '10px',
  border: '2px solid #ddd',
  marginBottom: '20px'
}}>
  <p>内容...</p>
</div>
```

**After:**
```jsx
<div className={styles.contentBox}>
  <p>内容...</p>
</div>
```

### Step 10: Migrate Navigation Section

**Before:**
```jsx
<div style={{
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid #ddd',
  display: 'flex',
  justifyContent: 'flex-end'
}}>
  <button onClick={handleNext}>下一页</button>
</div>
```

**After:**
```jsx
<div className={styles.navigation}>
  <Button variant="primary" onClick={handleNext}>
    下一页
  </Button>
</div>
```

## 📝 Complete Example Migration

### Before (Old Style):

```jsx
import React, { useState } from 'react';
import './QuestionPage.css';

const QuestionPage = () => {
  const [answer, setAnswer] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleNext = () => {
    console.log('Next page');
  };

  return (
    <div style={{ padding: '30px', height: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
          问题页面
        </h1>

        <div style={{ padding: '20px', background: 'white', borderRadius: '10px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            请回答以下问题：
          </label>
          <textarea
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setIsValid(e.target.value.trim().length > 0);
            }}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px'
            }}
          />
        </div>

        <div style={{ marginTop: '30px', textAlign: 'right' }}>
          <button
            onClick={handleNext}
            disabled={!isValid}
            style={{
              padding: '12px 24px',
              backgroundColor: isValid ? '#4a90e2' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isValid ? 'pointer' : 'not-allowed'
            }}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;
```

### After (Unified Style):

```jsx
import React, { useState } from 'react';
import styles from '../../styles/PageLayout.module.css';
import Button from '../../components/ui/Button';

const QuestionPage = () => {
  const [answer, setAnswer] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleNext = () => {
    console.log('Next page');
  };

  return (
    <div className={`${styles.pageContainer} ${styles.pageFadeIn}`}>
      <div className={styles.pageContent}>
        <h1 className={styles.pageTitle}>
          问题页面
        </h1>

        <div className={styles.contentBox}>
          <label className={styles.inputLabel}>
            请回答以下问题：
          </label>
          <textarea
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              setIsValid(e.target.value.trim().length > 0);
            }}
            className={`${styles.textInput} ${styles.textarea}`}
            placeholder="请输入你的答案..."
          />
        </div>

        <div className={styles.navigation}>
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!isValid}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;
```

## 🎨 Page-Specific Patterns

### Notice Page with Timer

```jsx
import React, { useState, useEffect } from 'react';
import styles from '../../styles/PageLayout.module.css';
import Button from '../../components/ui/Button';
import CountdownTimer from '../../components/ui/CountdownTimer';

const NoticePage = ({ onNext }) => {
  const [agreed, setAgreed] = useState(false);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    setCanProceed(agreed);
  }, [agreed]);

  return (
    <>
      <CountdownTimer
        seconds={40}
        onComplete={() => setCanProceed(true)}
        showWarning={false}
      />

      <div className={`${styles.pageContainer} ${styles.pageFadeIn}`}>
        <div className={styles.pageContent}>
          <h1 className={styles.pageTitle}>注意事项</h1>

          <div className={styles.contentBox}>
            <ul>
              <li>作答时间共40分钟，时间结束后，系统将自动退出答题界面。</li>
              <li>请按顺序回答每页问题，上一页题目未完成作答，将无法点击进入下一页。</li>
              <li>答题时，不要提前点击"下一页"查看后面的内容，否则将无法返回上一页。</li>
              <li>遇到系统故障、死机、死循环等特殊情况时，请举手示意老师。</li>
            </ul>
          </div>

          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className={styles.checkbox}
            />
            <label htmlFor="agree" className={styles.checkboxLabel}>
              我已阅读上述注意事项
            </label>
          </div>

          <div className={styles.navigation}>
            <Button
              variant="primary"
              onClick={onNext}
              disabled={!canProceed}
            >
              下一页
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NoticePage;
```

### Question Page with Radio Options

```jsx
import React, { useState } from 'react';
import styles from '../../styles/PageLayout.module.css';
import Button from '../../components/ui/Button';

const QuestionPage = ({ question, options, onNext }) => {
  const [selected, setSelected] = useState('');

  const handleSubmit = () => {
    if (selected) {
      onNext(selected);
    }
  };

  return (
    <div className={`${styles.pageContainer} ${styles.pageFadeIn}`}>
      <div className={styles.pageContent}>
        <h1 className={styles.pageTitle}>模拟实验</h1>

        <div className={styles.contentBox}>
          <h2 className={styles.sectionHeader}>{question}</h2>

          <div className={styles.radioGroup}>
            {options.map((option) => (
              <label key={option.value} className={styles.radioContainer}>
                <input
                  type="radio"
                  name="question"
                  value={option.value}
                  checked={selected === option.value}
                  onChange={(e) => setSelected(e.target.value)}
                  className={styles.radio}
                />
                <span className={styles.radioLabel}>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.navigation}>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selected}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;
```

### Two-Column Layout Page

```jsx
import React from 'react';
import styles from '../../styles/PageLayout.module.css';
import Button from '../../components/ui/Button';

const IntroPage = ({ onNext }) => {
  return (
    <div className={`${styles.pageContainer} ${styles.pageFadeIn}`}>
      <div className={styles.pageContent}>
        <h1 className={styles.pageTitle}>蜂蜜的奥秘</h1>

        <div className={styles.twoColumnLayout}>
          <div className={styles.column}>
            <div className={styles.contentBox}>
              <p>
                蜂蜜源自大自然的馈赠，富含多种有益成分。
                成都的中学生小明在超市购买了一瓶蜂蜜，
                存放一段时间后，他发现蜂蜜的状态似乎发生了变化。
                这是怎么回事呢？请你和他一起探索吧！
              </p>
            </div>
          </div>

          <div className={styles.column}>
            <div className={styles.contentBox}>
              <img
                src="/images/honey.jpg"
                alt="蜂蜜图片"
                style={{ width: '100%', borderRadius: '12px' }}
              />
            </div>
          </div>
        </div>

        <div className={styles.navigation}>
          <Button variant="primary" onClick={onNext}>
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntroPage;
```

## ✅ Migration Checklist

For each page you migrate:

### Visual Style
- [ ] Replaced inline styles with CSS modules
- [ ] Applied `.pageContainer` and `.pageFadeIn`
- [ ] Used `.pageTitle` for headings
- [ ] Applied `.contentBox` for main content sections
- [ ] Used `.navigation` for button areas

### Components
- [ ] Replaced raw buttons with Button component
- [ ] Replaced custom timer with CountdownTimer component
- [ ] Applied form control classes to inputs
- [ ] Used `.textInput` for text fields
- [ ] Applied `.radioGroup` for radio buttons
- [ ] Used `.checkboxContainer` for checkboxes

### Layout
- [ ] Applied responsive grid for multi-column layouts
- [ ] Used proper spacing classes
- [ ] Applied `.twoColumnLayout` where needed
- [ ] Ensured proper mobile breakpoints

### Accessibility
- [ ] Added proper labels to form controls
- [ ] Included aria-labels where appropriate
- [ ] Tested keyboard navigation
- [ ] Verified focus indicators are visible
- [ ] Checked color contrast ratios

### Testing
- [ ] Tested on desktop (1920x1080)
- [ ] Tested on tablet (768px)
- [ ] Tested on mobile (480px)
- [ ] Verified hover effects work
- [ ] Checked button disabled states
- [ ] Tested with keyboard only
- [ ] Verified screen reader compatibility

## 🚨 Common Pitfalls

### 1. Forgetting to import CSS modules
❌ **Wrong:** Using className without import
```jsx
<div className="pageContainer">
```

✅ **Correct:** Import and use
```jsx
import styles from '../../styles/PageLayout.module.css';
<div className={styles.pageContainer}>
```

### 2. Mixing inline styles with CSS modules
❌ **Wrong:** Mixing approaches
```jsx
<div className={styles.contentBox} style={{ marginTop: '20px' }}>
```

✅ **Correct:** Use CSS modules only
```jsx
<div className={styles.contentBox}>
```

### 3. Not using Button component consistently
❌ **Wrong:** Custom button
```jsx
<button onClick={handleNext} className="my-button">
```

✅ **Correct:** Button component
```jsx
<Button variant="primary" onClick={handleNext}>
```

### 4. Forgetting responsive design
❌ **Wrong:** Fixed widths
```jsx
<div style={{ width: '1200px' }}>
```

✅ **Correct:** Responsive containers
```jsx
<div className={styles.pageContent}>
```

### 5. Skipping accessibility
❌ **Wrong:** No labels
```jsx
<input type="text" />
```

✅ **Correct:** Proper labels
```jsx
<label className={styles.inputLabel}>
  Question
</label>
<input type="text" className={styles.textInput} />
```

## 📊 Migration Progress Tracking

Track your progress as you migrate pages:

```markdown
## Page Migration Status

- [x] 00-NoticePage.jsx
- [x] 01-IntroPage.jsx
- [ ] 02-QuestionPage.jsx
- [ ] 03-DataCollectionPage.jsx
- [ ] 04-HypothesisPage.jsx
- [ ] 05-DesignPage.jsx
- [ ] 06-EvaluationPage.jsx
- [ ] 07-TransitionPage.jsx
- [ ] 08-ExperimentPage.jsx
- [ ] 09-AnalysisPage1.jsx
- [ ] 10-AnalysisPage2.jsx
- [ ] 11-AnalysisPage3.jsx
- [ ] 12-ConclusionPage.jsx
- [ ] 13-CompletionPage.jsx
- [ ] 14-SurveyPage1.jsx
- [ ] 15-SurveyPage2.jsx
- [ ] 16-SurveyPage3.jsx
- [ ] 17-SurveyPage4.jsx
- [ ] 18-SurveyPage5.jsx
- [ ] 19-SurveyPage6.jsx
- [ ] 20-SurveyPage7.jsx
- [ ] 21-SurveyPage8.jsx
- [ ] 22-FinalPage.jsx
```

## 🎓 Tips for Success

1. **Migrate one page at a time** - Don't try to do everything at once
2. **Test after each migration** - Ensure functionality is preserved
3. **Use the Quick Reference** - Keep `STYLE_QUICK_REFERENCE.md` open
4. **Compare with examples** - Look at successfully migrated pages
5. **Ask for review** - Have another developer check your work
6. **Document issues** - Note any problems for team discussion

## 📚 Additional Resources

- **STYLE_ALIGNMENT_SUMMARY.md** - Comprehensive style documentation
- **STYLE_QUICK_REFERENCE.md** - Quick copy-paste reference
- **src/styles/global.css** - Global CSS variables
- **src/components/common/** - Reference implementations

---

**Remember:** The goal is consistency and maintainability. Take your time and ensure each page meets the style standards before moving to the next one.
