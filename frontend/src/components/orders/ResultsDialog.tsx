import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Props { order: any; open: boolean; onOpenChange: (o: boolean) => void; }

export function ResultsDialog({ order, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [results, setResults] = useState<Record<string, { status: string, date: string }>>({});

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, date }: any) => {
        await axios.patch(`/orders/battery/${id}/result`, { status, expirationDate: date });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  });

  const handleSaveAll = async () => {
      const promises = Object.entries(results).map(([id, data]) => 
          updateMutation.mutateAsync({ id, status: data.status, date: data.date })
      );
      await Promise.all(promises);
      await axios.patch(`/orders/${order.id}/status`, { status: 'REALIZADO' });
      toast.success("Orden completada");
      onOpenChange(false);
  };

  const handleChange = (id: string, field: 'status' | 'date', value: string) => {
      setResults(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle>Registrar Resultados</DialogTitle></DialogHeader>
        <div className="py-4 space-y-4">
            {/* Iteramos sobre orderBatteries, que son los registros individuales */}
            {order.orderBatteries?.map((ob: any) => (
                <div key={ob.id} className="p-3 border rounded bg-slate-50">
                    <p className="font-bold text-sm mb-2">{ob.battery?.name || 'Batería sin nombre'}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Select onValueChange={(v) => handleChange(ob.id, 'status', v)}>
                            <SelectTrigger><SelectValue placeholder="Resultado..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="APTO">Apto</SelectItem>
                                <SelectItem value="NO_APTO">No Apto</SelectItem>
                                <SelectItem value="APTO_CON_OBSERVACIONES">Con Observaciones</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="date" onChange={(e) => handleChange(ob.id, 'date', e.target.value)} />
                    </div>
                </div>
            ))}
        </div>
        <DialogFooter><Button onClick={handleSaveAll}>Guardar y Finalizar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}