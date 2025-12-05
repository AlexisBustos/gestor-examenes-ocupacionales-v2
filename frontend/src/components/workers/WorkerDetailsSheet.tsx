import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import {
  Loader2,
  User as UserIcon,
  Briefcase,
  Mail,
  Phone,
  ArrowRightLeft,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

import { JobTransferDialog } from '@/components/workers/JobTransferDialog';
import { WorkerMedicalTimeline } from './WorkerMedicalTimeline';

interface WorkerDetailsSheetProps {
  workerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkerDetailsSheet({
  workerId,
  open,
  onOpenChange,
}: WorkerDetailsSheetProps) {
  const queryClient = useQueryClient();
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const { data: worker, isLoading } = useQuery<any>({
    queryKey: ['worker-details', workerId],
    queryFn: async () => {
      const { data } = await axios.get(`/workers/${workerId}`);
      return data;
    },
    enabled: !!workerId && open,
  });

  // 👇👇👇 AQUÍ ESTÁ LA CORRECCIÓN CLAVE 👇👇👇
  const promoteMutation = useMutation({
    mutationFn: async () => {
        // 1. Buscamos el último examen (orden) para saber qué GES tenía asignado
        // Como el backend nos devuelve 'examOrders' ordenados por fecha desc, tomamos el primero [0]
        const latestOrder = worker?.examOrders?.[0];
        const gesToAssignId = latestOrder?.ges?.id;

        if (!gesToAssignId) {
            throw new Error("No se encontró un GES asociado en los exámenes para asignar el puesto.");
        }

        // 2. Actualizamos Estado A NÓMINA + Asignamos el GES ACTUAL
        return await axios.patch(`/workers/${workerId}`, { 
            employmentStatus: 'NOMINA',
            currentGesId: gesToAssignId // <--- ESTE ES EL CABLE QUE FALTABA
        });
    },
    onSuccess: () => {
        toast.success("¡Trabajador ingresado a Nómina y Puesto asignado!");
        queryClient.invalidateQueries({ queryKey: ['worker-details'] });
        queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
    onError: (err: any) => {
        toast.error("Error al actualizar: " + (err.message || "Desconocido"));
    }
  });
  // 👆👆👆 FIN DE LA CORRECCIÓN 👆👆👆

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] p-0 flex flex-col">
        <div className="border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-blue-600" />
              Ficha del Colaborador
            </SheetTitle>
            <SheetDescription>
              Historial clínico y laboral.
            </SheetDescription>
          </SheetHeader>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : worker ? (
          <>
            <ScrollArea className="flex-1 p-6">
              
              {/* === SECCIÓN ALERTAS: SOLO SI ESTÁ EN TRÁNSITO === */}
              {worker.employmentStatus === 'TRANSITO' && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
                    <div className="flex gap-3">
                        <div className="bg-amber-100 p-2 rounded-full h-fit">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-amber-900 text-sm">Candidato en Tránsito</h4>
                            <p className="text-xs text-amber-700 mt-1">
                                Este trabajador aún no figura en la nómina oficial.
                                <br />Si los exámenes están aprobados, confirma su ingreso.
                            </p>
                        </div>
                    </div>
                    <Button 
                        className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                        onClick={() => {
                            if(confirm("¿Confirmar que el trabajador pasa a ser parte de la dotación oficial?")) {
                                promoteMutation.mutate();
                            }
                        }}
                        disabled={promoteMutation.isPending}
                    >
                        {promoteMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ShieldCheck className="mr-2 h-4 w-4" />
                        )}
                        Confirmar Ingreso
                    </Button>
                </div>
              )}

              {/* DATOS BÁSICOS DEL TRABAJADOR */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {worker.name}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="mt-1 font-mono"
                  >
                    {worker.rut}
                  </Badge>
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    GES Actual:
                    {worker.currentGes ? (
                        <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                            {worker.currentGes.name}
                        </Badge>
                    ) : (
                        <span className="italic text-slate-400">Sin asignar</span>
                    )}
                  </div>
                </div>

                <div className="text-xs space-y-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3" /> {worker.position || 'Cargo no especificado'}
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-3 w-3" />{' '}
                    {worker.costCenter || 'Sin CC'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {worker.email || '-'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {worker.phone || '-'}
                  </div>

                  {/* Solo mostramos cambio de puesto si YA es de nómina */}
                  {worker.employmentStatus !== 'TRANSITO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-fit self-end text-blue-700 border-blue-200 hover:bg-blue-50"
                        onClick={() => setIsTransferOpen(true)}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Cambio de Puesto
                      </Button>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* TIMELINE DE VIGILANCIA */}
              <WorkerMedicalTimeline worker={worker} />

            </ScrollArea>

            {isTransferOpen && (
              <JobTransferDialog
                worker={worker}
                open={isTransferOpen}
                onOpenChange={setIsTransferOpen}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
            No se encontraron datos del trabajador.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}