// 路线数据：参考 docs/SVG动画参考/火车路线交互动画.html
// 路线1和2：南充北站 → 小明家
// 路线3-5：南充站 → 小明家
export const ROUTES = [
  {
    id: 1,
    name: '路线 1',
    station: '南充北站',
    color: '#F59E0B',
    path: ['nanchong_north', 'nn_a', 'xiaoming'],
    segments: [4.26, 3.64],
    totalDistance: 7.9,
    isEditable: true,
  },
  {
    id: 2,
    name: '路线 2',
    station: '南充北站',
    color: '#10B981',
    path: ['nanchong_north', 'nn_b', 'xiaoming'],
    segments: [3.33, 5.32],
    totalDistance: 8.65,
    isEditable: false,
  },
  {
    id: 3,
    name: '路线 3',
    station: '南充站',
    color: '#3B82F6',
    path: ['nanchong', 'n1', 'n2a', 'n3a', 'xiaoming'],
    segments: [2.3, 2.4, 3.0, 2.5],
    totalDistance: 10.2,
    isEditable: false,
  },
  {
    id: 4,
    name: '路线 4',
    station: '南充站',
    color: '#8B5CF6',
    path: ['nanchong', 'n1', 'n2a', 'n3b', 'xiaoming'],
    segments: [2.3, 2.4, 2.93, 2.0],
    totalDistance: 9.63,
    isEditable: false,
  },
  {
    id: 5,
    name: '路线 5',
    station: '南充站',
    color: '#EC4899',
    path: ['nanchong', 'n1', 'n2b', 'n3b', 'xiaoming'],
    segments: [2.3, 1.49, 2.09, 2.0],
    totalDistance: 7.88,
    isEditable: true,
  },
];

// 站点位置定义（百分比坐标）
export const STATIONS = [
  // 左上角区域 - 南充北站相关
  { id: 'nanchong_north', name: '南充北站', x: 10, y: 15, isCore: true },
  { id: 'nn_a', name: '北郊站A', x: 30, y: 20, isCore: false },
  { id: 'nn_b', name: '北郊站B', x: 20, y: 40, isCore: false },
  // 核心区域 - 小明家
  { id: 'xiaoming', name: '小明家', x: 50, y: 50, isCore: true },
  // 右下角区域 - 南充站相关
  { id: 'nanchong', name: '南充站', x: 90, y: 85, isCore: true },
  { id: 'n1', name: '枢纽东', x: 80, y: 75, isCore: false },
  { id: 'n2a', name: '东路站1', x: 75, y: 55, isCore: false },
  { id: 'n3a', name: '东路站2', x: 62, y: 45, isCore: false },
  { id: 'n2b', name: '南路站1', x: 68, y: 80, isCore: false },
  { id: 'n3b', name: '南路站2', x: 55, y: 70, isCore: false },
];

// 物理连接线（基础底图）
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
  { from: 'n2a', to: 'n3b' }, // 跨线连接
];

export default ROUTES;
