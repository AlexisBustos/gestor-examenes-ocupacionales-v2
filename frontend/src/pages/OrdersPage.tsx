import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as OrdersService from '@/services/orders.service';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye, Calendar, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { NewOrderSheet } from '@/components/orders/NewOrderSheet';
import { OrderDetailsSheet } from '@/components/orders/OrderDetailsSheet';
import { ScheduleOrderDialog } from '@/components/orders/ScheduleOrderDialog';
import { ResultsDialog } from '@/components/orders/ResultsDialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function OrdersPage() {
  const queryClient = useQueryClient();
  
  // Estados de Modals
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any>(null);
  const [selectedOrderForSchedule, setSelectedOrderForSchedule] = useState<any>(null);
  const [selectedOrderForResults, setSelectedOrderForResults] = useState<any>(null);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: OrdersService.getOrders,
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

  // 🎨 COLORES DE ESTADO (CORREGIDOS Y FUERTES)
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'SOLICITADO': 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100', // Amarillo
      'AGENDADO':   'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',     // Azul
      'REALIZADO':  'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100', // Verde
      'CERRADO':    'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100',   // Gris
      'ANULADO':    'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',       // Rojo
    };

    const defaultStyle = 'bg-gray-100 text-gray-800 hover:bg-gray-100';

    return (
      <Badge className={`border ${styles[status] || defaultStyle} shadow-sm`}>
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

  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-md border border-red-200">Error al cargar las órdenes. Verifique conexión.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gestión de Órdenes</h1>
          <p className="text-muted-foreground">Administra el ciclo de vida de los exámenes.</p>
        </div>
        <Button onClick={() => setIsNewOrderOpen(true)} className="bg-blue-700 hover:bg-blue-800 shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b bg-slate-50/50">
          <div className="flex justify-between items-center">
            <CardTitle>Listado de Solicitudes</CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar trabajador..." 
                className="pl-8 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[250px]">Trabajador</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Baterías</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right pr-6">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">No se encontraron resultados.</TableCell></TableRow>
                ) : (
                  filteredOrders?.map((order: any) => (
                    <TableRow key={order.id} className={`hover:bg-slate-50 transition-colors ${order.status === 'ANULADO' ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{order.worker.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{order.worker.rut}</div>
                      </TableCell>
                      <TableCell className="text-slate-600">{order.company.name}</TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-500 max-w-[200px] truncate" title={
                             order.orderBatteries && order.orderBatteries.length > 0 
                             ? order.orderBatteries.map((ob: any) => ob.battery.name).join(', ')
                             : (order.examBatteries?.map((b: any) => b.name).join(', ') || 'Sin baterías')
                        }>
                            {order.orderBatteries && order.orderBatteries.length > 0 
                                ? `${order.orderBatteries.length} Baterías`
                                : (order.examBatteries?.length > 0 ? `${order.examBatteries.length} Baterías` : 'Sin asignar')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {/* AQUÍ USAMOS LA NUEVA FUNCIÓN DE COLOR */}
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(order.scheduledAt || order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          
                          {/* ACCIONES DINÁMICAS */}
                          
                          {/* 1. Agendar (Solo Solicitado) */}
                          {order.status === 'SOLICITADO' && (
                            <Button variant="outline" size="icon" onClick={() => setSelectedOrderForSchedule(order)} className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50" title="Agendar">
                              <Calendar className="h-4 w-4" />
                            </Button>
                          )}

                          {/* 2. Resultados (Solo Agendado) */}
                          {order.status === 'AGENDADO' && (
                            <Button variant="outline" size="icon" onClick={() => setSelectedOrderForResults(order)} className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50" title="Cargar Resultados">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {/* 3. Anular (Activas) */}
                          {['SOLICITADO', 'AGENDADO'].includes(order.status) && (
                            <Button variant="outline" size="icon" onClick={() => setOrderToCancel(order.id)} className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50" title="Anular">
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* 4. Ver (Siempre) */}
                          <Button variant="ghost" size="icon" onClick={() => setSelectedOrderForDetail(order)} className="h-8 w-8 text-slate-500 hover:text-slate-900" title="Ver Detalle">
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
      <NewOrderSheet open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen} />
      
      {selectedOrderForDetail && <OrderDetailsSheet order={selectedOrderForDetail} open={!!selectedOrderForDetail} onOpenChange={(open) => !open && setSelectedOrderForDetail(null)} />}
      
      {selectedOrderForSchedule && <ScheduleOrderDialog order={selectedOrderForSchedule} open={!!selectedOrderForSchedule} onOpenChange={(open) => !open && setSelectedOrderForSchedule(null)} />}

      {selectedOrderForResults && (
        <ResultsDialog 
            order={selectedOrderForResults} 
            open={!!selectedOrderForResults} 
            onOpenChange={(open) => !open && setSelectedOrderForResults(null)} 
        />
      )}

      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Anular Solicitud?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => orderToCancel && cancelMutation.mutate(orderToCancel)}>Sí, Anular</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}