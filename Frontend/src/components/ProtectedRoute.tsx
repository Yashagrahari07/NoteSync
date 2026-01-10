import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useAuthCheck } from '@/hooks/auth/useAuthCheck';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const location = useLocation();
  
  useAuthCheck(); // Check auth periodically

  if (!isAuthenticated || !checkAuth()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

