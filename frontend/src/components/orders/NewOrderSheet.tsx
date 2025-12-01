import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, AlertTriangle, FileText, UserCheck, UserPlus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface RiskAgent { id: string; name: string; protocolUrl?: string; }
interface RiskExposure { riskAgent: RiskAgent; specificAgentDetails?: string }
interface GesLocal { id: string; name: string; areaId: string; riskExposures?: RiskExposure[]; }

// Estructura de la respuesta de sugerencias
interface OrderSuggestion {
    required: any[];
    covered: any[];
    missing: any[];
}

const formSchema = z.object({
  rut: z.string().min(8), name: z.string().min(2), phone: z.string().optional(), position: z.string().min(2),
  evaluationType: z.string(), companyId: z.string().uuid(), workCenterId: z.string().optional(), areaId: z.string().optional(), 
  gesId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function NewOrderSheet({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  
  // Estados
  const [workerStatus, setWorkerStatus] = useState<'found' | 'new' | null>(null);
  const [workerId, setWorkerId] = useState<string | undefined>(undefined); // Guardamos el ID real del trabajador
  const [searchMode, setSearchMode] = useState<'ges' | 'area'>('ges');

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { evaluationType: 'PRE_OCUPACIONAL', rut: '', name: '', position: '', phone: '' } });

  // 1. VALIDAR RUT Y OBTENER ID
  const handleRutBlur = async () => {
      const rut = form.getValues('rut');
      if (rut && rut.length >= 8) {
        try {
            const { data } = await axios.get(`/workers/check/${rut}`);
            if (data.exists) {
                setWorkerStatus('found');
                setWorkerId(data.worker.id); // Guardamos el ID para la consulta de brechas
                form.setValue('name', data.worker.name);
                form.setValue('position', data.worker.position || '');
                form.setValue('phone', data.worker.phone || '');
                form.setValue('evaluationType', 'OCUPACIONAL');
            } else {
                setWorkerStatus('new');
                setWorkerId(undefined); // Es nuevo, no tiene historial
                form.setValue('evaluationType', 'PRE_OCUPACIONAL');
            }
        } catch (e) { console.error(e); }
      }
  };

  const selectedCompanyId = form.watch('companyId');
  const selectedWorkCenterId = form.watch('workCenterId');
  const selectedAreaId = form.watch('areaId');
  const selectedGesId = form.watch('gesId');

  // Queries de infraestructura
  const { data: companies } = useQuery<any[]>({ queryKey: ['companies'], queryFn: async () => (await axios.get('/companies')).data, enabled: open });
  const { data: workCenters } = useQuery<any[]>({ queryKey: ['work-centers', selectedCompanyId], queryFn: async () => { if(!selectedCompanyId) return []; return (await axios.get(`/work-centers?companyId=${selectedCompanyId}`)).data; }, enabled: !!selectedCompanyId });
  const { data: areas } = useQuery<any[]>({ queryKey: ['areas', selectedWorkCenterId], queryFn: async () => { if(!selectedWorkCenterId) return []; return (await axios.get(`/areas?workCenterId=${selectedWorkCenterId}`)).data; }, enabled: !!selectedWorkCenterId });
  const { data: gesList } = useQuery<GesLocal[]>({ queryKey: ['ges', selectedAreaId], queryFn: async () => { const url = selectedAreaId ? `/ges?areaId=${selectedAreaId}` : '/ges'; return (await axios.get(url)).data; }, enabled: open });
  
  // 👇 QUERY INTELIGENTE DE SUGERENCIAS (Brechas)
  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery<OrderSuggestion>({
    queryKey: ['order-suggestions', selectedGesId, workerId, searchMode, selectedAreaId],
    queryFn: async () => {
      // Caso 1: Por Área (Trae todo, asumimos que es inicial o nuevo)
      if (searchMode === 'area' && selectedAreaId) {
         const batteries = (await axios.get(`/ges/area/${selectedAreaId}/batteries`)).data;
         return { required: batteries, covered: [], missing: batteries };
      }
      
      // Caso 2: Por GES (Usa el nuevo endpoint inteligente)
      if (selectedGesId) {
         // Si hay workerId, el backend calcula brechas. Si no, devuelve todo como missing.
         const params = new URLSearchParams({ gesId: selectedGesId });
         if (workerId) params.append('workerId', workerId);
         
         return (await axios.get(`/orders/suggestions?${params.toString()}`)).data;
      }
      return { required: [], covered: [], missing: [] };
    },
    enabled: !!(selectedGesId || (searchMode === 'area' && selectedAreaId))
  });

  const selectedGesData = gesList?.find(g => g.id === selectedGesId);

  const createOrderMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let finalGesId = values.gesId;
      if (searchMode === 'area' && !finalGesId && gesList && gesList.length > 0) { finalGesId = gesList[0].id; }
      if (!finalGesId) throw new Error("Debe seleccionar un GES o un Área válida");

      // 👇 SOLICITAMOS SOLO LO FALTANTE (MISSING)
      const batteryIds = suggestions?.missing.map((b: any) => ({ id: b.id })) || [];

      if (batteryIds.length === 0) {
          // Opcional: Permitir guardar orden vacía o bloquear.
          // Por ahora permitimos para registro.
      }

      await axios.post('/orders', {
        worker: { rut: values.rut, name: values.name, phone: values.phone, position: values.position },
        gesId: finalGesId, companyId: values.companyId, evaluationType: values.evaluationType, 
        examBatteries: batteryIds 
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); onOpenChange(false); form.reset(); setWorkerStatus(null); setWorkerId(undefined); toast.success("Solicitud creada"); },
    onError: () => toast.error("Error al crear (Verifique datos)")
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[600px]">
        <SheetHeader><SheetTitle>Nueva Solicitud</SheetTitle><SheetDescription>Gestión inteligente de exámenes.</SheetDescription></SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => createOrderMutation.mutate(v))} className="space-y-6 py-6">
            
            {/* DATOS TRABAJADOR */}
            <div className="space-y-4 border rounded-md p-3 bg-slate-50">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="rut" render={({ field }) => (<FormItem><FormLabel>RUT</FormLabel><FormControl><Input {...field} onBlur={handleRutBlur} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div>
                {workerStatus === 'found' && (<div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 p-2 rounded"><UserCheck className="h-4 w-4" /> Trabajador en nómina. <strong>OCUPACIONAL</strong>.</div>)}
                {workerStatus === 'new' && (<div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 p-2 rounded"><UserPlus className="h-4 w-4" /> Trabajador nuevo. <strong>PRE-OCUPACIONAL</strong>.</div>)}
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                </div>
                <FormField control={form.control} name="evaluationType" render={({ field }) => (<FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!!workerStatus}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="PRE_OCUPACIONAL">Pre-Ocupacional</SelectItem><SelectItem value="OCUPACIONAL">Ocupacional</SelectItem><SelectItem value="EXAMEN_SALIDA">Salida</SelectItem></SelectContent></Select></FormItem>)} />
            </div>

            <div className="h-px bg-border" />
            
            {/* UBICACIÓN */}
            <div className="space-y-3 bg-slate-50 p-3 rounded-md border"><h3 className="text-xs font-bold text-slate-500 uppercase">Ubicación</h3><FormField control={form.control} name="companyId" render={({ field }) => (<FormItem><FormLabel>Empresa</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl><SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>)} /><div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="workCenterId" render={({ field }) => (<FormItem><FormLabel>Centro</FormLabel><Select onValueChange={field.onChange} disabled={!selectedCompanyId}><FormControl><SelectTrigger><SelectValue placeholder="Filtrar..." /></SelectTrigger></FormControl><SelectContent>{workCenters?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></FormItem>)} /><FormField control={form.control} name="areaId" render={({ field }) => (<FormItem><FormLabel>Área</FormLabel><Select onValueChange={field.onChange} disabled={!selectedWorkCenterId}><FormControl><SelectTrigger><SelectValue placeholder="Filtrar..." /></SelectTrigger></FormControl><SelectContent>{areas?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></FormItem>)} /></div></div>
            
            {/* MODO */}
            <div className="flex justify-center">
                <Tabs value={searchMode} onValueChange={(v) => { setSearchMode(v as any); form.setValue('gesId', ''); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="ges">Por Puesto (GES)</TabsTrigger><TabsTrigger value="area" disabled={!selectedAreaId}>Por Área Completa</TabsTrigger></TabsList>
                </Tabs>
            </div>

            <div className={searchMode === 'area' ? 'opacity-50 pointer-events-none' : ''}>
                <FormField control={form.control} name="gesId" render={({ field }) => (<FormItem><FormLabel className="text-blue-600 font-bold">Seleccionar GES {searchMode === 'area' && '(Automático)'}</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={searchMode === 'area'}><FormControl><SelectTrigger><SelectValue placeholder="Busque el GES..." /></SelectTrigger></FormControl><SelectContent>{gesList?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select></FormItem>)} />
            </div>

            <div className="grid gap-3 animate-in fade-in">
                {/* RIESGOS (Solo modo GES) */}
                {selectedGesId && searchMode === 'ges' && (
                    <Card className="bg-blue-50 border-blue-200 shadow-none"><CardHeader className="pb-2 pt-3"><CardTitle className="text-blue-800 text-xs flex items-center gap-2"><AlertTriangle className="h-3 w-3" /> Riesgos Detectados</CardTitle></CardHeader><CardContent className="text-xs text-blue-900 pb-3"><ul className="space-y-3">{selectedGesData?.riskExposures?.map((r, i) => (<li key={i} className="flex flex-col gap-1 border-b border-blue-100 pb-2 last:border-0 last:pb-0"><div className="flex items-center justify-between"><span className="font-semibold">{r.riskAgent.name}</span>{r.specificAgentDetails && <span className="text-blue-600 text-[10px] bg-white px-1 rounded">({r.specificAgentDetails})</span>}</div>{r.riskAgent.protocols && r.riskAgent.protocols.length > 0 && (<div className="flex flex-wrap gap-1 mt-1">{r.riskAgent.protocols.map(p => (<a key={p.id} href={`http://localhost:3000${p.url}`} target="_blank" className="inline-flex items-center text-purple-700 hover:underline text-[10px] bg-purple-50 px-2 py-0.5 rounded border border-purple-200 transition-colors hover:bg-purple-100"><FileText className="h-3 w-3 mr-1" /> {p.name}</a>))}</div>)}</li>))}</ul></CardContent></Card>
                )}
                
                {/* 👇 TARJETA INTELIGENTE: COBERTURA */}
                <Card className="border-indigo-100 shadow-sm">
                    <CardHeader className="pb-2 pt-3 bg-indigo-50/50 border-b border-indigo-100">
                        <CardTitle className="text-indigo-800 text-xs flex items-center gap-2">
                            <ShieldCheck className="h-3 w-3" /> Análisis de Cobertura ({searchMode === 'area' ? 'Área' : 'GES'})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs pt-3 space-y-4">
                        {isLoadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                                {/* 1. Baterías Faltantes (A Solicitar) */}
                                <div>
                                    <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-amber-500"></div> 
                                        A Solicitar ({suggestions?.missing.length || 0})
                                    </h4>
                                    {suggestions?.missing && suggestions.missing.length > 0 ? (
                                        <ul className="list-disc list-inside font-medium text-amber-900 bg-amber-50 p-2 rounded border border-amber-100">
                                            {suggestions.missing.map((b: any) => <li key={b.id}>{b.name}</li>)}
                                        </ul>
                                    ) : <span className="text-slate-400 italic ml-4">No hay exámenes pendientes.</span>}
                                </div>

                                {/* 2. Baterías Cubiertas (Ya tiene) */}
                                {suggestions?.covered && suggestions.covered.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div> 
                                            Vigentes / Cubiertas ({suggestions.covered.length})
                                        </h4>
                                        <ul className="list-disc list-inside font-medium text-green-900 bg-green-50 p-2 rounded border border-green-100 opacity-80">
                                            {suggestions.covered.map((b: any) => <li key={b.id}>{b.name} <span className="text-[10px] text-green-600">(No se pedirá)</span></li>)}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Button type="submit" className="w-full bg-blue-700 hover:bg-blue-800" disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? "Procesando..." : `Generar Solicitud (${suggestions?.missing.length || 0} exámenes)`}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}