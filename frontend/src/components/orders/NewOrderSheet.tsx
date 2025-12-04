import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, UserCheck, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

interface GesLocal {
  id: string;
  name: string;
  // agrega más campos si tu backend devuelve otros que uses en este componente
}

interface OrderSuggestion {
  required: any[];
  covered: any[];
  missing: any[];
}

const formSchema = z.object({
  rut: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
  position: z.string().min(2),
  evaluationType: z.string(),
  companyId: z.string().uuid(),
  workCenterId: z.string().optional(),
  areaId: z.string().optional(),
  gesId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function NewOrderSheet({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  // Estados
  const [workerStatus, setWorkerStatus] = useState<'found' | 'new' | null>(null);
  const [workerId, setWorkerId] = useState<string | undefined>(undefined);
  const [searchMode, setSearchMode] = useState<'ges' | 'area'>('ges');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      evaluationType: 'PRE_OCUPACIONAL',
      rut: '',
      name: '',
      position: '',
      phone: '',
    },
  });

  // 1. VALIDAR RUT Y OBTENER ID
  const handleRutBlur = async () => {
    const rut = form.getValues('rut');
    if (rut && rut.length >= 8) {
      try {
        const { data } = await axios.get(`/workers/check/${rut}`);
        if (data.exists) {
          setWorkerStatus('found');
          setWorkerId(data.worker.id);
          form.setValue('name', data.worker.name);
          form.setValue('position', data.worker.position || '');
          form.setValue('phone', data.worker.phone || '');
          form.setValue('evaluationType', 'OCUPACIONAL');
        } else {
          setWorkerStatus('new');
          setWorkerId(undefined);
          form.setValue('evaluationType', 'PRE_OCUPACIONAL');
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const selectedCompanyId = form.watch('companyId');
  const selectedWorkCenterId = form.watch('workCenterId');
  const selectedAreaId = form.watch('areaId');
  const selectedGesId = form.watch('gesId');

  // Queries de infraestructura
  const { data: companies } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: async () => (await axios.get('/companies')).data,
    enabled: open,
  });

  const { data: workCenters } = useQuery<any[]>({
    queryKey: ['work-centers', selectedCompanyId],
    queryFn: async () => {
      if (!selectedCompanyId) return [];
      return (await axios.get(`/work-centers?companyId=${selectedCompanyId}`))
        .data;
    },
    enabled: !!selectedCompanyId,
  });

  const { data: areas } = useQuery<any[]>({
    queryKey: ['areas', selectedWorkCenterId],
    queryFn: async () => {
      if (!selectedWorkCenterId) return [];
      return (await axios.get(`/areas?workCenterId=${selectedWorkCenterId}`))
        .data;
    },
    enabled: !!selectedWorkCenterId,
  });

  // GES por área
  const { data: gesList } = useQuery<GesLocal[]>({
    queryKey: ['ges', selectedAreaId],
    queryFn: async () => {
      if (!selectedAreaId) return [];
      return (await axios.get(`/ges?areaId=${selectedAreaId}`)).data;
    },
    enabled: !!selectedAreaId, // solo cuando hay área seleccionada
  });

  // QUERY INTELIGENTE DE SUGERENCIAS (Brechas)
  const { data: suggestions, isLoading: isLoadingSuggestions } =
    useQuery<OrderSuggestion>({
      queryKey: ['order-suggestions', selectedGesId, workerId, searchMode, selectedAreaId],
      queryFn: async () => {
        // Caso 1: Por Área
        if (searchMode === 'area' && selectedAreaId) {
          const batteries = (await axios.get(`/ges/area/${selectedAreaId}/batteries`))
            .data;
          return { required: batteries, covered: [], missing: batteries };
        }

        // Caso 2: Por GES
        if (selectedGesId) {
          const params = new URLSearchParams({ gesId: selectedGesId });
          if (workerId) params.append('workerId', workerId);

          return (await axios.get(`/orders/suggestions?${params.toString()}`))
            .data;
        }

        return { required: [], covered: [], missing: [] };
      },
      enabled: !!(selectedGesId || (searchMode === 'area' && selectedAreaId)),
    });

  const createOrderMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let finalGesId = values.gesId;

      if (searchMode === 'area' && !finalGesId && gesList && gesList.length > 0) {
        finalGesId = gesList[0].id;
      }

      if (!finalGesId) {
        throw new Error('Debe seleccionar un GES o un Área válida');
      }

      // SOLICITAMOS SOLO LO FALTANTE (MISSING)
      const batteryIds =
        suggestions?.missing.map((b: any) => ({ id: b.id })) || [];

      await axios.post('/orders', {
        worker: {
          rut: values.rut,
          name: values.name,
          phone: values.phone,
          position: values.position,
        },
        gesId: finalGesId,
        companyId: values.companyId,
        evaluationType: values.evaluationType,
        examBatteries: batteryIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onOpenChange(false);
      form.reset();
      setWorkerStatus(null);
      setWorkerId(undefined);
      toast.success('Solicitud creada');
    },
    onError: () => toast.error('Error al crear (Verifique datos)'),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Nueva Solicitud</SheetTitle>
          <SheetDescription>
            Gestión inteligente de exámenes.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => createOrderMutation.mutate(v))}
            className="space-y-6 py-6"
          >
            {/* DATOS TRABAJADOR */}
            <div className="space-y-4 border rounded-md p-3 bg-slate-50">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUT</FormLabel>
                      <FormControl>
                        <Input {...field} onBlur={handleRutBlur} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {workerStatus === 'found' && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 p-2 rounded">
                  <UserCheck className="h-4 w-4" /> Trabajador en nómina.{' '}
                  <strong>OCUPACIONAL</strong>.
                </div>
              )}

              {workerStatus === 'new' && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 p-2 rounded">
                  <UserPlus className="h-4 w-4" /> Trabajador nuevo.{' '}
                  <strong>PRE-OCUPACIONAL</strong>.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="evaluationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!workerStatus}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PRE_OCUPACIONAL">
                          Pre-Ocupacional
                        </SelectItem>
                        <SelectItem value="OCUPACIONAL">Ocupacional</SelectItem>
                        <SelectItem value="EXAMEN_SALIDA">Salida</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="h-px bg-border" />

            {/* UBICACIÓN */}
            <div className="space-y-3 bg-slate-50 p-3 rounded-md border">
              <h3 className="text-xs font-bold text-slate-500 uppercase">
                Ubicación
              </h3>

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies?.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="workCenterId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Centro</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        disabled={!selectedCompanyId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workCenters?.map((w: any) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        disabled={!selectedWorkCenterId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Filtrar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {areas?.map((a: any) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              {/* SELECT DE GES CUANDO MODO = "GES" */}
              {searchMode === 'ges' && (
                <FormField
                  control={form.control}
                  name="gesId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puesto / GES</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={
                          !selectedAreaId ||
                          !gesList ||
                          gesList.length === 0
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                !selectedAreaId
                                  ? 'Seleccione un área primero'
                                  : 'Seleccione un GES...'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gesList?.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* MODO */}
            <div className="flex justify-center">
              <Tabs
                value={searchMode}
                onValueChange={(v: string) => {
                  setSearchMode(v as 'ges' | 'area');
                  form.setValue('gesId', '');
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ges">Por Puesto (GES)</TabsTrigger>
                  <TabsTrigger value="area" disabled={!selectedAreaId}>
                    Por Área Completa
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* SUGERENCIAS / RESULTADOS */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Análisis de Brechas</CardTitle>
              </CardHeader>
              <CardContent className="text-xs pt-3 space-y-4">
                {isLoadingSuggestions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {/* 1. Baterías Faltantes (A Solicitar) */}
                    <div>
                      <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        A Solicitar ({suggestions?.missing.length || 0})
                      </h4>
                      {suggestions?.missing &&
                      suggestions.missing.length > 0 ? (
                        <ul className="list-disc list-inside font-medium text-amber-900 bg-amber-50 p-2 rounded border border-amber-100">
                          {suggestions.missing.map((b: any) => (
                            <li key={b.id}>{b.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic ml-4">
                          No hay exámenes pendientes.
                        </span>
                      )}
                    </div>

                    {/* 2. Baterías Cubiertas (Ya tiene) */}
                    {suggestions?.covered &&
                      suggestions.covered.length > 0 && (
                        <div>
                          <h4 className="font-bold text-green-700 mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Vigentes / Cubiertas (
                            {suggestions.covered.length})
                          </h4>
                          <ul className="list-disc list-inside font-medium text-green-900 bg-green-50 p-2 rounded border border-green-100 opacity-80">
                            {suggestions.covered.map((b: any) => (
                              <li key={b.id}>
                                {b.name}{' '}
                                <span className="text-[10px] text-green-600">
                                  (No se pedirá)
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending
                ? 'Procesando...'
                : `Generar Solicitud (${
                    suggestions?.missing.length || 0
                  } exámenes)`}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
