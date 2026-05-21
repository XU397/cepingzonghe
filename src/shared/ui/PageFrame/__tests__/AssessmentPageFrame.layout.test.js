import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const frameCss = readFileSync(resolve(here, '../frame.module.css'), 'utf8');
const userInfoCss = readFileSync(resolve(here, '../../../../components/common/UserInfoBar.module.css'), 'utf8');
const appSource = readFileSync(resolve(here, '../../../../App.jsx'), 'utf8');
const appShellSource = readFileSync(resolve(here, '../../../../app/AppShell.jsx'), 'utf8');
const flowSource = readFileSync(resolve(here, '../../../../flows/FlowModule.jsx'), 'utf8');

function cssBlock(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`));
  return match?.[1] ?? '';
}

describe('AssessmentPageFrame chrome layout contract', () => {
  it('keeps the shared frame chrome as the single correct submodule frame', () => {
    const frameBlock = cssBlock(frameCss, '.frame');

    expect(frameBlock).toMatch(/border:\s*var\(--frame-border-width/);
    expect(frameBlock).toMatch(/border-radius:\s*var\(--frame-border-radius/);
    expect(frameBlock).toMatch(/box-shadow:\s*var\(--frame-shadow/);
    expect(frameBlock).toMatch(/overflow:\s*hidden;/);
  });

  it('keeps the shared frame timer slot visible for submodules', () => {
    const timerBlock = cssBlock(frameCss, '.timerSlot');

    expect(timerBlock).toMatch(/position:\s*fixed;/);
    expect(timerBlock).not.toMatch(/display:\s*none;/);
  });

  it('keeps the global green user info bar above frame chrome', () => {
    const barBlock = cssBlock(userInfoCss, '.userInfoBar');

    expect(barBlock).toMatch(/z-index:\s*2000;/);
  });

  it('keeps the global green user info bar mounted on non-login routes during auth hydration', () => {
    expect(appShellSource).toContain('<UserInfoBar forceVisible />');
  });
});

describe('App module route chrome contract', () => {
  it('does not wrap module routes with legacy global timer or rounded content shell', () => {
    const moduleBranchStart = appSource.indexOf('if (moduleUrl && isAuthenticated)');
    const moduleBranchEnd = appSource.indexOf('if (moduleLoggedRef.current)', moduleBranchStart);
    const moduleBranch = appSource.slice(moduleBranchStart, moduleBranchEnd);

    expect(moduleBranch).not.toContain('<Timer />');
    expect(moduleBranch).not.toContain('<QuestionnaireTimer />');
    expect(moduleBranch).not.toContain('main-content-wrapper');
    expect(moduleBranch).not.toContain('task-wrapper');
    expect(moduleBranch).toContain('module-app-container');
    expect(moduleBranch).toContain('<ModuleRouter');
  });
});

describe('Flow development controls contract', () => {
  it('detects Vite dev mode even when a process shim exists', () => {
    expect(flowSource).toMatch(/Boolean\(import\.meta\.env\?\.DEV\)/);
    expect(flowSource).toContain("import.meta.env?.MODE === 'development'");
    expect(flowSource).toContain("process.env.NODE_ENV === 'development'");
  });
});
