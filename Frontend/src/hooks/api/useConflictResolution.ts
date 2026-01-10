import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/queryClient';
import type { ApiResponse } from '@/types/api.types';
import type { Note } from '@/types/note.types';

export interface NoteVersion {
  _id: string;
  noteId: string;
  version: number;
  content: string;
  title: string;
  createdBy: string;
  createdByFullname: string;
  createdAt: string;
  conflictResolved?: boolean;
}

export interface PendingOperation {
  _id: string;
  noteId: string;
  type: string;
  position: number;
  content?: string;
  userId: string;
  userFullname: string;
  timestamp: number;
}

export const useVersionHistory = (noteId: string, limit: number = 10) => {
  return useQuery<NoteVersion[], Error>({
    queryKey: ['versionHistory', noteId],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<NoteVersion[]>>(
        `/conflict-resolution/${noteId}/versions?limit=${limit}`
      );
      return data.data || [];
    },
    enabled: !!noteId,
  });
};

export const useVersion = (noteId: string, version: number) => {
  return useQuery<NoteVersion, Error>({
    queryKey: ['version', noteId, version],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<NoteVersion>>(
        `/conflict-resolution/${noteId}/versions/${version}`
      );
      if (!data.data) throw new Error('Version not found');
      return data.data;
    },
    enabled: !!noteId && !!version,
  });
};

export const useRestoreVersion = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Note, Error, { noteId: string; version: number }>({
    mutationFn: async ({ noteId, version }) => {
      const data = await apiClient.post<ApiResponse<Note>>(
        `/conflict-resolution/${noteId}/versions/${version}/restore`
      );
      if (!data.data) throw new Error('Failed to restore version');
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', variables.noteId] });
      queryClient.invalidateQueries({ queryKey: ['versionHistory', variables.noteId] });
    },
  });
};

export const usePendingOperations = (noteId: string) => {
  return useQuery<PendingOperation[], Error>({
    queryKey: ['pendingOperations', noteId],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<PendingOperation[]>>(
        `/conflict-resolution/${noteId}/operations`
      );
      return data.data || [];
    },
    enabled: !!noteId,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

export const useClearResolvedConflicts = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (noteId: string) => {
      await apiClient.delete(`/conflict-resolution/${noteId}/operations`);
    },
    onSuccess: (_, noteId) => {
      queryClient.invalidateQueries({ queryKey: ['pendingOperations', noteId] });
    },
  });
};

