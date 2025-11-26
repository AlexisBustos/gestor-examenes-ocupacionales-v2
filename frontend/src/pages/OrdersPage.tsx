import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as OrdersService from '@/services/orders.service';
import { Input } from '@/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Eye, Calendar, Ban, CheckCircle } from 'lucide-react';
import { NewOrderSheet } from '@/components/orders/NewOrderSheet';
import { OrderDetailsSheet } from '@/components/orders/OrderDetailsSheet';
import { ScheduleOrderDialog } from '@/components/orders/ScheduleOrderDialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { OrderStatus } from '@/types/order.types';

export default function OrdersPage() {
  const queryClient = useQueryClient();

  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any>(null);
  const [selectedOrderForSchedule, setSelectedOrderForSchedule] = useState<any>(null);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [orderToComplete, setOrderToComplete] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: OrdersService.getOrders,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => { await OrdersService.updateOrderStatus(id, 'ANULADO'); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); toast.success("Solicitud anulada"); setOrderToCancel(null); },
    onError: () => { toast.error("Error al anular"); setOrderToCancel(null); }
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => { await OrdersService.updateOrderStatus(id, 'REALIZADO'); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); toast.success("Orden realizada"); setOrderToComplete(null); },
    onError: () => toast.error("Error al completar")
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'SOLICITADO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'AGENDADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REALIZADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'CERRADO': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ANULADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const filteredOrders = orders?.filter((order: any) =>
    order.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.worker.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- ESTADO DE CARGA CON SKELETONS ---
  if (isLoading) {
    return (
      <div className="space-y-6 p-2">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="border rounded-md p-4 space-y-4">
          <div className="flex justify-between mb-6">
            <Skeleton className="h-10 w-64" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-4 border-b last:border-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-red-500">Error al cargar órdenes</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">No se encontraron resultados.</TableCell></TableRow>
                ) : (
                  filteredOrders?.map((order: any) => (
                    <TableRow key={order.id} className={order.status === 'ANULADO' ? 'opacity-60 bg-slate-50' : ''}>
                      <TableCell>
                        <div className="font-medium">{order.worker.name}</div>
                        <div className="text-sm text-muted-foreground">{order.worker.rut}</div>
                      </TableCell>
                      <TableCell>{order.company.name}</TableCell>
                      <TableCell>
                        <div className="font-medium">{order.ges.name}</div>
                        <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {order.examBatteries && order.examBatteries.length > 0 ? order.examBatteries.map((b: any) => b.name).join(', ') : 'Sin baterías'}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={getStatusColor(order.status)} variant="outline">{order.status}</Badge></TableCell>
                      <TableCell>{formatDate(order.scheduledAt || order.createdAt)}</TableCell>
                      <TableCell className="text-right flex justify-end gap-1">
                        {order.status === 'SOLICITADO' && (
                          <Button variant="outline" size="icon" onClick={() => setSelectedOrderForSchedule(order)} title="Agendar Cita" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        )}
                        {order.status === 'AGENDADO' && (
                          <Button variant="outline" size="icon" onClick={() => setOrderToComplete(order.id)} title="Marcar Realizado" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {['SOLICITADO', 'AGENDADO'].includes(order.status) && (
                          <Button variant="outline" size="icon" onClick={() => setOrderToCancel(order.id)} title="Anular Solicitud" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200">
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => setSelectedOrderForDetail(order)} title="Ver Detalle" className="h-8 w-8">
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
      {selectedOrderForDetail && <OrderDetailsSheet order={selectedOrderForDetail} open={!!selectedOrderForDetail} onOpenChange={(open) => !open && setSelectedOrderForDetail(null)} />}
      {selectedOrderForSchedule && <ScheduleOrderDialog order={selectedOrderForSchedule} open={!!selectedOrderForSchedule} onOpenChange={(open) => !open && setSelectedOrderForSchedule(null)} />}

      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Anular Solicitud?</AlertDialogTitle><AlertDialogDescription>La solicitud pasará a estado ANULADO.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={() => orderToCancel && cancelMutation.mutate(orderToCancel)}>Sí, Anular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!orderToComplete} onOpenChange={() => setOrderToComplete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="text-green-700">¿Confirmar Realización?</AlertDialogTitle><AlertDialogDescription>El trabajador ya asistió al examen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-green-600" onClick={() => orderToComplete && completeMutation.mutate(orderToComplete)}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}