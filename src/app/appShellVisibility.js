export function hasVerifiedUserSession(session = {}) {
  const user = session.currentUser;
  const batchCode = session.batchCode || user?.batchCode;
  const examNo = session.examNo || user?.examNo;
  return Boolean(session.isAuthenticated && user && batchCode && examNo);
}

export function shouldHideUserInfoBar(pathname, session = {}) {
  if (pathname === '/login') {
    return true;
  }

  return pathname === '/' && !hasVerifiedUserSession(session);
}

export function shouldRedirectToFlowRoute(pathname, moduleUrl, session = {}) {
  if (!hasVerifiedUserSession(session) || pathname !== '/') {
    return false;
  }

  return /^\/flow\/[^/?#]+/.test(String(moduleUrl || ''));
}
