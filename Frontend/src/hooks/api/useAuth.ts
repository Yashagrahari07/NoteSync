import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

interface UpdateProfileData {
  fullname?: string;
  email?: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
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

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user, token, setAuth } = useAuthStore();

  return useMutation<{ message: string; user: User }, Error, UpdateProfileData>({
    mutationFn: async (profileData: UpdateProfileData) => {
      const data = await apiClient.patch<{ message: string; user: User }>('/users/profile', profileData);
      return data;
    },
    onSuccess: (data) => {
      // Update auth store with new user data
      if (token) {
        setAuth(data.user, token);
      }
      // Invalidate user profile query
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
};

export const useChangePassword = () => {
  const { clearAuth } = useAuthStore();

  return useMutation<{ message: string }, Error, ChangePasswordData>({
    mutationFn: async (passwordData: ChangePasswordData) => {
      const data = await apiClient.patch<{ message: string }>('/users/password', passwordData);
      return data;
    },
    onSuccess: () => {
      // Password changed, user needs to login again
      clearAuth();
    },
  });
};

export const useDeleteAccount = () => {
  const { clearAuth } = useAuthStore();

  return useMutation<{ message: string }, Error, void>({
    mutationFn: async () => {
      const data = await apiClient.delete<{ message: string }>('/users/account');
      return data;
    },
    onSuccess: () => {
      clearAuth();
    },
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

