# Quickstart: 薇甘菊防治实验子模块

**Date**: 2025-11-19

## Prerequisites

- Node.js 18+
- pnpm包管理器
- 项目依赖已安装 (`pnpm install`)

## Development Setup

### 1. 启动开发服务器

```bash
# 在项目根目录
pnpm dev
```

服务器启动后访问 http://localhost:3000

### 2. 测试模块

由于子模块需要在Flow框架中运行，测试方式如下：

**方式A: Mock登录进入Flow**
1. 确保环境变量 `VITE_USE_MOCK=1`
2. 使用任意账号登录
3. Mock服务器返回包含本模块的Flow配置

**方式B: 独立调试模式**
1. 在Flow配置中单独指定本子模块
2. 子模块将以stepIndex=0运行
3. 不调用flowContext的进度API

### 3. 文件修改热更新

修改以下文件会触发HMR：
- `src/submodules/g8-mikania-experiment/**/*.jsx`
- `src/submodules/g8-mikania-experiment/**/*.module.css`

## Key Workflows

### 完整评测流程

1. 学生登录 → 进入包含本模块的Flow
2. Page 00: 阅读注意事项，等待38秒后勾选确认，点击下一页
3. Page 01: 阅读任务背景，点击下一页
4. Page 02: 查看实验步骤，填写Q1答案(≥5字符)
5. Page 03: 操作实验面板，观察发芽率变化
6. Page 04: 继续实验，选择Q2答案
7. Page 05: 继续实验，选择Q3答案
8. Page 06: 完成判断题Q4a和填空题Q4b(≥10字符)
9. 提交 → 调用flowContext.onComplete()

### 实验面板操作

1. 选择浓度：点击左侧三个浓度按钮之一
2. 调整天数：使用上下箭头按钮(1-7天)
3. 开始实验：点击"开始"按钮
4. 观察动画：滴管下移 → 液滴落下 → 种子发芽
5. 查看结果：右侧显示发芽率百分比
6. 重置实验：点击"重置"按钮清空状态

### 数据提交

每次点击"下一页"时：
1. 验证必填项
2. 收集操作记录和答案
3. 构造MarkObject
4. 调用usePageSubmission.submit()
5. **非最后一页**: 更新进度updateModuleProgress(nextSubPageNum)，然后导航到下一页
6. **最后一页**: 直接调用flowContext.onComplete()，**不调用updateModuleProgress**

> **重要**: 最后一页完成后不更新进度，避免刷新恢复时进度回退。详见设计说明书第6.3节。

## Code Examples

### 查询发芽率

```javascript
import { getGerminationRate } from './utils/experimentData';

// 获取5mg/ml浓度、第3天的发芽率
const rate = getGerminationRate(5, 3);
console.log(rate); // 30
```

### 记录操作事件

```javascript
// 实验开始
logOperation({
  targetElement: '实验面板-开始按钮',
  eventType: 'exp_start',
  value: JSON.stringify({
    concentration: '10mg/ml',
    days: 5
  }),
  time: new Date().toISOString()
});
```

### 生成复合页码

```javascript
import { encodeCompositePageNum } from '@/shared/types/flow';

const pageNumber = encodeCompositePageNum(
  flowContext.stepIndex,  // 如 0
  '3'                     // 子模块第3页
);
// 结果: "M0:3"
```

### 处理完成

```javascript
const handleComplete = async () => {
  // 提交最后一页数据
  await submitPageData();

  // 通知容器完成（不更新进度）
  flowContext?.onComplete?.();
};
```

## Verification Checklist

### 功能验证

- [ ] 7页线性流程正常推进
- [ ] Page 00和Page 01不显示左侧导航
- [ ] Page 00的38秒倒计时正常工作
- [ ] 倒计时结束前复选框禁用
- [ ] 必须勾选确认才能进入下一页
- [ ] 实验面板动画流畅(60FPS)
- [ ] 发芽率结果与数据表一致
- [ ] 必填项验证阻断导航
- [ ] 数据提交格式正确(pageNumber为复合编码)

### 状态恢复验证

- [ ] 刷新后恢复到正确页面
- [ ] 实验参数状态被恢复
- [ ] 已填答案被回填

### 计时验证

- [ ] 20分钟计时显示
- [ ] 超时自动提交
- [ ] 未答项标记为"超时未回答"

### 错误处理验证

- [ ] 网络错误显示重试UI
- [ ] 401触发重新登录
- [ ] 参数越界使用默认值

## Troubleshooting

### 实验动画不播放

检查：
1. SVG元素是否正确渲染
2. CSS动画类是否正确添加
3. 浏览器是否支持CSS动画

### 数据提交失败

检查：
1. 网络连接状态
2. MarkObject格式是否正确
3. pageNumber是否使用encodeCompositePageNum

### 页面无法恢复

检查：
1. flowContext.modulePageNum是否正确传入
2. getInitialPage是否正确映射
3. localStorage命名空间是否正确

## Next Steps

1. 运行 `/speckit.tasks` 生成任务列表
2. 按任务列表顺序实现各组件
3. 完成后运行验收测试清单
