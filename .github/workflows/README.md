# GitHub Actions CI/CD 工作流

本目录包含项目的持续集成和持续部署（CI/CD）配置。

## 📋 工作流清单

### 1. `ci.yml` - 主 CI 流程

**触发条件**：
- Push 到 `main`, `develop`, `feature/**`, `fix/**` 分支
- 创建 PR 到 `main`, `develop` 分支

**检查项**：
1. **ESLint 代码检查** - 代码质量和规范检查
2. **单元测试** - 运行所有单元测试
3. **构建检查** - 验证项目可以成功构建

**状态要求**：
- ✅ 测试和构建必须通过才能合并
- ⚠️  Lint 警告不阻断合并，但建议修复

---

### 2. `submission-guard.yml` - 提交规范守卫 🔒

**触发条件**：
- 修改以下路径的文件时自动触发：
  - `src/shared/services/submission/**`
  - `src/shared/components/tracking/**`
  - `src/shared/ui/PageFrame/**`
  - `src/shared/utils/pageMapping.ts`
  - `src/modules/**/context/**`
  - `src/submodules/**`
  - `src/context/AppContext.jsx`
  - `.eslintrc.submission-rules.json`

**检查项**：

#### Job 1: `submission-lint` - 提交规范 Lint
- 运行 `npm run lint:submission`
- 检查违规项：
  - ❌ 直接调用 `/stu/saveHcMark`
  - ❌ 手写 `M` 前缀页码
  - ❌ 直接 `fetch('/stu/*')`
  - ❌ 绕过 `usePageSubmission` Hook

#### Job 2: `submission-format-test` - 格式快照测试
- 运行 `npm run test:submission-format`
- 验证：
  - ✅ pageNumber 格式（`stepIndex.subPageNum`，如 `'0.3'`）
  - ✅ targetElement 前缀（`P{pageNumber}_`）
  - ✅ 最小事件集（page_enter, page_exit, next_click）
  - ✅ flow_context 自动注入

#### Job 3: `submission-full-test` - 完整测试
- 运行 `npm run test:submission`
- 执行所有提交相关测试：
  - Schema 校验测试
  - 事件枚举测试
  - 前缀验证测试
  - usePageSubmission 集成测试

#### Job 4: `submission-guard-summary` - 守卫总结
- 汇总所有检查结果
- **任一失败则阻断合并** 🚫

**状态要求**：
- 🔒 **所有检查必须通过**才能合并
- 失败时提供清晰的错误消息和修复指导

---

## 🚀 本地验证

在提交代码前，建议先在本地运行以下命令验证：

```bash
# 1. Lint 检查
npm run lint
npm run lint:submission

# 2. 测试
npm test
npm run test:submission
npm run test:submission-format

# 3. 构建
npm run build
```

---

## 📊 CI 状态徽章

在项目 README.md 中可以添加状态徽章：

```markdown
![CI Status](https://github.com/your-org/your-repo/workflows/CI/badge.svg)
![Submission Guard](https://github.com/your-org/your-repo/workflows/提交规范守卫/badge.svg)
```

---

## 🔧 故障排查

### Lint 失败

**错误示例**：
```
禁止直接调用 /stu/saveHcMark，请使用 usePageSubmission Hook
```

**修复方法**：
1. 查看 `docs/submission-ci-checks.md`
2. 使用 `usePageSubmission` 替代直接 API 调用
3. 参考 `docs/migration-guide-unified-submission.md`

### 格式测试失败

**错误示例**：
```
pageNumber 必须使用 Flow 统一格式 <stepIndex>.<subPageNum>（如 "0.3"）
```

**修复方法**：
1. 检查 pageNumber 格式，确保使用点分格式
2. 不要使用单数字（`'1'`）或 M 前缀（`'M1:5'`）
3. 运行 `npm run test:submission-format` 本地验证

### 最小事件集缺失

**错误示例**：
```
operationList 必须包含 page_enter、page_exit，以及 next_click 或 auto_submit
```

**修复方法**：
1. 使用 `AssessmentPageFrame` 自动处理生命周期事件
2. 或使用 `TrackedButton` 组件（`isNext={true}`）
3. 确保提交前包含完整事件链

---

## 📝 快照更新

如果需要更新快照（谨慎操作）：

```bash
# 本地更新快照
npm run test:submission-format -- -u

# 提交更新后的快照文件
git add src/shared/services/submission/__tests__/**/__snapshots__
git commit -m "test: 更新提交格式快照"
```

⚠️ **注意**：快照更新需经过 Code Review 确认！

---

## 🔐 安全注意事项

1. **不要跳过 CI 检查**
   - 即使是紧急修复，也应确保通过所有检查
   - 如有特殊情况，需团队讨论并记录

2. **保护分支设置**
   - `main` 和 `develop` 应设置为保护分支
   - 要求 CI 检查通过才能合并
   - 要求至少一位审核者批准

3. **敏感信息**
   - 不要在 workflow 中硬编码密钥
   - 使用 GitHub Secrets 管理敏感配置

---

## 📚 相关文档

- [提交规范 CI 检查文档](../../docs/submission-ci-checks.md)
- [统一提交管道迁移指南](../../docs/migration-guide-unified-submission.md)
- [GitHub Actions 官方文档](https://docs.github.com/en/actions)

---

## 🆘 获取帮助

如果 CI 检查失败且无法自行解决：

1. 查看 CI 日志中的详细错误信息
2. 参考本文档的故障排查部分
3. 查阅相关技术文档
4. 联系团队寻求帮助
