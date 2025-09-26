# **1.0 引言 (Introduction)**

本文件旨在详细定义"HCI-Evaluation"应用中，全新"四年级"模块的用户体验（UX）目标、信息架构、用户流程和视觉设计规格。它将作为前端开发的核心指南，确保最终实现的用户界面在**功能上遵循四年级数学火车购票测评需求**，在**视觉风格上与现有"蒸馒头"模块（7年级模块）保持完全一致**。

## **1.1 总体UX目标与原则 (Overall UX Goals & Principles)**

* **目标用户**: 四年级学生。  
* **可用性目标**:  
  * **易学性**: 用户无需额外指导，即可理解每个页面的任务和交互方式。  
  * **防错性**: 通过明确的指令和交互约束（如按钮的禁用/启用状态），最大限度地减少用户误操作的可能性。  
  * **沉浸感**: 交互内容应具有趣味性和代入感，以维持学生的注意力和参与度。  
* **设计原则**:  
  1. **视觉一致性 (核心)**: 所有新页面的布局、颜色、字体和组件样式，必须严格复现现有项目的视觉风格，确保新旧模块在观感上无缝衔接。  
  2. **清晰引导**: 每个交互步骤都应有明确的文本指令，引导用户完成任务。  
  3. **即时反馈**: 用户的每一个有效操作都应立即在界面上产生可见的响应。  
  4. **流程至上**: 严格遵守测评的单向、不可逆流程，确保测评的严肃性和有效性。

## **1.2 品牌与风格指南 (Branding & Style Guide)**

本指南基于项目真实页面代码(Page_04_Material_Reading_Factor_Selection.jsx)和样式文件分析制定，确保与7年级模块视觉风格完全一致。

* **1.2.1 页面布局 (Page Layout) - 基于实际代码架构**  
  * **顶部用户信息条 (User Info Bar)**:  
    * 背景色：渐变绿色 linear-gradient(135deg, #4CAF50 0%, #45a049 100%)  
    * 固定位置：position: fixed, top: 0, 高度50px  
    * 左侧：平台名称"新都区义务教育质量综合监测平台"  
    * 右侧：用户姓名，白色半透明背景圆角胶囊样式  
  * **主应用区 (Main Application Area)**:  
    * 背景色：--cartoon-bg: #fff9f0 (温暖的米白色)  
    * 整体布局：垂直flexbox，上方为用户信息条，下方为主内容区  
    * **左侧进度导航 (Left Progress Navigation)**:  
      * 宽度：100px，高度100%，左侧固定  
      * 背景色：--cartoon-light: #e6f7ff  
      * 垂直排列的圆形进度点，直径40px  
      * 当前步骤：--cartoon-primary: #59c1ff 蓝色背景，白色文字  
      * 已完成步骤：--cartoon-green: #67d5b5 绿色背景  
      * 连接线：垂直4px宽度，颜色为--cartoon-border  
    * **中央内容区域 (Content Area)**:  
      * 背景：白色，圆角20px  
      * 3px边框，颜色为--cartoon-border: #ffd99e  
      * 阴影：0 10px 30px var(--cartoon-shadow)  
      * 内边距：20px  
      * **关键要求**：所有内容必须在一屏内完成，不出现滚动条  
  * **计时器 (Timer)**:  
    * 位置：固定在右上角(top: 55px, right: 20px)  
    * 样式：--cartoon-secondary: #ffce6b 黄色背景，圆角30px  
    * 内容：⏱️图标 + "剩余时间 MM:SS"  
    * 边框：2px solid #ffb347

* **1.2.2 色彩方案 (Color Palette) - 严格按照global.css变量**  
  * **主色系 (Primary Colors)**:  
    * --cartoon-primary: #59c1ff (主要交互色，导航高亮)  
    * --cartoon-secondary: #ffce6b (次要强调色，计时器背景)  
    * --cartoon-accent: #ff7eb6 (强调色，按钮激活状态)  
  * **背景色系 (Background Colors)**:  
    * --cartoon-bg: #fff9f0 (全局背景)  
    * --cartoon-light: #e6f7ff (左侧导航背景)  
    * 白色: #ffffff (主内容区背景)  
  * **功能色系 (Functional Colors)**:  
    * --cartoon-green: #67d5b5 (成功/已完成状态)  
    * --cartoon-red: #ff8a80 (警告/错误状态)  
    * --cartoon-dark: #2d5b8e (主要文本色)  
  * **装饰色系 (Decorative Colors)**:  
    * --cartoon-border: #ffd99e (边框色)  
    * --cartoon-shadow: rgba(255, 188, 97, 0.3) (阴影色)  
  * **用户信息条 (User Info Bar)**:  
    * 背景渐变: linear-gradient(135deg, #4CAF50 0%, #45a049 100%)  
    * 文字: 白色 #ffffff

* **1.2.3 组件样式 (Component Styles) - 基于实际代码实现**  
  * **圆角标准**: 大容器20px，中等元素12px，小元素8px  
  * **按钮样式**:  
    * 基础按钮：padding: 12px 24px, border-radius: 12px  
    * 禁用状态：#cccccc背景，#888888文字  
    * 激活状态：--cartoon-primary背景，白色文字，悬停时上移3px  
    * "下一页"按钮位置：页面底部居中或右下角  
  * **导航项 (Step Navigation)**:  
    * 圆形：width/height: 40px, border-radius: 50%  
    * 边框：3px solid var(--cartoon-border)  
    * 当前步骤：--cartoon-primary背景，scale(1.1)放大  
    * 已完成：--cartoon-green背景  
    * 连接线：4px宽度垂直线条  
  * **内容卡片**:  
    * 白色背景，border-radius: 20px  
    * 3px边框，--cartoon-border颜色  
    * 阴影：0 10px 30px var(--cartoon-shadow)  
  * **输入框**:  
    * border: 3px solid var(--cartoon-border)  
    * border-radius: 12px  
    * 聚焦时：border-color: var(--cartoon-primary)  
  * **页面标题**:  
    * font-size: 24px, color: var(--cartoon-dark)  
    * 下划线：4px solid var(--cartoon-secondary)

## **1.3 变更日志 (Change Log)**

| 日期 | 版本 | 描述 | 作者 |
| :---- | :---- | :---- | :---- |
| 2025-07-27 | 3.0 | 终稿修订：移除所有PDF页面引用，改用详细描述；强调动画脚本实现和磁吸交互效果；明确单页面多方案展示模式。 | Sally |
| 2025-07-27 | 2.0 | 架构对齐修订：基于Page_04页面代码和global.css实际样式，完全重写UI规格，确保与7年级模块视觉一致性。 | Sally |
| 2025-07-25 | 1.1 | 重大修订：根据用户提供的截图，将视觉风格基准从PDF更改为现有项目样式。 | Sally |