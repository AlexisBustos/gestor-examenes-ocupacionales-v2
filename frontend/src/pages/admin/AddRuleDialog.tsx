import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function AddRuleDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [agent, setAgent] = useState('');
  const [detail, setDetail] = useState('');
  const [batteryId, setBatteryId] = useState('');

  // Cargar baterías (Esta ruta la creamos en el paso anterior)
  const { data: batteries, isLoading } = useQuery<any[]>({ 
    queryKey: ['batteries-list'], 
    queryFn: async () => (await axios.get('/config/batteries')).data 
  });

  const createMutation = useMutation({
    mutationFn: async () => await axios.post('/config/rules', { riskAgentName: agent, specificDetail: detail, batteryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success("Regla creada");
      onOpenChange(false);
    },
    onError: () => toast.error("Error al crear")
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva Regla de Asignación</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            <div><Label>Agente de Riesgo (Palabra Clave)</Label><Input placeholder="Ej: Ruido" value={agent} onChange={e => setAgent(e.target.value)} /></div>
            <div><Label>Detalle Específico (Opcional)</Label><Input placeholder="Ej: Prexor" value={detail} onChange={e => setDetail(e.target.value)} /></div>
            <div>
                <Label>Batería a Sugerir</Label>
                {isLoading ? <div className="text-xs text-muted-foreground">Cargando baterías...</div> : (
                    <Select onValueChange={setBatteryId}>
                        <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                        <SelectContent>
                            {batteries?.map((b: any) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>
        </div>
        <DialogFooter><Button onClick={() => createMutation.mutate()} disabled={!agent || !batteryId || createMutation.isPending}>{createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Guardar Regla"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}