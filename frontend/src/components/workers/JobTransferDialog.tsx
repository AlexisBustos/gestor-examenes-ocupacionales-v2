import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRightLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Props {
  worker: any;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function JobTransferDialog({ worker, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  
  // Estados de Selección
  const [companyId, setCompanyId] = useState(worker.companyId);
  const [workCenterId, setWorkCenterId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [gesId, setGesId] = useState('');

  // Estado del Análisis
  const [analysis, setAnalysis] = useState<any>(null);

  // QUERIES PARA COMBOS (Cascada)
  // Nota: Usamos axios relativo para los GETs porque suelen funcionar bien, 
  // pero si fallan, también podríamos ponerles la URL completa.
  const { data: companies } = useQuery<any[]>({ 
    queryKey: ['companies'], 
    queryFn: async () => (await axios.get('/companies')).data 
  });
  
  const { data: workCenters } = useQuery<any[]>({ 
    queryKey: ['work-centers', companyId], 
    queryFn: async () => (await axios.get(`/work-centers?companyId=${companyId}`)).data,
    enabled: !!companyId 
  });

  const { data: areas } = useQuery<any[]>({ 
    queryKey: ['areas', workCenterId], 
    queryFn: async () => (await axios.get(`/areas?workCenterId=${workCenterId}`)).data,
    enabled: !!workCenterId 
  });

  const { data: gesList } = useQuery<any[]>({ 
    queryKey: ['ges', areaId], 
    queryFn: async () => (await axios.get(`/ges?areaId=${areaId}`)).data,
    enabled: !!areaId 
  });

  // MUTACIÓN 1: ANALIZAR (URL BLINDADA con /api)
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('http://localhost:3000/api/workers/analyze-transfer', { 
          workerId: worker.id, 
          targetGesId: gesId 
      });
      return data;
    },
    onSuccess: (data) => setAnalysis(data),
    onError: (err) => {
        console.error(err);
        toast.error("Error de conexión al analizar");
    }
  });

  // MUTACIÓN 2: EJECUTAR CAMBIO (URL BLINDADA con /api)
  const transferMutation = useMutation({
    mutationFn: async () => {
      await axios.post('http://localhost:3000/api/workers/transfer', { 
          workerId: worker.id, 
          targetGesId: gesId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', worker.id] });
      toast.success("Trabajador movido exitosamente");
      onOpenChange(false);
    },
    onError: () => toast.error("Error al mover trabajador")
  });

  const resetAnalysis = () => setAnalysis(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <ArrowRightLeft className="h-5 w-5" /> Movilidad Interna
          </DialogTitle>
          <DialogDescription>
            Cambio de puesto para <strong>{worker.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          
          {/* SELECTORES DE DESTINO */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
             <div className="space-y-2">
                <Label className="text-xs">Nueva Empresa</Label>
                <Select value={companyId} onValueChange={(v) => { setCompanyId(v); resetAnalysis(); }}>
                   <SelectTrigger className="bg-white h-8"><SelectValue /></SelectTrigger>
                   <SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-xs">Nuevo Centro</Label>
                <Select value={workCenterId} onValueChange={(v) => { setWorkCenterId(v); resetAnalysis(); }}>
                   <SelectTrigger className="bg-white h-8"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                   <SelectContent>{workCenters?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-xs">Nueva Área</Label>
                <Select value={areaId} onValueChange={(v) => { setAreaId(v); resetAnalysis(); }}>
                   <SelectTrigger className="bg-white h-8"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                   <SelectContent>{areas?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold text-blue-600">Nuevo Puesto (GES)</Label>
                <Select value={gesId} onValueChange={(v) => { setGesId(v); resetAnalysis(); }}>
                   <SelectTrigger className="bg-white h-8 border-blue-200"><SelectValue placeholder="Seleccione Puesto..." /></SelectTrigger>
                   <SelectContent>{gesList?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
             </div>
          </div>

          {/* BOTÓN ANALIZAR */}
          {!analysis && (
              <Button 
                className="w-full" 
                variant="secondary" 
                disabled={!gesId || analyzeMutation.isPending}
                onClick={() => analyzeMutation.mutate()}
              >
                {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analizar Requisitos del Puesto"}
              </Button>
          )}

          {/* RESULTADO DEL ANÁLISIS (BRECHAS) */}
          {analysis && (
            <Card className="p-4 border-slate-200 animate-in fade-in slide-in-from-bottom-2">
                <h4 className="font-bold text-sm mb-3 flex justify-between items-center">
                    Análisis de Brechas
                    {analysis.transferReady ? 
                        <Badge className="bg-green-100 text-green-800">Apto para traslado</Badge> : 
                        <Badge className="bg-amber-100 text-amber-800">Exámenes Pendientes</Badge>
                    }
                </h4>
                <div className="space-y-2">
                    {analysis.gaps.map((gap: any) => (
                        <div key={gap.batteryId} className="flex justify-between items-center text-sm p-2 rounded bg-white border">
                            <span>{gap.name}</span>
                            {gap.status === 'CUBIERTO' ? 
                                <div className="flex items-center text-green-600 text-xs font-bold"><CheckCircle2 className="h-4 w-4 mr-1"/> Cubierto</div> :
                                <div className="flex items-center text-red-600 text-xs font-bold"><AlertTriangle className="h-4 w-4 mr-1"/> Falta</div>
                            }
                        </div>
                    ))}
                </div>
                <div className="mt-4 p-2 bg-blue-50 text-xs text-blue-700 rounded">
                    {analysis.transferReady 
                        ? "El trabajador cumple con todos los requisitos. Puedes confirmar el cambio." 
                        : "El trabajador tiene brechas. Al confirmar, deberás gestionar una orden para los exámenes faltantes."}
                </div>
            </Card>
          )}

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={() => transferMutation.mutate()} 
            disabled={!analysis || transferMutation.isPending}
            className={analysis?.transferReady ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
          >
            {transferMutation.isPending ? "Procesando..." : "Confirmar Cambio de Puesto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}