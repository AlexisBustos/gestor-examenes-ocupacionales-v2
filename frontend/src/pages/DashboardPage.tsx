import { Card } from '@/components/ui/Card';
import { useOrders } from '@/hooks/useOrders';
import { FileSpreadsheet, Building2, CheckCircle2, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    const { data: orders, isLoading } = useOrders();

    if (isLoading) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter(o => ['SOLICITADO', 'AGENDADO'].includes(o.status)).length || 0;
    const completedOrders = orders?.filter(o => ['REALIZADO', 'CERRADO'].includes(o.status)).length || 0;
    const uniqueCompanies = new Set(orders?.map(o => o.company.id)).size || 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Solicitudes</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalOrders}</h3>
                    </div>
                </div>
            </Card>

            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl">
                        <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                        <h3 className="text-2xl font-bold text-gray-900">{pendingOrders}</h3>
                    </div>
                </div>
            </Card>

            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Completadas</p>
                        <h3 className="text-2xl font-bold text-gray-900">{completedOrders}</h3>
                    </div>
                </div>
            </Card>

            <Card className="p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-xl">
                        <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Empresas Activas</p>
                        <h3 className="text-2xl font-bold text-gray-900">{uniqueCompanies}</h3>
                    </div>
                </div>
            </Card>
        </div>
    );
}
