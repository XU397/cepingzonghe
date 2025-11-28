/**
 * 全屏提示管理器
 * 直接操作DOM，绕过React渲染问题
 */

let promptElement = null;

// 检查是否应该强制全屏
const shouldEnforceFullscreen = () => {
  // 生产环境总是强制全屏
  const isDevEnvironment = typeof process !== 'undefined'
    ? process.env.NODE_ENV === 'development'
    : Boolean(import.meta?.env?.DEV);

  if (!isDevEnvironment) {
    return true;
  }

  // 开发环境检查环境变量
  const flag = import.meta?.env?.VITE_REQUIRE_FULLSCREEN_IN_DEV;
  if (typeof flag === 'string') {
    return flag.toLowerCase() === 'true' || flag === '1';
  }
  return Boolean(flag);
};

export const showFullscreenPrompt = (onEnterFullscreen) => {
  console.log('[FullscreenPromptManager] 准备显示全屏提示');

  // 检查是否应该强制全屏
  if (!shouldEnforceFullscreen()) {
    console.log('[FullscreenPromptManager] 不强制全屏，跳过显示');
    return;
  }

  console.log('[FullscreenPromptManager] 显示全屏提示');

  // 如果已经存在，先移除
  hideFullscreenPrompt();

  // 创建提示元素
  promptElement = document.createElement('div');
  promptElement.id = 'global-fullscreen-prompt';
  promptElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    pointer-events: auto;
  `;

  // 创建内容
  promptElement.innerHTML = `
    <div style="
      background: white;
      border-radius: 16px;
      padding: 50px 48px;
      max-width: 540px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    ">
      <div style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 88px;
        height: 88px;
        background: linear-gradient(135deg, #4080ff 0%, #2970ff 100%);
        border-radius: 50%;
        color: white;
        margin-bottom: 28px;
      ">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </div>

      <h2 style="
        font-size: 30px;
        font-weight: 600;
        color: #1a202c;
        margin: 0 0 20px 0;
      ">请进入全屏模式</h2>

      <p style="
        font-size: 16px;
        color: #4a5568;
        line-height: 1.8;
        margin: 0 0 36px 0;
      ">
        为了确保测试环境的完整性和避免意外操作，<br />
        请点击下方按钮重新进入全屏模式。
      </p>

      <button id="fullscreen-prompt-button" style="
        background: linear-gradient(135deg, #4080ff 0%, #2970ff 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 15px 52px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(64, 128, 255, 0.4);
      ">进入全屏</button>

      <p style="
        font-size: 13px;
        color: #a0aec0;
        margin: 28px 0 0 0;
      ">
        提示：按 F11 或 Esc 键也可能影响全屏状态
      </p>
    </div>
  `;

  // 添加到body
  document.body.appendChild(promptElement);

  // 添加点击事件
  const button = document.getElementById('fullscreen-prompt-button');
  if (button && onEnterFullscreen) {
    button.addEventListener('click', () => {
      onEnterFullscreen();
      hideFullscreenPrompt();
    });
  }

  console.log('[FullscreenPromptManager] 全屏提示已添加到DOM');
};

export const hideFullscreenPrompt = () => {
  if (promptElement) {
    console.log('[FullscreenPromptManager] 隐藏全屏提示');
    promptElement.remove();
    promptElement = null;
  }
};

export const showInitialFullscreenGuide = (onEnterFullscreen) => {
  console.log('[FullscreenPromptManager] 准备显示初始全屏引导');

  // 检查是否应该强制全屏
  if (!shouldEnforceFullscreen()) {
    console.log('[FullscreenPromptManager] 不强制全屏，跳过显示');
    return;
  }

  console.log('[FullscreenPromptManager] 显示初始全屏引导');

  // 如果已经存在，先移除
  hideFullscreenPrompt();

  // 创建提示元素
  promptElement = document.createElement('div');
  promptElement.id = 'global-fullscreen-guide';
  promptElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    pointer-events: auto;
  `;

  // 创建内容
  promptElement.innerHTML = `
    <div style="
      background: white;
      border-radius: 16px;
      padding: 50px 48px;
      max-width: 540px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    ">
      <div style="
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 88px;
        height: 88px;
        background: linear-gradient(135deg, #4080ff 0%, #2970ff 100%);
        border-radius: 50%;
        color: white;
        margin-bottom: 28px;
      ">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </div>

      <h2 style="
        font-size: 30px;
        font-weight: 600;
        color: #1a202c;
        margin: 0 0 20px 0;
      ">欢迎使用测评系统</h2>

      <p style="
        font-size: 16px;
        color: #4a5568;
        line-height: 1.8;
        margin: 0 0 36px 0;
      ">
        为了提供最佳的测试体验并避免意外操作，<br />
        请点击下方按钮进入全屏模式开始测评。
      </p>

      <button id="fullscreen-guide-button" style="
        background: linear-gradient(135deg, #4080ff 0%, #2970ff 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 15px 52px;
        font-size: 18px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(64, 128, 255, 0.4);
      ">开始测评（进入全屏）</button>

      <p style="
        font-size: 13px;
        color: #a0aec0;
        margin: 28px 0 0 0;
      ">
        提示：测评过程中请保持全屏模式，避免使用 F11 或 Esc 键
      </p>
    </div>
  `;

  // 添加到body
  document.body.appendChild(promptElement);

  // 添加点击事件
  const button = document.getElementById('fullscreen-guide-button');
  if (button && onEnterFullscreen) {
    button.addEventListener('click', () => {
      onEnterFullscreen();
      hideFullscreenPrompt();
    });
  }

  console.log('[FullscreenPromptManager] 初始全屏引导已添加到DOM');
};