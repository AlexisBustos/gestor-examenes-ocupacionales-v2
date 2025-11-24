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
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

// Tipos locales para evitar errores de importación
interface GesLocal { 
  id: string; name: string; areaId: string;
  riskExposures?: { riskAgent: { name: string }, specificAgentDetails?: string }[]; 
}

const formSchema = z.object({
  rut: z.string().min(8, 'RUT inválido'),
  name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().optional(),
  position: z.string().min(2, 'Cargo requerido'),
  evaluationType: z.string(),
  companyId: z.string().uuid(),
  workCenterId: z.string().optional(), // Filtro visual
  areaId: z.string().optional(),       // Filtro visual
  gesId: z.string().uuid('Seleccione un GES'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function NewOrderSheet({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { evaluationType: 'OCUPACIONAL', rut: '', name: '', position: '' },
  });

  // Observadores para filtros en cascada
  const selectedCompanyId = form.watch('companyId');
  const selectedWorkCenterId = form.watch('workCenterId');
  const selectedAreaId = form.watch('areaId');
  const selectedGesId = form.watch('gesId');

  // 1. Cargar Empresas
  const { data: companies } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: async () => (await axios.get('/companies')).data,
    enabled: open
  });

  // 2. Cargar Centros
  const { data: workCenters } = useQuery<any[]>({
    queryKey: ['work-centers', selectedCompanyId],
    queryFn: async () => {
      if(!selectedCompanyId) return [];
      const { data } = await axios.get(`/work-centers?companyId=${selectedCompanyId}`);
      return data;
    },
    enabled: !!selectedCompanyId
  });

  // 3. Cargar Áreas
  const { data: areas } = useQuery<any[]>({
    queryKey: ['areas', selectedWorkCenterId],
    queryFn: async () => {
      if(!selectedWorkCenterId) return [];
      const { data } = await axios.get(`/areas?workCenterId=${selectedWorkCenterId}`);
      return data;
    },
    enabled: !!selectedWorkCenterId
  });

  // 4. Cargar GES
  const { data: gesList } = useQuery<GesLocal[]>({
    queryKey: ['ges', selectedAreaId],
    queryFn: async () => {
      const url = selectedAreaId ? `/ges?areaId=${selectedAreaId}` : '/ges';
      const { data } = await axios.get(url);
      return data;
    },
    enabled: open
  });

  // 5. ¡CONSULTA INTELIGENTE! Traer baterías sugeridas desde el Backend
  const { data: suggestedBatteries, isLoading: isLoadingSuggestions } = useQuery<any[]>({
    queryKey: ['suggestions', selectedGesId],
    queryFn: async () => {
      if(!selectedGesId) return [];
      const { data } = await axios.get(`/ges/${selectedGesId}/batteries`);
      return data;
    },
    enabled: !!selectedGesId
  });

  // Datos del GES seleccionado para mostrar riesgos
  const selectedGesData = gesList?.find(g => g.id === selectedGesId);

  const createOrderMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Enviamos las baterías que el backend nos sugirió
      const batteryIds = suggestedBatteries?.map((b: any) => ({ id: b.id })) || [];

      await axios.post('/orders', {
        worker: { 
            rut: values.rut, name: values.name, 
            phone: values.phone, position: values.position 
        },
        gesId: values.gesId,
        companyId: values.companyId,
        evaluationType: values.evaluationType,
        examBatteries: batteryIds // <--- Enviamos la lista completa
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onOpenChange(false);
      form.reset();
      toast.success("Solicitud creada con baterías asignadas");
    },
    onError: () => toast.error("Error al crear solicitud")
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[600px]">
        <SheetHeader><SheetTitle>Nueva Solicitud</SheetTitle><SheetDescription>Filtra por ubicación para encontrar el GES.</SheetDescription></SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => createOrderMutation.mutate(v))} className="space-y-6 py-6">
            
            {/* TRABAJADOR */}
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="rut" render={({ field }) => (
                  <FormItem><FormLabel>RUT</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="position" render={({ field }) => (
                  <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
            </div>

            <div className="h-px bg-border" />

            {/* UBICACIÓN */}
            <div className="space-y-3 bg-slate-50 p-3 rounded-md border">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Ubicación del Puesto</h3>
                
                <FormField control={form.control} name="companyId" render={({ field }) => (
                  <FormItem><FormLabel>Empresa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger></FormControl>
                      <SelectContent>{companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="workCenterId" render={({ field }) => (
                    <FormItem><FormLabel>Centro</FormLabel>
                        <Select onValueChange={field.onChange} disabled={!selectedCompanyId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Filtrar..." /></SelectTrigger></FormControl>
                        <SelectContent>{workCenters?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </FormItem>
                    )} />

                    <FormField control={form.control} name="areaId" render={({ field }) => (
                    <FormItem><FormLabel>Área</FormLabel>
                        <Select onValueChange={field.onChange} disabled={!selectedWorkCenterId}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Filtrar..." /></SelectTrigger></FormControl>
                        <SelectContent>{areas?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </FormItem>
                    )} />
                </div>
            </div>

            {/* SELECCIÓN GES */}
            <FormField control={form.control} name="gesId" render={({ field }) => (
                <FormItem>
                <FormLabel className="text-blue-600 font-bold">Seleccionar GES</FormLabel>
                <Select onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Busque el GES..." /></SelectTrigger></FormControl>
                    <SelectContent>
                    {gesList?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                </FormItem>
            )} />

            {/* TARJETAS INTELIGENTES */}
            {selectedGesId && (
              <div className="grid gap-3 animate-in fade-in">
                
                {/* RIESGOS (Azul) */}
                <Card className="bg-blue-50 border-blue-200 shadow-none">
                  <CardHeader className="pb-2 pt-3"><CardTitle className="text-blue-800 text-xs flex items-center gap-2"><AlertTriangle className="h-3 w-3" /> Riesgos Detectados</CardTitle></CardHeader>
                  <CardContent className="text-xs text-blue-900 pb-3">
                    <ul className="list-disc list-inside">
                      {selectedGesData?.riskExposures?.map((r, i) => (
                        <li key={i}>
                            <span className="font-semibold">{r.riskAgent.name}</span>
                            {r.specificAgentDetails && <span className="ml-1 text-blue-600">({r.specificAgentDetails})</span>}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* BATERÍAS SUGERIDAS (Indigo) */}
                <Card className="bg-indigo-50 border-indigo-200 shadow-none">
                  <CardHeader className="pb-2 pt-3"><CardTitle className="text-indigo-800 text-xs flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Baterías a Realizar</CardTitle></CardHeader>
                  <CardContent className="text-xs text-indigo-900 pb-3">
                    {isLoadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : 
                     suggestedBatteries && suggestedBatteries.length > 0 ? (
                        <ul className="list-disc list-inside font-medium">
                            {suggestedBatteries.map((b: any) => <li key={b.id}>{b.name}</li>)}
                        </ul>
                     ) : (
                        <span className="italic text-indigo-500">Sin coincidencias automáticas.</span>
                     )}
                  </CardContent>
                </Card>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? "Procesando..." : "Confirmar Solicitud"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}