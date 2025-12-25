import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/queryClient';
import type { ApiResponse } from '@/types/api.types';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  noteId?: string;
  noteTitle?: string;
  noteOwner?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const useNotifications = () => {
  return useQuery<NotificationsResponse, Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<NotificationsResponse>>('/notifications');
      return data.data || { notifications: [], unreadCount: 0 };
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
      await apiClient.patch('/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

export const useUnreadCount = () => {
  return useQuery<number, Error>({
    queryKey: ['unreadCount'],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
      return data.data?.unreadCount || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });
};

