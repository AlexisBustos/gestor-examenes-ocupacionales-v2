import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as OrdersService from '@/services/orders.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Calendar,
  CheckCircle,
  Ban,
  Eye,
  Filter
} from 'lucide-react';

import { NewOrderSheet } from '@/components/orders/NewOrderSheet';
import { OrderDetailsSheet } from '@/components/orders/OrderDetailsSheet';
import { ScheduleOrderDialog } from '@/components/orders/ScheduleOrderDialog';
import { ResultsDialog } from '@/components/orders/ResultsDialog';

type OrderStatusFilter = 'TODAS' | 'SOLICITADO' | 'AGENDADO' | 'REALIZADO' | 'CERRADO' | 'ANULADO';

export default function OrdersPage() {
  const queryClient = useQueryClient();

  // Estados de Modals
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any>(null);
  const [selectedOrderForSchedule, setSelectedOrderForSchedule] = useState<any>(null);
  const [selectedOrderForResults, setSelectedOrderForResults] = useState<any>(null);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('TODAS');

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', { status: statusFilter }],
    queryFn: () =>
      OrdersService.getOrders(
        statusFilter === 'TODAS' ? undefined : statusFilter
      ),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => await OrdersService.updateOrderStatus(id, 'ANULADO'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success("Solicitud anulada");
      setOrderToCancel(null);
    },
    onError: () => toast.error("Error al anular")
  });

  // 🎨 COLORES DE ESTADO GESTUM
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'SOLICITADO': 'bg-amber-100 text-amber-800 border-amber-200', // Alerta / Pendiente
      'AGENDADO': 'bg-secondary/10 text-secondary border-secondary/20 font-medium', // Morado = Gestión
      'REALIZADO': 'bg-primary/10 text-primary border-primary/20 font-bold', // Verde = Éxito
      'CERRADO': 'bg-slate-100 text-slate-600 border-slate-200',   // Neutro
      'ANULADO': 'bg-red-50 text-red-600 border-red-100',       // Error
    };

    const defaultStyle = 'bg-gray-100 text-gray-800';

    return (
      <Badge className={`border ${styles[status] || defaultStyle} shadow-sm px-2 py-0.5`}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const filteredOrders = orders?.filter((order: any) =>
    order.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.worker.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions: OrderStatusFilter[] = [
    'TODAS',
    'SOLICITADO',
    'AGENDADO',
    'REALIZADO',
    'CERRADO',
    'ANULADO',
  ];

  // SKELETON LOADING
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
           {[...Array(5)].map((_, i) => (
             <div key={i} className="flex justify-between items-center py-4 border-b last:border-0">
               <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div>
               <Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-32" /><Skeleton className="h-6 w-24 rounded-full" />
             </div>
           ))}
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-md border border-red-200">Error al cargar las órdenes. Verifique conexión.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Órdenes</h1>
          <p className="text-muted-foreground">Administra el ciclo de vida de los exámenes ocupacionales.</p>
        </div>
        
        {/* BOTÓN PRINCIPAL: Verde GESTUM */}
        <Button 
            onClick={() => setIsNewOrderOpen(true)} 
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-white transition-all hover:scale-105"
        >
          <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
        </Button>
      </div>

      <Card className="shadow-md border-slate-200 overflow-hidden">
        <CardHeader className="pb-4 border-b bg-slate-50/50 space-y-4">
            
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* BUSCADOR */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre o RUT..."
                        className="pl-9 bg-white border-slate-200 focus:border-primary focus:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* FILTROS */}
                <div className="flex flex-wrap gap-2 items-center">
                    <Filter className="h-4 w-4 text-slate-400 mr-1" />
                    {statusOptions.map((option) => (
                    <Button
                        key={option}
                        variant={statusFilter === option ? 'default' : 'outline'}
                        size="sm"
                        className={
                        statusFilter === option
                            ? 'bg-secondary text-white hover:bg-secondary/90 border-transparent shadow-sm' // Activo: Morado
                            : 'bg-white text-slate-600 hover:text-secondary hover:border-secondary/30' // Inactivo
                        }
                        onClick={() => setStatusFilter(option)}
                    >
                        {option === 'TODAS' ? 'Todas' : option}
                    </Button>
                    ))}
                </div>
            </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="rounded-none border-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="w-[250px] font-semibold text-slate-700">Trabajador</TableHead>
                  <TableHead className="font-semibold text-slate-700">Empresa</TableHead>
                  <TableHead className="font-semibold text-slate-700">Baterías</TableHead>
                  <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                  <TableHead className="font-semibold text-slate-700">Fecha</TableHead>
                  <TableHead className="text-right pr-6 font-semibold text-slate-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 text-slate-300 mb-2" />
                      <p>No se encontraron solicitudes.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders?.map((order: any) => (
                    <TableRow
                      key={order.id}
                      className={`hover:bg-slate-50 transition-colors group ${
                        order.status === 'ANULADO' ? 'opacity-50 bg-slate-50/50' : ''
                      }`}
                    >
                      <TableCell>
                        <div className="font-medium text-slate-900 group-hover:text-primary transition-colors">{order.worker.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{order.worker.rut}</div>
                      </TableCell>
                      <TableCell className="text-slate-600">{order.company.name}</TableCell>
                      <TableCell>
                        <div
                          className="text-xs text-slate-500 max-w-[200px] truncate bg-slate-100 px-2 py-1 rounded w-fit"
                          title={
                            order.orderBatteries && order.orderBatteries.length > 0
                              ? order.orderBatteries.map((ob: any) => ob.battery.name).join(', ')
                              : (order.examBatteries?.map((b: any) => b.name).join(', ') || 'Sin baterías')
                          }
                        >
                          {order.orderBatteries && order.orderBatteries.length > 0
                            ? `${order.orderBatteries.length} Baterías`
                            : (order.examBatteries?.length > 0 ? `${order.examBatteries.length} Baterías` : 'Sin asignar')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(order.scheduledAt || order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          
                          {/* 1. Agendar (Morado - Gestión) */}
                          {order.status === 'SOLICITADO' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSelectedOrderForSchedule(order)}
                              className="h-8 w-8 text-secondary border-secondary/20 hover:bg-secondary/10"
                              title="Agendar Cita"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}

                          {/* 2. Resultados (Verde - Éxito) */}
                          {order.status === 'AGENDADO' && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSelectedOrderForResults(order)}
                              className="h-8 w-8 text-primary border-primary/20 hover:bg-primary/10"
                              title="Cargar Resultados"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {/* 3. Anular */}
                          {['SOLICITADO', 'AGENDADO'].includes(order.status) && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setOrderToCancel(order.id)}
                              className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50"
                              title="Anular"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}

                          {/* 4. Ver */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-slate-100"
                            title="Ver Detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modales */}
      <NewOrderSheet
        open={isNewOrderOpen}
        onOpenChange={(open: boolean) => setIsNewOrderOpen(open)}
      />

      {selectedOrderForDetail && (
        <OrderDetailsSheet
          order={selectedOrderForDetail}
          open={!!selectedOrderForDetail}
          onOpenChange={(open: boolean) => !open && setSelectedOrderForDetail(null)}
        />
      )}

      {selectedOrderForSchedule && (
        <ScheduleOrderDialog
          order={selectedOrderForSchedule}
          open={!!selectedOrderForSchedule}
          onOpenChange={(open: boolean) => !open && setSelectedOrderForSchedule(null)}
        />
      )}

      {selectedOrderForResults && (
        <ResultsDialog
          order={selectedOrderForResults}
          open={!!selectedOrderForResults}
          onOpenChange={(open: boolean) => !open && setSelectedOrderForResults(null)}
        />
      )}

      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Anular Solicitud?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción es irreversible y notificará al administrador.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => orderToCancel && cancelMutation.mutate(orderToCancel)}
            >
              Sí, Anular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}