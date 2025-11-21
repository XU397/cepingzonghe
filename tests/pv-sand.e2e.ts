import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('光伏治沙子模块 - /dev/pv-sand', () => {
  test('7 页流程 skeleton（可在 CI/headless 运行）', async ({ page }) => {
    // 为了避免等待 38s/5s 倒计时，使用 query 直达 Page04；如需完整 1-7 页，可移除 &page=... 并改为等待倒计时
    await page.goto(`${BASE_URL}/dev/pv-sand?page=page04-experiment-design`);

    // Page04: 设计原因
    await page.getByRole('textbox').fill('自动化填入的实验设计原因，长度足够通过校验。');
    await page.getByRole('button', { name: /操作指引/ }).click();

    // Page05: 教程流程（高度→测量→完成）
    await page.getByRole('button', { name: /开始教程/ }).click();
    await page.getByRole('button', { name: '20cm' }).click();
    await page.waitForTimeout(1100); // 等待跳到步骤2
    await page.getByRole('button', { name: '开始测量风速' }).click();
    await page.waitForTimeout(2600); // 等待测量完成跳到步骤3
    await page.getByRole('button', { name: /继续/ }).click();
    await page.getByRole('button', { name: /继续/ }).click();
    await page.getByRole('button', { name: /完成教程，开始实验/ }).click();

    // Page06: 跑实验1 → 选择答案
    await page.getByRole('button', { name: '开始实验' }).click();
    await page.waitForTimeout(2200); // 等待动画与数据采集
    await page.getByLabelText(/有光伏板区域风速更小/).check();
    await page.getByRole('button', { name: /进入实验2/ }).click();

    // Page07: 三个高度跑完再填趋势分析
    const runExperimentAtHeight = async (heightLabel: string) => {
      await page.getByRole('button', { name: heightLabel }).click();
      await page.getByRole('button', { name: '开始实验' }).click();
      await page.waitForTimeout(2200);
    };
    await runExperimentAtHeight('20cm');
    await runExperimentAtHeight('50cm');
    await runExperimentAtHeight('100cm');

    const analysis = page.getByPlaceholderText(/趋势规律/);
    await analysis.fill('高度越高，无板区风速越大；光伏板存在降低风速。');
    await page.getByRole('button', { name: /完成实验分析/ }).click();

    // Page08: 验证最终答案/操作已暴露给 harness
    await page.waitForFunction(() => (window as any).__pvSandHarness__?.answers?.length >= 1);
    const harnessState = await page.evaluate(() => (window as any).__pvSandHarness__);
    expect(Array.isArray(harnessState.operations)).toBe(true);
    expect(harnessState.answers.length).toBeGreaterThan(0);
  });
});
