import { ApiError, SessionExpiredError } from './errors';
import type { RequestOptions } from './types';

class ApiClient {
  private baseURL: string;
  private sessionExpiredHandler?: () => void;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setSessionExpiredHandler(handler: () => void): void {
    this.sessionExpiredHandler = handler;
  }

  async request<T>(path: string, options: RequestInit & RequestOptions = {}): Promise<T> {
    const url = this.baseURL + path;
    const { json, formData, ...fetchOptions } = options;

    const requestInit: RequestInit = {
      ...fetchOptions,
      credentials: 'include',
      headers: {
        ...options.headers,
      },
    };

    if (json) {
      requestInit.headers = {
        'Content-Type': 'application/json',
        ...requestInit.headers,
      };
      requestInit.body = JSON.stringify(json);
    } else if (formData) {
      requestInit.body = formData;
    }

    try {
      const response = await fetch(url, requestInit);

      if (response.status === 401) {
        if (this.sessionExpiredHandler) {
          this.sessionExpiredHandler();
        }
        throw new SessionExpiredError();
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let errorData: any;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { message: text };
        }
        throw new ApiError(
          response.status,
          errorData.code || `HTTP_${response.status}`,
          errorData.msg || errorData.message || `Request failed with status ${response.status}`
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return (await response.text()) as any;
      }
    } catch (error) {
      if (error instanceof ApiError || error instanceof SessionExpiredError) {
        throw error;
      }
      throw new ApiError(0, 'NETWORK_ERROR', error instanceof Error ? error.message : 'Network error');
    }
  }

  async get<T>(path: string, options?: Omit<RequestOptions, 'json' | 'formData'>): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      json: data,
    });
  }

  async put<T>(path: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      json: data,
    });
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  async upload<T>(path: string, formData: FormData, options?: Omit<RequestOptions, 'formData'>): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      formData,
    });
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || '');

export default apiClient;
export type { RequestOptions };
