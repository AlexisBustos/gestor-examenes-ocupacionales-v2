import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Building2,
  Upload,
  LogOut,
  Receipt // Icono para Centro de Costos
} from 'lucide-react';

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { name: 'Órdenes', href: '/dashboard/orders', icon: FileSpreadsheet },
  { name: 'Empresas', href: '/dashboard/companies', icon: Building2 },
  { name: 'Centros de Costos', href: '/dashboard/cost-centers', icon: Receipt }, // <--- NUEVO BOTÓN
  { name: 'Importar Datos', href: '/dashboard/import', icon: Upload },
];

export function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <div className="hidden border-r bg-slate-900 text-slate-100 md:flex flex-col h-screen sticky top-0 md:w-64">
      
      {/* 1. HEADER CON LOGO VITAM */}
      <div className="flex h-20 items-center justify-center border-b border-slate-800 bg-white gap-3 px-2">
        <img 
          src="https://vitamhc.cl/wp-content/uploads/2025/09/10.png" 
          alt="Vitam Healthcare" 
          className="h-10 w-auto object-contain" 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const span = e.currentTarget.nextElementSibling;
            if (span) span.classList.remove('hidden');
          }}
        />
        {/* Texto de respaldo */}
        <span className="font-bold text-lg text-blue-900 leading-tight hidden md:block">
          GES <span className="text-xs block font-normal text-slate-500">Gestor Ocupacional</span>
        </span>
      </div>

      {/* 2. USUARIO */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-slate-100 truncate">{user?.name || 'Usuario'}</div>
            <div className="text-xs text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* 3. NAVEGACIÓN */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                isActive
                  ? "bg-blue-600 text-white shadow-md translate-x-1"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1"
              )
            }
          >
            <item.icon
              className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors")}
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* 4. LOGOUT */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-red-950/30 hover:text-red-300 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}