import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'sonner';

// PÁGINAS
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ImportPage from '@/pages/ImportPage';

// 👇 AQUÍ ESTABA LA CONFUSIÓN DE RUTAS. ASÍ ES COMO DEBE QUEDAR:
// Asumimos que estas páginas están en 'pages/admin' si las moviste ahí, 
// o en 'pages' si no. Ajusta si te sale error rojo.
import OrdersPage from '@/pages/OrdersPage'; 
import CompaniesPage from '@/pages/admin/CompaniesPage';
import CostCentersPage from '@/pages/admin/CostCentersPage'; 
import RisksLibraryPage from '@/pages/admin/RisksLibraryPage'; 

const AppLayout = () => (
  <AuthProvider><Toaster position="top-center" /><Outlet /></AuthProvider>
);

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        path: '/dashboard',
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'companies', element: <CompaniesPage /> },
              { path: 'import', element: <ImportPage /> },
              { path: 'cost-centers', element: <CostCentersPage /> },
              { path: 'risks-library', element: <RisksLibraryPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);