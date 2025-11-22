import { Card } from '@/components/ui/Card';

export default function DashboardPage() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card title="Total Órdenes">
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
            </Card>
            <Card title="Empresas Activas">
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">+1 nueva esta semana</p>
            </Card>
            <Card title="Exámenes Realizados">
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-muted-foreground">+15% vs mes anterior</p>
            </Card>
            <Card title="Pendientes">
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">Requieren atención</p>
            </Card>
        </div>
    );
}
