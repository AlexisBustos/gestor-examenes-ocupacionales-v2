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
import { ResultsDialog } from '@/components/orders/ResultsDialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function OrdersPage() {
  const queryClient = useQueryClient();
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); toast.success("Anulada"); setOrderToCancel(null); },
    onError: () => toast.error("Error")
  });

  if (isLoading) return <div className="p-10 text-center">Cargando órdenes...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error al cargar datos</div>;

  const filteredOrders = orders?.filter((order: any) => 
    order.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.worker.rut.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Órdenes</h1>
        <Button onClick={() => setIsNewOrderOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nueva</Button>
      </div>

      <Card>
        <CardHeader><div className="w-64"><Input placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Trabajador</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
                {filteredOrders.map((order: any) => (
                    <TableRow key={order.id}>
                        <TableCell>
                            <div className="font-medium">{order.worker.name}</div>
                            <div className="text-xs text-muted-foreground">{order.worker.rut}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                        <TableCell className="text-right flex justify-end gap-1">
                            {/* BOTONES */}
                            <Button size="icon" variant="ghost" onClick={() => setSelectedOrderForDetail(order)}><Eye className="h-4 w-4"/></Button>
                            {order.status === 'SOLICITADO' && <Button size="icon" variant="outline" onClick={() => setSelectedOrderForSchedule(order)}><Calendar className="h-4 w-4 text-blue-600"/></Button>}
                            {order.status === 'AGENDADO' && <Button size="icon" variant="outline" onClick={() => setSelectedOrderForResults(order)}><CheckCircle className="h-4 w-4 text-green-600"/></Button>}
                            {['SOLICITADO', 'AGENDADO'].includes(order.status) && <Button size="icon" variant="outline" onClick={() => setOrderToCancel(order.id)}><Ban className="h-4 w-4 text-red-600"/></Button>}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODALES */}
      <NewOrderSheet open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen} />
      {selectedOrderForDetail && <OrderDetailsSheet order={selectedOrderForDetail} open={!!selectedOrderForDetail} onOpenChange={(open) => !open && setSelectedOrderForDetail(null)} />}
      {selectedOrderForSchedule && <ScheduleOrderDialog order={selectedOrderForSchedule} open={!!selectedOrderForSchedule} onOpenChange={(open) => !open && setSelectedOrderForSchedule(null)} />}
      {selectedOrderForResults && <ResultsDialog order={selectedOrderForResults} open={!!selectedOrderForResults} onOpenChange={(open) => !open && setSelectedOrderForResults(null)} />}
      
      <AlertDialog open={!!orderToCancel} onOpenChange={() => setOrderToCancel(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>¿Anular?</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={() => setOrderToCancel(null)}>Cancelar</Button>
                <Button variant="destructive" onClick={() => orderToCancel && cancelMutation.mutate(orderToCancel)}>Sí, Anular</Button>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}