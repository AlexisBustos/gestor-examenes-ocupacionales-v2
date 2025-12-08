import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // <--- Importamos el contexto
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function Header() {
    const { user } = useAuth(); // <--- Obtenemos al usuario logueado

    // Función auxiliar para mostrar el rol de forma amigable
    const getRoleLabel = (role?: string) => {
        switch (role) {
            case 'ADMIN_VITAM': return 'Super Admin';
            case 'USER_VITAM': return 'Equipo Vitam';
            case 'ADMIN_EMPRESA': return 'Administrador';
            case 'USER_EMPRESA': return 'Usuario';
            default: return 'Invitado';
        }
    };

    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:h-[60px] justify-between">
            {/* SECCIÓN IZQUIERDA: MENÚ MÓVIL Y TÍTULO */}
            <div className="flex items-center gap-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0 md:hidden">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-0 w-64">
                        <Sidebar />
                    </SheetContent>
                </Sheet>
                {/* Podríamos hacer este título dinámico según la ruta, pero por ahora estático está bien */}
                <h1 className="text-lg font-semibold hidden md:block">Panel de Control</h1>
            </div>

            {/* SECCIÓN DERECHA: PERFIL DE USUARIO */}
            <div className="flex items-center gap-3">
                
                {/* Texto: Nombre y Rol (Oculto en móviles muy pequeños para ahorrar espacio) */}
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium leading-none">
                        {user?.name || 'Usuario'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                        {getRoleLabel(user?.role)}
                    </span>
                </div>

                {/* Avatar con Iniciales */}
                <Avatar className="h-9 w-9 border border-slate-200">
                    {/* Si tuvieras foto de perfil en el backend, iría aquí en src */}
                    <AvatarImage src="" alt={user?.name} /> 
                    <AvatarFallback className="bg-blue-600 text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}