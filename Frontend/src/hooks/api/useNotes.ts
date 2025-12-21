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

export const useNotes = () => {
  return useQuery<Note[], Error>({
    queryKey: ['notes'],
    queryFn: async () => {
      const data = await apiClient.get<ApiResponse<Note[]>>('/notes');
      return data.data || [];
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

