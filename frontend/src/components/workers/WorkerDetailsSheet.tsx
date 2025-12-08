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
  AlertTriangle,
  Building2 // Icono para el Centro de Costos
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

  const promoteMutation = useMutation({
    mutationFn: async () => {
        const latestOrder = worker?.examOrders?.[0];
        const gesToAssignId = latestOrder?.ges?.id;

        if (!gesToAssignId) {
            throw new Error("No se encontró un GES asociado en los exámenes para asignar el puesto.");
        }

        return await axios.patch(`/workers/${workerId}`, { 
            employmentStatus: 'NOMINA',
            currentGesId: gesToAssignId 
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
              Historial clínico y laboral completo.
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
              
              {/* === SECCIÓN ALERTAS (TRÁNSITO) === */}
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
                        {promoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                        Confirmar Ingreso
                    </Button>
                </div>
              )}

              {/* === DATOS BÁSICOS (ENCABEZADO) === */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {worker.name}
                  </h3>
                  <Badge variant="secondary" className="mt-1 font-mono">
                    {worker.rut}
                  </Badge>
                  <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                    GES Actual:
                    {worker.currentGes ? (
                        <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 ml-1">
                            {worker.currentGes.name}
                        </Badge>
                    ) : (
                        <span className="italic text-slate-400 ml-1">Sin asignar</span>
                    )}
                  </div>
                </div>

                <div className="text-xs space-y-2 text-slate-600 min-w-[200px]">
                  {/* Cargo */}
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-slate-400" /> 
                    <span className="font-medium">{worker.position || 'Cargo no especificado'}</span>
                  </div>
                  
                  {/* 👇👇👇 CENTRO DE COSTOS (ARREGLADO VISUALMENTE) 👇👇👇 */}
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-slate-400" />{' '}
                    {worker.costCenter?.name ? (
                        <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0 font-normal">
                            {worker.costCenter.code} | {worker.costCenter.name}
                        </Badge>
                    ) : (
                        <span className="text-slate-400 italic">
                            {typeof worker.costCenter === 'string' ? worker.costCenter : 'Sin Centro de Costos'}
                        </span>
                    )}
                  </div>
                  {/* 👆👆👆 FIN ARREGLO 👆👆👆 */}

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-1">
                    <Mail className="h-3 w-3 text-slate-400" /> {worker.email || '-'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-slate-400" /> {worker.phone || '-'}
                  </div>

                  {worker.employmentStatus !== 'TRANSITO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full justify-center text-blue-700 border-blue-200 hover:bg-blue-50 h-8"
                        onClick={() => setIsTransferOpen(true)}
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                        Cambio de Puesto
                      </Button>
                  )}
                </div>
              </div>

              <Separator className="my-6" />

              {/* === TIMELINE UNIFICADO (HISTORIAL MÉDICO + EVENTOS + ÓRDENES) === */}
              {/* Aquí se muestra todo junto, como te gustaba */}
              <h4 className="text-sm font-semibold mb-4 text-slate-800">Línea de Tiempo</h4>
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