import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'sonner';

// IMPORTACIONES CORREGIDAS (Con llaves si es necesario)
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import OrdersPage from '@/pages/OrdersPage';

// 1. Layout Global
const AppLayout = () => (
  <AuthProvider>
    <Toaster position="top-center" />
    <Outlet />
  </AuthProvider>
);

// 2. Protección
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// 3. Rutas
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/dashboard',
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'orders', element: <OrdersPage /> },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);