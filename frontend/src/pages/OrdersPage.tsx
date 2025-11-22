import { useState } from 'react';
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

const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case 'SOLICITADO':
            return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-transparent';
        case 'AGENDADO':
            return 'bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-transparent';
        case 'REALIZADO':
            return 'bg-green-100 text-green-700 hover:bg-green-100/80 border-transparent';
        case 'CERRADO':
            return 'bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-transparent';
        case 'ANULADO':
            return 'bg-red-100 text-red-700 hover:bg-red-100/80 border-transparent';
        default:
            return 'bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-transparent';
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export default function OrdersPage() {
    const { data: orders, isLoading, error } = useOrders();
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredOrders = orders?.filter((order) =>
        order.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.worker.rut.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Gestión de Órdenes</h2>
                <p className="text-muted-foreground">Administra y monitorea los exámenes ocupacionales</p>
            </div>

            <div className="flex items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o RUT..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-gray-200">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                            <TableHead className="font-medium text-gray-500">Trabajador</TableHead>
                            <TableHead className="font-medium text-gray-500">RUT</TableHead>
                            <TableHead className="font-medium text-gray-500">Empresa</TableHead>
                            <TableHead className="font-medium text-gray-500">Batería</TableHead>
                            <TableHead className="font-medium text-gray-500">Fecha</TableHead>
                            <TableHead className="font-medium text-gray-500">Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders?.map((order) => (
                            <TableRow key={order.id} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="p-4 font-medium text-gray-900">{order.worker.name}</TableCell>
                                <TableCell className="p-4 text-gray-600">{order.worker.rut}</TableCell>
                                <TableCell className="p-4 text-gray-600">{order.company.name}</TableCell>
                                <TableCell className="p-4 text-gray-600">{order.examBattery.name}</TableCell>
                                <TableCell className="p-4 text-gray-600">
                                    {formatDate(order.scheduledAt || order.createdAt)}
                                </TableCell>
                                <TableCell className="p-4">
                                    <Badge className={getStatusColor(order.status)} variant="outline">
                                        {order.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredOrders?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                    No se encontraron resultados para "{searchTerm}"
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
