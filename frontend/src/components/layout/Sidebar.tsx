import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext'; 
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Building2,
  Upload,
  LogOut,
  Receipt,
  BookOpen,
  Users,
  Activity,
  Settings,
  Stethoscope,
  ShieldCheck,
  Shield,
  FileText // 👇 1. IMPORTAMOS EL NUEVO ICONO
} from 'lucide-react';

type UserRole = 'ADMIN_VITAM' | 'USER_VITAM' | 'ADMIN_EMPRESA' | 'USER_EMPRESA';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  exact?: boolean;
  allowedRoles: UserRole[] | 'ALL';
}

// --- CONFIGURACIÓN DE NAVEGACIÓN ---
const navigation: NavItem[] = [
  // --- NIVEL 1: GLOBAL ---
  { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard, exact: true, allowedRoles: 'ALL' },
  { name: 'Órdenes', href: '/dashboard/orders', icon: FileSpreadsheet, allowedRoles: 'ALL' },
  { name: 'Vigilancia Médica', href: '/dashboard/surveillance', icon: Activity, allowedRoles: 'ALL' },
  { name: 'Nómina', href: '/dashboard/workers', icon: Users, allowedRoles: 'ALL' },
  
  // 👇 2. AQUÍ AGREGAMOS EL BOTÓN DE REPORTES
  { name: 'Reportes', href: '/dashboard/reports', icon: FileText, allowedRoles: 'ALL' },

  // --- NIVEL 2: ADMIN EMPRESA + VITAM ---
  { 
    name: 'Empresas', 
    href: '/dashboard/companies', 
    icon: Building2, 
    allowedRoles: ['ADMIN_VITAM', 'ADMIN_EMPRESA'] 
  },
  { 
    name: 'Biblioteca Técnica', 
    href: '/dashboard/risks-library', 
    icon: BookOpen, 
    allowedRoles: ['ADMIN_VITAM', 'ADMIN_EMPRESA'] 
  },
  // 👇 MODIFICADO: Ahora visible para Admin Empresa también
  { 
    name: 'Gestión Documental (ODI)', 
    href: '/dashboard/risk-management', 
    icon: ShieldCheck, 
    allowedRoles: ['ADMIN_VITAM', 'ADMIN_EMPRESA'] 
  },

  // --- NIVEL 3: SOLO SUPER ADMIN ---
  { 
    name: 'Gestión Usuarios', 
    href: '/dashboard/users', 
    icon: Shield, 
    allowedRoles: ['ADMIN_VITAM'] 
  },
  { 
    name: 'Centros de Costos', 
    href: '/dashboard/cost-centers', 
    icon: Receipt, 
    allowedRoles: ['ADMIN_VITAM'] 
  },
  { 
    name: 'Reglas Médicas', 
    href: '/dashboard/ges-rules', 
    icon: ShieldCheck, 
    allowedRoles: ['ADMIN_VITAM'] 
  },
  { 
    name: 'Baterías', 
    href: '/dashboard/batteries', 
    icon: Stethoscope, 
    allowedRoles: ['ADMIN_VITAM'] 
  },
  { 
    name: 'Configuración', 
    href: '/dashboard/config', 
    icon: Settings, 
    allowedRoles: ['ADMIN_VITAM'] 
  },
  { 
    name: 'Importar Datos', 
    href: '/dashboard/import', 
    icon: Upload, 
    allowedRoles: ['ADMIN_VITAM'] 
  },
];

export function Sidebar() {
  const { logout, user } = useAuth();

  const filteredNavigation = navigation.filter((item) => {
    if (!user) return false;
    if (item.allowedRoles === 'ALL') return true;
    return item.allowedRoles.includes(user.role as UserRole);
  });

  return (
    <div className="hidden border-r border-purple-900/20 bg-secondary text-white md:flex flex-col h-screen sticky top-0 md:w-64 shadow-xl z-50">
      
      {/* HEADER AJUSTADO */}
      <div className="flex h-32 items-center justify-center border-b border-white/10 bg-black/10 backdrop-blur-sm p-1 overflow-hidden">
         <img 
           src="/logo.png" 
           alt="GESTUM Logo" 
           className="h-full w-auto max-w-full object-contain brightness-0 invert hover:scale-105 transition-transform duration-300" 
         />
      </div>

      {/* USUARIO */}
      <div className="p-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shadow-md border border-white/20 shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <div className="text-sm font-medium text-white truncate">{user?.name || 'Usuario'}</div>
            <div className="text-xs text-purple-200 truncate opacity-80">
              {user?.role === 'ADMIN_VITAM' ? 'Super Admin' : 
               user?.role === 'ADMIN_EMPRESA' ? 'Administrador' : 'Usuario'}
            </div>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-800 scrollbar-track-transparent">
        <div className="px-3 mb-2 text-xs font-semibold text-purple-300/50 uppercase tracking-wider">
            Menú Principal
        </div>
        
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative",
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-purple-100/70 hover:bg-white/10 hover:text-white"
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

      {/* LOGOUT */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <button
          onClick={logout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-300 rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200 group"
        >
          <LogOut className="mr-3 h-5 w-5 group-hover:animate-pulse" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}