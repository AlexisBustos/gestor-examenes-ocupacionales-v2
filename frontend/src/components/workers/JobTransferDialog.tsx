import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRightLeft, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
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

  const [companyId, setCompanyId] = useState(worker.companyId);
  const [workCenterId, setWorkCenterId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [gesId, setGesId] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);

  // Queries
  const { data: companies } = useQuery<any[]>({ queryKey: ['companies'], queryFn: async () => (await axios.get('/companies')).data });
  const { data: workCenters } = useQuery<any[]>({ queryKey: ['work-centers', companyId], queryFn: async () => (await axios.get(`/work-centers?companyId=${companyId}`)).data, enabled: !!companyId });
  const { data: areas } = useQuery<any[]>({ queryKey: ['areas', workCenterId], queryFn: async () => (await axios.get(`/areas?workCenterId=${workCenterId}`)).data, enabled: !!workCenterId });
  const { data: gesList } = useQuery<any[]>({ queryKey: ['ges', areaId], queryFn: async () => (await axios.get(`/ges?areaId=${areaId}`)).data, enabled: !!areaId });

  // 1. Analizar
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('/workers/analyze-transfer', { workerId: worker.id, targetGesId: gesId });
      return data;
    },
    onSuccess: (data) => setAnalysis(data),
    onError: () => toast.error("Error al analizar requisitos")
  });

  // 2. Ejecutar
  const transferMutation = useMutation({
    mutationFn: async () => await axios.post('/workers/transfer', { workerId: worker.id, targetGesId: gesId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker', worker.id] });
      queryClient.invalidateQueries({ queryKey: ['worker-details'] }); // Actualizar también la ficha
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
            Evaluación de cambio de puesto para <strong>{worker.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Selectores */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
            <div className="space-y-2">
              <Label className="text-xs">Empresa</Label>
              <Select value={companyId} onValueChange={(v) => { setCompanyId(v); resetAnalysis(); }}>
                <SelectTrigger className="bg-white h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Centro</Label>
              <Select value={workCenterId} onValueChange={(v) => { setWorkCenterId(v); resetAnalysis(); }}>
                <SelectTrigger className="bg-white h-8"><SelectValue placeholder="..." /></SelectTrigger>
                <SelectContent>{workCenters?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Área</Label>
              <Select value={areaId} onValueChange={(v) => { setAreaId(v); resetAnalysis(); }}>
                <SelectTrigger className="bg-white h-8"><SelectValue placeholder="..." /></SelectTrigger>
                <SelectContent>{areas?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-blue-600">Nuevo GES</Label>
              <Select value={gesId} onValueChange={(v) => { setGesId(v); resetAnalysis(); }}>
                <SelectTrigger className="bg-white h-8 border-blue-200"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>{gesList?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Botón Analizar */}
          {!analysis && (
            <Button
              className="w-full bg-slate-800 hover:bg-slate-900"
              disabled={!gesId || analyzeMutation.isPending}
              onClick={() => analyzeMutation.mutate()}
            >
              {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analizar Requisitos"}
            </Button>
          )}

          {/* Resultados */}
          {analysis && (
            <Card className="p-4 border-slate-200 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <div>
                  <p className="text-xs text-muted-foreground">Puesto Actual</p>
                  {/* 👇 FIX: Agregamos ?. y valor por defecto */}
                  <p className="font-medium text-sm">
                    {analysis.worker?.currentGesName || 'Sin asignar'}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Nuevo Puesto</p>
                  {/* 👇 FIX: Agregamos ?. y valor por defecto */}
                  <p className="font-medium text-sm text-blue-700">
                    {analysis.newGes?.name || 'Seleccionado'}
                  </p>
                </div>
              </div>

              <h4 className="font-bold text-sm mb-3 flex justify-between items-center">
                Análisis de Brechas
                {analysis.transferReady ?
                  <Badge className="bg-green-100 text-green-800 border-green-200">Apto para traslado</Badge> :
                  <Badge className="bg-red-100 text-red-800 border-red-200">Faltan Exámenes</Badge>
                }
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {/* 👇 FIX: Aseguramos que gaps sea un array */}
                {(analysis.gaps || []).map((gap: any) => (
                  <div key={gap.batteryId} className="flex justify-between items-center text-sm p-2 rounded bg-white border">
                    <span>{gap.name}</span>
                    {gap.status === 'CUBIERTO' ?
                      <div className="flex items-center text-green-600 text-xs font-bold"><CheckCircle2 className="h-4 w-4 mr-1" /> Cubierto</div> :
                      <div className="flex items-center text-red-600 text-xs font-bold"><AlertTriangle className="h-4 w-4 mr-1" /> Falta</div>
                    }
                  </div>
                ))}
                {(analysis.gaps || []).length === 0 && <p className="text-xs text-slate-500 italic">Este puesto no requiere exámenes adicionales.</p>}
              </div>

              {!analysis.transferReady && (
                <div className="mt-4 p-2 bg-amber-50 border border-amber-100 text-xs text-amber-800 rounded">
                  ⚠️ El trabajador no cumple con todos los requisitos. Debes gestionar una orden para los exámenes faltantes antes o después del traslado.
                </div>
              )}
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
            {transferMutation.isPending ? "Procesando..." : "Confirmar Cambio"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}