# Grade 7 Tracking Module - Bug Analysis and Fix

**Date**: 2025-10-15
**Module**: Grade 7 Tracking Module
**Bug ID**: C-001
**Severity**: 🔴 CRITICAL - Blocking

---

## Bug Summary

**Page 4 (Hypothesis) Navigation Failure** - Users cannot proceed past Page 4 due to missing `submitPageData` function in navigation context.

---

## Root Cause Analysis

### The Problem

When clicking "下一页" on Page 4 (Hypothesis), the page attempts to navigate but fails silently. The console shows:

```
[useNavigation] 准备提交页面 4 的数据
[useNavigation] submitPageData 函数未定义，跳过数据提交
[useNavigation] 从页面 4 导航到页面 5
```

However, the actual page transition never occurs.

### Code Analysis

#### File: `src/modules/grade-7-tracking/pages/Page06_Hypothesis.jsx`

**Lines 24-30** - Incorrect Hook Usage:
```javascript
const { logOperation, session } = useTrackingContext();
const navigation = useNavigation({
  currentPage: session.currentPage,
  navigationMode: session.navigationMode,
  navigateToPage: () => {}, // ❌ EMPTY FUNCTION - This is the problem!
});
```

The `useNavigation` hook is being called with an **incomplete context object**. Specifically:
- ❌ Missing: `submitPageData` function
- ❌ Missing: `navigateToPage` implementation (empty function passed)
- ❌ Missing: Other required context values

#### File: `src/modules/grade-7-tracking/hooks/useNavigation.js`

**Lines 155-166** - Hook expects `submitPageData`:
```javascript
if (submitPageData && typeof submitPageData === 'function') {
  const submitSuccess = await submitPageData();
  // ... submit logic
} else {
  console.warn('[useNavigation] submitPageData 函数未定义，跳过数据提交');
}
```

The hook properly checks if `submitPageData` exists, but **when it's undefined, navigation still fails** because the page state is never updated.

#### Comparison: Working Page (Page03_Question.jsx)

**Lines 39-47** - Correct Implementation:
```javascript
const {
  logOperation,
  clearOperations,
  currentPageOperations,
  navigateToPage  // ✅ Gets real function from context
} = useTrackingContext();

const { submitPageData } = useDataLogger();  // ✅ Gets submitPageData from hook
```

**Lines 95-139** - Direct Navigation Implementation:
```javascript
const handleNextClick = useCallback(async () => {
  // ... validation logic

  try {
    const markObject = {
      pageNumber: '2',
      pageDesc: '提出问题',
      operationList: [...],
      answerList: [...],
      beginTime: formatDateTime(pageStartTime),
      endTime: formatDateTime(pageEndTime),
      imgList: []
    };

    const success = await submitPageData(markObject);  // ✅ Direct submission
    if (success) {
      clearOperations();
      await navigateToPage(3);  // ✅ Direct navigation
    }
  } catch (error) {
    console.error('[Page03_Question] 导航失败:', error);
    alert(error.message || '页面跳转失败，请重试');
  }
}, [/* dependencies */]);
```

### Why It Fails

1. **Page06_Hypothesis** tries to use the `useNavigation` hook as an abstraction
2. The hook requires `submitPageData` and `navigateToPage` functions to work
3. Page06_Hypothesis passes incomplete context: `navigateToPage: () => {}`
4. Hook detects missing `submitPageData`, warns, but continues
5. Hook tries to call `navigateToPage()` which does nothing (empty function)
6. React state never updates, page stays stuck

---

## The Fix

### Option 1: Use Direct Navigation (Recommended - Consistent with Other Pages)

**Replace the entire navigation setup in Page06_Hypothesis.jsx:**

```javascript
// ❌ REMOVE THIS:
const navigation = useNavigation({
  currentPage: session.currentPage,
  navigationMode: session.navigationMode,
  navigateToPage: () => {},
});

// ✅ ADD THIS:
const {
  logOperation,
  clearOperations,
  currentPageOperations,
  navigateToPage,
  session
} = useTrackingContext();

const { submitPageData } = useDataLogger();
const [pageStartTime] = useState(() => new Date());
```

**Replace handleNextPage function (lines 56-75):**

```javascript
const handleNextPage = async () => {
  if (isNavigating) return;
  setIsNavigating(true);

  try {
    logOperation({
      action: 'button_click',
      target: 'next_button',
      value: '进入下一页',
      time: new Date().toISOString(),
    });

    // Build mark object
    const pageEndTime = new Date();
    const markObject = {
      pageNumber: '4',
      pageDesc: '假设陈述',
      operationList: currentPageOperations.map(op => ({
        targetElement: op.target,
        eventType: op.action,
        value: op.value || '',
        time: op.time || new Date(op.timestamp).toISOString()
      })),
      answerList: [], // No answers on this page
      beginTime: formatDateTime(pageStartTime),
      endTime: formatDateTime(pageEndTime),
      imgList: []
    };

    // Submit data
    const success = await submitPageData(markObject);
    if (success) {
      clearOperations();
      await navigateToPage(5); // Navigate to Page 5 (Design)
    }
  } catch (error) {
    console.error('[Page06_Hypothesis] 导航失败:', error);
    alert(error.message || '页面跳转失败，请重试');
    setIsNavigating(false);
  }
};

// Add formatDateTime helper
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
```

**Updated imports:**

```javascript
import { useEffect, useState, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingContext.jsx';
import { useDataLogger } from '../hooks/useDataLogger.js';  // ADD THIS
// REMOVE: import { useNavigation } from '../hooks/useNavigation.js';
import Button from '../components/ui/Button.jsx';
import styles from '../styles/Page06_Hypothesis.module.css';
```

### Option 2: Fix useNavigation Hook Usage (Alternative)

If you want to keep using the `useNavigation` hook abstraction, pass the complete context:

```javascript
const {
  logOperation,
  clearOperations,
  currentPageOperations,
  navigateToPage: contextNavigateToPage,
  session,
  experimentTrials,
  questionnaireAnswers,
  textResponses,
  precautionsCheckbox
} = useTrackingContext();

const { submitPageData } = useDataLogger();

const navigation = useNavigation({
  currentPage: session.currentPage,
  navigationMode: session.navigationMode,
  experimentTrials,
  questionnaireAnswers,
  textResponses,
  precautionsCheckbox,
  submitPageData,  // ✅ Pass the real function
  navigateToPage: contextNavigateToPage  // ✅ Pass the real function
});
```

**However, Option 1 is recommended** because:
- It's consistent with other working pages (Page03_Question, etc.)
- It's simpler and more explicit
- It has fewer dependencies
- It's easier to debug
- The `useNavigation` hook adds unnecessary abstraction for simple pages

---

## Verification Steps

After applying the fix:

1. **Start dev server**: `npm run dev`
2. **Login** with any credentials (mock mode)
3. **Navigate** through Pages 1-3
4. **Arrive at Page 4** (Hypothesis)
5. **Click "下一页"**
6. **Verify**:
   - ✅ Console shows: `[useDataLogger] 数据提交成功: {"pageNumber":"4","pageDesc":"假设陈述"}`
   - ✅ Console shows: `[TrackingProvider] 导航至页面: Page_05_Design 页码: 5`
   - ✅ Page changes to Page 5 (Design page)
   - ✅ Network tab shows POST to `/stu/saveHcMark` with Page 4 data
   - ✅ No console errors

---

## Additional Pages to Check

The same bug pattern may exist in other pages. Check these files for similar issues:

```bash
# Search for useNavigation usage with empty navigateToPage
grep -n "navigateToPage: () => {}" src/modules/grade-7-tracking/pages/*.jsx
```

**Likely affected pages** (based on pattern):
- Any page using `useNavigation` hook with incomplete context
- Look for pattern: `navigateToPage: () => {}`

**Recommended action**: Convert ALL pages to use the direct navigation pattern (Option 1) for consistency.

---

## Impact Assessment

### Before Fix
- 🔴 Users stuck at Page 4, cannot complete assessment
- 🔴 Page 4 data never submitted (data loss)
- 🔴 E2E testing blocked at 13% completion (3/23 pages)
- 🔴 Production deployment blocked

### After Fix
- ✅ Users can proceed past Page 4
- ✅ Page 4 data submitted correctly
- ✅ E2E testing can continue to completion
- ✅ No data loss
- ✅ Consistent navigation pattern across all pages

---

## Testing Checklist

After applying the fix, verify:

- [ ] Page 4 navigation works (Page 4 → Page 5)
- [ ] Page 4 data submission logged in console
- [ ] Network request sent with correct mark object
- [ ] No console errors or warnings
- [ ] Page transition smooth and immediate
- [ ] Button disables during navigation (no double-clicks)
- [ ] Error handling works (network failures)
- [ ] All operations logged correctly
- [ ] Timer continues running after navigation
- [ ] Progress indicator updates to 5/13

---

## Long-term Recommendations

1. **Remove `useNavigation` hook** - It adds unnecessary complexity
   - Most pages don't use it
   - Those that do use it incorrectly
   - Direct navigation is simpler and more maintainable

2. **Standardize navigation pattern** - Use the same approach everywhere:
   ```javascript
   const { navigateToPage } = useTrackingContext();
   const { submitPageData } = useDataLogger();

   const handleNext = async () => {
     const markObject = buildMarkObject();
     const success = await submitPageData(markObject);
     if (success) {
       await navigateToPage(nextPageNum);
     }
   };
   ```

3. **Add TypeScript** - Would have caught this error at compile time:
   ```typescript
   // Type error: navigateToPage expects (pageNum: number) => Promise<void>
   navigateToPage: () => {}  // ❌ Wrong signature
   ```

4. **Add prop validation** - Use PropTypes or TypeScript to validate hook parameters

5. **Add integration tests** - Automated tests for page navigation flow

6. **Add error boundaries** - Catch navigation errors gracefully

---

## Related Files

### Files to Modify (Fix)
- `src/modules/grade-7-tracking/pages/Page06_Hypothesis.jsx` - **Primary fix**

### Files to Review (Potential Similar Issues)
- All pages in `src/modules/grade-7-tracking/pages/` directory
- Check for `useNavigation` usage pattern

### Files for Reference (Correct Implementation)
- `src/modules/grade-7-tracking/pages/Page03_Question.jsx` - ✅ Working example
- `src/modules/grade-7-tracking/hooks/useDataLogger.js` - Data submission hook
- `src/modules/grade-7-tracking/context/TrackingContext.jsx` - Context implementation

---

## Conclusion

This is a **critical bug** caused by improper use of the `useNavigation` hook with an incomplete context object. The fix is straightforward: either pass the complete context to the hook OR (recommended) remove the hook and use direct navigation like other working pages.

**Estimated Fix Time**: 15-30 minutes
**Testing Time**: 10 minutes
**Priority**: 🔴 HIGHEST - Blocks all testing and production

---

**Document Created**: 2025-10-15
**Created By**: Claude Code (Automated Analysis)
**Bug ID**: C-001
**Status**: Analysis Complete - Ready for Implementation
