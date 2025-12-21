import { useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { getSocketClient, disconnectSocketClient } from '@/lib/socketClient';

interface UseSocketReturn {
  socket: Socket | null;
  emitOptimized: (event: string, data: unknown, debounceMs?: number) => void;
}

export const useSocket = (noteId?: string): UseSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const { token, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!token || !checkAuth()) return;

    // Get socket instance from centralized client
    socketRef.current = getSocketClient(token);

    if (!socketRef.current) return;

    // Join note room if noteId provided
    if (noteId) {
      socketRef.current.emit('joinNote', noteId);
    }

    return () => {
      if (socketRef.current) {
        if (noteId) {
          socketRef.current.emit('leaveNote', noteId);
        }
        // Don't disconnect here - let centralized client manage connection
        // Only leave the room
      }
    };
  }, [token, noteId, checkAuth]);

  // Optimized emit with debouncing for high-frequency events
  const emitOptimized = useCallback((
    event: string,
    data: unknown,
    debounceMs: number = 300
  ) => {
    if (!socketRef.current) return;

    // Debounce high-frequency events like editNote
    if (event === 'editNote') {
      const socketWithTimer = socketRef.current as Socket & { _debounceTimer?: NodeJS.Timeout };
      const existingTimer = socketWithTimer._debounceTimer;
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      socketWithTimer._debounceTimer = setTimeout(() => {
        socketRef.current?.emit(event, data);
      }, debounceMs);
    } else {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { socket: socketRef.current, emitOptimized };
};

/**
 * Hook to disconnect socket on logout
 */
export const useSocketDisconnect = (): void => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocketClient();
    }
  }, [isAuthenticated]);
};

