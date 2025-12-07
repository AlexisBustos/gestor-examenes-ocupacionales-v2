import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Toaster } from 'sonner';

// IMPORTAMOS EL GUARDIA DE SEGURIDAD (Asegúrate de haber creado este componente)
import { RoleGuard } from '@/components/auth/RoleGuard';

// PÁGINAS GENERALES (LAYOUTS)
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import OrdersPage from '@/pages/OrdersPage';
import ImportPage from '@/pages/ImportPage';

// PÁGINAS ADMIN
// Asegúrate de que creaste UsersPage en el paso anterior
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
      { path: '/login', element: <LoginPage /> },
      {
        path: '/dashboard',
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              // ------------------------------------------------------------------
              // NIVEL 1: ACCESO GLOBAL (Permitido para TODOS los roles)
              // Según tu matriz: Inicio, Órdenes, Vigilancia y Nómina tienen "SÍ" en todos.
              // ------------------------------------------------------------------
              { index: true, element: <DashboardPage /> },
              { path: 'orders', element: <OrdersPage /> },
              { path: 'surveillance', element: <MedicalSurveillancePage /> },
              { path: 'workers', element: <WorkersPage /> }, // Nómina accesible por todos según tabla

              // ------------------------------------------------------------------
              // NIVEL 2: GESTIÓN DE EMPRESAS
              // Permitido para: ADMIN_VITAM y ADMIN_EMPRESA
              // ------------------------------------------------------------------
              {
                element: <RoleGuard allowedRoles={['ADMIN_VITAM', 'ADMIN_EMPRESA']} />,
                children: [
                  { path: 'companies', element: <CompaniesPage /> },
                ]
              },

              // ------------------------------------------------------------------
              // NIVEL 3: SUPER ADMIN (Exclusivo ADMIN_VITAM)
              // Aquí van todos los módulos donde los demás tienen "NO" en tu tabla.
              // ------------------------------------------------------------------
              {
                element: <RoleGuard allowedRoles={['ADMIN_VITAM']} />,
                children: [
                  { path: 'users', element: <UsersPage /> },            // Gestión de Usuarios
                  { path: 'cost-centers', element: <CostCentersPage /> }, // Tu tabla dice NO para Admin Empresa
                  { path: 'risks-library', element: <RisksLibraryPage /> },
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