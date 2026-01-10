import { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { getCookie, setCookie } from '@/lib/utils';
import type { ApiError } from '@/types/api.types';

// Environment variables - centralized configuration
// Default to HTTP for local development (HTTPS requires SSL certificates)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API Request Options Interface
 */
interface ApiRequestOptions extends RequestInit {
  retry?: boolean;
  _retry?: boolean;
}

/**
 * Centralized API Client using Fetch API
 * Handles all HTTP requests with error handling, auth, and rate limiting
 */
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const token = getCookie('authToken');
    
    // Build headers - use Record type for proper indexing
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build request options
    const requestOptions: RequestInit = {
      ...options,
      headers: headers as HeadersInit,
      credentials: 'include', // Include cookies
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

      // Handle rate limiting (429)
      if (response.status === 429) {
        const errorData = (await response.json().catch(() => ({}))) as ApiError;
        const { retryAfter, message } = errorData;
        
        // Show toast notification (will be implemented with shadcn toast)
        console.error('Rate Limit Exceeded:', message || 'Too many requests. Please slow down.');
        
        // Wait before retrying (if retryAfter is provided and not already retried)
        if (retryAfter && !options._retry) {
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          return this.request<T>(endpoint, { ...options, _retry: true });
        }
        
        throw new Error(message || 'Rate limit exceeded');
      }

      // Handle token expiry (401)
      if (response.status === 401) {
        const errorData = (await response.json().catch(() => ({}))) as ApiError;
        const { code } = errorData;
        
        if (code === 'TOKEN_EXPIRED') {
          // Try to refresh token
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/users/refresh-token`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.accessToken) {
                setCookie('authToken', refreshData.accessToken, 7);
                // Retry original request with new token
                return this.request<T>(endpoint, { ...options, _retry: true });
              }
            }
          } catch (refreshError) {
            // Refresh failed, logout
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
            throw refreshError;
          }
        } else if (code === 'HTTPS_REQUIRED') {
          console.error('Security Error: HTTPS is required for authentication. Please use a secure connection.');
          throw new Error('HTTPS required');
        } else {
          // Other 401 errors - logout
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
          throw new Error('Authentication failed');
        }
      }

      // Handle HTTPS required (403)
      if (response.status === 403) {
        const errorData = (await response.json().catch(() => ({}))) as ApiError;
        if (errorData.code === 'HTTPS_REQUIRED') {
          console.error('Security Error: HTTPS is required. Please use a secure connection.');
          throw new Error('HTTPS required');
        }
      }

      // Handle other errors
      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }))) as ApiError;
        throw new Error(errorData.message || 'Request failed');
      }

      // Parse and return response
      const data = await response.json();
      return data as T;
    } catch (error) {
      // Network errors or other failures
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        const errorMessage = 'Network Error: Unable to connect to the server. Please check your connection and ensure the backend is running.';
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Centralized TanStack Query Client
 * Configured with default options for queries and mutations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Disable retry for mutations to prevent duplicate calls
    },
  },
});

// Export API base URL for use in other files
export { API_BASE_URL };

