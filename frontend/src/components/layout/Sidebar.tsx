import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, FileSpreadsheet, Building2 } from 'lucide-react';

const sidebarItems = [
    { icon: Home, label: 'Inicio', href: '/dashboard' },
    { icon: FileSpreadsheet, label: 'Órdenes', href: '/dashboard/orders' },
    { icon: Building2, label: 'Empresas', href: '/dashboard/companies' },
];

export function Sidebar({ className }: { className?: string }) {
    const location = useLocation();

    return (
        <div className={cn('pb-12 w-64 border-r bg-background h-screen', className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Gestor Exámenes
                    </h2>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                                    location.pathname === item.href ? 'bg-accent text-accent-foreground' : 'transparent'
                                )}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
