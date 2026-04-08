# g8-banana-browning-experiment 实施计划

## 1. 背景与目标

本文档用于固化 `g8-banana-browning-experiment` 的实施口径、页面映射、执行顺序、子 agent 分工与验收方式。

用途：

- 作为后续新会话恢复上下文的唯一执行入口
- 作为页面实施阶段的统一施工说明
- 作为 review/QA 的核对清单

当前状态：

- 标准子模块骨架已创建
- `src/submodules/g8-banana-browning-experiment/` 已接入 registry、mapping compliance test、build
- page-01 默认提示页已可运行
- page-02 ~ page-14 仍为占位页

目标：

- 将 `docs/g8-banana-browning-experiment/` 下的页面 MD 逐步落实为真实页面实现
- 所有页面通过标准子模块提交流程提交 `answerList` 与 `operationList`
- 最终通过 LSP / 测试 / build / 手动验证

---

## 2. 当前已确认口径

### 2.1 基础信息

- 子模块 ID：`g8-banana-browning-experiment`
- 显示名称：`8年级香蕉变黑科学探究`
- 任务时长：40 分钟
- 问卷时长：0

### 2.2 模型与 agent 口径

- 页面实现类任务：使用 `visual-engineering`
- `visual-engineering` 对应模型：**GLM-5.1**
- review / orchestration / QA：由当前 **GPT-5.4** 负责

### 2.3 页面业务口径

- page-02 / page-05 / page-08 为**纯信息展示页**
- 模拟实验交互逻辑：直接参考 **7 年级蒸馒头测评实验组件**
- 实验状态**不跨页保留**
- 温度统一使用：**2℃ / 10℃ / 18℃**
- **不做答案正确性判定**，只提交用户输入/选择
- page-09 / page-10 / page-11 的题干与选项已在 MD 中给出，可直接实现
- page-08 需要**过程动画**
- page-08 初始态为 **0%**
- page-12 参考 7 年级蒸馒头的方案选择页结构
- page-12 提交后**直接完成 flow**
- page-14 `task_completion` 继续保留在 mapping 中，但**当前实施口径下不作为真实流程终点**

### 2.4 实现默认值（非 blocker）

- page-08 重置按钮：默认回到 **0 天 + 0%**
- page-08 动画：默认“开始实验”后，根据当前天数播放一段黑变过程，再落到结果态
- page-12 暂按“仅校验是否填写完整，不做正确性校验”实现

---

## 3. 子模块页码映射（14页）

> 结构为：1 个默认提示页 + 13 个业务页

| 页码 | pageId                            | 标题                         | 说明                                    |
| ---- | --------------------------------- | ---------------------------- | --------------------------------------- |
| 01   | `intro_notice`                    | 注意事项                     | 默认提示页，已完成                      |
| 02   | `page_02_banana_browning`         | 香蕉变黑                     | 纯信息展示页                            |
| 03   | `banana_mystery`                  | 香蕉的奥秘                   | 对话 + 科学问题输入                     |
| 04   | `banana_browning_reading`         | 香蕉变黑：资料阅读           | 资料阅读 + 多选                         |
| 05   | `page_05_banana_browning`         | 香蕉变黑                     | 纯信息展示页                            |
| 06   | `banana_browning_design`          | 香蕉变黑：方案设计           | 三个文本输入                            |
| 07   | `banana_browning_evaluation`      | 香蕉变黑：方案评估           | 六个文本输入                            |
| 08   | `page_08_banana_browning`         | 香蕉变黑                     | 纯信息展示页（模拟前说明页）            |
| 09   | `banana_browning_simulation_main` | 香蕉变黑：模拟实验（主界面） | 主实验面板页                            |
| 10   | `simulation_question_1`           | 模拟实验 + 问题1             | 模拟器 + 单选                           |
| 11   | `simulation_question_2`           | 模拟实验 + 问题2             | 模拟器 + 单选                           |
| 12   | `simulation_question_3`           | 模拟实验 + 问题3             | 模拟器 + 单选                           |
| 13   | `solution_selection`              | 方案选择                     | 折线图 + 动态表格 + 理由                |
| 14   | `task_completion`                 | 任务完成                     | 保留在 mapping 中，但当前不作为真实终点 |

---

## 4. 页面实施分组

### Group A：共享契约层（必须先做，串行）

范围：

- `mapping.ts`
- `Component.tsx`
- 共享实验状态与校验逻辑
- 页面问题/答案映射

目标：

- 把 phase-1 空 mapping 补成可提交的正式契约
- 为后续页面实现建立统一 `answerList` 与 `validation` 基础

### Group B：信息展示页（可并行）

页面：

- page-02
- page-05
- page-08

### Group C：阅读/进入类页面（可并行）

页面：

- page-03
- page-04
- page-07

### Group D：方案构思类页面（可并行）

页面：

- page-06
- page-07（如果按业务重排可与上一组合并 review）

> 说明：当前 page-07 实际是过渡页；真正的设计/评估页面是 page-06 / page-07 映射中的业务页，即 `banana_browning_design` 与 `banana_browning_evaluation`。

### Group E：模拟实验共享底座（必须先做，串行）

范围：

- page-09 共用实验面板
- page-10/11/12 复用实验面板壳
- 过程动画、时间轴、开始实验、重置逻辑

### Group F：模拟题页面（可并行，但依赖 Group E）

页面：

- page-10
- page-11
- page-12（业务页，即 3 个分析题页中的第 1/2/3 题页面）

### Group G：方案选择与完成链路（最后做）

页面：

- page-13 `solution_selection`
- `task_completion` 仅保留，不进入真实终点流程

---

## 5. 每组实现目标与验收标准

### Group A 验收

- `PAGE_QUESTIONS`、`QUESTION_CODE_MAP`、`QUESTION_TEXT_MAP`、`ANSWER_KEY_TO_QUESTION`、`QUESTION_OPTIONS_MAP` 补齐
- `validatePage()` 覆盖真实页面校验
- `buildAnswerList()` 能产生非空、结构正确的 `answerList`
- LSP 0 error

### Group B 验收

- 3 个展示页完成真实 UI
- 无答案提交通道，仅提交操作日志/生命周期事件
- 页面与 MD 内容一致

### Group C 验收

- page-03 弹层、资料阅读、多选因素可用
- page-04 / page-07 内容与图片布局完成
- 校验规则正常工作

### Group D 验收

- `banana_browning_design` 的 3 个输入框可提交
- `banana_browning_evaluation` 的 6 个输入框可提交
- 校验阻断与提示文案正常

### Group E 验收

- page-09 模拟主界面可用
- 时间轴、开始实验、重置、6 组结果值、过程动画全部可用
- 初始态 0%
- 不跨页保留状态

### Group F 验收

- 3 个题页均可复用实验面板
- 每页题干/选项与 MD 一致
- 单选可提交，不判对错

### Group G 验收

- page-13 方案选择页可用
- 点击下一步后直接完成 flow
- 不再进入 `task_completion` 作为真实终点

---

## 6. 页面级实施说明

### page-01 `intro_notice`

- 已完成
- 不重复实现，仅保留现有提示页逻辑

### page-02 `page_02_banana_browning`

- 纯信息页
- 目标：还原 `docs/g8-banana-browning-experiment/page-01.md` 的内容和香蕉黑斑 SVG 背景视觉
- 不需要答案字段

### page-03 `banana_mystery`

- 参考：7 年级蒸馒头 `Page_03_Dialogue_Question`
- 内容来源：`docs/g8-banana-browning-experiment/page-02.md`
- 需要：
  - 对话区
  - 1 个文本输入框
  - 记录输入操作
  - 非空校验

### page-04 `banana_browning_reading`

- 参考：`Page_04_Material_Reading_Factor_Selection`
- 内容来源：`page-03.md` + `page-03-layer-01..05.md`
- 需要：
  - 5 个资料入口
  - 5 个弹层
  - 多选因素区
  - 至少选 1 项校验

### page-05 `page_05_banana_browning`

- 纯信息页
- 内容来源：`page-04.md`
- 目标：展示小明/妈妈对比信息，作为过渡页
- 不需要答案字段

### page-06 `banana_browning_design`

- 参考：`Page_11_Solution_Design_Measurement_Ideas`
- 内容来源：`page-05.md`
- 需要：
  - 3 个文本输入框
  - 统一答案键映射
  - 必填校验

### page-07 `banana_browning_evaluation`

- 参考：`Page_12_Solution_Evaluation_Measurement_Critique`
- 内容来源：`page-06.md`
- 需要：
  - 3 个方法卡片
  - 6 个文本输入框（优点/缺点）
  - 必填校验

### page-08 `page_08_banana_browning`

- 纯信息页
- 内容来源：`page-07.md`
- 作为模拟实验前的过渡说明页
- 不需要答案字段

### page-09 `banana_browning_simulation_main`

- 参考：7 年级蒸馒头实验组件 + `Page_14_Simulation_Intro_Exploration`
- 内容来源：`page-08.md` + `appendix-dev-notes.md`
- 关键口径：
  - 初始态 0%
  - 温度 2/10/18℃
  - 不跨页保留状态
  - 开始实验后播放过程动画
  - 重置回到 0%
- 需要：
  - 6 组条件显示
  - 时间轴（0/3/6/9/12/15）
  - 开始实验按钮
  - 重置按钮
  - 6 个结果值框
  - 香蕉黑变 SVG 动画

### page-10 `simulation_question_1`

- 内容来源：`page-09.md`
- 题干和选项已足够
- 需要：实验面板 + 单选题 1

### page-11 `simulation_question_2`

- 内容来源：`page-10.md`
- 题干和选项已足够
- 需要：实验面板 + 单选题 2

### page-12 `simulation_question_3`

- 内容来源：`page-11.md`
- 题干和选项已足够
- 需要：实验面板 + 单选题 3

### page-13 `solution_selection`

- 参考：`Page_18_Solution_Selection`
- 内容来源：`page-12.md` + `appendix-dev-notes.md`
- 需要：
  - 6 条线折线图
  - 动态表格（品种、温度）
  - 星标最优方案
  - 理由输入框
  - onNext 后直接完成 flow

### page-14 `task_completion`

- 当前保留在 mapping 中
- 不是当前真实完成链路的一部分
- 可保留占位，不纳入本轮正式用户流

---

## 7. 共享层修改清单

### 7.1 `mapping.ts`

需要补齐：

- 各页面 `PAGE_QUESTIONS`
- 问题 code / 文本 / 选项映射
- page-14 的非终点说明仅反映在计划，不必立刻删 mapping

### 7.2 `Component.tsx`

需要补齐：

- `validatePage()` 真实校验
- page-13 成功后直接 `flowContext.onComplete()`
- page-14 不作为真实终点的链路处理

### 7.3 Context / 共享实验状态

需要新增或补齐：

- 香蕉实验本页局部状态
- 时间轴当前值
- 开始实验状态
- 当前 6 组结果
- 重置逻辑

### 7.4 校验钩子

建议抽取：

- 文本输入页校验
- 多选页校验
- 模拟题单选页校验
- 方案选择页校验

---

## 8. 数据与提交契约补全清单

### 必须补进 mapping 的信息

1. page-03 科学问题文本题
2. page-04 多选因素题
3. page-06 3 个“想法”输入
4. page-07 6 个优缺点输入
5. page-10 / 11 / 12 的 3 个单选题
6. page-13 动态方案表、最优方案、理由

### answerList 设计原则

- 不判对错，只提交用户输入/选择
- 选择题保留完整选项文案
- 动态表格可仿照 7 年级蒸馒头页面用 JSON 字符串提交组合与最优方案

### operationList 关键事件

- 文本输入变化
- 多选勾选/取消
- 弹层打开/关闭
- 时间轴切换
- 开始实验
- 重置
- 单选点击
- 表格新增/删除/星标点击

---

## 9. 模型与 agent 使用策略

### 页面实现

- 使用 `visual-engineering`
- 已确认其底层模型为 **GLM-5.1**
- 适用任务：
  - 页面 UI 实现
  - 动画
  - 布局
  - 交互视觉还原

### Review / QA / orchestration

- 由当前 **GPT-5.4** 负责
- 适用任务：
  - 任务拆分
  - 契约检查
  - 提交结构校验
  - 测试与 build 验证
  - 最终质量门禁

### 推荐分工

- GLM-5.1：页面构建子 agent
- GPT-5.4：mapping / flow / validation / review / build 验证

---

## 10. 推荐执行顺序

### Phase 1：共享契约先行

1. 补齐 `mapping.ts`
2. 设计 answer schema
3. 更新 `Component.tsx` 校验与完成链路

### Phase 2：低风险页面并行

4. page-02
5. page-03
6. page-04
7. page-05
8. page-08

### Phase 3：文本输入页面并行

9. page-06
10. page-07

### Phase 4：模拟实验底座

11. page-09 共享实验面板与动画

### Phase 5：模拟题页面并行

12. page-10
13. page-11
14. page-12（业务题页，即第三个模拟题页）

### Phase 6：收尾页

15. page-13 `solution_selection`
16. 完成链路验证（不再走 page-14）

---

## 11. 验证与验收标准

### 静态检查

- `lsp_diagnostics`：改动文件 0 error

### 测试

- 相关页面/子模块测试
- `test:submission-format` 不回归
- 如新增 mapping 契约测试，必须覆盖 page-03 / page-06 / page-07 / page-10~13

### 构建

- `npm run build` 通过

### 手动交互检查

- page-03 弹层打开/关闭正常
- page-04 多选校验正常
- page-06 / page-07 输入校验正常
- page-09 时间轴、开始、重置、结果动画正常
- page-10~12 单选提交正常
- page-13 新增/删除/星标/理由输入正常
- page-13 提交后直接完成 flow

### 提交结构检查

- `answerList` 非空且字段合理
- `operationList` 含关键操作事件
- `pageDesc` 正常
- `flow_context` 注入正常

---

## 12. 新会话恢复方式

压缩上下文后，新的会话只需读取以下文件即可恢复执行：

1. `docs/g8-banana-browning-experiment/implementation-plan.md`
2. `docs/g8-banana-browning-experiment/appendix-dev-notes.md`
3. `docs/g8-banana-browning-experiment/page-02.md` ~ `page-13.md`
4. `src/submodules/g8-banana-browning-experiment/mapping.ts`

### 新会话启动提示词建议

```text
请进入实施模式，先阅读：
1. docs/g8-banana-browning-experiment/implementation-plan.md
2. docs/g8-banana-browning-experiment/appendix-dev-notes.md
3. docs/g8-banana-browning-experiment/page-02.md ~ page-13.md
4. src/submodules/g8-banana-browning-experiment/mapping.ts

按 implementation-plan.md 的 Phase 顺序推进。
页面实现类任务使用 visual-engineering（GLM-5.1），review / 契约 / QA 由当前 GPT-5.4 负责。
先做 Group A，再按推荐执行顺序推进。
```

### 进入实施阶段后的第一步

- 先补齐 `mapping.ts` 的问题/答案契约
- 再开始页面并行实现

---

## 13. 当前 plan-mode 的最终结论

当前已经满足进入实施阶段的条件。

阻塞项已全部转化为实现默认值或已确认口径：

- 温度已定
- 不判对错已定
- page-08 动画已定
- page-12 完成链路已定

下一步不再需要继续澄清需求，直接按本计划进入实施即可。
