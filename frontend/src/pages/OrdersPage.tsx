import { useOrders } from '@/hooks/useOrders';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Loader2, Search } from 'lucide-react';
import type { OrderStatus } from '@/types/order.types';

const getStatusVariant = (status: OrderStatus) => {
    switch (status) {
        case 'SOLICITADO':
            return 'secondary';
        case 'AGENDADO':
            return 'default'; // Blue-ish usually
        case 'REALIZADO':
            return 'outline'; // Or success color if we had one
        case 'CERRADO':
            return 'outline';
        case 'ANULADO':
            return 'destructive';
        default:
            return 'default';
    }
};

export default function OrdersPage() {
    const { data: orders, isLoading, error } = useOrders();

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-destructive">
                Error al cargar las órdenes
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Órdenes</h2>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar..." className="pl-8 w-[250px]" />
                    </div>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Trabajador</TableHead>
                            <TableHead>RUT</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Batería</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders?.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.worker.name}</TableCell>
                                <TableCell>{order.worker.rut}</TableCell>
                                <TableCell>{order.company.name}</TableCell>
                                <TableCell>{order.examBattery.name}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(order.status)}>
                                        {order.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {orders?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    No se encontraron órdenes.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
