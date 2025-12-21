import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouteObject } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const Home = lazy(() => import('@/pages/Home/Home'));
const EditNote = lazy(() => import('@/pages/EditNote/EditNote'));
const Login = lazy(() => import('@/pages/Login/Login'));
const SignUp = lazy(() => import('@/pages/SignUp/SignUp'));
const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage'));
const JoinNote = lazy(() => import('@/pages/JoinNote/JoinNote'));

const NotFoundPage = () => (
  <div className="text-center mt-12">
    <h1 className="text-5xl font-bold text-destructive mb-4">404 - Page Not Found</h1>
    <p className="text-xl text-muted-foreground mb-8">
      Oops! The page you are looking for does not exist.
    </p>
    <a
      href="/"
      className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
    >
      Go Back to Home
    </a>
  </div>
);

export const router = createBrowserRouter([
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
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
] as RouteObject[]);

