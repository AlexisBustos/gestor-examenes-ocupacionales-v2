import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as OrdersService from '@/services/orders.service';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye, Calendar, Ban, CheckCircle } from 'lucide-react';
import { NewOrderSheet } from '@/components/orders/NewOrderSheet';
import { OrderDetailsSheet } from '@/components/orders/OrderDetailsSheet';
import { ScheduleOrderDialog } from '@/components/orders/ScheduleOrderDialog';
import { ResultsDialog } from '@/components/orders/ResultsDialog'; // <--- ESTO ES EL PROMPT 33
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
  const [selectedOrderForResults, setSelectedOrderForResults] = useState<any>(null); // <--- ESTADO PARA RESULTADOS
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: OrdersService.getOrders,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => await OrdersService.updateOrderStatus(id, 'ANULADO'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); toast.success("Anulada"); setOrderToCancel(null); },
    onError: () => toast.error("Error al anular")
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'SOLICITADO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'AGENDADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REALIZADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'ANULADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const filteredOrders = orders?.filter((order: any) => 
    order.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.worker.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-2">
        <div className="flex justify-between"><Skeleton className="h-10 w-48"/><Skeleton className="h-10 w-32"/></div>
        <div className="border rounded-md p-4 space-y-4"><Skeleton className="h-10 w-full"/><Skeleton className="h-64 w-full"/></div>
      </div>
    );
  }
  if (error) return <div className="p-8 text-center text-red-500">Error al cargar</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Órdenes</h1>
        <Button onClick={() => setIsNewOrderOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nueva Solicitud</Button>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle>Listado</CardTitle>
        <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Buscar..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div></CardHeader>
        <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Trabajador</TableHead><TableHead>Empresa</TableHead><TableHead>Baterías</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredOrders?.map((order: any) => (
                    <TableRow key={order.id} className={order.status === 'ANULADO' ? 'opacity-60' : ''}>
                      <TableCell><div>{order.worker.name}</div><div className="text-xs text-muted-foreground">{order.worker.rut}</div></TableCell>
                      <TableCell>{order.company.name}</TableCell>
                      <TableCell><div className="text-xs max-w-[150px] truncate">{order.examBatteries?.map((b: any) => b.name).join(', ') || '-'}</div></TableCell>
                      <TableCell><Badge className={getStatusColor(order.status)} variant="outline">{order.status}</Badge></TableCell>
                      <TableCell>{formatDate(order.scheduledAt || order.createdAt)}</TableCell>
                      <TableCell className="text-right flex justify-end gap-1">
                        {order.status === 'SOLICITADO' && <Button variant="outline" size="icon" onClick={() => setSelectedOrderForSchedule(order)}><Calendar className="h-4 w-4 text-blue-600" /></Button>}
                        {/* 👇 BOTÓN VERDE DE RESULTADOS */}
                        {order.status === 'AGENDADO' && <Button variant="outline" size="icon" onClick={() => setSelectedOrderForResults(order)}><CheckCircle className="h-4 w-4 text-green-600" /></Button>}
                        {['SOLICITADO', 'AGENDADO'].includes(order.status) && <Button variant="outline" size="icon" onClick={() => setOrderToCancel(order.id)}><Ban className="h-4 w-4 text-red-600" /></Button>}
                        <Button variant="ghost" size="icon" onClick={() => setSelectedOrderForDetail(order)}><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <NewOrderSheet open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen} />
      {selectedOrderForDetail && <OrderDetailsSheet order={selectedOrderForDetail} open={!!selectedOrderForDetail} onOpenChange={(open) => !open && setSelectedOrderForDetail(null)} />}
      {selectedOrderForSchedule && <ScheduleOrderDialog order={selectedOrderForSchedule} open={!!selectedOrderForSchedule} onOpenChange={(open) => !open && setSelectedOrderForSchedule(null)} />}
      
      {/* 👇 COMPONENTE DE RESULTADOS CONECTADO */}
      {selectedOrderForResults && <ResultsDialog order={selectedOrderForResults} open={!!selectedOrderForResults} onOpenChange={(open) => !open && setSelectedOrderForResults(null)} />}

      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Anular?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-600" onClick={() => orderToCancel && cancelMutation.mutate(orderToCancel)}>Anular</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}