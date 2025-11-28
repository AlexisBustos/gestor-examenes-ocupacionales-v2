import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'sonner';

// PÁGINAS BASE
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import OrdersPage from '@/pages/OrdersPage';
import ImportPage from '@/pages/ImportPage';

// PÁGINAS ADMIN
import CompaniesPage from '@/pages/admin/CompaniesPage';
import WorkersPage from '@/pages/admin/WorkersPage';
import CostCentersPage from '@/pages/admin/CostCentersPage';
import RisksLibraryPage from '@/pages/admin/RisksLibraryPage';
import MedicalSurveillancePage from '@/pages/admin/MedicalSurveillancePage';
import ConfigPage from '@/pages/admin/ConfigPage';
import BatteriesPage from '@/pages/admin/BatteriesPage';

const AppLayout = () => (
  <AuthProvider>
    <Toaster position="top-center" />
    <Outlet />
  </AuthProvider>
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
              
              // Operación
              { path: 'orders', element: <OrdersPage /> },
              { path: 'surveillance', element: <MedicalSurveillancePage /> },
              { path: 'import', element: <ImportPage /> },

              // Administración
              { path: 'companies', element: <CompaniesPage /> },
              { path: 'workers', element: <WorkersPage /> },
              { path: 'cost-centers', element: <CostCentersPage /> },
              { path: 'risks-library', element: <RisksLibraryPage /> },
              { path: 'config', element: <ConfigPage /> },
              { path: 'batteries', element: <BatteriesPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);