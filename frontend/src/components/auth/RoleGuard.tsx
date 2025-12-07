import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

// 👇 AQUÍ ESTÁ EL TRUCO: Definimos los roles aquí mismo para no pedirlos fuera
type UserRole = 'ADMIN_VITAM' | 'USER_VITAM' | 'ADMIN_EMPRESA' | 'USER_EMPRESA';

interface RoleGuardProps {
    allowedRoles: UserRole[]; 
}

export const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
    const { user, isLoading, isAuthenticated } = useAuth();

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // TypeScript ahora sabe qué es UserRole porque lo escribimos arriba
    if (!allowedRoles.includes(user.role as UserRole)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};