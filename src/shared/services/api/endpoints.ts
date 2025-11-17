export const endpoints = {
  // 认证
  auth: {
    login: '/stu/login',
    logout: '/stu/logout',
  },

  // 数据提交
  submission: {
    saveMark: '/stu/saveHcMark', // 注意：实际是 /saveHcMark，但通过代理前缀 /stu
  },

  // Flow（新增，待后端实现）
  flow: {
    getDefinition: (flowId: string) => `/api/flows/${flowId}`,
    getProgress: (flowId: string, examNo: string) => `/api/flows/${flowId}/progress/${examNo}`,
    updateProgress: (flowId: string) => `/api/flows/${flowId}/progress`,
  },

  // 心跳（新增，待后端实现）
  heartbeat: {
    ping: '/api/heartbeat',
  },
};

export default endpoints;
