# 复合页码格式变更 - 任务清单

## 1. 核心工具更新

### 1.1 编码函数变更
- [x] 1.1.1 更新 `src/shared/utils/pageMapping.ts`：
  - 修改 `encodeCompositePageNum(submoduleIndex, pageIndex)` 实现新格式
  - 添加 `isValidCompositePageNum(pageNumStr)` 校验函数
  - 更新 `parseCompositePageNum` 支持新格式解析
  - 添加类型定义 `CompositePageNumNew`
- [x] 1.1.2 添加单元测试覆盖新格式编码/解析/校验

### 1.2 提交层适配
- [x] 1.2.1 更新 `src/shared/services/submission/usePageSubmission.js`：
  - 修改 `pickPageNumber` 使用 `stepIndex + 1` 作为 `submoduleIndex`
  - 确保 `pageIndex` 两位零填充
- [x] 1.2.2 更新 `src/shared/services/submission/schema.ts`：
  - 添加 pageNumber 格式校验正则 `^[1-9]\d*\.\d{2}$`
  - 在 `validateMarkObject` 中校验 pageNumber 格式
- [x] 1.2.3 更新相关测试用例

### 1.3 Flow/Assessment 容器
- [ ] 1.3.1 检查 `src/flows/orchestrator/FlowOrchestrator.ts` 页码生成逻辑
- [ ] 1.3.2 检查 `src/shared/ui/PageFrame/AssessmentPageFrame.jsx` 页码传递
- [ ] 1.3.3 确保 `pageDesc` 前缀与 `pageNumber` 中的 stepIndex 对齐

## 2. 规范文档输出

### 2.1 子模块迁移规范文档
- [x] 2.1.1 创建 `docs/composite-page-numbering-migration-guide.md`，包含：
  - 新旧格式对比说明
  - 转换规则详解（`submoduleIndex = stepIndex + 1`）
  - 子模块需要检查的代码位置清单
  - 测试快照更新方法
  - 验证检查清单

### 2.2 更新现有文档
- [x] 2.2.1 更新 `docs/submodule-submission-guidelines.md`：
  - 第 1 节页码格式改为新格式
  - 添加格式校验正则说明
  - 更新示例代码
- [ ] 2.2.2 更新 `docs/submission-format-standard.md`（如存在）- 文件不存在，跳过

## 3. 数据兼容与迁移

### 3.1 旧数据读取策略
- [x] 3.1.1 在 `parseCompositePageNum` 中保留对 `0.*` 格式的读取兼容（仅读取，不再生成）
- [x] 3.1.2 添加 `convertLegacyPageNum(oldFormat)` 工具函数，用于迁移脚本

### 3.2 CI/Lint 守卫
- [ ] 3.2.1 更新 ESLint 规则禁止 `0.*`/`M*` 格式的 pageNumber 字面量
- [ ] 3.2.2 添加 CI 检查脚本验证提交快照中的 pageNumber 格式

## 4. 子模块迁移（后续独立任务）

> 以下每个子模块创建独立的迁移任务，遵循规范文档执行

### 4.1 g8-drone-imaging
- [ ] 4.1.1 检查 `src/submodules/g8-drone-imaging/context/DroneImagingContext.tsx` 页码生成
- [ ] 4.1.2 更新测试快照 `src/submodules/g8-drone-imaging/pages/__tests__/*.test.tsx`
- [ ] 4.1.3 验证提交数据格式

### 4.2 g8-mikania-experiment
- [ ] 4.2.1 检查 `src/submodules/g8-mikania-experiment/Component.jsx` 页码传递
- [ ] 4.2.2 检查 `mapping.ts` 中的页码常量
- [ ] 4.2.3 更新测试快照
- [ ] 4.2.4 验证提交数据格式

### 4.3 g8-pv-sand-experiment
- [ ] 4.3.1 检查 `src/submodules/g8-pv-sand-experiment/context/PvSandContext.tsx`
- [ ] 4.3.2 更新测试快照 `src/submodules/g8-pv-sand-experiment/__tests__/*.test.ts`
- [ ] 4.3.3 验证提交数据格式

### 4.4 g7-tracking-experiment
- [ ] 4.4.1 检查 `src/modules/grade-7-tracking/context/TrackingContext.jsx`
- [ ] 4.4.2 检查 `src/modules/grade-7-tracking/utils/pageMapping.js`
- [ ] 4.4.3 更新相关页面的快照测试
- [ ] 4.4.4 验证提交数据格式

### 4.5 g7-tracking-questionnaire
- [ ] 4.5.1 检查 `src/submodules/g7-tracking-questionnaire/mapping.ts`
- [ ] 4.5.2 更新测试快照
- [ ] 4.5.3 验证提交数据格式

### 4.6 grade-7-experiment / grade-7-questionnaire
- [ ] 4.6.1 检查 `src/modules/grade-7/wrapper.jsx` 页码传递
- [ ] 4.6.2 验证提交数据格式

## 5. 验证与发布

### 5.1 规格校验
- [x] 5.1.1 运行 `openspec validate update-composite-page-numbering --strict`
- [x] 5.1.2 修复所有校验错误（验证通过，无需修复）

### 5.2 回归测试
- [x] 5.2.1 运行全量单元测试 `npm test`（24 tests passed）
- [x] 5.2.2 更新失败的快照测试
- [ ] 5.2.3 运行 E2E 测试验证提交流程（后续任务）

### 5.3 文档发布
- [x] 5.3.1 确认规范文档完整
- [ ] 5.3.2 通知相关开发人员迁移时间线（后续任务）

---

## 附录：子模块迁移检查清单模板

每个子模块迁移时使用此检查清单：

```markdown
## [子模块名称] 页码格式迁移检查清单

### 代码检查
- [ ] Context 中 `pageNumber` 生成逻辑已更新
- [ ] `pageMeta.subPageNum` 传递正确（从 1 开始）
- [ ] `stepIndex` 使用处已添加 `+ 1` 转换
- [ ] 无硬编码的 `0.*` 或 `M*` 格式页码

### 测试更新
- [ ] 快照测试中的 pageNumber 格式已更新为 `X.YY`
- [ ] 新增格式校验测试用例

### 验证
- [ ] 本地运行提交流程，检查 Network 中的 pageNumber 格式
- [ ] 格式满足正则 `^[1-9]\d*\.\d{2}$`
- [ ] targetElement 前缀格式正确（如 `P1.03_xxx`）
```
