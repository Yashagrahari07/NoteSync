import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user.types';
import { setCookie, deleteCookie } from '@/lib/utils';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  checkAuth: () => boolean;
}

// Helper to decode JWT and check expiry
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp: number };
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        setCookie('authToken', token, 7); // 7 days
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        deleteCookie('authToken');
        set({ user: null, token: null, isAuthenticated: false });
      },
      checkAuth: () => {
        const { token } = get();
        if (!token) return false;
        
        if (isTokenExpired(token)) {
          get().clearAuth();
          return false;
        }
        return true;
      },
    }),
    { name: 'auth-storage' }
  )
);

