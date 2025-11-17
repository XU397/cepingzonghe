export function handleSessionExpired(options = {}) {
  const { reason } = options;

  console.error('[usePageSubmission] 会话已过期，执行统一登出流程', { reason });

  try {
    alert('您的登录会话已过期，请重新登录');
  } catch (error) {
    console.warn('[usePageSubmission] 无法弹出提示:', error);
  }

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (error) {
    console.error('[usePageSubmission] 清理本地缓存时出错', error);
  }

  try {
    window.location.href = '/';
  } catch (error) {
    console.error('[usePageSubmission] 重定向到登录页失败', error);
  }
}

export default handleSessionExpired;
