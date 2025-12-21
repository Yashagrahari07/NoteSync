export interface ApiError {
  message: string;
  code?: string;
  retryAfter?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

