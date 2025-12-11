import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import { RoleGuard } from '@/components/auth/RoleGuard';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
// 👇 IMPORTAMOS LAS NUEVAS PÁGINAS DE AUTH
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

import DashboardPage from '@/pages/DashboardPage';
import OrdersPage from '@/pages/OrdersPage'; 
import ImportPage from '@/pages/ImportPage'; 

import UsersPage from '@/pages/admin/UsersPage'; 
import CompaniesPage from '@/pages/admin/CompaniesPage';
import WorkersPage from '@/pages/admin/WorkersPage';
import CostCentersPage from '@/pages/admin/CostCentersPage';
import RisksLibraryPage from '@/pages/admin/RisksLibraryPage';
import MedicalSurveillancePage from '@/pages/admin/MedicalSurveillancePage';
import ConfigPage from '@/pages/admin/ConfigPage';
import BatteriesPage from '@/pages/admin/BatteriesPage';
import GesRulesPage from '@/pages/admin/GesRulesPage';

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
      // === RUTAS PÚBLICAS ===
      { path: '/login', element: <LoginPage /> },
      // 👇 AGREGAMOS ESTAS DOS LÍNEAS AQUÍ
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/auth/reset-password', element: <ResetPasswordPage /> },

      // === RUTAS PROTEGIDAS ===
      {
        path: '/dashboard',
        element: <ProtectedRoute />, 
        children: [
          {
            element: <DashboardLayout />,
            children: [
              // ============================================================
              // NIVEL 1: ACCESO GLOBAL (TODOS)
              // ============================================================
              { index: true, element: <DashboardPage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'surveillance', element: <MedicalSurveillancePage /> },
              { path: 'workers', element: <WorkersPage /> }, 

              // ============================================================
              // NIVEL 2: GESTIÓN DE EMPRESA (ADMIN_VITAM + ADMIN_EMPRESA)
              // ============================================================
              {
                element: <RoleGuard allowedRoles={['ADMIN_VITAM', 'ADMIN_EMPRESA']} />,
                children: [
                  { path: 'companies', element: <CompaniesPage /> },
                  { path: 'risks-library', element: <RisksLibraryPage /> }, 
                ]
              },

              // ============================================================
              // NIVEL 3: EXCLUSIVO SUPER ADMIN (SOLO ADMIN_VITAM)
              // ============================================================
              {
                element: <RoleGuard allowedRoles={['ADMIN_VITAM']} />,
                children: [
                  { path: 'users', element: <UsersPage /> },
                  { path: 'cost-centers', element: <CostCentersPage /> },
                  { path: 'ges-rules', element: <GesRulesPage /> },
                  { path: 'config', element: <ConfigPage /> },
                  { path: 'batteries', element: <BatteriesPage /> },
                  { path: 'import', element: <ImportPage /> },
                ]
              }
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);