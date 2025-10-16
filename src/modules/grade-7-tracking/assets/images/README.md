# 图片资源规格说明

本目录存放7年级追踪测评模块(蜂蜜黏度探究)使用的所有图片资源。

## T104: 图片优化策略

### 当前实现状态

本模块采用 **SVG 内联 + CSS 渐变绘制** 策略，**不依赖外部图片资源**，从而实现：

- ✅ 零网络请求（无需加载外部图片）
- ✅ 完美适配任何分辨率（矢量图形可无限缩放）
- ✅ 动态修改颜色和样式（CSS 变量控制）
- ✅ 减少加载时间（无需等待图片下载）
- ✅ 打包体积更小（无需携带图片文件）

### 性能指标

| 指标 | 当前值 | 目标值 | 状态 |
|------|--------|--------|------|
| 图片总大小 | 0 KB | ≤200KB/张 | ✅ 优秀 |
| 网络请求数 | 0 个 | 最小化 | ✅ 优秀 |
| 首屏渲染阻塞 | 无 | 无 | ✅ 优秀 |
| 缓存依赖 | 无 | 最小化 | ✅ 优秀 |

---

## 实验相关图形

### 量筒图标 (BeakerSelector组件)
- **文件名**: 无（使用SVG内联）
- **用途**: 量筒选择器中显示不同含水量的量筒
- **实现方式**:
  ```jsx
  <svg viewBox="0 0 100 200">
    <rect fill={waterColor} />
  </svg>
  ```
- **颜色映射**:
  - 15%含水量: `#0050b3` (深蓝)
  - 17%含水量: `#1890ff` (蓝色)
  - 19%含水量: `#69c0ff` (浅蓝)
  - 21%含水量: `#91d5ff` (淡蓝)
- **规格**: 动态生成，宽100px，高200px
- **状态**: ✅ 已实现（SVG内联）

### 温度计图标 (TemperatureControl组件)
- **文件名**: 无（使用SVG内联）
- **用途**: 温度控制器中的温度计图标
- **实现方式**: SVG 绘制红色液体柱 + 灰色外框
- **规格**: 宽80px，高240px
- **状态**: ✅ 已实现（SVG内联）

### 小钢球图标 (BallDropAnimation组件)
- **文件名**: 无（使用CSS渐变）
- **用途**: 下落动画中的小钢球
- **实现方式**:
  ```css
  background: radial-gradient(circle at 30% 30%, #69c0ff, #1890ff 40%, #0050b3 80%);
  ```
- **规格**: 20x20px 圆形，带金属质感高光
- **性能优化**: 使用 `will-change: transform` 和 GPU 加速
- **状态**: ✅ 已实现（CSS渐变）

---

## 背景与装饰图片

### 实验室背景
- **文件名**: 无（使用纯色背景）
- **用途**: 实验页面的背景
- **实现方式**: `background: #f5f5f5`
- **状态**: ✅ 已实现（纯色背景）
- **备选方案**: 如需添加背景图，建议使用淡化的实验室场景（1920x1080px, JPG 80%质量，≤150KB）

### 蜂蜜图片
- **文件名**: 无（使用 emoji 🍯）
- **用途**: 说明区域的蜂蜜配图
- **实现方式**: Unicode emoji 字符
- **状态**: ✅ 已实现（emoji）
- **备选方案**: 如需真实图片，建议 400x300px, JPG 85%质量，≤100KB

---

## 角色头像

### 学生角色头像
- **文件名**: 无（使用CSS圆形+文字）
- **用途**: 实验说明区的学生"小明"头像
- **实现方式**:
  ```css
  .avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  ```
- **状态**: ✅ 已实现（CSS渐变背景+文字）

---

## 图标与UI元素

### 选中徽章图标
- **文件名**: 无（SVG内联）
- **用途**: 选中状态的对号徽章
- **实现方式**: SVG `<path>` 绘制对号形状
- **颜色**: `#52c41a` (绿色)
- **规格**: 24x24px
- **状态**: ✅ 已实现（SVG内联）

### 提示灯泡图标
- **文件名**: 无（使用 emoji 💡）
- **用途**: 提示卡片中的灯泡图标
- **实现方式**: Unicode emoji 字符
- **状态**: ✅ 已实现（emoji）

---

## 数据可视化相关

### 图表占位符
- **文件名**: 无（Recharts 稳定运行）
- **用途**: Recharts库加载失败时的降级图片
- **当前状态**: Recharts 库稳定，无需降级方案
- **备选方案**: 如需添加，建议静态折线图 PNG（800x400px，≤80KB）

---

## 问卷部分图片

### 完成徽章
- **文件名**: 无（使用 emoji ✅）
- **用途**: 问卷完成后的徽章图标
- **实现方式**: Unicode emoji 字符或 SVG
- **状态**: ✅ 已实现（emoji）

---

## 图片优化指南（如需添加外部图片）

### 1. 文件格式选择

| 格式 | 适用场景 | 优化方法 | 大小限制 |
|------|----------|----------|----------|
| SVG | 图标、Logo、简单图形 | SVGO 压缩 | 无限制 |
| PNG | 需要透明背景的图片 | TinyPNG 压缩 | ≤200KB |
| JPG | 照片、复杂图像 | 质量80-85% | ≤200KB |
| WebP | 现代浏览器优先 | 质量80% | ≤150KB |

### 2. 压缩工具推荐

- **在线工具**:
  - TinyPNG (https://tinypng.com/) - PNG/JPG 压缩
  - SVGOMG (https://jakearchibald.github.io/svgomg/) - SVG 优化
  - Squoosh (https://squoosh.app/) - WebP 转换

- **命令行工具**:
  ```bash
  # PNG 压缩
  pngquant --quality=65-80 input.png -o output.png

  # JPG 压缩
  convert input.jpg -quality 80 output.jpg

  # SVG 优化
  svgo input.svg -o output.svg
  ```

### 3. 响应式图片

如需添加外部图片，建议提供多分辨率版本：

```jsx
<img
  src={image1x}
  srcSet={`${image1x} 1x, ${image2x} 2x, ${image3x} 3x`}
  alt="描述性文字"
/>
```

### 4. 懒加载策略

对于非首屏图片，使用原生懒加载：

```jsx
<img src={imageSrc} loading="lazy" alt="描述" />
```

### 5. 无障碍性

所有图片必须有 `alt` 属性：

```jsx
// 功能性图片
<img src={icon} alt="温度计图标" />

// 装饰性图片
<img src={decoration} alt="" aria-hidden="true" />
```

---

## 命名规范

如需添加图片文件，请遵循以下命名规范：

- **基础命名**: 使用 kebab-case
  ```
  experiment-beaker.png
  honey-jar.jpg
  student-avatar.svg
  ```

- **状态图片**: 添加状态后缀
  ```
  button-default.png
  button-hover.png
  button-active.png
  button-disabled.png
  ```

- **多分辨率**: 添加倍数标识
  ```
  icon.png          (1x - 24x24px)
  icon@2x.png       (2x - 48x48px)
  icon@3x.png       (3x - 72x72px)
  ```

---

## 使用方法

如需添加外部图片到项目中：

### 步骤1: 放置图片文件
```
src/modules/grade-7-tracking/assets/images/
├── honey.jpg          (优化后 ≤100KB)
├── honey@2x.jpg       (高清版 ≤180KB)
└── student-avatar.png (优化后 ≤50KB)
```

### 步骤2: 在组件中导入
```jsx
import honeyImage from '../../assets/images/honey.jpg';
import honeyImage2x from '../../assets/images/honey@2x.jpg';

function Component() {
  return (
    <img
      src={honeyImage}
      srcSet={`${honeyImage} 1x, ${honeyImage2x} 2x`}
      alt="蜂蜜图片"
      loading="lazy"
    />
  );
}
```

### 步骤3: Vite 自动处理
Vite 会自动：
- 优化图片（根据配置）
- 生成唯一文件名（带 hash）
- 复制到 dist 目录
- 更新引用路径

---

## 性能验证

使用以下工具验证图片优化效果：

### 1. Chrome DevTools
```
1. 打开 Network 标签
2. 筛选 Img 类型
3. 检查每个图片的:
   - Size (传输大小)
   - Time (加载时间)
   - Initiator (请求来源)
```

### 2. Lighthouse 审计
```
1. 打开 Chrome DevTools → Lighthouse
2. 运行审计（Performance + Best Practices）
3. 查看 "Properly size images" 建议
4. 查看 "Efficiently encode images" 建议
```

### 3. WebPageTest
```
1. 访问 https://www.webpagetest.org/
2. 输入项目 URL
3. 查看 Image Analysis 报告
```

---

## 当前状态总结

### 优势
1. **零图片依赖**: 所有图形使用 SVG/CSS 绘制
2. **性能优异**: 无网络请求，无加载等待
3. **可维护性强**: 颜色、尺寸通过 CSS 变量控制
4. **响应式完美**: 矢量图形适配所有分辨率
5. **包体积小**: 不携带图片文件

### 未来改进建议
1. **可选背景图**: 为实验页面添加淡化的实验室背景（低优先级）
2. **真实蜂蜜图**: 替换 emoji 为真实蜂蜜图片（可选）
3. **卡通头像**: 为"小明"添加卡通风格头像（可选）

### T104 完成标准
- ✅ 单个图片不超过 200KB（当前0KB，无外部图片）
- ✅ 图片总大小最小化（当前0KB）
- ✅ 使用现代图片格式（SVG 内联）
- ✅ 文档完善（本 README）

---

## 联系与维护

如需添加或修改图片资源，请：
1. 参考本文档的优化指南
2. 确保图片大小符合限制
3. 更新本 README 的使用记录
4. 运行性能测试验证

**维护者**: Frontend Developer Team
**最后更新**: 2025-10-15 (T104)
