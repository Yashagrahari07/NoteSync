import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/queryClient';
import type { ApiResponse } from '@/types/api.types';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  message: string;
  noteId?: string;
  noteTitle?: string;
  read: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  return useQuery<Notification[], Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<Notification[]>>('/notifications');
      return data.data || [];
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (notificationId: string) => {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

