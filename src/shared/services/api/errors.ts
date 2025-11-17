export class ApiError extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string
  ) {
    super(message || 'API request failed');
    this.name = 'ApiError';
  }
}

export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, 'SESSION_EXPIRED', 'Session expired');
    this.name = 'SessionExpiredError';
  }
}

export function isSessionExpiredError(error: any): error is SessionExpiredError {
  return error instanceof SessionExpiredError;
}

export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}
