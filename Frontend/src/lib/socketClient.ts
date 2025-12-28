import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { getCookie } from '@/lib/utils';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socketInstance: Socket | null = null;

export const getSocketClient = (token?: string): Socket | null => {
  if (socketInstance?.connected) {
    return socketInstance;
  }

  if (!token) {
    const authToken = getCookie('authToken');
    if (!authToken) {
      return null;
    }
    token = authToken;
  }

  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    randomizationFactor: 0.5,
  });

  let reconnectAttempts = 0;
  let operationQueue: Array<{ event: string; data: unknown }> = [];

  socketInstance.on('connect', () => {
    reconnectAttempts = 0;
    
    if (operationQueue.length > 0) {
      operationQueue.forEach(({ event, data }) => {
        socketInstance?.emit(event, data);
      });
      operationQueue = [];
    }
  });

  socketInstance.on('disconnect', (reason) => {
    if (reason === 'io server disconnect' && socketInstance) {
      socketInstance.connect();
    }
  });

  socketInstance.on('reconnect_attempt', (attemptNumber) => {
    reconnectAttempts = attemptNumber;
  });

  socketInstance.on('reconnect_failed', () => {
    console.error('Socket reconnection failed after all attempts');
    // Could show a toast notification here
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    if (error.message.includes('authentication') || error.message.includes('Unauthorized')) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
  });

  socketInstance.on('rateLimitExceeded', (data: { message: string; retryAfter: number }) => {
    console.error('Rate Limit Exceeded:', data.message || 'Too many requests. Please slow down.');
  });

  socketInstance.on('error', (error: { message: string; code?: string }) => {
    if (error.code === 'TOKEN_EXPIRED' || error.code === 'AUTH_FAILED') {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    } else {
      console.error('Connection Error:', error.message || 'An error occurred');
    }
  });

  return socketInstance;
};

export const disconnectSocketClient = (): void => {
  if (socketInstance !== null) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export const reconnectSocketClient = (token: string): Socket | null => {
  disconnectSocketClient();
  return getSocketClient(token);
};

export { SOCKET_URL };

