import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export const useAuthCheck = (): void => {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status
    if (!isAuthenticated || !checkAuth()) {
      navigate('/login');
      return;
    }

    // Periodic auth check (every 5 minutes)
    const checkInterval = setInterval(() => {
      if (!checkAuth()) {
        navigate('/login');
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(checkInterval);
  }, [isAuthenticated, navigate, checkAuth]);
};

