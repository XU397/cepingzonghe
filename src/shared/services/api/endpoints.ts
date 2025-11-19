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
    // 注意：后端约定实际路径为 /stu/api/flows/{flowId}
    getDefinition: (flowId: string) => `/stu/api/flows/${flowId}`,
    // 进度查询：GET /stu/api/flows/{flowId}/progress/{examNo}?batchCode={batchCode}
    getProgress: (flowId: string, examNo: string, batchCode?: string) => {
      const base = `/stu/api/flows/${flowId}/progress/${examNo}`;
      if (!batchCode) return base;
      return `${base}?batchCode=${encodeURIComponent(batchCode)}`;
    },
    updateProgress: (flowId: string) => `/stu/api/flows/${flowId}/progress`,
  },

  // 心跳（新增，待后端实现）
  heartbeat: {
    ping: '/api/heartbeat',
  },
};

export default endpoints;
