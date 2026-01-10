import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/queryClient';
import type { ApiResponse } from '@/types/api.types';

export interface UserPreferences {
  _id?: string;
  userId: string;
  notifications: {
    joinLeave: boolean;
    collaboratorChanges: boolean;
    liveEdits: boolean;
    cursorMoves: boolean;
  };
  realTime: {
    showCursors: boolean;
    showSelections: boolean;
    showPresence: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export const useUserPreferences = () => {
  return useQuery<UserPreferences, Error>({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<UserPreferences>>('/user-preferences');
      return data.data || {
        userId: '',
        notifications: {
          joinLeave: true,
          collaboratorChanges: true,
          liveEdits: false,
          cursorMoves: false,
        },
        realTime: {
          showCursors: true,
          showSelections: true,
          showPresence: true,
        },
      };
    },
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UserPreferences, Error, Partial<UserPreferences>>({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const data = await apiClient.put<ApiResponse<UserPreferences>>('/user-preferences', preferences);
      if (!data.data) throw new Error('Failed to update preferences');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
};

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UserPreferences, Error, UserPreferences['notifications']>({
    mutationFn: async (notifications: UserPreferences['notifications']) => {
      const data = await apiClient.put<ApiResponse<UserPreferences>>('/user-preferences/notifications', { notifications });
      if (!data.data) throw new Error('Failed to update notification settings');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
};

export const useUpdateRealTimeSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation<UserPreferences, Error, UserPreferences['realTime']>({
    mutationFn: async (realTime: UserPreferences['realTime']) => {
      const data = await apiClient.put<ApiResponse<UserPreferences>>('/user-preferences/realtime', { realTime });
      if (!data.data) throw new Error('Failed to update real-time settings');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
};

