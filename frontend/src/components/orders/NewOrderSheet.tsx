import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// --- TIPOS LOCALES (Para evitar error de importación) ---
interface RiskAgent {
  id: string;
  name: string;
}

interface RiskExposure {
  id: string;
  riskAgent: RiskAgent;
  examBatteries?: { id: string; name: string }[];
}

interface GesLocal {
  id: string;
  name: string;
  riskExposures?: RiskExposure[];
  prescriptions?: string;
}
// -------------------------------------------------------

const formSchema = z.object({
  rut: z.string().min(8, 'RUT inválido'),
  name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().optional(),
  position: z.string().min(2, 'Cargo requerido'),
  evaluationType: z.enum(['PRE_OCUPACIONAL', 'OCUPACIONAL', 'EXAMEN_SALIDA']),
  gesId: z.string().uuid('Seleccione un GES'),
  companyId: z.string().uuid(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewOrderSheet({ open, onOpenChange }: NewOrderSheetProps) {
  const queryClient = useQueryClient();

  // 1. Traer lista de GES
  const { data: gesList } = useQuery<GesLocal[]>({
    queryKey: ['ges'],
    queryFn: async () => {
      const { data } = await axios.get('/ges');
      return data;
    },
    enabled: open,
  });

  // 2. Traer lista de Empresas
  const { data: companies } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await axios.get('/companies');
      return data;
    },
    enabled: open,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rut: '',
      name: '',
      phone: '',
      position: '',
      evaluationType: 'OCUPACIONAL',
    },
  });

  const selectedGesId = form.watch('gesId');
  const selectedGes = gesList?.find((g) => g.id === selectedGesId);

  const createOrderMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let examBatteryId = undefined;
      if (selectedGes && selectedGes.riskExposures) {
        const riskWithBattery = selectedGes.riskExposures.find((r) => r.examBatteries && r.examBatteries.length > 0);
        if (riskWithBattery && riskWithBattery.examBatteries) {
          examBatteryId = riskWithBattery.examBatteries[0].id;
        }
      }

      await axios.post('/orders', {
        worker: {
          rut: values.rut,
          name: values.name,
          phone: values.phone,
          position: values.position,
        },
        gesId: values.gesId,
        companyId: values.companyId,
        evaluationType: values.evaluationType,
        examBatteryId: examBatteryId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      onOpenChange(false);
      form.reset();
      toast.success("Orden creada exitosamente");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Error al crear orden");
    },
  });

  const onSubmit = (values: FormValues) => {
    createOrderMutation.mutate(values);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Nueva Solicitud de Examen</SheetTitle>
          <SheetDescription>
            Ingresa los datos del trabajador y selecciona el GES.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Datos Trabajador</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUT</FormLabel>
                      <FormControl>
                        <Input placeholder="12.345.678-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre Apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+569..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Soldador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Datos del Servicio</h3>

              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione Empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies?.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="evaluationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Evaluación</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PRE_OCUPACIONAL">Pre-Ocupacional</SelectItem>
                          <SelectItem value="OCUPACIONAL">Ocupacional</SelectItem>
                          <SelectItem value="EXAMEN_SALIDA">Salida</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gesId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GES (Puesto de Trabajo)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Busque el GES..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gesList?.map((ges) => (
                            <SelectItem key={ges.id} value={ges.id}>
                              {ges.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {selectedGes && (
              <Card className="bg-blue-50 border-blue-200 animate-in fade-in slide-in-from-bottom-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-800 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Protocolo Detectado: {selectedGes.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-blue-700 space-y-2">
                  <div>
                    <span className="font-semibold">Riesgos:</span>{' '}
                    {selectedGes.riskExposures?.map((r) => r.riskAgent.name).join(', ') || 'Sin riesgos registrados'}
                  </div>
                  <div>
                    <span className="font-semibold">Baterías Sugeridas:</span>{' '}
                    {(() => {
                      const batteries = selectedGes.riskExposures?.flatMap(r => r.examBatteries || []) || [];
                      const uniqueBatteries = Array.from(new Map(batteries.map(b => [b.id, b])).values());
                      return uniqueBatteries.length > 0
                        ? uniqueBatteries.map(b => b.name).join(', ')
                        : 'Ninguna detectada (se usará fallback)';
                    })()}
                  </div>
                  {selectedGes.prescriptions && (
                    <div>
                      <span className="font-semibold">Prescripciones:</span> {selectedGes.prescriptions}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Solicitud
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}