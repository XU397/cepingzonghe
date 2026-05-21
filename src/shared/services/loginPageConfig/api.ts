import type { LoginPageConfig } from './types';

const API_ENDPOINT = '/stu/api/login-page-config/active';

interface ApiResponse {
  code: number;
  msg?: string;
  data?: LoginPageConfig | null;
}

export async function fetchLoginPageConfig(): Promise<LoginPageConfig | null> {
  const response = await fetch(API_ENDPOINT);
  if (!response.ok) {
    throw new Error(`Login page config API returned ${response.status}`);
  }
  const result: ApiResponse = await response.json();
  if (result.code !== 200) {
    throw new Error(result.msg || `Login page config API returned code ${result.code}`);
  }
  return result.data ?? null;
}
