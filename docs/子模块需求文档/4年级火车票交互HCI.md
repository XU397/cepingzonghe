# **HCI监测页面开发需求描述书 \- \[四年级数学\]火车购票0401**

**文档说明**：本与文档根据PDF文件《\[四年级数学\]火车购票0401》内容生成，严格遵循《页面内容输出规范》中的七种页面类型（Type-A至Type-G）进行分类描述。所有页面文字内容均原样保留。

**版本变更**：

* 已移除封面页。  
* 已重新编排页面序号，跳过中间的视觉状态页（原PDF P7-P11），保持编码连续。

## **页面列表**

### **Page 1**

* **页面名称**：注意事项  
* **页面类型**：Type-A (基础信息展示页)  
* **主要页面内容与交互**：  
  * **文本内容**：注意事项:  
    作答时间共40分钟,时间结束后,系统将自动退出答题界面。  
    请按顺序回答每页问题,上一页题目未完成作答,将无法点击进入下一页。  
    答题时,不要提前点击“下一页”查看后面的内容,否则将无法返回上一页。  
    遇到系统故障、死机、死循环等特殊情况时,请举手示意老师。  
  * **交互组件**：  
    * 复选框：\[ \] 我已阅读上述注意事项(40s)  
  * **逻辑**：必须勾选复选框后才能点击“下一页”。  
* **倒计时/限制**：  
  * **倒计时**：40秒（强制阅读时间，倒计时结束后复选框才可点击或自动勾选）。  
  * **全局限制**：作答时间共40分钟。

### **Page 2**

* **页面名称**：1 出行方案  
* **页面类型**：Type-A (基础信息展示页)  
* **主要页面内容与交互**：  
  * **图片/布局内容**：\[Image: 地图示意图\]  
  * **文本内容**：小明一家住在四川省南充市。暑假快来了,住在成都的舅舅邀请小明  
    一家到那里做客。请你帮小明一起规划出行方案吧\!  
    1 出行方案  
  * **交互**：点击“下一页”按钮。  
* **倒计时/限制**：无

### **Page 3**

* **页面名称**：2 出行方案
* **页面类型**：Type-B (单一文本输入页)
* **主要页面内容与交互**：
  * **左侧内容（聊天记录展示）**：
    * 标题：假期安排讨论群(4)
    * \[头像:舅舅\] 舅舅: @小明你什么时候放暑假呀?
    * \[头像:小明\] 小明: 舅舅,我7月8号放暑假\!
    * \[头像:舅舅\] 舅舅: 这个假期有时间来成都看大熊猫吗?
    * \[头像:小明\] 小明: 好呀,我有时间\!爸爸妈妈有时间陪我一起去吗?
    * \[头像:妈妈\] 妈妈: 没问题,我们可以选一个周末去,南充离成都不远。
    * \[头像:爸爸\] 爸爸: 7月27号怎么样?那天是周六,我们不用上班。
    * \[头像:小明\] 小明: 太好啦\!那我来负责买火车票吧。
    * \[头像:舅舅\] 舅舅: 记得到达站选择成都东站,那里交通方便。@小明
    * \[头像:妈妈\] 妈妈: 另外路上不要花太长时间,争取在18时30分前到成都东站。
  * **右侧内容（交互区）**：
    * **问题文本**：根据左侧对话,请写出小明接下来要解决什么问题?
    * **输入框**：\[Textarea: 请在此处输入你的回答。\]
* **倒计时/限制**：无

---

#### **Page 3 详细设计规格（AI编码工程师实现参考）**

> **设计依据**：
> - 对话框视觉与动画：`docs/对话框动画参考/四年级火车票对话.html`（**像素级复制**）
> - 数据轨迹收集模式：`src/pages/Page_03_Dialogue_Question.jsx`（g7-experiment子模块）
> - 页面布局结构：`src/pages/Page_03_Dialogue_Question.jsx`（左右分栏布局）

##### **1. 页面整体布局**

**外层容器**（参考 `Page_03_Dialogue_Question.jsx:207-220`）：
- 背景色：`#f0f8ff`（浅蓝色）+ 圆点装饰图案
- 布局方式：`flex` 水平排列，左右分栏
- 最大宽度：`1400px`（居中显示）
- 内边距：`20px`，左右间距：`gap: 20px`

##### **2. 左侧：手机模拟器对话展示**

**2.1 手机外壳尺寸与样式**（参考 `四年级火车票对话.html:52-104`）：
- **容器尺寸**：
  - `width: 45%`，`min-width: 400px`
  - `height: 680px`，`max-height: 680px`（固定高度）
- **外观样式**：
  - `border-radius: 3rem`（48px圆角，模拟手机外形）
  - `border: 8px solid #1f2937`（深灰色粗边框）
  - `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)`（深阴影）
  - `background-color: white`

**2.2 顶部刘海装饰**：
- 位置：`position: absolute; top: 0; left: 50%; transform: translateX(-50%)`
- 尺寸：`width: 160px; height: 24px`
- 样式：`background-color: #1f2937`，`border-bottom-left-radius: 12px`，`border-bottom-right-radius: 12px`
- `z-index: 20`（覆盖在导航栏上方）

**2.3 顶部导航栏**（参考 `四年级火车票对话.html:58-68`）：
- 背景色：`#3b82f6`（蓝色 blue-500）
- 内边距：`padding: 16px; padding-top: 32px`（为刘海留空间）
- 布局：左侧返回按钮 + 中间标题 + 右侧菜单按钮
- **标题样式**：
  - 字体：`font-family: 'ZCOOL KuaiLe', cursive`（卡通字体）
  - 大小：`font-size: 1.25rem`（20px）
  - 粗细：`font-weight: bold`
  - 字间距：`letter-spacing: 0.05em`
  - 文本：`假期安排讨论群 (4)`

**2.4 聊天内容区域**：
- 背景色：`#f8fafc`（slate-50，浅灰蓝）
- 内边距：`padding: 16px`
- 滚动：`overflow-y: auto`（自动滚动）
- **隐藏滚动条**（但保留滚动功能）：
  ```css
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  ```

**2.5 消息气泡**（参考 `四年级火车票对话.html:158-189`）：

**角色配置**：
| 角色ID | 名称 | 气泡颜色 | 文字颜色 | 位置 | 头像图片路径 |
|--------|------|----------|----------|------|--------------|
| uncle | 舅舅 | `#dbeafe` | `#1f2937` | left | `src/assets/images/jiujiuT.png` |
| ming | 小明 | `#fdba74` | `#111827` | right | `src/assets/images/xiaomingT.png` |
| mom | 妈妈 | `#dbeafe` | `#1f2937` | left | `src/assets/images/mamaT.png` |
| dad | 爸爸 | `#dbeafe` | `#1f2937` | left | `src/assets/images/babaT.png` |

**头像说明**：
- **舅舅**：绿色背景圆形PNG，卷发男性形象（jiujiuT.png）
- **爸爸**：橙色背景圆形PNG，戴眼镜男性形象（babaT.png）
- **小明**：蓝色背景圆形PNG，儿童男孩形象（xiaomingT.png）
- **妈妈**：粉色背景圆形PNG，长发女性形象（mamaT.png）
- **导入方式**：
  ```javascript
  import jiujiuAvatar from '@/assets/images/jiujiuT.png';
  import babaAvatar from '@/assets/images/babaT.png';
  import xiaomingAvatar from '@/assets/images/xiaomingT.png';
  import mamaAvatar from '@/assets/images/mamaT.png';
  ```

**气泡结构**：
```
消息容器 (display: flex, justify-content: left/right)
  ├─ 头像容器 (display: flex, flex-direction: column, align-items: center, gap: 4px)
  │   ├─ 头像图片（<img src={avatarImage} alt={角色名} />）
  │   │   - 容器尺寸：width: 48px; height: 48px
  │   │   - 图片样式：width: 100%; height: 100%; object-fit: cover
  │   │   - 圆形裁剪：border-radius: 50%
  │   │   - 白色边框：border: 2px solid white
  │   │   - 阴影效果：box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
  │   │   - hover效果：transform: scale(1.1); transition: transform 0.3s ease
  │   │   - 背景保护：background-color: white（防止PNG透明区域）
  │   └─ 角色名称
  │       - 字体大小：font-size: 0.75rem (12px)
  │       - 颜色：color: #6b7280 (gray-500)
  │       - 粗细：font-weight: 500
  └─ 气泡容器 (position: relative)
      ├─ 气泡主体 (padding: 12px 20px, border-radius: 16px)
      │   └─ 消息文本（支持HTML，如 @小明 蓝色加粗）
      └─ 气泡尖角 (16px × 16px, rotate 45deg, 绝对定位)
```

**头像容器完整样式**：
```css
.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-right: 12px;  /* 左侧消息 */
  /* margin-left: 12px;  右侧消息（小明） */
}

.avatar-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background-color: white;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.1);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.role-name {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}
```

**气泡尖角定位**：
- 左侧消息：`left: -8px; top: 16px`
- 右侧消息：`right: -8px; top: 16px`
- 背景色与气泡主体一致

**消息弹出动画**（参考 `四年级火车票对话.html:24-32`）：
```css
@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  80% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); }
}

.message-enter {
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
```

**2.6 "正在输入"指示器**（参考 `四年级火车票对话.html:75-81`）：
- 初始状态：`display: none`
- 显示时：三个跳动的圆点（8px × 8px，灰色）
- 动画延迟：`0s`, `0.2s`, `0.4s`
- 跳动动画：
  ```css
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
  }
  ```

**2.7 底部输入栏**（装饰用，不可交互）：
- 布局：笑脸图标 + 输入框占位符（"想说点什么..."）+ 发送按钮
- 背景：`background-color: white; border-top: 1px solid #e5e7eb`
- 内边距：`padding: 12px; gap: 8px`
- 输入框：`background-color: #f3f4f6; border-radius: 9999px; height: 40px`
- 发送按钮：`background-color: #3b82f6; border-radius: 9999px; width: 40px; height: 40px`

**2.8 重播按钮**：
- 位置：`position: absolute; bottom: 80px; right: 16px`
- 样式：
  - `background-color: rgba(255, 255, 255, 0.8)`
  - `backdrop-filter: blur(10px)`（毛玻璃效果）
  - `color: #2563eb`
  - `padding: 8px; border-radius: 9999px`
  - `border: 1px solid rgba(37, 99, 235, 0.1)`
- 图标：旋转箭头SVG
- hover效果：SVG旋转180度（`transition: transform 0.5s`）

##### **3. 自动播放逻辑**

**3.1 对话数据**（参考 `四年级火车票对话.html:141-151`）：

**导入头像资源**：
```javascript
// 导入四个角色的头像PNG
import jiujiuAvatar from '@/assets/images/jiujiuT.png';
import babaAvatar from '@/assets/images/babaT.png';
import xiaomingAvatar from '@/assets/images/xiaomingT.png';
import mamaAvatar from '@/assets/images/mamaT.png';
```

**角色配置对象**：
```javascript
const characters = {
  uncle: {
    name: '舅舅',
    avatar: jiujiuAvatar,
    color: '#dbeafe',      // 气泡背景色 (bg-blue-100)
    textColor: '#1f2937',  // 文字颜色 (text-gray-800)
    side: 'left'
  },
  ming: {
    name: '小明',
    avatar: xiaomingAvatar,
    color: '#fdba74',      // 气泡背景色 (bg-orange-300)
    textColor: '#111827',  // 文字颜色 (text-gray-900)
    side: 'right'
  },
  mom: {
    name: '妈妈',
    avatar: mamaAvatar,
    color: '#dbeafe',
    textColor: '#1f2937',
    side: 'left'
  },
  dad: {
    name: '爸爸',
    avatar: babaAvatar,
    color: '#dbeafe',
    textColor: '#1f2937',
    side: 'left'
  }
};
```

**对话消息数组**：
```javascript
const dialogueMessages = [
  { role: 'uncle', text: '<span style="color: #2563eb; font-weight: bold;">@小明</span> 你什么时候放暑假呀?' },
  { role: 'ming', text: '舅舅,我7月8号放暑假!' },
  { role: 'uncle', text: '这个假期有时间来成都看大熊猫吗?' },
  { role: 'ming', text: '好呀,我有时间!爸爸妈妈有时间陪我一起去吗?' },
  { role: 'mom', text: '没问题,我们可以选一个周末去,南充离成都不远。' },
  { role: 'dad', text: '7月27号怎么样?那天是周六,我们不用上班。' },
  { role: 'ming', text: '太好啦!那我来负责买火车票吧。' },
  { role: 'uncle', text: '记得到达站选择成都东站,那里交通方便。<span style="color: #2563eb; font-weight: bold;">@小明</span>' },
  { role: 'mom', text: '另外路上不要花太长时间,争取在18时30分前到成都东站。' }
];
```

**渲染消息气泡时的使用**：
```javascript
function createMessageElement(messageData) {
  const char = characters[messageData.role];
  const isRight = char.side === 'right';

  return (
    <div className={`message-wrapper ${isRight ? 'justify-end' : 'justify-start'}`}>
      {/* 头像容器 */}
      <div className={`avatar-container ${isRight ? 'order-2 ml-3' : 'mr-3'}`}>
        <div className="avatar-wrapper">
          <img
            src={char.avatar}
            alt={char.name}
            className="avatar-image"
          />
        </div>
        <span className="role-name">{char.name}</span>
      </div>

      {/* 气泡 */}
      <div className="bubble-container">
        <div
          className="bubble"
          style={{
            backgroundColor: char.color,
            color: char.textColor
          }}
          dangerouslySetInnerHTML={{ __html: messageData.text }}
        />
        <div className={`bubble-tail ${isRight ? 'right' : 'left'}`} style={{ backgroundColor: char.color }} />
      </div>
    </div>
  );
}
```

**3.2 播放时序参数**（参考 `四年级火车票对话.html:191-226`）：
- **页面加载延迟**：1000ms（页面加载完成1秒后开始播放第一条消息）
- **打字延迟计算**（模拟打字时间）：
  ```javascript
  const delay = Math.min(
    Math.max(message.text.length * 100, 1200),
    2500
  );
  ```
  - 最小延迟：1200ms
  - 最大延迟：2500ms
  - 计算公式：字符数 × 100ms
- **消息间隔**：500ms（每条消息显示后到下一条消息开始的间隔）

**3.3 播放流程**：
1. 显示"正在输入"指示器（`display: flex`）
2. 等待打字延迟时间
3. 隐藏"正在输入"指示器
4. 创建消息气泡元素并插入DOM（带 `message-enter` 动画类）
5. 平滑滚动到容器底部（`scrollTo({ behavior: 'smooth' })`）
6. 等待消息间隔（500ms）
7. 继续下一条消息

**3.4 重播功能**：
- 点击重播按钮：移除所有消息DOM节点
- 重置索引：`currentIndex = 0`
- 延迟500ms后重新开始播放

##### **4. 右侧：交互区域**

**4.1 容器布局**（参考 `Page_03_Dialogue_Question.jsx:263-279`）：
- `flex: 1`（自适应剩余宽度）
- `min-width: 400px`（最小宽度保护）
- `display: flex; flex-direction: column; justify-content: center`（垂直居中）

**4.2 交互卡片样式**：
- `width: 100%; padding: 30px`
- `background-color: rgba(255, 255, 255, 0.9)`（半透明白色）
- `border-radius: 20px`（大圆角）
- `box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25)`（蓝色阴影）
- `border: 3px solid rgba(59, 130, 246, 0.3)`（半透明蓝色边框）

**4.3 标题**：
- 文本：`火车购票`
- 样式：
  - `font-size: 1.8em; font-weight: bold`
  - `color: #3b82f6`
  - `text-align: center; margin-bottom: 20px`
  - `text-shadow: 2px 2px 4px rgba(59, 130, 246, 0.2)`
  - `letter-spacing: 2px`

**4.4 问题文本**（参考 `Page_03_Dialogue_Question.jsx:298-314`）：
- 文本：`根据左侧对话,请写出小明接下来要解决什么问题?`
- 样式：
  - `font-size: 1.1em; font-weight: 600; color: #374151`
  - `line-height: 1.6; padding: 12px`
  - `background-color: rgba(219, 234, 254, 0.5)`（淡蓝背景）
  - `border-radius: 10px`
  - `border-left: 4px solid #3b82f6`（左侧蓝色强调线）
  - `margin-bottom: 20px`

**4.5 文本输入框**（参考 `Page_03_Dialogue_Question.jsx:317-342`）：
```css
textarea {
  width: 100%;
  min-height: 100px;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  line-height: 1.6;
  background-color: rgba(239, 246, 255, 1);
  box-shadow: inset 0 2px 6px rgba(59, 130, 246, 0.15),
              0 2px 8px rgba(59, 130, 246, 0.2);
  border: 2px solid rgba(59, 130, 246, 0.4);
  resize: none;
  transition: all 0.3s ease;
}

textarea:focus {
  border-color: #3b82f6;
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

- 占位符：`请在此处输入你的回答...`
- 最大字数：200字符
- 行数：至少4行（`rows={4}`）

**4.6 导航按钮**：
- 文本：`下一页`
- 禁用条件：`userAnswer.trim() === ''`（输入为空时禁用）
- 禁用样式：
  - `opacity: 0.5`
  - `cursor: not-allowed`

##### **5. 数据轨迹收集**

**参考实现**：`src/pages/Page_03_Dialogue_Question.jsx`

**5.1 State 管理**：
```javascript
const [userAnswer, setUserAnswer] = useState('');
const pageLoadedRef = useRef(false);
const operationsRef = useRef([]);
const inputStateRef = useRef({ focused: false, lastValue: '' });
```

**5.2 必须记录的事件**：

**页面生命周期**：
- `page_enter`：进入页面（`useEffect` 初始化时记录）
- `page_exit`：离开页面（组件卸载时记录，如使用 `useEffect` 返回的清理函数）

**输入框事件**（参考 `Page_03_Dialogue_Question.jsx:73-120`）：
- `INPUT_FOCUS`：
  - 触发时机：`onFocus` 事件
  - targetElement: `'问题输入框'`
  - value: `'聚焦'`
- `INPUT_BLUR`：
  - 触发时机：`onBlur` 事件
  - targetElement: `'问题输入框'`
  - value: 当前输入内容
- `INPUT_CHANGE`：
  - 触发时机：`onChange` 事件
  - targetElement: `'问题输入框'`
  - value: `{ prev: 之前的值, next: 新值 }`
- `INPUT_DELETE`：
  - 触发时机：检测到字符数减少
  - targetElement: `'问题输入框'`
  - value: `{ action: 'delete', prevLength: 之前长度, nextLength: 新长度 }`

**对话容器事件**（参考 `Page_03_Dialogue_Question.jsx:125-142`）：
- `INPUT_FOCUS`：
  - 触发时机：鼠标进入对话容器（`onMouseEnter`）
  - targetElement: `'对话容器'`
  - value: `'对话框聚焦'`
- `INPUT_BLUR`：
  - 触发时机：鼠标离开对话容器（`onMouseLeave`）
  - targetElement: `'对话容器'`
  - value: `'对话框失焦'`

**消息气泡事件**（参考 `Page_03_Dialogue_Question.jsx:147-179`）：
- `CLICK`：
  - 触发时机：点击消息气泡
  - targetElement: `对话消息_${index}`（index从0开始）
  - value: `{ role: 角色名, messageIndex: 索引, messageText: 消息文本前50字 }`
- `INPUT_FOCUS`：
  - 触发时机：鼠标进入消息气泡（`onMouseEnter`）
  - targetElement: `对话消息_${index}`
  - value: `focus|role=${角色名}|idx=${索引}|text=${消息文本前50字}`
- `INPUT_BLUR`：
  - 触发时机：鼠标离开消息气泡（`onMouseLeave`）
  - targetElement: `对话消息_${index}`
  - value: `blur|role=${角色名}|idx=${索引}|text=${消息文本前50字}`

**导航事件**：
- `CLICK`：
  - 触发时机：点击"下一页"按钮
  - targetElement: `'next_button'`
  - value: `'提交答案'`

**5.3 操作记录函数模板**（参考 `Page_03_Dialogue_Question.jsx:45-53`）：
```javascript
const recordOperation = useCallback((operation) => {
  const normalizedOperation = {
    ...operation,
    time: formatTimestamp(new Date()), // 统一时间格式
  };
  logOperation(normalizedOperation);
  operationsRef.current = [...operationsRef.current, normalizedOperation];
}, [logOperation]);
```

**5.4 提交逻辑**（参考 `Page_03_Dialogue_Question.jsx:184-204`）：
```javascript
const handleNextPage = useCallback(async () => {
  // 1. 记录按钮点击
  recordOperation({
    eventType: EventTypes.CLICK,
    targetElement: 'next_button',
    value: '提交答案'
  });

  // 2. 收集答案
  const trimmedAnswer = userAnswer.trim();

  // 3. 提交数据
  const submissionSuccess = await submitPage({
    answers: trimmedAnswer ? [{
      targetElement: '问题输入框',
      value: trimmedAnswer
    }] : [],
    operations: operationsRef.current,
  });

  // 4. 根据提交结果决定导航
  if (submissionSuccess) {
    navigateToPage('NextPageId', { skipSubmit: true });
    return true;
  } else {
    alert('数据提交失败,请稍后再试。');
    return false;
  }
}, [navigateToPage, recordOperation, userAnswer, submitPage]);
```

##### **6. 组件封装建议**

**DialogueChat 组件接口**：
```typescript
interface DialogueChatProps {
  messages: Array<{
    role: 'uncle' | 'ming' | 'mom' | 'dad';
    text: string;  // 支持HTML标签
  }>;
  title: string;  // 对话组标题
  autoPlay?: boolean;  // 是否自动播放
  initialDelay?: number;  // 页面加载后延迟多久开始播放(ms)
  onContainerFocus?: () => void;  // 鼠标进入对话容器
  onContainerBlur?: () => void;  // 鼠标离开对话容器
  onMessageClick?: (message, index, roleName) => void;  // 点击消息
  onMessageFocus?: (message, index, roleName) => void;  // 鼠标进入消息
  onMessageBlur?: (message, index, roleName) => void;  // 鼠标离开消息
  style?: React.CSSProperties;
}
```

**使用示例**（参考 `Page_03_Dialogue_Question.jsx:244-260`）：
```jsx
<DialogueChat
  messages={dialogueMessages}
  title="假期安排讨论群 (4)"
  autoPlay={true}
  initialDelay={800}
  onContainerFocus={handleDialogueFocus}
  onContainerBlur={handleDialogueBlur}
  onMessageClick={handleMessageClick}
  onMessageFocus={handleMessageFocus}
  onMessageBlur={handleMessageBlur}
  style={{
    width: '100%',
    height: '100%',
    borderRadius: '30px'
  }}
/>
```

##### **7. 关键技术要点**

**7.1 字体加载**：
```html
<link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Noto+Sans+SC:wght@400;500;700&display=swap" rel="stylesheet">
```

**7.2 隐藏滚动条但保留滚动功能**：
```css
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

**7.3 文件编码**：
- **强制要求**：所有文件必须使用 UTF-8 编码（无 BOM）
- 确保中文字符（如"舅舅"、"小明"、"@小明"）正常显示

**7.4 响应式适配**：
- 最小宽度：`minWidth: '400px'`（左右两侧各400px）
- 总最小宽度：约 820px（400 + 400 + 20 gap）
- 最大内容宽度：`maxWidth: '1400px'`
- 固定手机容器高度：`680px`

##### **8. 验收清单**

**视觉还原**：
- [ ] 手机外框：圆角48px、边框8px深灰、阴影效果完全一致
- [ ] 刘海装饰：160px宽、24px高、居中定位正确
- [ ] 顶部导航栏：蓝色背景、卡通字体、按钮位置精确
- [ ] 消息气泡：颜色、圆角、尖角位置像素级匹配
- [ ] 头像：48px圆形、SVG内联、hover放大1.1倍
- [ ] 底部输入栏：笑脸+占位符+发送按钮样式完整
- [ ] 重播按钮：毛玻璃效果、旋转动画正确
- [ ] 背景：浅蓝色+圆点图案正确显示

**动画效果**：
- [ ] 消息弹出：popIn动画流畅，缓动函数正确
- [ ] 正在输入：三点跳动动画，延迟0s/0.2s/0.4s
- [ ] 重播按钮hover：SVG旋转180度，过渡0.5s
- [ ] 头像hover：放大到1.1倍，过渡0.3s
- [ ] 滚动行为：平滑滚动到底部

**交互功能**：
- [ ] 自动播放：页面加载1秒后开始
- [ ] 打字延迟：根据字数动态计算（1200-2500ms）
- [ ] 消息间隔：每条消息间隔500ms
- [ ] 重播功能：点击清空并重新播放
- [ ] 输入框：最大200字符，空值时按钮禁用
- [ ] 禁用样式：透明度0.5，鼠标禁用图标

**数据轨迹**：
- [ ] 页面进入/退出事件正确记录
- [ ] 输入框：聚焦/失焦/输入/删除事件完整
- [ ] 对话容器：鼠标进入/离开事件
- [ ] 消息气泡：点击/聚焦/失焦事件（含角色、索引、文本）
- [ ] 下一页按钮：点击事件
- [ ] 所有事件时间戳格式统一（`formatTimestamp`）

**兼容性**：
- [ ] 响应式布局：最小总宽度820px正常显示
- [ ] UTF-8编码：中文、标点、@符号无乱码
- [ ] 滚动条：隐藏但功能正常
- [ ] 浏览器兼容：Chrome/Edge/Firefox正常显示

---

### **Page 4**

* **页面名称**：3 火车购票  
* **页面类型**：Type-D (复杂交互选择页)  
* **主要页面内容与交互**：  
  * **文本内容**：3 火车购票  
    我要为爸爸妈妈和自己购买从南充到成都的火车票。从家出发到成都东站的总用时要尽量短,且要在18时30分前到达。  
    为解决上述问题,请问小明在购票时需要考虑以下哪些因素? 单击选择你认为正确的选项,再次单击可取消选择(可多选)。  
  * **交互组件（复选框组）**：  
    * \[ \] 小明家到出发站的路程  
    * \[ \] 火车车厢数  
    * \[ \] 成都东站到舅舅家的路程  
    * \[ \] 火车到达时间  
    * \[ \] 剩余车票数  
    * \[ \] 火车发展历史  
* **倒计时/限制**：无

### **Page 5**

* **页面名称**：4 火车购票:出发站 (交互页)  
* **页面类型**：Type-C (多文本输入页) \- *注：含地图交互*  
* **主要页面内容与交互**：  
  * **文本说明**：4 火车购票:出发站  
    买火车票首先要考虑出发站。小明家附近有2个火车站:南充站和南充北站。  
    小明家到这2个火车站共有5条路线。请依次点击左下图【路线】按钮,查看这5条路线,计算【路线1】和【路线5】的路程,并将结果填在右侧表格相应的空格内。  
  * **左侧交互（地图与路线展示）**：  
    * 显示地图：小明家、南充北站、南充站。  
    * 按钮组：\[路线1\], \[路线2\], \[路线3\], \[路线4\], \[路线5\]。  
    * **交互逻辑**（整合原PDF P6-P11所有状态）：  
      * 点击\[路线1\] \-\> 显示路径及分段距离：3.64km, 4.26km。  
      * 点击\[路线2\] \-\> 显示总距离：8.65 km。  
      * 点击\[路线3\] \-\> 显示总距离：10.2 km。  
      * 点击\[路线4\] \-\> 显示总距离：9.63 km。  
      * 点击\[路线5\] \-\> 显示路径及分段距离：2km, 2.4km, 2.3km, 1.49km。*(注: 原P11完整显示了路线5的最后一段1.49km，总和约为7.88km)*。  
  * **右侧内容（输入表格）**：  
    * 表格头：路线 | 路程  
    * 行1：路线1 | \[Input Box: \_\_\_\_\_\_ km\]  
    * 行2：路线2 | 8.65 km  
    * 行3：路线3 | 10.2 km  
    * 行4：路线4 | 9.63 km  
    * 行5：路线5 | \[Input Box: \_\_\_\_\_\_ km\]  
* **倒计时/限制**：无

### **Page 6**

* **页面名称**：5 火车购票:出发站 (结论页)  
* **页面类型**：Type-D (复杂交互选择页)  
* **主要页面内容与交互**：  
  * **文本内容**：5 火车购票:出发站  
    小明也正确算出了【路线1】和【路线5】的路程,右表是他的计算结果。你建议小明选择哪个车站作为出发站?  
  * **左侧展示（数据表）**：  
    * "出发站": 南充北站 | "路线": 路线1 | "路程": 7.9 km  
    * "出发站": 南充北站 | "路线": 路线2 | "路程": 8.65 km  
    * "出发站": 南充站 | "路线": 路线3 | "路程": 10.2 km  
    * "出发站": 南充站 | "路线": 路线4 | "路程": 9.63 km  
    * "出发站": 南充站 | "路线": 路线5 | "路程": 7.88 km  
  * **右侧交互**：  
    * **单选组件**：  
      * ( ) 南充北站  
      * ( ) 南充站  
    * **提示文本**：提示:可点击下方路线按钮,重新查看路线哦\! (复用Page 5的地图交互逻辑)  
    * **文本输入**：  
      * 标签：请简要说明理由:  
      * 输入框：\[Textarea: 请在此处输入你的回答。\]  
* **倒计时/限制**：无

### **Page 7**

* **页面名称**：6 火车购票:出发时间 (演示)
* **页面类型**：Type-F (SVG动画实验页)
* **主要页面内容与交互**：
  * **文本内容**：6 火车购票:出发时间
    小明还要思考从家出发的时间。起床后,他要完成以下5件事:①洗水壶(1分钟)②用水壶烧热水(10分钟)③灌水到保温杯(2分钟)④整理背包(2分钟)⑤吃早饭(6分钟),他该如何安排这些事情呢?
    【注】以下5个长方条分别代表上述①-⑤事件,其长度与事件所用时间对应,可依次选中5个长方条拖动至作答区域,完成方案设计。
    请点击 \[播放演示\] 按钮,查看操作动画。动画表示:小明将按①, ②, ⑤, ③顺序依次完成4件事,在完成②的同时完成④,方案总用时为19分钟。
  * **交互组件**：
    * **控制按钮区**：
      * **播放演示按钮**：蓝色渐变按钮，带播放图标，点击后播放完整的任务条拖动动画演示
      * **重置按钮**：白色边框按钮，带重置图标，点击后恢复初始状态
    * **SVG交互画布**（1000×450px）：
      * **待办任务区**（顶部区域，Y=50）：显示5个可拖动的任务条
        * ① 洗水壶 (蓝色 #2563EB, 宽40px, 1分钟)
        * ② 烧热水 (橙色 #EA580C, 宽400px, 10分钟)
        * ③ 灌水 (灰色 #6B7280, 宽80px, 2分钟)
        * ④ 整理背包 (绿色 #15803D, 宽80px, 2分钟)
        * ⑤ 吃早饭 (粉色 #DB2777, 宽240px, 6分钟)
      * **时间安排区**（中下部区域，Y=200-350）：虚线框标识的拖放目标区域
        * 包含两条水平时间轴（主轴和副轴），支持任务并行排列
        * 智能磁吸对齐功能：拖动任务条靠近时自动吸附对齐（支持4种对齐模式：左-左、左-右、右-右、右-左）
        * 吸附阈值：30px
      * **动画光标**：演示时显示模拟鼠标指针，支持"抓取"和"释放"两种状态的动画效果
    * **时间输入框区域**：
      * **标签**："方案总用时："
      * **输入框**：120px宽，居中对齐，蓝色边框高亮
      * **单位标签**："分钟"
      * **动画效果**：演示完成后，自动以打字效果逐字输入"19"
  * **演示动画流程**：
    1. 光标移动到任务条①
    2. 抓取任务条①，拖动到时间轴起点（X=50, 主轴）
    3. 光标移动到任务条②
    4. 抓取任务条②，拖动到①的右侧（X=90, 主轴）
    5. 光标移动到任务条④
    6. 抓取任务条④，拖动到②下方对齐位置（X=90, 副轴，与②同时进行）
    7. 光标移动到任务条⑤
    8. 抓取任务条⑤，拖动到②的右侧（X=490, 主轴）
    9. 光标移动到任务条③
    10. 抓取任务条③，拖动到⑤的右侧（X=730, 主轴）
    11. 光标消失，延迟500ms后在时间输入框中逐字显示"19"
  * **技术实现规范**：
    * **参考实现**：`docs/SVG动画参考/任务条拖动动画.html`（需像素级复刻）
    * **拖放交互**：使用 Pointer Events API（支持鼠标和触摸）
    * **动画缓动**：使用自定义缓动函数 `ease(t) = t < 0.5 ? 2*t*t : -1 + (4-2*t)*t`
    * **动画时长**：任务条移动800ms，光标移动500ms，输入延迟300ms/字符
    * **吸附算法**：计算拖动块与所有已放置块的边缘距离，取最小距离<30px的目标进行吸附
* **倒计时/限制**：无

### **Page 8**

* **页面名称**：7 火车购票:出发时间 (设计)
* **页面类型**：Type-F (SVG动画实验页)
* **主要页面内容与交互**：
  * **文本内容**：7 火车购票:出发时间
    请你拖动长方条,帮小明设计两种不同的事情安排方案吧。
    ①洗水壶(1分钟)②用水壶烧热水(10分钟)③灌水到保温杯(2分钟)④整理背包(2分钟) ⑤吃早饭(6分钟)
  * **交互组件**：
    * **工具栏区域**（顶部，Y=50-100）：
      * 显示5个任务条模板（作为拖动源）
        * ① 洗水壶 (蓝色 #2563EB, 宽40px, 1分钟)
        * ② 烧热水 (橙色 #EA580C, 宽400px, 10分钟)
        * ③ 灌水 (灰色 #6B7280, 宽80px, 2分钟)
        * ④ 整理背包 (绿色 #15803D, 宽80px, 2分钟)
        * ⑤ 吃早饭 (粉色 #DB2777, 宽240px, 6分钟)
      * 每个任务条可无限次拖出（克隆机制）
      * 水平排列，间距20px
    * **方案一区域**（中上部，Y=150-350）：
      * **标题**："方案一："（左上角）
      * **拖放容器**：虚线框标识的SVG区域（800×180px）
        * 包含两条水平时间轴（主轴和副轴），支持任务并行排列
        * 继承Page 7的智能磁吸对齐功能（4种对齐模式，30px阈值）
        * 起点标记：时间轴左侧标记"0"
      * **清空按钮**：方案区域右上角的小型按钮，点击清空该方案的所有任务条
      * **时间输入区域**：
        * 标签："总用时："
        * 输入框：80px宽，用户手动输入，右对齐数字
        * 单位："分钟"
    * **方案二区域**（中下部，Y=380-580）：
      * **标题**："方案二："（左上角）
      * **拖放容器**：与方案一相同的结构和规格
      * **清空按钮**：独立控制方案二
      * **时间输入区域**：与方案一相同的结构
    * **全局按钮区**（底部）：
      * **重置全部按钮**：清空两个方案的所有内容
      * **下一步按钮**：提交两个方案（由框架提供）
  * **交互行为**：
    * **拖动克隆**：
      1. 从工具栏拖动任务条时，创建新副本（原模板保持不动）
      2. 副本跟随鼠标移动
      3. 释放到方案区域内时，副本被添加到该方案
      4. 释放到方案区域外时，副本消失（取消操作）
    * **方案内拖动**：
      1. 已放置的任务条可以在方案内重新拖动调整位置
      2. 支持跨方案拖动（从方案一拖到方案二，会移除原方案中的任务）
      3. 拖出方案区域外时，任务条被删除
    * **磁吸对齐**：
      * 与Page 7相同的对齐算法
      * 每个方案区域独立计算对齐目标
      * 吸附到时间轴起点、其他任务条的4种边缘对齐
    * **任务条操作**：
      * 单击已放置的任务条：高亮选中（蓝色边框）
      * 双击已放置的任务条：删除该任务
      * 拖动时显示半透明预览
  * **验证规则**：
    * 两个方案都必须完成（都有任务条布局）
    * 两个方案的总用时都必须填写（用户手动输入）
    * 输入框只接受正整数（1-999分钟）
    * 两个方案的任务条布局不能完全相同（需要不同排列）
  * **技术实现规范**：
    * **共享组件复用**（来自Page 7）：
      * `TaskBlock.jsx` - 任务条纯展示组件
      * `DraggableTask.jsx` - 任务条拖放逻辑（Pointer Events API）
      * `AlignmentUtils.js` - 智能对齐算法（4种模式）
      * `TimelineDropZone.jsx` - 时间轴拖放区域组件
    * **新增组件**：
      * `TaskToolbar.jsx` - 工具栏（提供克隆源）
      * `SolutionZone.jsx` - 单个方案容器（可复用2次）
      * `DualSolutionDesigner.jsx` - 双方案布局管理器
    * **状态管理**：
      ```javascript
      {
        solution1: {
          tasks: [{ id, cloneId, x, y, width, color, label }, ...],
          userInputTime: ""  // 用户手动输入的时间
        },
        solution2: {
          tasks: [...],
          userInputTime: ""
        }
      }
      ```
    * **克隆机制**：每次从工具栏拖出生成唯一cloneId（如 `task2_clone_1`）
    * **拖放逻辑**：继承Page 7的指针事件处理，扩展跨区域拖动支持
  * **数据提交格式**：
    * **operationList** 应包含：
      * 每次拖动操作：`{ targetElement: "P1.08_方案一_任务条②", eventType: "drag_place", value: "{x:90,y:200}" }`
      * 输入时间：`{ targetElement: "P1.08_方案一_总用时", eventType: "input", value: "19" }`
    * **answerList** 应包含：
      * 方案一布局：`{ code: 1, targetElement: "方案一设计", value: "[{task:①,x:50,y:200},{task:②,x:90,y:200}...]" }`
      * 方案一总用时：`{ code: 2, targetElement: "方案一总用时", value: "19" }`
      * 方案二布局：`{ code: 3, targetElement: "方案二设计", value: "[...]" }`
      * 方案二总用时：`{ code: 4, targetElement: "方案二总用时", value: "21" }`
* **倒计时/限制**：无

### **Page 9**

* **页面名称**：8 火车购票:出发时间 (判断)  
* **页面类型**：Type-E (实验+选择题混合页)  
* **主要页面内容与交互**：  
  * **文本内容**：8 火车购票:出发时间  
    如下图,小明也提出了一种安排方案。  
  * **展示区域**：  
    * 显示小明的方案图（甘特图）：① \-\> ②(并行④) \-\> ③ \-\> ⑤。  
    * 总用时: 15 分钟  
    * 图例说明。  
  * **交互组件**：  
    * **问题**：请问小明的方案是否是用时最短的方案?  
    * **单选**：  
      * ( ) 是  
      * ( ) 否  
* **倒计时/限制**：无

### **Page 10**

* **页面名称**：8 火车购票:出发时间 (改进)  
* **页面类型**：Type-F (SVG动画实验页)  
* **主要页面内容与交互**：  
  * **文本内容**：8 火车购票:出发时间  
    如下图,小明也提出了一种安排方案。  
    请拖动长方条,画出你的改进方案。  
  * **展示区域**：同上页的小明方案图。  
  * **交互区域**：  
    * **工具栏**：可拖拽的①-⑤长方条。  
    * **作答区**：  
      * \[容器：请将长方条拖动至此方框内。\]  
      * 总用时: \[Input: \_\_\_\_\_\_\] 分钟  
* **倒计时/限制**：无

### **Page 11**

* **页面名称**：9 火车购票:车票选择  
* **页面类型**：Type-D (复杂交互选择页)  
* **主要页面内容与交互**：  
  * **文本内容**：9 火车购票:车票选择  
    小明最终决定选择出发时间在11时后、乘车时长在2小时内的火车。以下是可供选择的5辆列车信息。  
    此外,妈妈提醒小明买车票还要考虑:  
    1、3张车票为同一车次;  
    2、到达时间在18时30分前。  
    请从上面的列车表中选出符合妈妈需求的车次(可多选),单击点亮车次前的 \[图标\],再次单击可取消选择。  
  * **交互组件（表格选择）**：  
    * **表格数据行**（支持点击行首图标进行多选）：  
      1. \[ \] C769 | 11:15 (12:58) | 1小时43分 | 96元(2张) | 60元(无)  
      2. \[ \] D175 | 12:36 (14:06) | 1小时30分 | 148元(5张) | 112元(1张)  
      3. \[ \] C751 | 14:38 (16:25) | 1小时47分 | 96元(3张) | 60元(6张)  
      4. \[ \] C757 | 16:36 (18:13) | 1小时37分 | 96元(1张) | 60元(1张)  
      5. \[ \] D163 | 18:16 (19:50) | 1小时34分 | 148元(12张) | 112元(8张)  
* **倒计时/限制**：无

### **Page 12**

* **页面名称**：10 火车购票:车票选择 (计算)  
* **页面类型**：Type-E (实验+选择题混合页)  
* **主要页面内容与交互**：  
  * **文本内容**：10 火车购票:车票选择  
    以下是符合小明和妈妈要求的列车信息。  
    根据表格信息,为小明推荐一个你认为合适的车次,点亮车次前的\[图标\],并在方框内说明理由。  
    选好方案后,请计算三人总票价。爸爸妈妈为全价成人票,小明为半价儿童票。请利用右侧键盘输入数字和运算符号,在方框内列出计算过程(按\[Enter\]可换行),并自行计算结果。  
  * **左侧交互**：  
    * **表格**：展示筛选后的车次（D175, C751）。  
    * **单选**：推荐一个车次。  
    * **输入**：\[Textarea: 请在此处输入你的回答。\]  
  * **右侧交互（计算器）**：  
    * **计算过程输入框**：\[Textarea: 请在此处输入你的回答。\]  
    * **虚拟键盘**：\[0-9\], \[+\], \[-\], \[x\], \[÷\], \[=\], \[Enter\]  
    * **结果输入**：总票价: \[Input: \_\_\_\_\_\_\] 元  
* **倒计时/限制**：无

### **Page 13**

* **页面名称**：11 火车购票 (结束页)  
* **页面类型**：Type-A (基础信息展示页)  
* **主要页面内容与交互**：  
  * **文本内容**：11 火车购票  
    感谢你帮助小明完成了火车票购买,预祝小明一家在成都度过一个美好假期\!  
    请点击“完成”按钮进行提交。  
  * **交互**：\[按钮: 完成\]  
* **倒计时/限制**：无