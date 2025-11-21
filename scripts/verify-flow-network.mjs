import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const screenshotDir = path.join(repoRoot, 'test-screenshots');
const verificationDir = path.join(repoRoot, 'docs', 'verification');
const chromiumExecutable = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.cache',
  'ms-playwright',
  'chromium-1187',
  'chrome-linux',
  'chrome',
);

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const extractMarkPayload = (rawBody) => {
  if (!rawBody) {
    return null;
  }
  const marker = 'name="mark"';
  const index = rawBody.indexOf(marker);
  if (index === -1) {
    return null;
  }
  const segment = rawBody.slice(index + marker.length);
  const separatorIndex = segment.indexOf('\r\n\r\n');
  if (separatorIndex === -1) {
    return null;
  }
  const rest = segment.slice(separatorIndex + 4);
  const boundaryIndex = rest.indexOf('\r\n------');
  const jsonPayload = boundaryIndex === -1 ? rest.trim() : rest.slice(0, boundaryIndex).trim();
  try {
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn('[verify-flow-network] Failed to parse mark payload', error);
    return null;
  }
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const renderTextScreenshot = async (context, filename, title, content) => {
  const page = await context.newPage();
  await page.setContent(`
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: "JetBrains Mono", "Fira Code", SFMono-Regular, Menlo, Consolas, monospace;
            padding: 24px;
            background: #0f172a;
            color: #e2e8f0;
          }
          h1 {
            margin-top: 0;
            font-size: 20px;
          }
          pre {
            white-space: pre-wrap;
            word-break: break-word;
            font-size: 14px;
            line-height: 1.5;
            background: #1e293b;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #334155;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <pre>${escapeHtml(content)}</pre>
      </body>
    </html>
  `);
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
  await page.close();
};

async function main() {
  await ensureDir(screenshotDir);
  await ensureDir(verificationDir);

  await fs.access(chromiumExecutable);

  const browser = await chromium.launch({
    executablePath: chromiumExecutable,
    headless: true,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (message) => {
    consoleLogs.push(`[${message.type()}] ${message.text()}`);
  });

  let saveHcMarkBody = null;
  await page.route('**/stu/saveHcMark', async (route) => {
    const request = route.request();
    const buffer = request.postDataBuffer();
    saveHcMarkBody = buffer ? buffer.toString('utf-8') : request.postData();
    await route.continue();
  });

  await page.addInitScript(() => {
    const originalSetInterval = window.setInterval;
    window.setInterval = (handler, timeout = 0, ...args) => {
      if (timeout === 1000) {
        return originalSetInterval(handler, 25, ...args);
      }
      return originalSetInterval(handler, timeout, ...args);
    };
  });

  await page.goto('http://127.0.0.1:3000/flow/test-flow-1', { waitUntil: 'networkidle' });
  await page.waitForSelector('#acknowledge-checkbox', { timeout: 20000 });
  await page.screenshot({
    path: path.join(screenshotDir, 'flow-notice.png'),
    fullPage: true,
  });

  await page.waitForFunction(() => {
    const checkbox = document.querySelector('#acknowledge-checkbox');
    return checkbox && !checkbox.disabled;
  }, { timeout: 20000 });
  await page.check('#acknowledge-checkbox');

  const saveResponsePromise = page.waitForResponse((response) =>
    response.url().includes('/stu/saveHcMark'),
  );
  await page.getByRole('button', { name: '继续' }).click();
  const saveResponse = await saveResponsePromise;
  const saveResponseBody = await saveResponse.json();

  const localStorageSnapshot = await page.evaluate(() => {
    const snapshot = {};
    Object.keys(localStorage)
      .filter((key) => key.startsWith('flow.'))
      .forEach((key) => {
        snapshot[key] = localStorage.getItem(key);
      });
    return snapshot;
  });

  const markPayload = extractMarkPayload(saveHcMarkBody);
  if (!markPayload) {
    throw new Error('Failed to parse mark payload from saveHcMark request');
  }

  const verificationSummary = {
    timestamp: new Date().toISOString(),
    network: {
      response: saveResponseBody,
      mark: markPayload,
    },
    localStorage: localStorageSnapshot,
    consoleLogs,
  };

  await fs.writeFile(
    path.join(verificationDir, 'flow-saveHcMark-artifacts.json'),
    JSON.stringify(verificationSummary, null, 2),
    'utf8',
  );

  await renderTextScreenshot(
    context,
    'flow-network-payload.png',
    'saveHcMark Payload',
    JSON.stringify(markPayload, null, 2),
  );

  await renderTextScreenshot(
    context,
    'flow-console-logs.png',
    'Console Logs',
    consoleLogs.join('\n') || 'No console output captured.',
  );

  await renderTextScreenshot(
    context,
    'flow-local-storage.png',
    'localStorage flow.* keys',
    JSON.stringify(localStorageSnapshot, null, 2),
  );

  await browser.close();
}

main().catch((error) => {
  console.error('[verify-flow-network] Failed to capture artifacts:', error);
  process.exitCode = 1;
});
