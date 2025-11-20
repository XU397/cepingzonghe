import { test, expect } from '@playwright/test';

test('dev harness walks the full g8 flow with mocked submission', async ({ page }) => {
  await page.goto('/dev/g8-drone-imaging?skipCountdown=1');

  const frameNext = page.getByTestId('frame-next');
  const noticeCheckbox = page.getByRole('checkbox', { name: /已阅读并理解上述注意事项/ });

  await expect(noticeCheckbox).toBeChecked();
  await noticeCheckbox.click();
  await expect(frameNext).toBeDisabled();
  await noticeCheckbox.click();
  await expect(frameNext).toBeEnabled();

  // Hidden intro screens use frame Next
  await frameNext.click();
  await expect(page.getByText('任务背景')).toBeVisible();
  await frameNext.click();

  // Page 02 - invalid then valid
  await expect(page.getByText('实验步骤')).toBeVisible();
  const q1Textarea = page.getByRole('textbox');
  await q1Textarea.fill('1234');
  await page.getByRole('button', { name: /^下一页$/ }).click();
  await expect(page.getByText(/至少5个字符/)).toBeVisible();
  await q1Textarea.fill('这是足够长的答案内容');
  await page.getByRole('button', { name: /^下一页$/ }).click();

  // Page 03 - use frame Next
  await expect(page.getByText('模拟实验')).toBeVisible();
  await frameNext.click();

  // Page 04 - single-choice validation
  await expect(page.getByText('实验数据收集')).toBeVisible();
  await page.getByRole('button', { name: /^下一页$/ }).click();
  await expect(page.getByText('请选择一个选项')).toBeVisible();
  await page.getByRole('button', { name: /10mg\/ml/ }).click();
  await page.getByRole('button', { name: /^下一页$/ }).click();

  // Page 05 - single-choice validation
  await expect(page.getByText('发芽率趋势分析')).toBeVisible();
  await page.getByRole('button', { name: /^下一页$/ }).click();
  await expect(page.getByText('请选择一个选项')).toBeVisible();
  await page.getByRole('button', { name: /浓度越高/ }).click();
  await page.getByRole('button', { name: /^下一页$/ }).click();

  // Page 06 - final submit, expect errors then success
  await expect(page.getByText('实验结论')).toBeVisible();
  await page.getByRole('button', { name: '提交' }).click();
  await expect(page.getByText('请选择"是"或"否"')).toBeVisible();
  await expect(page.getByText('至少10个字符')).toBeVisible();

  await page.getByRole('button', { name: /^是$/ }).click();
  await page.getByRole('textbox').fill('这是一个充分的结论文本，满足要求');
  await page.getByRole('button', { name: '提交' }).click();

  await expect(page.getByTestId('dev-last-submission')).not.toHaveText(/尚未提交/);
  await expect(page.getByTestId('dev-complete-flag')).toBeVisible();
});
