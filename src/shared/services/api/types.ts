export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  obj?: T;
}

export interface RequestOptions {
  json?: any;
  formData?: FormData;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}
