import { useState } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye, Calendar } from 'lucide-react';
import { NewOrderSheet } from '@/components/orders/NewOrderSheet';
import { OrderDetailsSheet } from '@/components/orders/OrderDetailsSheet';
import { ScheduleOrderDialog } from '@/components/orders/ScheduleOrderDialog';
import type { OrderStatus } from '@/types/order.types';

export default function OrdersPage() {
  const { data: orders, isLoading, error } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any>(null);
  const [selectedOrderForSchedule, setSelectedOrderForSchedule] = useState<any>(null);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'SOLICITADO': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'AGENDADO': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'REALIZADO': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'CERRADO': return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
      case 'ANULADO': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredOrders = orders?.filter(order => 
    order.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.worker.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-8 text-center">Cargando órdenes...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error al cargar órdenes</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Órdenes</h1>
          <p className="text-muted-foreground">Administra y monitorea las solicitudes de exámenes.</p>
        </div>
        <Button onClick={() => setIsNewOrderOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listado de Solicitudes</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por trabajador o RUT..."
              className="pl-8 max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trabajador</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>GES / Baterías</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">No se encontraron resultados.</TableCell>
                  </TableRow>
                ) : (
                  filteredOrders?.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.worker.name}</div>
                        <div className="text-sm text-muted-foreground">{order.worker.rut}</div>
                      </TableCell>
                      <TableCell>{order.company.name}</TableCell>
                      <TableCell>
                        <div className="font-medium">{order.ges.name}</div>
                        <div className="text-xs text-muted-foreground">
                            {/* LÓGICA MULTI BATERÍA */}
                            {order.examBatteries && order.examBatteries.length > 0 
                                ? order.examBatteries.map(b => b.name).join(', ')
                                : 'Sin baterías asignadas'
                            }
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.scheduledAt || order.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {order.status === 'SOLICITADO' && (
                          <Button variant="outline" size="icon" onClick={() => setSelectedOrderForSchedule(order)} title="Agendar Cita">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setSelectedOrderForDetail(order)} title="Ver Detalle">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NewOrderSheet open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen} />
      
      {selectedOrderForDetail && (
        <OrderDetailsSheet order={selectedOrderForDetail} open={!!selectedOrderForDetail} onOpenChange={(open) => !open && setSelectedOrderForDetail(null)} />
      )}

      {selectedOrderForSchedule && (
        <ScheduleOrderDialog order={selectedOrderForSchedule} open={!!selectedOrderForSchedule} onOpenChange={(open) => !open && setSelectedOrderForSchedule(null)} />
      )}
    </div>
  );
}