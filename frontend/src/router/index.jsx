import { createBrowserRouter, Navigate } from 'react-router-dom';

// Public pages
import Hero from '../pages/public/Hero';
import Login from '../pages/public/Login';
import Signup from '../pages/public/Signup';
import Docs from '../pages/Docs';

// Protected app pages
import Dashboard from '../pages/app/Dashboard';
import Transactions from '../pages/app/Transactions';
import Rules from '../pages/app/Rules';
import Simulator from '../pages/app/Simulator';
import Settings from '../pages/app/Settings';

// Route guards
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: (
      <PublicRoute>
        <Hero />
      </PublicRoute>
    ),
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <PublicRoute>
        <Signup />
      </PublicRoute>
    ),
  },
  {
    path: '/docs',
    element: <Docs />,
  },
  {
    path: '/docs/*',
    element: <Docs />,
  },

  // Protected routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/transactions',
    element: (
      <ProtectedRoute>
        <Transactions />
      </ProtectedRoute>
    ),
  },
  {
    path: '/rules',
    element: (
      <ProtectedRoute>
        <Rules />
      </ProtectedRoute>
    ),
  },
  {
    path: '/simulate',
    element: (
      <ProtectedRoute>
        <Simulator />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
