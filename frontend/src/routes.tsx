import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'sonner';
import { RoleGuard } from '@/components/auth/RoleGuard';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// 👇 1. IMPORTAMOS LA PÁGINA DE CONFIRMACIÓN PÚBLICA
import OdiConfirmation from '@/pages/public/OdiConfirmation';

import DashboardPage from '@/pages/DashboardPage';
import OrdersPage from '@/pages/OrdersPage'; 
import ImportPage from '@/pages/ImportPage'; 

// 👇 2. IMPORTAMOS LA NUEVA PÁGINA DE REPORTES
import ReportsPage from '@/pages/ReportsPage';

import UsersPage from '@/pages/admin/UsersPage'; 
import CompaniesPage from '@/pages/admin/CompaniesPage';
import WorkersPage from '@/pages/admin/WorkersPage';
import CostCentersPage from '@/pages/admin/CostCentersPage';
import RisksLibraryPage from '@/pages/admin/RisksLibraryPage';
import MedicalSurveillancePage from '@/pages/admin/MedicalSurveillancePage';
import ConfigPage from '@/pages/admin/ConfigPage';
import BatteriesPage from '@/pages/admin/BatteriesPage';
import GesRulesPage from '@/pages/admin/GesRulesPage';
import RiskManagement from '@/pages/admin/RiskManagement';

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
      // === RUTAS PÚBLICAS (ACCESO LIBRE) ===
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/auth/reset-password', element: <ResetPasswordPage /> },
      
      // RUTA DE FIRMA (PÚBLICA)
      { path: '/confirmar-odi', element: <OdiConfirmation /> },

      // === RUTAS PROTEGIDAS (REQUIEREN LOGIN) ===
      {
        path: '/dashboard',
        element: <ProtectedRoute />, 
        children: [
          {
            element: <DashboardLayout />,
            children: [
              // Nivel 1: Todos (Accesible para cualquier usuario logueado)
              { index: true, element: <DashboardPage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'surveillance', element: <MedicalSurveillancePage /> },
              { path: 'workers', element: <WorkersPage /> },
              
              // 👇 3. AQUÍ AGREGAMOS LA RUTA DE REPORTES
              { path: 'reports', element: <ReportsPage /> },

              // Nivel 2: Admin Empresa + Vitam
              {
                element: <RoleGuard allowedRoles={['ADMIN_VITAM', 'ADMIN_EMPRESA']} />,
                children: [
                  { path: 'companies', element: <CompaniesPage /> },
                  { path: 'risks-library', element: <RisksLibraryPage /> },
                  // 👇 MOVIMOS ESTO AQUÍ: Ahora Admin Empresa puede entrar
                  { path: 'risk-management', element: <RiskManagement /> }, 
                ]
              },

              // Nivel 3: Solo Admin Vitam
              {
                element: <RoleGuard allowedRoles={['ADMIN_VITAM']} />,
                children: [
                  { path: 'users', element: <UsersPage /> },
                  { path: 'cost-centers', element: <CostCentersPage /> },
                  { path: 'ges-rules', element: <GesRulesPage /> },
                  { path: 'config', element: <ConfigPage /> },
                  { path: 'batteries', element: <BatteriesPage /> },
                  { path: 'import', element: <ImportPage /> },
                  // (risk-management ya no está aquí, subió al nivel 2)
                ]
              }
            ],
          },
        ],
      },
      // Cualquier otra ruta redirige al dashboard (o login si no está autenticado)
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);