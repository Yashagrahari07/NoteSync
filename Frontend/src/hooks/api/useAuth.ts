import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthResponse, User } from '@/types/user.types';
import type { ApiResponse } from '@/types/api.types';
import { setCookie } from '@/lib/utils';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  fullname: string;
  email: string;
  password: string;
}

export const useLogin = () => {
  return useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      const data = await apiClient.post<AuthResponse>('/users/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      useAuthStore.getState().setAuth(data.user, data.accessToken);
      setCookie('authToken', data.accessToken, 7);
    },
  });
};

export const useRegister = () => {
  return useMutation<AuthResponse, Error, RegisterData>({
    mutationFn: async (userData: RegisterData) => {
      const data = await apiClient.post<AuthResponse>('/users/register', userData);
      return data;
    },
  });
};

export const useGetUserProfile = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery<User, Error>({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<User>>('/users/profile');
      if (!data.data) throw new Error('User not found');
      return data.data;
    },
    enabled: isAuthenticated,
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.post('/users/logout');
    },
    onSuccess: () => {
      clearAuth();
    },
  });
};

