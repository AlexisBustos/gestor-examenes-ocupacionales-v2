import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // <--- Importante
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface Props {
  order: any;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ResultsDialog({ order, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  
  // Estado local para cada batería
  const [results, setResults] = useState<Record<string, { status: string, date: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, date }: any) => {
        await axios.patch(`/orders/battery/${id}/result`, { status, expirationDate: date });
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const handleSaveAll = async () => {
      setIsSaving(true);
      try {
        const promises = Object.entries(results).map(([id, data]) => 
            updateMutation.mutateAsync({ id, status: data.status, date: data.date })
        );
        await Promise.all(promises);
        
        // Si todo sale bien, cerramos la orden principal
        await axios.patch(`/orders/${order.id}/status`, { status: 'REALIZADO' });
        
        toast.success("Resultados guardados y orden cerrada");
        onOpenChange(false);
      } catch (error) {
        toast.error("Error al guardar resultados");
      } finally {
        setIsSaving(false);
      }
  };

  const handleChange = (id: string, field: 'status' | 'date', value: string) => {
      setResults(prev => ({
          ...prev,
          [id]: { ...prev[id], [field]: value }
      }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Registrar Resultados Clínicos
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-muted-foreground mb-2">
              Ingresa el dictamen y la fecha de vencimiento para cada batería realizada.
            </p>

            {/* Iteramos sobre las baterías de la orden */}
            {order.orderBatteries?.map((ob: any) => (
                <div key={ob.id} className="p-4 border rounded-lg bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-slate-800">{ob.battery?.name || 'Batería sin nombre'}</p>
                        {/* Indicador visual si ya tiene datos */}
                        {results[ob.id]?.status && results[ob.id]?.date && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Listo para guardar</span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500">Dictamen Médico</Label>
                            <Select onValueChange={(v) => handleChange(ob.id, 'status', v)}>
                                <SelectTrigger className="bg-white h-9">
                                    <SelectValue placeholder="Seleccione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="APTO">Apto</SelectItem>
                                    <SelectItem value="NO_APTO">No Apto</SelectItem>
                                    <SelectItem value="APTO_CON_OBSERVACIONES">Con Observaciones</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-500">Fecha de Vencimiento</Label>
                            <Input 
                                type="date" 
                                className="bg-white h-9"
                                onChange={(e) => handleChange(ob.id, 'date', e.target.value)} 
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSaveAll} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar y Finalizar"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}