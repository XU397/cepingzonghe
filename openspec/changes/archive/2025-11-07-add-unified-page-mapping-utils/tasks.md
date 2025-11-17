## Tasks: add-unified-page-mapping-utils

## 1. 工具与约定
- [x] 1.1 导出 `getTargetPageIdFromPageNum(n)` 与 `parseCompositePageNum(s)`
- [x] 1.2 提供越界回落与默认页策略（注意事项页）
- [x] 1.3 为 `submodules/*/mapping.ts` 定义类型与校验脚本（可选）

## 实施摘要

### 已完成的工作

1. **创建核心工具文件** `src/shared/utils/pageMapping.ts`
   - 实现了 `parseCompositePageNum(s)` 函数，支持两种复合页码格式：
     - `M<stepIndex>:<subPageNum>` (如 "M1:5")
     - `<stepIndex>.<subPageNum>` (如 "1.5")
   - 实现了 `getTargetPageIdFromPageNum(n, mapping)` 函数，提供统一的越界处理和默认页策略
   - 定义了类型：`PageInfo`, `PageMapping`, `CompositePageNum`
   - 提供了辅助工具函数：
     - `buildCompositePageNum`: 构造复合页码
     - `getPageNumFromPageId`: 反向查找页码
     - `isValidPageNum`: 验证页码有效性
     - `getTotalPages`: 获取总页数
     - `getAllPageIds`: 获取所有页面ID
     - `getNextPageId` / `getPrevPageId`: 获取相邻页面

2. **创建示例文件** `src/submodules/_example/mapping.ts`
   - 展示了完整的页码映射表定义
   - 演示了如何使用工具函数实现 CMI 接口
   - 提供了 Flow 集成的使用示例

3. **创建文档** `src/shared/utils/README.md`
   - 详细说明了所有 API 的用法
   - 提供了边界处理策略说明
   - 包含了在子模块中使用的完整示例
   - 说明了 Flow 集成的方法

### 验收标准达成情况

- ✅ **统一映射逻辑**：所有模块可通过 `getTargetPageIdFromPageNum` 实现一致的页码到页面ID的转换
- ✅ **复合页码支持**：支持 Flow 编排运行时的两种复合页码格式
- ✅ **边界处理一致**：无效/越界页码统一返回默认页
- ✅ **类型安全**：提供完整的 TypeScript 类型定义
- ✅ **易于使用**：子模块只需定义映射表，复用工具函数即可
- ✅ **文档完善**：包含详细的使用说明和示例

### 后续建议

1. 在实际子模块包装器中应用此工具（如 `g7-experiment`, `g7-questionnaire` 等）
2. 可选：添加单元测试验证边界处理和复合页码解析的正确性
3. 可选：在 `vite.config.js` 中添加路径别名 `@` 以支持 `@/shared/utils/pageMapping` 导入
