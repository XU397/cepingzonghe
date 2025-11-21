#!/usr/bin/env node
/**
 * E2E Flow Verification Script
 *
 * - Launches Chromium via Puppeteer
 * - Logs in (szcs001/1234)
 * - Navigates to Flow: g7-experiment-003
 * - Verifies per-page submissions for:
 *   1) g7-experiment (14 pages)
 *   2) g7-tracking-experiment (13 pages)
 * - Listens to /stu/saveHcMark requests, extracts batchCode, examNo and mark
 * - Validates mark.flow_context and pageDesc prefix
 * - Generates a Markdown report to stdout and writes to docs/E2E_FLOW_VERIFICATION_REPORT.md
 *
 * Usage:
 *   node scripts/e2e-flow-verification.mjs
 *
 * Env overrides:
 *   BASE_URL=http://localhost:3001
 *   E2E_USER=szcs001
 *   E2E_PASS=1234
 *   HEADLESS=true|false
 */

import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Config
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const FLOW_ID = 'g7-experiment-003';
const FLOW_URL = `${BASE_URL}/flow/${FLOW_ID}`;
const LOGIN_USER = process.env.E2E_USER || 'szcs001';
const LOGIN_PASS = process.env.E2E_PASS || '1234';
const HEADLESS = String(process.env.HEADLESS || 'true').toLowerCase() === 'true';

// Page timeouts
const DEFAULT_PAGE_TIMEOUT_MS = 30_000; // 30s
const NOTICE_PAGE_TIMEOUT_MS = 45_000;  // 45s for notice pages with 40s countdown
const NETWORK_IDLE_TIMEOUT_MS = 10_000;

// Save endpoint patterns
const SAVE_ENDPOINT_SUFFIXES = ['/stu/saveHcMark', '/saveHcMark'];

// Helpers: time + sleep
const nowIso = () => new Date().toISOString();
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Simple hasFlowContext check (mirrors src/shared/services/submission/pageDescUtils.js)
const hasFlowContextPrefix = (pageDesc) => /^(\[[^/]+\/[^/]+\/\d+\])\s*/.test(String(pageDesc || ''));

// Parse multipart/form-data body for FormData keys (batchCode, examNo, mark)
function parseMultipartFormData(rawBody, contentTypeHeader) {
  if (!rawBody || !contentTypeHeader) return null;
  const ct = String(contentTypeHeader);
  const m = ct.match(/boundary=(.*)$/);
  if (!m) return null;
  const boundary = m[1];

  // Normalize line endings to \r\n for safer splitting
  const body = String(rawBody).replace(/\r?\n/g, '\r\n');
  const delimiter = `--${boundary}`;

  const parts = body.split(delimiter).map((p) => p.trim()).filter((p) => p && p !== '--');
  const form = {};

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;
    const headersRaw = part.slice(0, headerEnd);
    let content = part.slice(headerEnd + 4);
    // Strip trailing boundary markers and CRLF
    content = content.replace(/\r\n$/, '');

    const cdMatch = headersRaw.match(/content-disposition:.*?name="([^"]+)"/i);
    if (!cdMatch) continue;
    const name = cdMatch[1];

    // If filename present, content might be binary; we skip files
    const isFile = /filename="/i.test(headersRaw);
    if (isFile) continue;

    // Clean content (some browsers add trailing CRLF)
    const value = content;
    form[name] = value;
  }

  // Post-process specific fields
  let markObj = null;
  if (typeof form.mark === 'string') {
    try {
      markObj = JSON.parse(form.mark);
    } catch (e) {
      markObj = null;
    }
  }

  return {
    batchCode: form.batchCode || null,
    examNo: form.examNo || null,
    mark: markObj,
  };
}

// Request capture per page
function attachSaveRequestCapture(page, onCapture) {
  const handler = async (request) => {
    try {
      const url = request.url();
      const isSave = SAVE_ENDPOINT_SUFFIXES.some((suf) => url.endsWith(suf) || url.includes(suf));
      if (!isSave) return;

      const headers = request.headers();
      const postData = request.postData();
      const parsed = parseMultipartFormData(postData, headers['content-type']);

      const capture = {
        at: nowIso(),
        url,
        method: request.method(),
        headers,
        payload: parsed,
      };
      onCapture?.(capture);
    } catch (err) {
      // keep going
      onCapture?.({ at: nowIso(), error: String(err && err.message || err) });
    }
  };
  page.on('request', handler);
  return () => page.off('request', handler);
}

async function waitForNavigationStable(page, timeoutMs = NETWORK_IDLE_TIMEOUT_MS) {
  try {
    await page.waitForNetworkIdle({ idleTime: 500, timeout: timeoutMs });
  } catch (_) {
    // ignore
  }
}

async function gotoAndWait(page, urlStr) {
  await page.goto(urlStr, { waitUntil: 'networkidle2' });
}

// Visible element helpers
async function queryAllVisible(page, selector) {
  const handles = await page.$$(selector);
  const visible = [];
  for (const h of handles) {
    const box = await h.boundingBox();
    const isVisible = !!box && box.width > 0 && box.height > 0;
    if (isVisible) visible.push(h);
  }
  return visible;
}

// Click button by texts (tries several candidates)
async function clickButtonByText(page, texts) {
  const candidates = Array.isArray(texts) ? texts : [texts];
  for (const t of candidates) {
    const xpath = `//button[normalize-space(text())='${t}'] | //button[contains(normalize-space(.), '${t}')]`;
    const els = await page.$x(xpath);
    if (els.length > 0) {
      await els[0].click();
      return true;
    }
  }
  return false;
}

async function tryMinimalFormInteractions(page) {
  // 1) Textareas
  const textareas = await queryAllVisible(page, 'textarea');
  for (const ta of textareas) {
    try {
      await ta.focus();
      await ta.click({ clickCount: 3 });
      await ta.type('自动化测试输入');
      break;
    } catch (_) {}
  }
  // 2) Text inputs
  const textInputs = await queryAllVisible(page, 'input[type="text"]');
  for (const inp of textInputs) {
    try {
      await inp.focus();
      await inp.click({ clickCount: 3 });
      await inp.type('自动化测试');
      break;
    } catch (_) {}
  }
  // 3) Radio
  const radios = await queryAllVisible(page, 'input[type="radio"]');
  if (radios.length) {
    try { await radios[0].click(); } catch (_) {}
  }
  // 4) Checkbox
  const checkboxes = await queryAllVisible(page, 'input[type="checkbox"]');
  if (checkboxes.length) {
    try { await checkboxes[0].click(); } catch (_) {}
  }
  // 5) Select
  const selects = await queryAllVisible(page, 'select');
  for (const sel of selects) {
    try {
      await page.evaluate((el) => {
        const opts = Array.from(el.options || []);
        const pick = opts.find((o) => o.value && o.value !== '' && !o.disabled);
        if (pick) el.value = pick.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, sel);
      break;
    } catch (_) {}
  }
  // 6) Simulation start button (计时开始)
  await clickButtonByText(page, ['计时开始']);
}

async function clickNextLike(page) {
  // Try common next button texts
  const success = await clickButtonByText(page, ['下一页', '继续', '下一步', '开始作答']);
  return success;
}

async function waitForNoticeAndProceed(page, timeoutMs) {
  // Notice pages typically require waiting for checkbox to be enabled then click continue
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      // Try the standard g7-experiment notice checkbox
      const ack = await page.$('#acknowledge-checkbox');
      if (ack) {
        const disabled = await page.evaluate((el) => el.disabled, ack);
        if (!disabled) {
          await ack.click();
          await clickButtonByText(page, ['继续', '下一页']);
          return true;
        }
      }
      // Try tracking notice page: checkbox disabled until countdown complete
      const anyCheckbox = await page.$('input[type="checkbox"]');
      if (anyCheckbox) {
        const disabled = await page.evaluate((el) => el.disabled, anyCheckbox);
        if (!disabled) {
          try { await anyCheckbox.click(); } catch (_) {}
          await clickButtonByText(page, ['继续', '下一页']);
          return true;
        }
      }
    } catch (_) {}
    await sleep(500);
  }
  return false;
}

function makeModuleResult(name, totalPages) {
  return {
    name,
    totalPages,
    pages: Array.from({ length: totalPages }, (_, i) => ({
      index: i + 1,
      requestCount: 0,
      batchCode: null,
      examNo: null,
      pageNumber: null,
      pageDesc: null,
      hasFlowContextEvent: false,
      hasPageDescPrefix: false,
      status: 'pending',
      note: '',
    })),
  };
}

function summarizePageStatus(p) {
  if (p.requestCount <= 0) return 'fail';
  if (p.hasFlowContextEvent && p.hasPageDescPrefix) return 'pass';
  if (p.hasFlowContextEvent || p.hasPageDescPrefix) return 'warn';
  return 'fail';
}

function formatStatusIcon(status) {
  if (status === 'pass') return '✅ 通过';
  if (status === 'warn') return '🟡 警告';
  return '🔴 失败';
}

async function verifyModuleFlow(page, moduleName, totalPages, options = {}) {
  const result = makeModuleResult(moduleName, totalPages);

  // Local collector for save requests in this module
  const saveEvents = [];
  const detach = attachSaveRequestCapture(page, (evt) => saveEvents.push(evt));

  try {
    for (let i = 0; i < totalPages; i++) {
      const pageIndex = i + 1;
      const row = result.pages[i];

      // Special handling for notice pages (index 1): allow up to 45s to pass 40s countdown
      if (pageIndex === 1) {
        const ok = await waitForNoticeAndProceed(page, NOTICE_PAGE_TIMEOUT_MS);
        if (!ok) {
          row.status = 'warn';
          row.note = '超时未能通过倒计时/确认，尝试继续';
        }
      } else {
        // Minimal interactions to enable Next, then click Next
        try {
          await tryMinimalFormInteractions(page);
        } catch (_) {}

        const clicked = await clickNextLike(page);
        if (!clicked) {
          // Some pages auto-submit during navigation or have custom buttons; try one more time after a short wait
          await sleep(500);
          await tryMinimalFormInteractions(page);
          await clickNextLike(page);
        }
      }

      // Wait for save request for this page (up to DEFAULT_PAGE_TIMEOUT_MS)
      const startWait = Date.now();
      let observedForThisTurn = [];
      while (Date.now() - startWait < DEFAULT_PAGE_TIMEOUT_MS) {
        // Pull and drain events collected so far
        if (saveEvents.length) {
          observedForThisTurn = observedForThisTurn.concat(saveEvents.splice(0, saveEvents.length));
        }
        if (observedForThisTurn.length > 0) break;
        await sleep(100);
      }

      // Consolidate the observed requests for this page turn
      const parsed = observedForThisTurn
        .map((e) => ({ e, p: e && e.payload }))
        .filter((x) => x.p && x.p.mark);

      row.requestCount = parsed.length;

      if (parsed.length > 0) {
        const last = parsed[parsed.length - 1].p; // use the last submit attempt
        row.batchCode = last.batchCode || row.batchCode;
        row.examNo = last.examNo || row.examNo;
        row.pageNumber = last.mark?.pageNumber ?? null;
        row.pageDesc = last.mark?.pageDesc ?? null;

        // Check flow_context event
        const opList = Array.isArray(last.mark?.operationList) ? last.mark.operationList : [];
        row.hasFlowContextEvent = opList.some((op) => String(op?.eventType) === 'flow_context');
        row.hasPageDescPrefix = hasFlowContextPrefix(row.pageDesc);
      } else {
        row.note = row.note || '未捕获提交请求';
      }

      row.status = summarizePageStatus(row);

      // Let the UI settle to next page
      await waitForNavigationStable(page);
    }
  } catch (err) {
    // record module-level issue but continue
    result.moduleError = String(err?.message || err);
  } finally {
    detach();
  }

  return result;
}

function renderModuleTable(mod) {
  const lines = [];
  lines.push(`| 页码 | Network请求次数 | batchCode | examNo | flow_context | pageDesc前缀 | 状态 | 备注 |`);
  lines.push(`|------|------------------|-----------|--------|--------------|--------------|------|------|`);
  for (const p of mod.pages) {
    const flowCtx = p.hasFlowContextEvent ? '✅ 有' : '❌ 无';
    const descPrefix = p.hasPageDescPrefix ? '✅ 有' : '❌ 无';
    const status = formatStatusIcon(p.status);
    lines.push(`| ${p.index} | ${p.requestCount} | ${p.batchCode || '-'} | ${p.examNo || '-'} | ${flowCtx} | ${descPrefix} | ${status} | ${p.note || ''} |`);
  }
  return lines.join('\n');
}

function renderReport(report) {
  const lines = [];
  lines.push(`# Flow 端到端验证报告`);
  lines.push('');
  lines.push(`- 测试时间: ${nowIso()}`);
  lines.push(`- 测试账号: ${LOGIN_USER}`);
  lines.push(`- Flow ID: ${FLOW_ID}`);
  lines.push('');

  for (const mod of report.modules) {
    lines.push(`## 子模块: ${mod.name}`);
    if (mod.moduleError) {
      lines.push(`> 模块执行错误: ${mod.moduleError}`);
    }
    lines.push('');
    lines.push(renderModuleTable(mod));
    lines.push('');
  }

  return lines.join('\n');
}

async function performLogin(page) {
  await gotoAndWait(page, BASE_URL);

  // Wait for login inputs
  await page.waitForSelector('.login-input-field', { timeout: 15_000 });
  const inputs = await page.$$('.login-input-field');
  if (inputs.length < 2) {
    throw new Error('Login inputs not found');
  }

  // Fill user and password
  await inputs[0].focus();
  await page.keyboard.type(LOGIN_USER);
  await inputs[1].focus();
  await page.keyboard.type(LOGIN_PASS);

  // Click login button
  await clickButtonByText(page, ['登录']);

  // After login, the app should redirect to /flow/<id>. If not, force navigate.
  // Give it a moment to route and render.
  const routeWaitStart = Date.now();
  let atFlow = false;
  while (Date.now() - routeWaitStart < 8_000) {
    const urlNow = page.url();
    if (urlNow.includes('/flow/')) { atFlow = true; break; }
    await sleep(200);
  }
  if (!atFlow) {
    await gotoAndWait(page, FLOW_URL);
  }
}

async function main() {
  const browser = await puppeteer.launch({ headless: HEADLESS, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 820 });

  const report = { modules: [] };

  try {
    console.log('[E2E] Starting login...');
    await performLogin(page);
    console.log('[E2E] At flow page:', page.url());

    // Verify module 1: g7-experiment (14 pages)
    console.log('[E2E] Verifying g7-experiment (14 pages)');
    const mod1 = await verifyModuleFlow(page, 'g7-experiment', 14);
    report.modules.push(mod1);

    // After completing g7-experiment, the Flow orchestrator advances to g7-tracking-experiment
    // Give some time for transition
    await waitForNavigationStable(page, 3_000);
    await sleep(500);

    // Verify module 2: g7-tracking-experiment (13 pages)
    console.log('[E2E] Verifying g7-tracking-experiment (13 pages)');
    const mod2 = await verifyModuleFlow(page, 'g7-tracking-experiment', 13);
    report.modules.push(mod2);

  } catch (err) {
    console.error('[E2E] Fatal error:', err);
    report.fatalError = String(err?.message || err);
  } finally {
    // Render report
    const md = renderReport(report);
    console.log('\n' + md + '\n');

    // Write to docs
    try {
      const outPath = path.resolve(projectRoot, 'docs', 'E2E_FLOW_VERIFICATION_REPORT.md');
      await fs.writeFile(outPath, md, 'utf8');
      console.log(`[E2E] Report written: ${outPath}`);
    } catch (werr) {
      console.warn('[E2E] Failed to write report file:', werr?.message || werr);
    }

    await browser.close();
  }
}

main().catch((e) => {
  console.error('[E2E] Unhandled error:', e);
  process.exitCode = 1;
});

