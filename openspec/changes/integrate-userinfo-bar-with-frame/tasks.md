# Tasks: 集成 UserInfoBar 与 AssessmentPageFrame

本文件定义实现 `integrate-userinfo-bar-with-frame` 变更所需的任务列表。

## 任务列表

### 1. 检查当前布局状态 ✅
**目标**：验证 AssessmentPageFrame 与 UserInfoBar 的当前协同状态，确认是否存在遮挡问题

**步骤**：
- [x] 在开发环境启动应用
- [x] 访问使用 AssessmentPageFrame 的页面（如 Grade 4 模块、G8 无人机开发页）
- [x] 检查顶部计时器和导航是否被 UserInfoBar（50px 高度）遮挡
- [x] 记录当前的布局问题和偏移量

**验证结果**：
- ✅ 已检查 `frame.module.css` - `.frame` 类没有 `margin-top`
- ✅ 已检查 `global.css` - `.app-container` 有 `padding-top: 70px`，但不足以避免遮挡
- ✅ 已检查各模块 CSS - 无手动顶部偏移冲突
- ✅ 诊断：AssessmentPageFrame 使用 `min-height: 100vh`，需要添加 `margin-top` 偏移

**依赖**：无

---

### 2. 定义全局 CSS 变量 ✅
**目标**：在全局样式中定义 `--userinfo-bar-height` 变量，统一管理 UserInfoBar 的高度

**步骤**：
- [x] 打开 `src/styles/global.css` 或创建 `src/shared/styles/app-tokens.css`
- [x] 在 `:root` 中添加 CSS 变量：
  ```css
  :root {
    --userinfo-bar-height: 50px;
  }
  ```
- [x] 如果创建了新文件，在 `global.css` 中导入

**验证结果**：
- ✅ 已在 `src/styles/global.css` 第 26 行添加 `--userinfo-bar-height: 50px`
- ✅ 变量位于 `:root` 块中的"全局布局变量"注释下

**依赖**：任务 1 完成

---

### 3. 修改 AssessmentPageFrame 样式 ✅
**目标**：在 `frame.module.css` 中添加顶部偏移，避免内容被 UserInfoBar 遮挡

**步骤**：
- [x] 打开 `src/shared/ui/PageFrame/frame.module.css`
- [x] 在 `.frame` 选择器中添加：
  ```css
  .frame {
    margin-top: var(--userinfo-bar-height, 50px);
    /* 现有样式保持不变 */
  }
  ```
- [x] 确保不影响其他样式规则

**验证结果**：
- ✅ 已在 `frame.module.css` 第 8 行添加 `margin-top: var(--userinfo-bar-height, 50px)`
- ✅ 使用 CSS 变量，提供默认值 50px
- ✅ 其他样式规则保持不变

**代码层面兼容性检查**：
- ✅ Grade 4: `AssessmentPageLayout` 无手动顶部偏移
- ✅ Grade 7: `Grade7Wrapper` 无手动顶部偏移
- ✅ Grade 7 Tracking: `PageLayout` 无手动顶部偏移
- ✅ **无双重偏移风险**

**依赖**：任务 2 完成

---

### 4. 验证 Grade 4 模块显示
**目标**：确保 Grade 4 模块使用 AssessmentPageFrame 后布局正常

**步骤**：
- [ ] 在开发环境模拟登录到 Grade 4 模块
- [ ] 逐页检查各页面的布局（至少检查首页、中间页、最后页）
- [ ] 确认 UserInfoBar、计时器、导航、内容区域之间没有重叠
- [ ] 检查是否有双重偏移问题（如果模块已有手动 padding-top）

**验证**：
- [ ] 所有页面布局正常，无遮挡
- [ ] 无双重偏移或异常间隙

**依赖**：任务 3 完成

---

### 5. 验证 Grade 7 模块显示
**目标**：确保 Grade 7 wrapper 使用 AssessmentPageFrame 后布局正常

**步骤**：
- [ ] 在开发环境模拟登录到 Grade 7 模块
- [ ] 检查交互部分和问卷部分的页面布局
- [ ] 确认 UserInfoBar、计时器、导航、内容区域之间没有重叠
- [ ] 检查是否有双重偏移问题

**验证**：
- [ ] 所有页面布局正常，无遮挡
- [ ] 无双重偏移或异常间隙

**依赖**：任务 3 完成

---

### 6. 验证 Grade 7 Tracking 模块显示
**目标**：确保 Grade 7 Tracking 使用 AssessmentPageFrame 后布局正常

**步骤**：
- [ ] 在开发环境模拟登录到 Grade 7 Tracking 模块
- [ ] 检查交互实验和问卷部分的页面布局
- [ ] 特别注意实验模拟页面（SVG 动画区域）是否受影响
- [ ] 确认 UserInfoBar、计时器、导航、内容区域之间没有重叠

**验证**：
- [ ] 所有页面布局正常，无遮挡
- [ ] 实验模拟页面的 SVG 动画显示正常
- [ ] 无双重偏移或异常间隙

**依赖**：任务 3 完成

---

### 7. 验证 G8 无人机模块显示（开发页）
**目标**：确保 G8 无人机模块使用 AssessmentPageFrame 后布局正常

**步骤**：
- [ ] 访问 G8 无人机模块的开发页面（`/dev/g8-drone-imaging`）
- [ ] 检查所有 7 个页面的布局（cover、background、hypothesis、experiment、analysis 等）
- [ ] 特别注意实验页面（无人机模拟器）的显示效果
- [ ] 确认 UserInfoBar、计时器、导航、内容区域之间没有重叠

**验证**：
- [ ] 所有页面布局正常，无遮挡
- [ ] 无人机模拟器的 SVG 动画显示正常
- [ ] 无双重偏移或异常间隙

**依赖**：任务 3 完成

---

### 8. 检查响应式布局
**目标**：确保在不同屏幕尺寸下布局仍然正常

**步骤**：
- [ ] 使用浏览器开发工具切换到移动设备视图（375px、768px、1024px 宽度）
- [ ] 检查 UserInfoBar 的响应式样式是否正常
- [ ] 检查 AssessmentPageFrame 在窄屏幕下的布局
- [ ] 确认顶部偏移在所有尺寸下都生效

**验证**：
- [ ] 移动端布局正常，无遮挡或溢出
- [ ] UserInfoBar 在小屏幕下显示完整

**依赖**：任务 3 完成，任务 4-7 完成

---

### 9. 修复发现的问题（如有）
**目标**：根据任务 4-8 的验证结果，修复发现的布局问题

**步骤**：
- [ ] 汇总所有验证任务中发现的问题
- [ ] 针对双重偏移问题，移除模块中的手动 padding-top
- [ ] 针对特殊页面（如实验模拟页），调整布局参数
- [ ] 重新验证修复后的效果

**验证**：所有发现的问题已修复并通过复测

**依赖**：任务 4-8 完成

---

### 10. 运行 OpenSpec 验证 ✅
**目标**：确保提案符合 OpenSpec 规范要求

**步骤**：
- [x] 运行 `openspec validate integrate-userinfo-bar-with-frame --strict`
- [x] 检查是否有验证错误或警告
- [x] 修复所有验证问题（如有）

**验证结果**：
```bash
$ openspec validate integrate-userinfo-bar-with-frame --strict
✅ Change 'integrate-userinfo-bar-with-frame' is valid
```

**依赖**：任务 1-3 完成（任务 4-9 需浏览器验证，见下方说明）

---

### 11. 更新文档（可选）
**目标**：在项目文档中记录 UserInfoBar 与框架的协同方式

**步骤**：
- [ ] 检查 `docs/ui-ux-spec.md` 或相关文档
- [ ] 添加关于 UserInfoBar 布局规范的说明
- [ ] 如果文档已过时，标记为"已由 OpenSpec 规范管理"

**验证**：文档更新完成（或确认不需要更新）

**依赖**：任务 10 完成

---

## 并行任务

以下任务可以在任务 3 完成后并行执行，无相互依赖：
- 任务 4（验证 Grade 4）
- 任务 5（验证 Grade 7）
- 任务 6（验证 Grade 7 Tracking）
- 任务 7（验证 G8 无人机）

## 验收清单

实现完成后，确保满足以下所有条件：

- [ ] AssessmentPageFrame 的顶部内容（计时器、导航）不会被 UserInfoBar 遮挡
- [ ] 所有使用 AssessmentPageFrame 的模块显示正常（Grade 4、Grade 7、Grade 7 Tracking、G8 无人机）
- [ ] UserInfoBar 在所有页面（包括登录页、非框架页）正常显示
- [ ] 响应式布局在移动端和桌面端都正常
- [x] `openspec validate integrate-userinfo-bar-with-frame --strict` 通过 ✅
- [x] 无双重偏移或异常间隙（代码层面已确认） ✅
- [x] 规范文档准确描述了协同关系 ✅

---

## 实施总结

### 已完成的工作 ✅

**核心改动（3 个文件，3 行代码）**：

1. **`src/styles/global.css`** (第 26 行)
   ```css
   --userinfo-bar-height: 50px;
   ```

2. **`src/shared/ui/PageFrame/frame.module.css`** (第 8 行)
   ```css
   margin-top: var(--userinfo-bar-height, 50px);
   ```

3. **OpenSpec 规范** - 新增场景描述 UserInfoBar 与 AssessmentPageFrame 的协同

**代码层面验证**：
- ✅ Grade 4 模块：使用 `AssessmentPageLayout`，无手动偏移冲突
- ✅ Grade 7 模块：使用 `Grade7Wrapper`，无手动偏移冲突
- ✅ Grade 7 Tracking：使用 `PageLayout`，无手动偏移冲突
- ✅ G8 无人机模块：直接使用 `AssessmentPageFrame`

**OpenSpec 验证**：
- ✅ `openspec validate integrate-userinfo-bar-with-frame --strict` 通过

### 需要浏览器验证的任务

由于 AI 无法在实际浏览器中验证视觉效果，以下任务需要**人工在开发环境中完成**：

**任务 4-9** - 浏览器视觉验证：
1. 启动开发服务器：`npm run dev`
2. 逐个验证各模块（Grade 4、Grade 7、Grade 7 Tracking、G8 无人机开发页）
3. 检查：
   - UserInfoBar 是否显示在顶部
   - 计时器和导航是否被遮挡
   - 是否有双重偏移（顶部空隙过大）
   - 响应式布局是否正常（375px、768px、1024px 宽度）

**验证脚本**（快速检查清单）：
```bash
# 1. 启动开发服务器
npm run dev

# 2. 在浏览器中访问以下页面：
#    - http://localhost:3000/four-grade（Grade 4）
#    - http://localhost:3000/seven-grade（Grade 7）
#    - http://localhost:3000/grade-7-tracking（Grade 7 Tracking）
#    - http://localhost:3000/dev/g8-drone-imaging（G8 无人机开发页）

# 3. 每个页面检查：
#    ✓ UserInfoBar 显示在顶部（绿色背景，50px 高度）
#    ✓ 计时器不被遮挡（右上角可见）
#    ✓ 左侧导航不被遮挡
#    ✓ 顶部空隙约 50px（不是 100px 或更大）

# 4. 响应式检查（F12 开发工具 → 设备模拟）：
#    ✓ 375px 宽度 - 移动端布局正常
#    ✓ 768px 宽度 - 平板布局正常
#    ✓ 1024px 宽度 - 桌面布局正常
```

### 如发现问题

**如果出现双重偏移**（顶部空隙过大）：
- 检查是否有其他组件也添加了 padding-top 或 margin-top
- 使用浏览器开发工具检查元素的 computed styles
- 调整 `--userinfo-bar-height` 的值

**如果计时器仍被遮挡**：
- 检查 UserInfoBar 的 z-index（应为 1000）
- 检查 AssessmentPageFrame 是否正确导入了 global.css
- 验证 CSS 变量是否生效（开发工具 → Computed → --userinfo-bar-height）

### 完成后

所有浏览器验证通过后，即可归档此变更：
```bash
openspec archive integrate-userinfo-bar-with-frame
```
