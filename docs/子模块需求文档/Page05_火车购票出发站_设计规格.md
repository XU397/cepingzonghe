# Page 5: 火车购票-出发站（交互页）设计规格书

**版本**: v1.0
**创建日期**: 2025-12-16
**页面类型**: Type-C (多文本输入页) - 含地图交互
**参考实现**: `docs/SVG动画参考/火车路线交互动画.html` (像素级复刻)

---

## 一、页面概览

### 1.1 功能描述
用户通过交互式地图查看5条从小明家到车站的路线，点击按钮切换路线显示，计算路���1和路线5的总路程并填入右侧表格。

### 1.2 教育目标
- 培养空间认知能力和路径规划能力
- 练习加法运算（分段距离相加）
- 学习地图信息提取和数据整理

### 1.3 成功标准
- [ ] 地图交互流畅（路线切换 < 500ms）
- [ ] 动画效果符合参考（颜色过渡、小火车移动）
- [ ] 输入验证正确（仅数字、合理范围）
- [ ] 数据轨迹完整（所有交互事件记录）

---

## 二、整体布局设计

### 2.1 页面结构
```
┌─────────────────────────────────────────────────────────┐
│                   页面标题区域                          │
│         "4 火车购票:出发站"                             │
│                 说明文字                                 │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   左侧：地图交互区   │    右侧：输入表格区              │
│                      │                                  │
│   - 路线按钮（5个）  │    - 路线距离表格                │
│   - 地图画布          │    - 输入框（2个）               │
│   - 动画火车          │                                  │
│                      │                                  │
├──────────────────────┴──────────────────────────────────┤
│                   导航按钮区域                          │
│                   [下一页]                              │
└─────────────────────────────────────────────────────────┘
```

### 2.2 尺寸与间距
- **容器最大宽度**: `1200px`（全局约束）
- **左右分栏比例**: `55% : 45%`（地图 : 表格）
- **最小宽度**: 左侧 `500px`，右侧 `400px`
- **内边距**: 外层 `30px`，左右间隙 `40px`
- **响应式断点**:
  - `≥1200px`: 左右分栏
  - `<1200px`: 垂直堆叠（地图在上，表格在下）

### 2.3 颜色系统（统一使用 CSS 变量）
```css
/* 主色调 */
--cartoon-primary: #59c1ff;      /* 主要按钮、强调元素 */
--cartoon-secondary: #ffce6b;    /* 次要按钮、提示信息 */
--cartoon-border: #ffd99e;       /* 卡片边框、分割线 */

/* 功能色 */
--cartoon-green: #67d5b5;        /* 完成状态、正确提示 */
--cartoon-red: #ff8a80;          /* 错误提示、警告信息 */

/* 文本与背景 */
--text-color: #333333;           /* 正文段落 */
--text-secondary: #666666;       /* 说明文字 */
--background-color: #f5f5f5;     /* 内容区背景 */
--card-background: #ffffff;      /* 卡片背景 */
--cartoon-shadow: rgba(0,0,0,0.1); /* 阴影 */

/* 路线专用色（参考实现） */
--route-1-color: #F59E0B;        /* 橙色 */
--route-2-color: #10B981;        /* 绿色 */
--route-3-color: #3B82F6;        /* 蓝色 */
--route-4-color: #8B5CF6;        /* 紫色 */
--route-5-color: #EC4899;        /* 粉色 */
--route-inactive: #E2E8F0;       /* 未激活路线（灰色）*/
--route-inactive-text: #64748B;  /* 未激活按钮文字 */
```

---

## 三、左侧地图交互区

### 3.1 地图容器规格
```css
.map-container {
  width: 100%;
  aspect-ratio: 16 / 9;           /* 宽高比固定 */
  background-color: #ffffff;      /* 白色背景 */
  border-radius: 24px;            /* 圆角 */
  border: 3px solid var(--cartoon-border);
  box-shadow: 0 10px 30px var(--cartoon-shadow);
  position: relative;
  overflow: hidden;
}

/* 背景网格装饰 */
.map-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.3;
  background-image: radial-gradient(#CBD5E1 1px, transparent 1px);
  background-size: 30px 30px;
}
```

### 3.2 路线切换按钮组
**位置**: 左侧，垂直居中偏下（`top: 65%`）
**布局**: 垂直排列，间距 `12px`

```jsx
// 按钮状态样式
const buttonStyles = {
  base: {
    position: 'relative',
    paddingLeft: '48px',    // 为序号圈留空间
    paddingRight: '24px',
    paddingTop: '12px',
    paddingBottom: '12px',
    borderRadius: '16px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: 'none',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },

  // 激活状态
  active: (routeColor) => ({
    backgroundColor: routeColor,
    color: '#ffffff',
    transform: 'scale(1)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  }),

  // 未激活状态
  inactive: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
    transform: 'scale(0.95)'
  },

  // hover效果
  hover: {
    transform: 'scale(1.05)',
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)'
  }
};

// 序号圈圈样式
const badgeStyles = {
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: '900'
};
```

**交互行为**:
1. 点击按钮 → 切换激活路线 → 触发地图更新
2. 激活按钮: 对应路线颜色背景 + 白色文字 + 放大1倍
3. 未激活按钮: 浅灰背景 + 深灰文字 + 缩小0.95倍
4. hover效果: 放大1.05倍 + 阴影增强

### 3.3 站点数据定义
```javascript
const stations = [
  // 左上角区域（南充北站）
  {
    id: 'nanchong_north',
    name: '南充北站',
    x: 10,    // 相对位置百分比
    y: 15,
    isCore: true,         // 核心站点（显示标签和图标）
    icon: 'MapPin'        // lucide-react 图标
  },
  { id: 'nn_a', name: '北郊站A', x: 30, y: 20, isCore: false },
  { id: 'nn_b', name: '北郊站B', x: 20, y: 40, isCore: false },

  // 核心区域（小明家）
  {
    id: 'xiaoming',
    name: '小明家',
    x: 50,
    y: 50,
    isCore: true,
    icon: 'Home'
  },

  // 右下角区域（南充站）
  {
    id: 'nanchong',
    name: '南充站',
    x: 90,
    y: 85,
    isCore: true,
    icon: 'MapPin'
  },
  { id: 'n1', name: '枢纽东', x: 80, y: 75, isCore: false },
  { id: 'n2a', name: '东路站1', x: 75, y: 55, isCore: false },
  { id: 'n3a', name: '东路站2', x: 62, y: 45, isCore: false },
  { id: 'n2b', name: '南路站1', x: 68, y: 80, isCore: false },
  { id: 'n3b', name: '南路站2', x: 55, y: 70, isCore: false }
];
```

### 3.4 站点渲染规格
**核心站点（3个）**:
```css
.core-station {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #ffffff;
  border: 4px solid;                    /* 边框颜色动态变化 */
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease;
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.core-station.active {
  border-color: var(--route-color);      /* 当前路线颜色 */
  transform: translate(-50%, -50%) scale(1.1);
}

.core-station.inactive {
  border-color: #CBD5E1;                 /* 灰色 */
  transform: translate(-50%, -50%) scale(1);
}

/* 图标样式 */
.station-icon {
  width: 18px;
  height: 18px;
  color: #475569;
}

/* 站点名称标签 */
.station-label {
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: bold;
  background-color: #ffffff;
  border: 2px solid;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.5s ease;
  white-space: nowrap;
}

.station-label.active {
  border-color: var(--route-color);
  color: var(--text-color);
  transform: scale(1.05);
}

.station-label.inactive {
  border-color: #E2E8F0;
  color: #94A3B8;
  transform: scale(1);
}
```

**普通站点（7个）**:
```css
.normal-station {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: transparent;         /* 未激活时透明 */
  border: 4px solid #CBD5E1;
  transition: all 0.5s ease;
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.normal-station.active {
  background-color: var(--route-color);  /* 激活时填充路线颜色 */
  border-color: var(--route-color);
  box-shadow: 0 0 0 4px rgba(var(--route-color-rgb), 0.2);
}
```

### 3.5 路线数据定义
```javascript
const routes = {
  1: {
    id: 1,
    name: '线路 1',
    color: '#F59E0B',      // 橙色
    path: ['nanchong_north', 'nn_a', 'xiaoming'],
    distances: [4.26, 3.64],
    totalDistance: 7.9     // km
  },
  2: {
    id: 2,
    name: '线路 2',
    color: '#10B981',      // 绿色
    path: ['nanchong_north', 'nn_b', 'xiaoming'],
    distances: [3.33, 5.32],
    totalDistance: 8.65
  },
  3: {
    id: 3,
    name: '线路 3',
    color: '#3B82F6',      // 蓝色
    path: ['nanchong', 'n1', 'n2a', 'n3a', 'xiaoming'],
    distances: [2.3, 2.4, 3.0, 2.5],
    totalDistance: 10.2
  },
  4: {
    id: 4,
    name: '线路 4',
    color: '#8B5CF6',      // 紫色
    path: ['nanchong', 'n1', 'n2a', 'n3b', 'xiaoming'],
    distances: [2.3, 2.4, 2.93, 2.0],
    totalDistance: 9.63
  },
  5: {
    id: 5,
    name: '线路 5',
    color: '#EC4899',      // 粉色
    path: ['nanchong', 'n1', 'n2b', 'n3b', 'xiaoming'],
    distances: [2.3, 1.49, 2.09, 2.0],
    totalDistance: 7.88
  }
};

// 物理连接线（基础底图，所有可能的连接）
const baseLines = [
  { from: 'nanchong_north', to: 'nn_a' },
  { from: 'nn_a', to: 'xiaoming' },
  { from: 'nanchong_north', to: 'nn_b' },
  { from: 'nn_b', to: 'xiaoming' },
  { from: 'nanchong', to: 'n1' },
  { from: 'n1', to: 'n2a' },
  { from: 'n1', to: 'n2b' },
  { from: 'n2a', to: 'n3a' },
  { from: 'n3a', to: 'xiaoming' },
  { from: 'n2b', to: 'n3b' },
  { from: 'n3b', to: 'xiaoming' },
  { from: 'n2a', to: 'n3b' }  // 跨线连接
];
```

### 3.6 轨道线渲染
**技术方案**: SVG `<line>` 元素
**关键逻辑**: 判断每条物理连接线是否属于当前激活路线

```jsx
// 判断逻辑
const isLineActive = (fromId, toId, currentPath) => {
  for (let i = 0; i < currentPath.length - 1; i++) {
    if (
      (currentPath[i] === fromId && currentPath[i + 1] === toId) ||
      (currentPath[i] === toId && currentPath[i + 1] === fromId)
    ) {
      return true;
    }
  }
  return false;
};

// SVG渲染
<svg className="absolute inset-0 w-full h-full pointer-events-none">
  {baseLines.map((line, idx) => {
    const start = getStationPos(line.from);
    const end = getStationPos(line.to);
    const active = isLineActive(line.from, line.to, currentRoute.path);

    return (
      <g key={`line-${idx}`}>
        {/* 底部光晕（仅激活线显示）*/}
        {active && (
          <line
            x1={`${start.x}%`}
            y1={`${start.y}%`}
            x2={`${end.x}%`}
            y2={`${end.y}%`}
            stroke={currentRoute.color}
            strokeWidth="16"
            strokeLinecap="round"
            className="opacity-30 blur-sm transition-all duration-500"
          />
        )}

        {/* 实体轨道 */}
        <line
          x1={`${start.x}%`}
          y1={`${start.y}%`}
          x2={`${end.x}%`}
          y2={`${end.y}%`}
          stroke={active ? currentRoute.color : '#E2E8F0'}
          strokeWidth="12"
          strokeLinecap="round"
          className="transition-colors duration-500 ease-in-out"
        />
      </g>
    );
  })}
</svg>
```

**样式规格**:
- 激活线: 路线专用颜色 + 12px宽 + 底部16px光晕（30%透明度 + 模糊）
- 未激活线: `#E2E8F0`灰色 + 12px宽
- 过渡动画: `transition: all 0.5s ease`

### 3.7 距离标签渲染
**显示规则**: 仅在激活路线的分段上显示
**位置计算**: 每段的中点

```jsx
const renderDistanceLabels = (currentRoute) => {
  if (!currentRoute) return null;

  return currentRoute.path.slice(0, -1).map((startId, i) => {
    const endId = currentRoute.path[i + 1];
    const startPos = getStationPos(startId);
    const endPos = getStationPos(endId);
    const distance = currentRoute.distances[i];

    const midX = (startPos.x + endPos.x) / 2;
    const midY = (startPos.y + endPos.y) / 2;

    return (
      <div
        key={`dist-${i}`}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        style={{ left: `${midX}%`, top: `${midY}%` }}
      >
        <div
          className="px-2 py-1 rounded-full text-xs font-bold shadow-md border-2 bg-white transition-colors duration-500"
          style={{
            color: currentRoute.color,
            borderColor: currentRoute.color
          }}
        >
          {distance}km
        </div>
      </div>
    );
  });
};
```

**样式规格**:
```css
.distance-label {
  padding: 4px 8px;
  border-radius: 9999px;        /* 全圆角 */
  font-size: 12px;
  font-weight: bold;
  background-color: #ffffff;
  border: 2px solid;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.5s ease;
  white-space: nowrap;
}
```

### 3.8 小火车动画
**技术方案**: CSS动画 + React状态更新

```javascript
// 状态管理
const [trainProgress, setTrainProgress] = useState(0);  // 0-100

// 动画循环（每20ms更新一次）
useEffect(() => {
  const interval = setInterval(() => {
    setTrainProgress(prev => {
      if (prev >= 100) return 0;    // 循环重置
      return prev + 0.3;             // 每次增加0.3%
    });
  }, 20);

  return () => clearInterval(interval);
}, []);

// 路线切换时重置进度
useEffect(() => {
  setTrainProgress(0);
}, [activeLineId]);

// 位置计算（多段线性插值）
const getTrainPosition = (progress, pathPoints) => {
  if (pathPoints.length < 2) return pathPoints[0] || { x: 0, y: 0 };

  const totalSegments = pathPoints.length - 1;
  const segmentSize = 100 / totalSegments;
  const currentSegmentIndex = Math.min(
    Math.floor(progress / segmentSize),
    totalSegments - 1
  );
  const segmentPercent = (progress - currentSegmentIndex * segmentSize) / segmentSize;

  const p1 = pathPoints[currentSegmentIndex];
  const p2 = pathPoints[currentSegmentIndex + 1];

  return {
    x: p1.x + (p2.x - p1.x) * segmentPercent,
    y: p1.y + (p2.y - p1.y) * segmentPercent
  };
};
```

**渲染结构**:
```jsx
<div
  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none transition-all duration-75 ease-linear"
  style={{ left: `${trainPos.x}%`, top: `${trainPos.y}%` }}
>
  <div className="relative">
    {/* 火车主体 */}
    <div
      className="p-2 rounded-full shadow-xl border-4 border-white transition-colors duration-500"
      style={{ backgroundColor: currentRoute.color }}
    >
      <Train size={24} className="text-white" />
    </div>

    {/* 气泡文字 */}
    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-md whitespace-nowrap">
      出发啦!
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
    </div>
  </div>
</div>
```

**性能优化**:
- 使用 `useMemo` 缓存路径点计算
- 动画过渡使用 `transition: all 75ms linear`（更平滑）
- 火车元素设置 `pointer-events: none`（避免干扰其他交互）

---

## 四、右侧输入表格区

### 4.1 容器布局
```css
.input-table-container {
  width: 100%;
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  border: 3px solid var(--cartoon-border);
  box-shadow: 0 8px 24px var(--cartoon-shadow);
}
```

### 4.2 标题区域
```jsx
<div className="text-section">
  <h2 className="page-subtitle">
    4 火车购票:出发站
  </h2>
  <p className="instruction-text">
    买火车票首先要考虑出发站。小明家附近有2个火车站:南充站和南充北站。
    <br />
    小明家到这2个火车站共有5条路线。请依次点击左下图【路线】按钮,查看这5条路线,计算【路线1】和【路线5】的路程,并将结果填在右侧表格相应的空格内。
  </p>
</div>
```

**样式规格**:
```css
.page-subtitle {
  font-size: 22px;
  font-weight: bold;
  color: var(--cartoon-primary);
  margin-bottom: 16px;
  text-align: center;
}

.instruction-text {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-color);
  margin-bottom: 24px;
  padding: 16px;
  background-color: rgba(89, 193, 255, 0.08);
  border-left: 4px solid var(--cartoon-primary);
  border-radius: 8px;
}
```

### 4.3 数据表格
**结构**:
```jsx
<table className="route-distance-table">
  <thead>
    <tr>
      <th>路线</th>
      <th>路程</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>路线1</td>
      <td>
        <input
          type="text"
          placeholder="请输入"
          value={route1Input}
          onChange={handleRoute1Change}
          className="distance-input"
          maxLength={6}
        />
        <span className="unit-label">km</span>
      </td>
    </tr>
    <tr>
      <td>路线2</td>
      <td className="fixed-distance">8.65 km</td>
    </tr>
    <tr>
      <td>路线3</td>
      <td className="fixed-distance">10.2 km</td>
    </tr>
    <tr>
      <td>路线4</td>
      <td className="fixed-distance">9.63 km</td>
    </tr>
    <tr>
      <td>路线5</td>
      <td>
        <input
          type="text"
          placeholder="请输入"
          value={route5Input}
          onChange={handleRoute5Change}
          className="distance-input"
          maxLength={6}
        />
        <span className="unit-label">km</span>
      </td>
    </tr>
  </tbody>
</table>
```

**样式规格**:
```css
.route-distance-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 2px solid var(--cartoon-border);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 24px;
}

.route-distance-table thead {
  background-color: var(--cartoon-primary);
  color: #ffffff;
}

.route-distance-table th {
  padding: 12px 16px;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  border-bottom: 2px solid var(--cartoon-border);
}

.route-distance-table tbody tr {
  background-color: #ffffff;
  transition: background-color 0.2s ease;
}

.route-distance-table tbody tr:hover {
  background-color: rgba(89, 193, 255, 0.05);
}

.route-distance-table tbody tr:not(:last-child) td {
  border-bottom: 1px solid var(--cartoon-border);
}

.route-distance-table td {
  padding: 14px 16px;
  font-size: 15px;
  text-align: center;
}

/* 输入框样式 */
.distance-input {
  width: 80px;
  padding: 8px 12px;
  border: 2px solid var(--cartoon-border);
  border-radius: 8px;
  font-size: 15px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: rgba(89, 193, 255, 0.05);
}

.distance-input:focus {
  outline: none;
  border-color: var(--cartoon-primary);
  box-shadow: 0 0 0 3px rgba(89, 193, 255, 0.15);
  background-color: #ffffff;
}

.distance-input.error {
  border-color: var(--cartoon-red);
  background-color: rgba(255, 138, 128, 0.08);
}

.distance-input::placeholder {
  color: #94A3B8;
  font-size: 14px;
}

/* 单位标签 */
.unit-label {
  margin-left: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

/* 固定距离 */
.fixed-distance {
  color: var(--text-color);
  font-weight: 500;
}
```

### 4.4 输入验证规则
```javascript
const validateDistanceInput = (value) => {
  // 1. 仅允许数字和小数点
  const numericRegex = /^[0-9.]*$/;
  if (!numericRegex.test(value)) {
    return { valid: false, error: '仅允许输入数字和小数点' };
  }

  // 2. 小数点不能超过一个
  if ((value.match(/\./g) || []).length > 1) {
    return { valid: false, error: '小数点格式错误' };
  }

  // 3. 小数点后最多两位
  const decimalParts = value.split('.');
  if (decimalParts[1] && decimalParts[1].length > 2) {
    return { valid: false, error: '小数点后最多两位' };
  }

  // 4. 范围检查 (0.1 ~ 50 km，实际场景合理范围)
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    if (numValue < 0.1) {
      return { valid: false, error: '路程不能小于0.1km' };
    }
    if (numValue > 50) {
      return { valid: false, error: '路程不能大于50km' };
    }
  }

  return { valid: true, error: null };
};

// 实时验证处理
const handleRoute1Change = (e) => {
  const value = e.target.value;
  setRoute1Input(value);

  const validation = validateDistanceInput(value);
  if (!validation.valid && value !== '') {
    setRoute1Error(validation.error);
  } else {
    setRoute1Error(null);
  }

  // 记录操作轨迹
  logOperation({
    targetElement: '路线1输入框',
    eventType: 'INPUT_CHANGE',
    value: value,
    time: new Date().toISOString()
  });
};
```

### 4.5 错误提示
```jsx
{route1Error && (
  <div className="error-hint">
    <span className="error-icon">⚠️</span>
    <span>{route1Error}</span>
  </div>
)}
```

```css
.error-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-top: 8px;
  border-radius: 8px;
  background-color: rgba(255, 138, 128, 0.12);
  color: var(--cartoon-red);
  font-size: 13px;
  border: 1px solid var(--cartoon-red);
}

.error-icon {
  font-size: 14px;
}
```

---

## 五、数据轨迹收集规范

### 5.1 必须记录的事件

#### 5.1.1 页面生命周期
```javascript
// 进入页面
useEffect(() => {
  logOperation({
    targetElement: '页面',
    eventType: 'page_enter',
    value: 'Page_05_Train_Route_Selection',
    time: new Date().toISOString()
  });

  return () => {
    // 离开页面
    logOperation({
      targetElement: '页面',
      eventType: 'page_exit',
      value: 'Page_05_Train_Route_Selection',
      time: new Date().toISOString()
    });
  };
}, []);
```

#### 5.1.2 路线按钮点击
```javascript
const handleRouteButtonClick = (routeId) => {
  logOperation({
    targetElement: `路线按钮_${routeId}`,
    eventType: 'CLICK',
    value: `切换至路线${routeId}`,
    time: new Date().toISOString()
  });

  setActiveLineId(routeId);
};
```

#### 5.1.3 输入框事件
```javascript
// 聚焦
const handleInputFocus = (routeNum) => {
  logOperation({
    targetElement: `路线${routeNum}输入框`,
    eventType: 'INPUT_FOCUS',
    value: '聚焦',
    time: new Date().toISOString()
  });
};

// 失焦
const handleInputBlur = (routeNum, value) => {
  logOperation({
    targetElement: `路线${routeNum}输入框`,
    eventType: 'INPUT_BLUR',
    value: value,
    time: new Date().toISOString()
  });
};

// 输入变化
const handleInputChange = (routeNum, prevValue, newValue) => {
  logOperation({
    targetElement: `路线${routeNum}输入框`,
    eventType: 'INPUT_CHANGE',
    value: JSON.stringify({ prev: prevValue, next: newValue }),
    time: new Date().toISOString()
  });
};

// 删除操作（字符数减少）
if (newValue.length < prevValue.length) {
  logOperation({
    targetElement: `路线${routeNum}输入框`,
    eventType: 'INPUT_DELETE',
    value: JSON.stringify({
      action: 'delete',
      prevLength: prevValue.length,
      nextLength: newValue.length
    }),
    time: new Date().toISOString()
  });
}
```

#### 5.1.4 地图交互事件
```javascript
// 鼠标进入地图区域
const handleMapEnter = () => {
  logOperation({
    targetElement: '地图容器',
    eventType: 'INPUT_FOCUS',
    value: '地图区域聚焦',
    time: new Date().toISOString()
  });
};

// 鼠标离开地图区域
const handleMapLeave = () => {
  logOperation({
    targetElement: '地图容器',
    eventType: 'INPUT_BLUR',
    value: '地图区域失焦',
    time: new Date().toISOString()
  });
};

// 点击站点（可选）
const handleStationClick = (stationId, stationName) => {
  logOperation({
    targetElement: `站点_${stationId}`,
    eventType: 'CLICK',
    value: `点击站点: ${stationName}`,
    time: new Date().toISOString()
  });
};
```

#### 5.1.5 导航事件
```javascript
const handleNextPage = async () => {
  // 记录按钮点击
  logOperation({
    targetElement: 'next_button',
    eventType: 'CLICK',
    value: '提交答案',
    time: new Date().toISOString()
  });

  // 收集答案
  const answers = [
    {
      targetElement: '路线1输入框',
      value: route1Input.trim()
    },
    {
      targetElement: '路线5输入框',
      value: route5Input.trim()
    }
  ];

  // 提交数据
  const success = await submitPage({
    answers,
    operations: operationsRef.current
  });

  if (success) {
    navigateToPage('Page_06', { skipSubmit: true });
  }
};
```

### 5.2 操作记录格式
```typescript
interface OperationLog {
  targetElement: string;    // 目标元素标识
  eventType: string;        // 事件类型：CLICK, INPUT_FOCUS, INPUT_BLUR, INPUT_CHANGE, INPUT_DELETE, page_enter, page_exit
  value: string;            // 事件值（字符串或JSON序列化）
  time: string;             // ISO 8601时间戳
}
```

### 5.3 答案收集格式
```typescript
interface AnswerData {
  targetElement: string;    // 答题元素标识
  value: string;            // 答案内容
}
```

---

## 六、导航与验证逻辑

### 6.1 下一页按钮
**位置**: 页面底部右侧
**样式**: 使用全局 `.btn-primary` 类

```jsx
<div className="navigation">
  <button
    onClick={handleNextPage}
    disabled={!isFormValid}
    className={`btn ${isFormValid ? 'btn-primary' : 'btn-disabled'}`}
  >
    下一页 →
  </button>
</div>
```

### 6.2 表单验证
```javascript
const isFormValid = useMemo(() => {
  // 两个输入框都必须有值
  if (!route1Input.trim() || !route5Input.trim()) {
    return false;
  }

  // 验证路线1
  const validation1 = validateDistanceInput(route1Input);
  if (!validation1.valid) return false;

  // 验证路线5
  const validation5 = validateDistanceInput(route5Input);
  if (!validation5.valid) return false;

  return true;
}, [route1Input, route5Input]);
```

### 6.3 禁用状态样式
```css
.btn-disabled {
  background-color: #cccccc;
  color: #888888;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.btn-disabled:hover {
  transform: none;
}
```

---

## 七、响应式适配

### 7.1 断点策略
```css
/* 桌面端（≥1200px）*/
@media (min-width: 1200px) {
  .page-container {
    display: flex;
    flex-direction: row;
    gap: 40px;
  }

  .map-section {
    flex: 1.2;
    min-width: 500px;
  }

  .input-section {
    flex: 1;
    min-width: 400px;
  }
}

/* 平板端（768px - 1199px）*/
@media (max-width: 1199px) {
  .page-container {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .map-section {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
  }

  .input-section {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
  }

  /* 路线按钮调整为横向排列 */
  .route-buttons {
    flex-direction: row;
    justify-content: center;
    gap: 12px;
    top: auto;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 移动端（<768px）*/
@media (max-width: 767px) {
  .map-container {
    aspect-ratio: 4 / 3;  /* 调整比例更适合移动端 */
  }

  .route-buttons button {
    font-size: 14px;
    padding: 8px 12px;
  }

  .distance-input {
    width: 60px;
    font-size: 14px;
  }

  .route-distance-table th,
  .route-distance-table td {
    padding: 10px 8px;
    font-size: 14px;
  }
}
```

---

## 八、性能优化

### 8.1 React优化
```javascript
// 1. 站点位置计算缓存
const getStationPos = useCallback((id) => {
  const station = stations.find(s => s.id === id);
  return station ? { x: station.x, y: station.y } : { x: 0, y: 0 };
}, [stations]);

// 2. 当前路径点缓存
const activePathPoints = useMemo(() => {
  const route = routes[activeLineId];
  if (!route) return [];
  return route.path.map(id => getStationPos(id));
}, [activeLineId, getStationPos]);

// 3. 路线激活判断缓存
const isLineActive = useCallback((fromId, toId, path) => {
  for (let i = 0; i < path.length - 1; i++) {
    if (
      (path[i] === fromId && path[i + 1] === toId) ||
      (path[i] === toId && path[i + 1] === fromId)
    ) {
      return true;
    }
  }
  return false;
}, []);
```

### 8.2 动画性能
```css
/* 使用 GPU 加速 */
.train-element {
  will-change: transform;
  transform: translateZ(0);
}

/* 减少重绘区域 */
.station-label,
.distance-label {
  contain: layout style;
}

/* 使用 transition 而非 animation（更高效）*/
.route-line {
  transition: stroke 0.5s ease-in-out;
}
```

### 8.3 事件节流
```javascript
// 输入事件节流（避免过于频繁的日志记录）
import { debounce } from 'lodash';

const logInputChange = useCallback(
  debounce((routeNum, value) => {
    logOperation({
      targetElement: `路线${routeNum}输入框`,
      eventType: 'INPUT_CHANGE',
      value: value,
      time: new Date().toISOString()
    });
  }, 300),  // 300ms防抖
  []
);
```

---

## 九、测试验收标准

### 9.1 视觉还原（像素级）
- [ ] 地图容器圆角、边框、阴影完全一致
- [ ] 站点大小、图标、标签样式匹配参考
- [ ] 路线按钮颜色、圆角、序号圈样式一致
- [ ] 距离标签字体、颜色、边框完全匹配
- [ ] 小火车大小、气泡样式、颜色过渡正确
- [ ] 表格边框、内边距、hover效果符合规范

### 9.2 交互功能
- [ ] 点击路线按钮立即切换地图显示（< 500ms）
- [ ] 激活路线高亮（轨道、站点、标签）正确
- [ ] 距离标签仅在激活路线显示
- [ ] 小火车沿路径平滑移动（无卡顿）
- [ ] 路线切换时火车重置到起点
- [ ] 输入框实时验证（数字、小数点、范围）
- [ ] 两个输入框都填写有效值时才能点击下一页

### 9.3 动画效果
- [ ] 轨道颜色过渡平滑（0.5s ease-in-out）
- [ ] 站点边框颜色过渡正确
- [ ] 站点标签缩放动画流畅
- [ ] 按钮hover放大效果正确（scale 1.05）
- [ ] 激活按钮缩放到1倍（未激活0.95倍）
- [ ] 小火车移动使用线性插值（无跳跃）

### 9.4 数据轨迹
- [ ] 页面进入/退出事件正确记录
- [ ] 路线按钮点击事件包含路线ID
- [ ] 输入框聚焦/失焦事件完整
- [ ] 输入变化事件包含prev/next值
- [ ] 删除操作单独记录
- [ ] 地图区域鼠标进入/离开事件
- [ ] 下一页按钮点击事件
- [ ] 所有时间戳使用ISO 8601格式

### 9.5 边界情况
- [ ] 输入空值时下一页按钮禁用
- [ ] 输入非数字时显示错误提示
- [ ] 输入超过范围时显示错误提示
- [ ] 小数点超过2位时自动截断或提示
- [ ] 路线数据缺失时不崩溃（降级显示）
- [ ] 窗口缩放时布局正确响应

### 9.6 可访问性
- [ ] 输入框有placeholder提示
- [ ] 错误提示清晰可见
- [ ] 按钮禁用状态明显（灰色+不可点击光标）
- [ ] 表格结构语义化（thead/tbody）
- [ ] 站点图标使用 aria-label

---

## 十、技术依赖

### 10.1 React库
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

### 10.2 图标库
```bash
npm install lucide-react
```

**使用图标**:
- `Train`: 小火车图标
- `Home`: 小明家图标
- `MapPin`: 火车站图标

### 10.3 工具函数
```javascript
// 时间格式化
const formatTimestamp = (date) => {
  return date.toISOString();  // ISO 8601标准
};

// 数字格式化
const formatDistance = (num) => {
  return num.toFixed(2);  // 保留两位小数
};
```

---

## 十一、文件组织

```
src/modules/grade-4/
├── pages/
│   ├── Page05_RouteSelection.jsx       # 主页面组件
│   └── Page05_RouteSelection.module.css # 页面样式
├── components/
│   ├── TrainRouteMap/                   # 地图组件
│   │   ├── index.jsx
│   │   ├── TrainRouteMap.module.css
│   │   ├── RouteButton.jsx              # 路线按钮
│   │   ├── Station.jsx                  # 站点渲染
│   │   ├── TrainAnimation.jsx           # 火车动画
│   │   └── DistanceLabel.jsx            # 距离标签
│   └── RouteInputTable/                 # 输入表格组件
│       ├── index.jsx
│       └── RouteInputTable.module.css
├── hooks/
│   ├── useRouteAnimation.js             # 火车动画Hook
│   └── useInputValidation.js            # 输入验证Hook
├── utils/
│   ├── stationData.js                   # 站点数据
│   ├── routeData.js                     # 路线数据
│   └── validation.js                    # 验证逻辑
└── context/
    └── Grade4Context.jsx                # 模块上下文
```

---

## 十二、开发流程建议

### 阶段1：静态布局（1天）
1. 创建页面结构（左右分栏）
2. 实现右侧表格UI
3. 实现左侧地图容器和路线按钮
4. 应用全局CSS变量

### 阶段2：地图渲染（1天）
1. 绘制站点（SVG圆圈+图标）
2. 绘制轨道线（SVG line元素）
3. 实现路线切换逻辑
4. 添加距离标签

### 阶段3：动画实现（1天）
1. 实现颜色过渡动画
2. 实现小火车路径计算
3. 添加火车循环移动动画
4. 优化动画性能

### 阶段4：交互与验证（1天）
1. 实现输入框验证逻辑
2. 连接下一页按钮禁用状态
3. 添加错误提示UI
4. 实现数据轨迹收集

### 阶段5：测试与优化（1天）
1. 视觉还原对比（截图对比）
2. 交互功能测试
3. 响应式测试
4. 性能优化（React.memo, useMemo）
5. 边界情况测试

---

## 附录A：完整数据定义

### 站点数据
```javascript
export const STATIONS = [
  { id: 'nanchong_north', name: '南充北站', x: 10, y: 15, isCore: true, icon: 'MapPin' },
  { id: 'nn_a', name: '北郊站A', x: 30, y: 20, isCore: false },
  { id: 'nn_b', name: '北郊站B', x: 20, y: 40, isCore: false },
  { id: 'xiaoming', name: '小明家', x: 50, y: 50, isCore: true, icon: 'Home' },
  { id: 'nanchong', name: '南充站', x: 90, y: 85, isCore: true, icon: 'MapPin' },
  { id: 'n1', name: '枢纽东', x: 80, y: 75, isCore: false },
  { id: 'n2a', name: '东路站1', x: 75, y: 55, isCore: false },
  { id: 'n3a', name: '东路站2', x: 62, y: 45, isCore: false },
  { id: 'n2b', name: '南路站1', x: 68, y: 80, isCore: false },
  { id: 'n3b', name: '南路站2', x: 55, y: 70, isCore: false }
];
```

### 路线数据
```javascript
export const ROUTES = {
  1: {
    id: 1,
    name: '线路 1',
    color: '#F59E0B',
    path: ['nanchong_north', 'nn_a', 'xiaoming'],
    distances: [4.26, 3.64],
    totalDistance: 7.9
  },
  2: {
    id: 2,
    name: '线路 2',
    color: '#10B981',
    path: ['nanchong_north', 'nn_b', 'xiaoming'],
    distances: [3.33, 5.32],
    totalDistance: 8.65
  },
  3: {
    id: 3,
    name: '线路 3',
    color: '#3B82F6',
    path: ['nanchong', 'n1', 'n2a', 'n3a', 'xiaoming'],
    distances: [2.3, 2.4, 3.0, 2.5],
    totalDistance: 10.2
  },
  4: {
    id: 4,
    name: '线路 4',
    color: '#8B5CF6',
    path: ['nanchong', 'n1', 'n2a', 'n3b', 'xiaoming'],
    distances: [2.3, 2.4, 2.93, 2.0],
    totalDistance: 9.63
  },
  5: {
    id: 5,
    name: '线路 5',
    color: '#EC4899',
    path: ['nanchong', 'n1', 'n2b', 'n3b', 'xiaoming'],
    distances: [2.3, 1.49, 2.09, 2.0],
    totalDistance: 7.88
  }
};
```

### 物理连接线
```javascript
export const BASE_LINES = [
  { from: 'nanchong_north', to: 'nn_a' },
  { from: 'nn_a', to: 'xiaoming' },
  { from: 'nanchong_north', to: 'nn_b' },
  { from: 'nn_b', to: 'xiaoming' },
  { from: 'nanchong', to: 'n1' },
  { from: 'n1', to: 'n2a' },
  { from: 'n1', to: 'n2b' },
  { from: 'n2a', to: 'n3a' },
  { from: 'n3a', to: 'xiaoming' },
  { from: 'n2b', to: 'n3b' },
  { from: 'n3b', to: 'xiaoming' },
  { from: 'n2a', to: 'n3b' }
];
```

---

## 附录B：关键算法伪代码

### 路线激活判断
```
function isLineActive(fromId, toId, currentPath):
  for i from 0 to (currentPath.length - 2):
    if (currentPath[i] == fromId AND currentPath[i+1] == toId) OR
       (currentPath[i] == toId AND currentPath[i+1] == fromId):
      return true
  return false
```

### 火车位置计算
```
function getTrainPosition(progress, pathPoints):
  if pathPoints.length < 2:
    return pathPoints[0] or {x: 0, y: 0}

  totalSegments = pathPoints.length - 1
  segmentSize = 100 / totalSegments
  currentSegmentIndex = min(floor(progress / segmentSize), totalSegments - 1)
  segmentPercent = (progress - currentSegmentIndex * segmentSize) / segmentSize

  p1 = pathPoints[currentSegmentIndex]
  p2 = pathPoints[currentSegmentIndex + 1]

  return {
    x: p1.x + (p2.x - p1.x) * segmentPercent,
    y: p1.y + (p2.y - p1.y) * segmentPercent
  }
```

---

**文档结束**
