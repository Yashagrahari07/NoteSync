import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, RouteObject } from 'react-router-dom';
import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppErrorBoundary } from '@/components/ErrorBoundary';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';

// Lazy load pages (with corrected imports - no subfolders)
const Home = lazy(() => import('@/pages/Home.tsx'));
const EditNote = lazy(() => import('@/pages/EditNote.tsx'));
const Login = lazy(() => import('@/pages/Login.tsx'));
const SignUp = lazy(() => import('@/pages/SignUp.tsx'));
const LandingPage = lazy(() => import('@/pages/LandingPage.tsx'));
const JoinNote = lazy(() => import('@/pages/JoinNote.tsx'));
const Settings = lazy(() => import('@/pages/Settings.tsx'));

// 404 Page Component (using shadcn Button instead of native <a>)
const NotFoundPage = () => (
  <div className="text-center mt-12">
    <h1 className="text-5xl font-bold text-destructive mb-4">404 - Page Not Found</h1>
    <p className="text-xl text-muted-foreground mb-8">
      Oops! The page you are looking for does not exist.
    </p>
    <Button asChild>
      <a href="/">Go Back to Home</a>
    </Button>
  </div>
);

// Router Configuration
const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/signup',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <SignUp />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <Home />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/edit-note/:noteId',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <EditNote />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/join-note',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <JoinNote />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner />}>
          <Settings />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
] as RouteObject[]);

// Providers Component (moved from app/providers.tsx)
function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Main App Component
export function App() {
  return (
    <AppErrorBoundary>
      <Providers>
        <ConnectionStatus />
        <RouterProvider router={router} />
        <Toaster />
      </Providers>
    </AppErrorBoundary>
  );
}