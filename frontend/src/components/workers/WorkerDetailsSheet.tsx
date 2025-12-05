import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // 👈 Importamos useMutation y Client
import axios from '@/lib/axios';
import { toast } from 'sonner'; // 👈 Importamos toast para el feedback

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
  FileText,
  Calendar,
  CheckCircle2,
  ShieldCheck, // 👈 Nuevo icono
  AlertTriangle // 👈 Nuevo icono
} from 'lucide-react';

import { JobTransferDialog } from '@/components/workers/JobTransferDialog';

interface WorkerDetailsSheetProps {
  workerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-CL');
}

function getStatusBadge(status: string | null | undefined) {
  if (status === 'APTO') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        Apto
      </Badge>
    );
  }
  if (status === 'NO_APTO') {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        No Apto
      </Badge>
    );
  }
  return <Badge variant="outline">Pendiente</Badge>;
}

export function WorkerDetailsSheet({
  workerId,
  open,
  onOpenChange,
}: WorkerDetailsSheetProps) {
  const queryClient = useQueryClient(); // 👈 Inicializamos el cliente
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const { data: worker, isLoading } = useQuery<any>({
    queryKey: ['worker-details', workerId],
    queryFn: async () => {
      const { data } = await axios.get(`/workers/${workerId}`);
      return data;
    },
    enabled: !!workerId && open,
  });

  // 👇 MUTACIÓN PARA PASAR A NÓMINA
  const promoteMutation = useMutation({
    mutationFn: async () => {
        // Asumimos que tienes un endpoint PATCH o PUT genérico para actualizar workers
        // Si tu backend usa PUT, cambia patch por put
        return await axios.patch(`/workers/${workerId}`, { 
            employmentStatus: 'NOMINA' 
        });
    },
    onSuccess: () => {
        toast.success("¡Trabajador ingresado a Nómina exitosamente!");
        queryClient.invalidateQueries({ queryKey: ['worker-details'] });
        queryClient.invalidateQueries({ queryKey: ['workers'] }); // Refresca la tabla principal
    },
    onError: () => {
        toast.error("Error al actualizar el estado");
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
              
              {/* 👇 SECCIÓN ESPECIAL: SOLO SI ESTÁ EN TRÁNSITO */}
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
              {/* 👆 FIN SECCIÓN ESPECIAL */}

              {/* Cabecera con datos básicos */}
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
                  <div className="mt-2 text-xs text-muted-foreground">
                    GES Actual:{' '}
                    <strong>
                      {worker.currentGes?.name || 'Sin asignar'}
                    </strong>
                  </div>
                </div>

                <div className="text-xs space-y-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3" /> {worker.position}
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

              {/* Historial de órdenes / evaluaciones */}
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Historial de Evaluaciones
              </h4>

              {Array.isArray(worker.orders) && worker.orders.length > 0 ? (
                <div className="space-y-3">
                  {worker.orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="border rounded-md overflow-hidden text-xs"
                    >
                      <div className="bg-slate-100 p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-sm text-slate-800">
                            {order.ges?.name || 'Examen'}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>

                      <div className="p-0 divide-y">
                        {order.orderBatteries?.map((ob: any) => (
                          <div
                            key={ob.id}
                            className="p-3 flex items-center justify-between bg-white"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-4 w-4 text-slate-400" />
                              <span className="text-sm font-medium">
                                {ob.battery?.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              {ob.expirationDate && (
                                <span className="text-xs text-slate-500">
                                  {formatDate(ob.expirationDate)}
                                </span>
                              )}
                              {getStatusBadge(ob.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic">
                  No hay evaluaciones registradas.
                </div>
              )}
            </ScrollArea>

            {/* Dialogo de cambio de puesto */}
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