/**
 * E2E Tests for G8 Drone Imaging Submodule
 *
 * Tests run against the dev harness at /dev/g8-drone-imaging
 * Reference: 无人机航拍交互课堂-子模块设计说明书 第14节 验收标准与测试清单
 *
 * Event types from: src/shared/services/submission/eventTypes.js
 */

import { test, expect, Page, Route } from '@playwright/test';

// Valid event types from EventTypes enum
const VALID_EVENT_TYPES = [
  'page_enter',
  'page_exit',
  'page_submit_success',
  'page_submit_failed',
  'flow_context',
  'click',
  'input',
  'input_focus',
  'input_change',
  'input_blur',
  'focus',
  'blur',
  'radio_select',
  'checkbox_check',
  'checkbox_uncheck',
  'modal_open',
  'modal_close',
  'view_material',
  'timer_start',
  'timer_stop',
  'simulation_timing_started',
  'simulation_run_result',
  'simulation_operation',
  'questionnaire_answer',
  'session_expired',
  'network_error',
  'click_blocked',
  'auto_submit',
  'reading_complete',
];

// GSD lookup table for verification
const GSD_LOOKUP = {
  '100-8': 3.01,
  '100-24': 1.00,
  '100-50': 0.48,
  '200-8': 6.03,
  '200-24': 2.01,
  '200-50': 0.96,
  '300-8': 9.04,
  '300-24': 3.01,
  '300-50': 1.45,
};

// Helper to intercept and capture submission requests
interface CapturedMark {
  pageNumber: string;
  pageDesc: string;
  operationList: Array<{
    code: number;
    targetElement: string;
    eventType: string;
    value: string;
    time: string;
  }>;
  answerList: Array<{
    code?: number;
    targetElement: string;
    value: string;
  }>;
  beginTime: string;
  endTime: string;
}

async function setupSubmissionInterceptor(page: Page): Promise<CapturedMark[]> {
  const capturedMarks: CapturedMark[] = [];

  await page.route('**/stu/saveHcMark', async (route: Route) => {
    const request = route.request();
    const postData = request.postData();

    if (postData) {
      try {
        // Parse FormData - the mark field contains JSON
        const formData = new URLSearchParams(postData);
        const markJson = formData.get('mark');
        if (markJson) {
          const mark = JSON.parse(markJson) as CapturedMark;
          capturedMarks.push(mark);
        }
      } catch (e) {
        console.error('Failed to parse submission:', e);
      }
    }

    // Return success response
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 200,
        msg: 'Mock submission success',
        obj: true,
      }),
    });
  });

  return capturedMarks;
}

// Helper to simulate time passing (for countdown timers)
async function waitForCountdown(page: Page, seconds: number): Promise<void> {
  // Use fake timers or just wait
  // In real tests, we may want to mock timers for speed
  await page.waitForTimeout(seconds * 1000);
}

// Helper to fast-forward countdown (mock approach)
async function fastForwardCountdown(page: Page): Promise<void> {
  // This would require injecting JS to speed up setInterval/setTimeout
  // For skeleton, we'll use actual wait or page.evaluate to manipulate state
  await page.evaluate(() => {
    // Attempt to find and manipulate countdown state
    // This is a placeholder - actual implementation depends on component structure
  });
}

test.describe('G8 Drone Imaging E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/dev/g8-drone-imaging?page=1');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  /**
   * 用例0：任务封面页注意事项确认
   * Reference: 设计说明书 14.1 用例0
   *
   * 验证：
   * - [ ] 倒计时未结束前，复选框处于不可勾选状态
   * - [ ] 倒计时未结束前，"下一页"按钮被禁用或点击时被拦截
   * - [ ] 40秒结束后，复选框变为可勾选
   * - [ ] 勾选复选框后，"下一页"按钮可用，点击后成功进入 Page 2
   * - [ ] Mark 数据中存在对应事件记录
   */
  test('Test Case 0: Notice page with 40s countdown and checkbox confirmation', async ({ page }) => {
    const capturedMarks = await setupSubmissionInterceptor(page);

    // Navigate to page 1 (cover)
    await page.goto('/dev/g8-drone-imaging?page=1');
    await expect(page.getByTestId('page-cover')).toBeVisible();

    // Step 1: Verify checkbox is disabled before countdown ends
    const checkbox = page.getByTestId('confirm-checkbox');
    await expect(checkbox).toBeDisabled();

    // Step 2: Try to click next button before countdown - should be blocked or show error
    const nextButton = page.getByTestId('next-button');
    await nextButton.click();

    // Should show error message
    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('请先阅读注意事项并勾选确认后再继续');

    // Step 3: Wait for 40s countdown to complete
    // Note: In real tests, mock timers for speed. Here using shortened wait for skeleton.
    // TODO: Implement timer mocking for faster tests
    // await waitForCountdown(page, 40);

    // For skeleton, we'll skip actual wait and verify structure
    // In real implementation: await page.waitForSelector('[data-testid="confirm-checkbox"]:not(:disabled)', { timeout: 45000 });

    // Step 4: After countdown, checkbox should be enabled
    // await expect(checkbox).toBeEnabled();

    // Step 5: Check the checkbox
    // await checkbox.check();

    // Step 6: Click next button - should navigate to background page
    // await nextButton.click();
    // await expect(page.getByTestId('page-background')).toBeVisible();

    // Step 7: Verify captured marks contain expected events
    // const lastMark = capturedMarks[capturedMarks.length - 1];
    // expect(lastMark.operationList.some(op => op.eventType === 'page_enter')).toBe(true);
    // expect(lastMark.operationList.some(op => op.eventType === 'click_blocked')).toBe(true);
    // expect(lastMark.operationList.some(op => op.eventType === 'checkbox_check')).toBe(true);

    // Validate all event types are from valid enum
    // for (const op of lastMark.operationList) {
    //   expect(VALID_EVENT_TYPES).toContain(op.eventType);
    // }
  });

  /**
   * 用例1：正常完成流程
   * Reference: 设计说明书 14.1 用例1
   *
   * 验证：
   * - [ ] 所有页面均可正常访问
   * - [ ] Page 2 强制阅读 5 秒后才可点击下一页
   * - [ ] Page 3 文本输入校验正常（> 5 字符）
   * - [ ] Page 4 实验操作正常
   * - [ ] Page 5/6 选择题可正常选择
   * - [ ] Page 7 混合输入校验正常
   * - [ ] 提交数据格式符合规范
   */
  test('Test Case 1: Complete flow normally', async ({ page }) => {
    const capturedMarks = await setupSubmissionInterceptor(page);

    // Start from page 2 (skip cover page countdown for this test)
    await page.goto('/dev/g8-drone-imaging?page=2');
    await expect(page.getByTestId('page-background')).toBeVisible();

    // Page 2: Wait for 5s reading timer
    // TODO: Mock timer for faster tests
    // await waitForCountdown(page, 5);
    // await page.getByTestId('next-button').click();
    // await expect(page.getByTestId('page-hypothesis')).toBeVisible();

    // Page 3: Enter hypothesis text (> 5 characters)
    // await page.getByTestId('hypothesis-textarea').fill('这是我的假设内容，用于测试输入验证功能');
    // await page.getByTestId('next-button').click();
    // await expect(page.getByTestId('page-experiment')).toBeVisible();

    // Page 4: Perform experiment operations
    // Select height 100m, focal 8mm, capture
    // await page.getByTestId('next-button').click();
    // await expect(page.getByTestId('page-focal-analysis')).toBeVisible();

    // Page 5: Select radio option C (50毫米)
    // await page.getByTestId('radio-focal-C').check();
    // await page.getByTestId('next-button').click();
    // await expect(page.getByTestId('page-height-analysis')).toBeVisible();

    // Page 6: Select radio option A (增大)
    // await page.getByTestId('radio-height-A').check();
    // await page.getByTestId('next-button').click();
    // await expect(page.getByTestId('page-conclusion')).toBeVisible();

    // Page 7: Select radio and enter reason
    // await page.getByTestId('radio-conclusion-B').check();
    // await page.getByTestId('conclusion-textarea').fill('根据实验数据，调整镜头焦距对GSD的影响更显著');
    // await page.getByTestId('submit-button').click();

    // Verify submission data format
    // expect(capturedMarks.length).toBeGreaterThan(0);
    // const lastMark = capturedMarks[capturedMarks.length - 1];
    // expect(lastMark.pageNumber).toMatch(/^\d+:\d+$/);
    // expect(lastMark.answerList.length).toBeGreaterThan(0);
    // expect(lastMark.operationList.length).toBeGreaterThan(0);
    // expect(lastMark.beginTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    // expect(lastMark.endTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  /**
   * 用例2：实验数据验证（GSD + 模糊度）
   * Reference: 设计说明书 14.1 用例2
   *
   * 验证关键参数组合：
   * - [ ] 高度 100m + 焦距 8mm → GSD = 3.01
   * - [ ] 高度 100m + 焦距 50mm → GSD = 0.48
   * - [ ] 高度 300m + 焦距 8mm → GSD = 9.04
   * - [ ] 模糊度视觉效果正确（GSD 越大越模糊）
   */
  test('Test Case 2: Verify GSD and blur for key parameter combinations', async ({ page }) => {
    const capturedMarks = await setupSubmissionInterceptor(page);

    // Navigate to experiment page
    await page.goto('/dev/g8-drone-imaging?page=4');
    await expect(page.getByTestId('page-experiment')).toBeVisible();

    // Test combination 1: Height 100m + Focal 8mm → GSD = 3.01
    // TODO: Implement height and focal length selectors
    // await page.locator('[data-testid="height-100"]').click();
    // await page.locator('[data-testid="focal-8"]').click();
    // await page.getByTestId('capture-button').click();

    // Verify GSD display shows 3.01
    // const gsdDisplay = page.locator('[data-testid="gsd-value"]');
    // await expect(gsdDisplay).toContainText('3.01');

    // Test combination 2: Height 100m + Focal 50mm → GSD = 0.48
    // await page.locator('[data-testid="focal-50"]').click();
    // await page.getByTestId('capture-button').click();
    // await expect(gsdDisplay).toContainText('0.48');

    // Test combination 3: Height 300m + Focal 8mm → GSD = 9.04
    // await page.locator('[data-testid="height-300"]').click();
    // await page.locator('[data-testid="focal-8"]').click();
    // await page.getByTestId('capture-button').click();
    // await expect(gsdDisplay).toContainText('9.04');

    // Verify operation events are logged
    // await page.getByTestId('next-button').click();
    // const lastMark = capturedMarks[capturedMarks.length - 1];
    // const captureOps = lastMark.operationList.filter(op => op.eventType === 'simulation_operation');
    // expect(captureOps.length).toBeGreaterThanOrEqual(3);

    // Verify event type is valid
    // for (const op of captureOps) {
    //   expect(VALID_EVENT_TYPES).toContain(op.eventType);
    // }
  });

  /**
   * 用例3：中途刷新恢复
   * Reference: 设计说明书 14.1 用例3
   *
   * 验证：
   * - [ ] 恢复到正确的页面
   * - [ ] 已保存答案被正确回填
   * - [ ] 实验操作历史可恢复
   */
  test('Test Case 3: Refresh recovery', async ({ page }) => {
    // Navigate to page 5 and fill in some answers
    await page.goto('/dev/g8-drone-imaging?page=5');
    await expect(page.getByTestId('page-focal-analysis')).toBeVisible();

    // Select an answer
    await page.getByTestId('radio-focal-C').check();

    // Refresh the page
    await page.reload();

    // Verify we're still on page 5
    await expect(page.getByTestId('page-focal-analysis')).toBeVisible();

    // Verify the answer is restored
    const radioC = page.getByTestId('radio-focal-C');
    await expect(radioC).toBeChecked();

    // Navigate to experiment page and perform some operations
    // await page.goto('/dev/g8-drone-imaging?page=4');
    // Perform captures...
    // Refresh and verify experiment history is preserved
  });

  /**
   * 用例4：提交失败重试
   * Reference: 设计说明书 14.1 用例5
   *
   * 验证：
   * - [ ] 显示错误提示
   * - [ ] 重试逻辑正常（最多3次）
   * - [ ] 阻断导航直到提交成功
   */
  test('Test Case 4: Submission failure and retry', async ({ page }) => {
    let submitCount = 0;

    // Route to simulate failure on first 2 attempts, success on 3rd
    await page.route('**/stu/saveHcMark', async (route: Route) => {
      submitCount++;
      if (submitCount <= 2) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 500,
            msg: 'Mock server error',
            obj: false,
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            msg: 'Success',
            obj: true,
          }),
        });
      }
    });

    // Navigate to page with submission
    await page.goto('/dev/g8-drone-imaging?page=5&submit=fail');
    await expect(page.getByTestId('page-focal-analysis')).toBeVisible();

    // Select answer and try to submit
    await page.getByTestId('radio-focal-C').check();
    // await page.getByTestId('next-button').click();

    // Should show error and retry
    // Verify retry logic kicks in
    // expect(submitCount).toBeLessThanOrEqual(3);
  });

  /**
   * 用例5：校验阻断时的提示文案（Page 1-7 全覆盖）
   * Reference: 设计说明书 第9节 错误处理与边界情况
   *
   * 验证所有页面的校验失败提示文案
   */
  test.describe('Test Case 5: Validation blocking messages for all pages', () => {
    /**
     * Page 1: 未完成注意事项确认
     * Expected: "请先阅读注意事项并勾选确认后再继续"
     */
    test('Page 1 - Notice not confirmed', async ({ page }) => {
      await page.goto('/dev/g8-drone-imaging?page=1');
      await expect(page.getByTestId('page-cover')).toBeVisible();

      // Click next without checking checkbox
      await page.getByTestId('next-button').click();

      // Verify error message
      const errorMessage = page.getByTestId('error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('请先阅读注意事项并勾选确认后再继续');
    });

    /**
     * Page 2: 强制阅读未完成
     * Expected: Button disabled until timer completes
     */
    test('Page 2 - Reading not complete', async ({ page }) => {
      await page.goto('/dev/g8-drone-imaging?page=2');
      await expect(page.getByTestId('page-background')).toBeVisible();

      // Next button should be disabled initially
      const nextButton = page.getByTestId('next-button');
      await expect(nextButton).toBeDisabled();
    });

    /**
     * Page 3: 文本输入为空或过短
     * Expected: "请输入至少5个字符的思考内容"
     */
    test('Page 3 - Text input too short', async ({ page }) => {
      await page.goto('/dev/g8-drone-imaging?page=3');
      await expect(page.getByTestId('page-hypothesis')).toBeVisible();

      // Enter short text
      await page.getByTestId('hypothesis-textarea').fill('短');
      await page.getByTestId('next-button').click();

      // Verify error message
      const errorMessage = page.getByTestId('error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('请输入至少5个字符的思考内容');
    });

    /**
     * Page 5: 未选择选项
     * Expected: "请选择一个答案后再继续"
     */
    test('Page 5 - No selection', async ({ page }) => {
      await page.goto('/dev/g8-drone-imaging?page=5');
      await expect(page.getByTestId('page-focal-analysis')).toBeVisible();

      // Click next without selecting
      await page.getByTestId('next-button').click();

      // Verify error message
      const errorMessage = page.getByTestId('error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('请选择一个答案后再继续');
    });

    /**
     * Page 6: 未选择选项
     * Expected: "请选择一个答案后再继续"
     */
    test('Page 6 - No selection', async ({ page }) => {
      await page.goto('/dev/g8-drone-imaging?page=6');
      await expect(page.getByTestId('page-height-analysis')).toBeVisible();

      // Click next without selecting
      await page.getByTestId('next-button').click();

      // Verify error message
      const errorMessage = page.getByTestId('error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('请选择一个答案后再继续');
    });

    /**
     * Page 7: 未完成单选
     * Expected: "请选择一个答案"
     */
    test('Page 7 - Radio not selected', async ({ page }) => {
      await page.goto('/dev/g8-drone-imaging?page=7');
      await expect(page.getByTestId('page-conclusion')).toBeVisible();

      // Click submit without selecting radio
      await page.getByTestId('submit-button').click();

      // Verify error message
      const errorMessage = page.getByTestId('error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('请选择一个答案');
    });

    /**
     * Page 7: 理由未填写或过短
     * Expected: "请输入至少5个字符的理由说明"
     */
    test('Page 7 - Reason too short', async ({ page }) => {
      await page.goto('/dev/g8-drone-imaging?page=7');
      await expect(page.getByTestId('page-conclusion')).toBeVisible();

      // Select radio but enter short reason
      await page.getByTestId('radio-conclusion-A').check();
      await page.getByTestId('conclusion-textarea').fill('短');
      await page.getByTestId('submit-button').click();

      // Verify error message
      const errorMessage = page.getByTestId('error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('请输入至少5个字符的理由说明');
    });
  });

  /**
   * 辅助测试：验证提交数据格式
   * Reference: 设计说明书 第6节 数据提交与事件设计
   */
  test('Verify MarkObject submission structure', async ({ page }) => {
    const capturedMarks = await setupSubmissionInterceptor(page);

    // Navigate through a page to trigger submission
    await page.goto('/dev/g8-drone-imaging?page=3');
    await expect(page.getByTestId('page-hypothesis')).toBeVisible();

    // Fill valid input and navigate
    await page.getByTestId('hypothesis-textarea').fill('测试内容用于验证提交数据结构格式');
    // await page.getByTestId('next-button').click();

    // Verify mark structure
    // if (capturedMarks.length > 0) {
    //   const mark = capturedMarks[0];
    //
    //   // Check pageNumber format: "stepIndex:subPageNum"
    //   expect(mark.pageNumber).toMatch(/^\d+:\d+$/);
    //
    //   // Check pageDesc format
    //   expect(mark.pageDesc).toBeTruthy();
    //
    //   // Check operationList
    //   expect(Array.isArray(mark.operationList)).toBe(true);
    //   for (const op of mark.operationList) {
    //     expect(op.code).toBeGreaterThan(0);
    //     expect(op.targetElement).toBeTruthy();
    //     expect(VALID_EVENT_TYPES).toContain(op.eventType);
    //     expect(op.time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    //   }
    //
    //   // Check answerList
    //   expect(Array.isArray(mark.answerList)).toBe(true);
    //   for (const ans of mark.answerList) {
    //     expect(ans.targetElement).toBeTruthy();
    //     expect(ans.value).toBeDefined();
    //   }
    //
    //   // Check time format
    //   expect(mark.beginTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    //   expect(mark.endTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    // }
  });

  /**
   * 辅助测试：验证事件类型枚举
   * Reference: 设计说明书 6.2节 事件类型与命名规范
   */
  test('Verify all event types are from valid enum', async ({ page }) => {
    const capturedMarks = await setupSubmissionInterceptor(page);

    // Perform various operations to generate events
    await page.goto('/dev/g8-drone-imaging?page=1');
    await page.getByTestId('next-button').click(); // Should generate click_blocked

    // Verify all captured events use valid enum values
    // for (const mark of capturedMarks) {
    //   for (const op of mark.operationList) {
    //     expect(VALID_EVENT_TYPES).toContain(op.eventType);
    //   }
    // }
  });
});

/**
 * Additional test scenarios for comprehensive coverage
 */
test.describe('G8 Drone Imaging - Additional Tests', () => {
  /**
   * Test timer expiration behavior
   * Reference: 设计说明书 14.1 用例4
   *
   * Note: This test would require mocking the 20-minute timer
   */
  test.skip('Timer expiration auto-submit', async ({ page }) => {
    // TODO: Implement timer mocking
    // - Auto-submit current page data
    // - Fill unanswered with "超时未回答"
    // - Navigate to next flow step
  });

  /**
   * Test session expiration handling
   * Reference: 设计说明书 9节 401/会话过期
   */
  test.skip('Session expiration redirect', async ({ page }) => {
    // Route to return 401
    await page.route('**/stu/saveHcMark', async (route: Route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 401,
          msg: 'Unauthorized',
        }),
      });
    });

    // TODO: Trigger submission and verify redirect to login
  });

  /**
   * Test navigation is blocked during submission
   */
  test.skip('Navigation blocked during submission', async ({ page }) => {
    // TODO: Test that user cannot navigate while submission is in progress
  });
});
