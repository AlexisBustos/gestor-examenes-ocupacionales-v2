import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';

// TIPOS LOCALES ACTUALIZADOS
interface RiskProtocol { id: string; name: string; url: string; }
interface RiskAgent { 
  id: string; 
  name: string; 
  protocols?: RiskProtocol[]; // <--- LISTA DE PROTOCOLOS
}
interface RiskExposure { 
  riskAgent: RiskAgent; 
  specificAgentDetails?: string 
}
interface GesLocal { 
  id: string; name: string; areaId: string; 
  riskExposures?: RiskExposure[]; 
}

const formSchema = z.object({
  rut: z.string().min(8, 'RUT inválido'),
  name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().optional(),
  position: z.string().min(2, 'Cargo requerido'),
  evaluationType: z.string(),
  companyId: z.string().uuid(),
  workCenterId: z.string().optional(),
  areaId: z.string().optional(),
  gesId: z.string().uuid('Seleccione un GES'),
});

type FormValues = z.infer<typeof formSchema>;
interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function NewOrderSheet({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { evaluationType: 'OCUPACIONAL', rut: '', name: '', position: '', phone: '' } });

  const selectedCompanyId = form.watch('companyId');
  const selectedWorkCenterId = form.watch('workCenterId');
  const selectedAreaId = form.watch('areaId');
  const selectedGesId = form.watch('gesId');

  const { data: companies } = useQuery<any[]>({ queryKey: ['companies'], queryFn: async () => (await axios.get('/companies')).data, enabled: open });
  const { data: workCenters } = useQuery<any[]>({ queryKey: ['work-centers', selectedCompanyId], queryFn: async () => { if(!selectedCompanyId) return []; return (await axios.get(`/work-centers?companyId=${selectedCompanyId}`)).data; }, enabled: !!selectedCompanyId });
  const { data: areas } = useQuery<any[]>({ queryKey: ['areas', selectedWorkCenterId], queryFn: async () => { if(!selectedWorkCenterId) return []; return (await axios.get(`/areas?workCenterId=${selectedWorkCenterId}`)).data; }, enabled: !!selectedWorkCenterId });
  const { data: gesList } = useQuery<GesLocal[]>({ queryKey: ['ges', selectedAreaId], queryFn: async () => { const url = selectedAreaId ? `/ges?areaId=${selectedAreaId}` : '/ges'; return (await axios.get(url)).data; }, enabled: open });
  const { data: suggestedBatteries, isLoading: isLoadingSuggestions } = useQuery<any[]>({ queryKey: ['suggestions', selectedGesId], queryFn: async () => { if(!selectedGesId) return []; return (await axios.get(`/ges/${selectedGesId}/batteries`)).data; }, enabled: !!selectedGesId });

  const selectedGesData = gesList?.find(g => g.id === selectedGesId);

  const createOrderMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const batteryIds = suggestedBatteries?.map((b: any) => ({ id: b.id })) || [];
      await axios.post('/orders', {
        worker: { rut: values.rut, name: values.name, phone: values.phone, position: values.position },
        gesId: values.gesId, companyId: values.companyId, evaluationType: values.evaluationType, examBatteries: batteryIds 
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); onOpenChange(false); form.reset(); toast.success("Solicitud creada"); },
    onError: () => toast.error("Error al crear")
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[600px]">
        <SheetHeader><SheetTitle>Nueva Solicitud</SheetTitle><SheetDescription>Filtra por ubicación.</SheetDescription></SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => createOrderMutation.mutate(v))} className="space-y-6 py-6">
            {/* INPUTS TRABAJADOR */}
            <div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="rut" render={({ field }) => (<FormItem><FormLabel>RUT</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="position" render={({ field }) => (<FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /><FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} /></div>
            <div className="h-px bg-border" />
            <div className="space-y-3 bg-slate-50 p-3 rounded-md border"><h3 className="text-xs font-bold text-slate-500 uppercase">Ubicación</h3><FormField control={form.control} name="companyId" render={({ field }) => (<FormItem><FormLabel>Empresa</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl><SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></FormItem>)} /><div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="workCenterId" render={({ field }) => (<FormItem><FormLabel>Centro</FormLabel><Select onValueChange={field.onChange} disabled={!selectedCompanyId}><FormControl><SelectTrigger><SelectValue placeholder="Filtrar..." /></SelectTrigger></FormControl><SelectContent>{workCenters?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select></FormItem>)} /><FormField control={form.control} name="areaId" render={({ field }) => (<FormItem><FormLabel>Área</FormLabel><Select onValueChange={field.onChange} disabled={!selectedWorkCenterId}><FormControl><SelectTrigger><SelectValue placeholder="Filtrar..." /></SelectTrigger></FormControl><SelectContent>{areas?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></FormItem>)} /></div></div>
            <FormField control={form.control} name="gesId" render={({ field }) => (<FormItem><FormLabel className="text-blue-600 font-bold">Seleccionar GES</FormLabel><Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Busque el GES..." /></SelectTrigger></FormControl><SelectContent>{gesList?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent></Select></FormItem>)} />

            {selectedGesId && (
              <div className="grid gap-3 animate-in fade-in">
                <Card className="bg-blue-50 border-blue-200 shadow-none">
                  <CardHeader className="pb-2 pt-3"><CardTitle className="text-blue-800 text-xs flex items-center gap-2"><AlertTriangle className="h-3 w-3" /> Riesgos Detectados</CardTitle></CardHeader>
                  <CardContent className="text-xs text-blue-900 pb-3">
                    <ul className="space-y-3">
                      {selectedGesData?.riskExposures?.map((r, i) => (
                        <li key={i} className="flex flex-col gap-1 border-b border-blue-100 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">{r.riskAgent.name}</span>
                                {r.specificAgentDetails && <span className="text-blue-600 text-[10px] bg-white px-1 rounded">({r.specificAgentDetails})</span>}
                            </div>
                            
                            {/* 👇 AQUÍ ESTÁ LA LISTA DE MÚLTIPLES ARCHIVOS */}
                            {r.riskAgent.protocols && r.riskAgent.protocols.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {r.riskAgent.protocols.map((p: any) => (
                                        <a key={p.id} href={`http://localhost:3000${p.url}`} target="_blank" className="inline-flex items-center text-purple-700 hover:underline text-[10px] bg-purple-50 px-2 py-0.5 rounded border border-purple-200 transition-colors hover:bg-purple-100">
                                            <FileText className="h-3 w-3 mr-1" /> {p.name}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="bg-indigo-50 border-indigo-200 shadow-none"><CardHeader className="pb-2 pt-3"><CardTitle className="text-indigo-800 text-xs flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Baterías Sugeridas</CardTitle></CardHeader><CardContent className="text-xs text-indigo-900 pb-3">{isLoadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : suggestedBatteries && suggestedBatteries.length > 0 ? (<ul className="list-disc list-inside font-medium">{suggestedBatteries.map((b: any) => <li key={b.id}>{b.name}</li>)}</ul>) : <span className="italic text-indigo-500">Sin coincidencias automáticas.</span>}</CardContent></Card>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={createOrderMutation.isPending}>{createOrderMutation.isPending ? "Procesando..." : "Confirmar Solicitud"}</Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}