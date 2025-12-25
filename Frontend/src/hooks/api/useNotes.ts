import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/queryClient';
import type { Note } from '@/types/note.types';
import type { ApiResponse } from '@/types/api.types';

interface CreateNoteData {
  title: string;
  content: string;
}

interface UpdateNoteData extends Partial<CreateNoteData> {
  tags?: string[];
  isPinned?: boolean;
}

interface NotesQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'updatedOn' | 'createdOn' | 'title';
  sortOrder?: 1 | -1;
  tags?: string[];
  isPinned?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  ownerId?: string;
  collaboratorId?: string;
  filterType?: 'all' | 'owned' | 'shared';
}

export const useNotes = (params?: NotesQueryParams) => {
  return useQuery<Note[], Error>({
    queryKey: ['notes', params],
    queryFn: async () => {
      if (params?.search) {
        // Use search endpoint
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.append('q', params.search);
        if (params.tags && params.tags.length > 0) queryParams.append('tags', params.tags.join(','));
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.ownerId) queryParams.append('ownerId', params.ownerId);
        if (params.collaboratorId) queryParams.append('collaboratorId', params.collaboratorId);
        if (params.isPinned !== undefined) queryParams.append('isPinned', params.isPinned.toString());
        if (params.filterType) queryParams.append('filterType', params.filterType);
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder.toString());
        
        const data = await apiClient.get<ApiResponse<Note[]>>(`/notes/search?${queryParams.toString()}`);
        return data.data || [];
      } else {
        // Use regular endpoint with query params
        const queryParams = new URLSearchParams();
        if (params?.filterType) queryParams.append('filterType', params.filterType);
        if (params?.isPinned !== undefined) queryParams.append('isPinned', params.isPinned.toString());
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder.toString());
        
        const url = queryParams.toString() ? `/notes?${queryParams.toString()}` : '/notes';
        const data = await apiClient.get<ApiResponse<Note[]>>(url);
        return data.data || [];
      }
    },
  });
};

export const useNote = (noteId: string) => {
  return useQuery<Note, Error>({
    queryKey: ['notes', noteId],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<Note>>(`/notes/${noteId}`);
      if (!data.data) throw new Error('Note not found');
      return data.data;
    },
    enabled: !!noteId,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Note, Error, CreateNoteData>({
    mutationFn: async (noteData: CreateNoteData) => {
      const data = await apiClient.post<ApiResponse<Note>>('/notes', noteData);
      if (!data.data) throw new Error('Failed to create note');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Note, Error, { noteId: string } & UpdateNoteData>({
    mutationFn: async ({ noteId, ...updates }) => {
      const data = await apiClient.put<ApiResponse<Note>>(`/notes/${noteId}`, updates);
      if (!data.data) throw new Error('Failed to update note');
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', variables.noteId] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (noteId: string) => {
      await apiClient.delete(`/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useTogglePinNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Note, Error, string>({
    mutationFn: async (noteId: string) => {
      const data = await apiClient.patch<ApiResponse<Note>>(`/notes/${noteId}/pin`);
      if (!data.data) throw new Error('Failed to toggle pin');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
};

export const useAddCollaborator = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Note, Error, { noteId: string; email: string }>({
    mutationFn: async ({ noteId, email }) => {
      const data = await apiClient.post<ApiResponse<Note>>(`/notes/${noteId}/collaborators`, { email });
      if (!data.data) throw new Error('Failed to add collaborator');
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', variables.noteId] });
    },
  });
};

export const useRemoveCollaborator = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Note, Error, { noteId: string; collaboratorId: string }>({
    mutationFn: async ({ noteId, collaboratorId }) => {
      const data = await apiClient.delete<ApiResponse<Note>>(`/notes/${noteId}/collaborators/${collaboratorId}`);
      if (!data.data) throw new Error('Failed to remove collaborator');
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', variables.noteId] });
    },
  });
};

