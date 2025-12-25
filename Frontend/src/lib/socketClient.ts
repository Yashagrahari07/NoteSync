import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth.store';
import { getCookie } from '@/lib/utils';

// Environment variables - centralized configuration
// Default to HTTP for local development (HTTPS requires SSL certificates)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socketInstance: Socket | null = null;

/**
 * Get or create socket instance
 * Ensures only one socket connection exists
 */
export const getSocketClient = (token?: string): Socket | null => {
  // If socket already exists and is connected, return it
  if (socketInstance?.connected) {
    return socketInstance;
  }

  // If no token provided, try to get from cookie
  if (!token) {
    const authToken = getCookie('authToken');
    if (!authToken) {
      console.warn('No auth token available for socket connection');
      return null;
    }
    token = authToken;
  }

  // Create new socket instance with improved reconnection
  socketInstance = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'], // WebSocket only for better performance
    reconnection: true,
    reconnectionDelay: 1000, // Start with 1 second
    reconnectionDelayMax: 30000, // Max 30 seconds
    reconnectionAttempts: Infinity, // Keep trying
    timeout: 20000,
    // Exponential backoff multiplier
    randomizationFactor: 0.5,
  });

  // Setup global error handlers with improved reconnection logic
  let reconnectAttempts = 0;
  let operationQueue: Array<{ event: string; data: unknown }> = [];

  socketInstance.on('connect', () => {
    console.log('Socket connected');
    reconnectAttempts = 0;
    
    // Process queued operations
    if (operationQueue.length > 0) {
      operationQueue.forEach(({ event, data }) => {
        socketInstance?.emit(event, data);
      });
      operationQueue = [];
    }
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected, need to reconnect manually
      socketInstance.connect();
    }
  });

  socketInstance.on('reconnect_attempt', (attemptNumber) => {
    reconnectAttempts = attemptNumber;
    console.log(`Reconnection attempt ${attemptNumber}`);
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

  // Handle rate limit errors
  socketInstance.on('rateLimitExceeded', (data: { message: string; retryAfter: number }) => {
    // Toast will be implemented with shadcn toast
    console.error('Rate Limit Exceeded:', data.message || 'Too many requests. Please slow down.');
  });

  // Handle authentication errors
  socketInstance.on('error', (error: { message: string; code?: string }) => {
    if (error.code === 'TOKEN_EXPIRED' || error.code === 'AUTH_FAILED') {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    } else {
      // Toast will be implemented with shadcn toast
      console.error('Connection Error:', error.message || 'An error occurred');
    }
  });

  return socketInstance;
};

/**
 * Disconnect socket client
 */
export const disconnectSocketClient = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

/**
 * Reconnect socket with new token
 */
export const reconnectSocketClient = (token: string): Socket | null => {
  disconnectSocketClient();
  return getSocketClient(token);
};

// Export socket URL for use in other files
export { SOCKET_URL };

