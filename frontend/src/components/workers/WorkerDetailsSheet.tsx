import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Loader2,
  User as UserIcon,
  Briefcase,
  Mail,
  Phone,
  ArrowRightLeft,
  ShieldCheck,
  AlertTriangle,
  Building2,
  History,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Skull,
  UserMinus // Icono para desvincular
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

  // --- MUTACIÓN 1: PROMOVER A NÓMINA ---
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

  // --- MUTACIÓN 2: DESVINCULAR (DAR DE BAJA) ---
  const terminateMutation = useMutation({
    mutationFn: async () => {
        return await axios.patch(`/workers/${workerId}`, { 
            employmentStatus: 'DESVINCULADO'
        });
    },
    onSuccess: () => {
        toast.success("Colaborador desvinculado. Se ha enviado el protocolo de egreso.");
        queryClient.invalidateQueries({ queryKey: ['workers'] });
        onOpenChange(false); // Cerramos el panel
    },
    onError: (err: any) => {
        toast.error("Error al desvincular: " + (err.message || "Desconocido"));
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[750px] p-0 flex flex-col bg-white">
        
        {/* HEADER */}
        <div className="border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl">
              <div className="bg-primary/10 p-2 rounded-full">
                  <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                  <span>Ficha del Colaborador</span>
                  <span className="text-xs font-normal text-muted-foreground uppercase tracking-wider">ID: {worker?.rut || '...'}</span>
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary h-8 w-8" />
          </div>
        ) : worker ? (
          <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
            
            {/* TABS MENU */}
            <div className="px-6 pt-2 border-b">
                <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-8">
                    <TabsTrigger 
                        value="general" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 py-3 text-slate-500 font-medium transition-all hover:text-slate-700"
                    >
                        Vista General
                    </TabsTrigger>
                    <TabsTrigger 
                        value="history" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 py-3 text-slate-500 font-medium transition-all group hover:text-slate-700"
                    >
                        <div className="flex items-center gap-2">
                            Historial de Exposición 
                            {worker.exposureHistory && worker.exposureHistory.length > 0 && (
                                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px]">
                                    {worker.exposureHistory.length}
                                </Badge>
                            )}
                        </div>
                    </TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="flex-1">
              
              {/* === PESTAÑA 1: VISTA GENERAL === */}
              <TabsContent value="general" className="p-6 m-0 space-y-6 animate-in fade-in duration-300">
                
                {/* 1. ALERTA DE TRÁNSITO */}
                {worker.employmentStatus === 'TRANSITO' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-3">
                            <div className="bg-amber-100 p-2.5 rounded-full h-fit shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm">Candidato en Tránsito</h4>
                                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                    Este trabajador aún no figura en la nómina oficial.
                                </p>
                            </div>
                        </div>
                        
                        {/* MODAL CONFIRMACION INGRESO */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                                    size="sm"
                                    disabled={promoteMutation.isPending}
                                >
                                    {promoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                    Confirmar Ingreso
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Ingreso a Nómina</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        ¿Estás seguro de que deseas confirmar el ingreso de <strong>{worker.name}</strong> a la nómina oficial?
                                        <br/><br/>
                                        Esta acción habilitará todas las funciones de gestión y vigilancia para este trabajador.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => promoteMutation.mutate()} className="bg-green-600 hover:bg-green-700">
                                        Confirmar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                    </div>
                )}

                {/* 2. ALERTA DE DESVINCULADO (SI YA LO ESTÁ) */}
                {worker.employmentStatus === 'DESVINCULADO' && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex gap-3 items-center">
                        <div className="bg-red-100 p-2 rounded-full h-fit shrink-0">
                            <UserMinus className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-red-900 text-sm">Trabajador Desvinculado</h4>
                            <p className="text-xs text-red-700">
                                Este registro es histórico. El protocolo de egreso ya fue enviado.
                            </p>
                        </div>
                    </div>
                )}

                {/* 3. TARJETA DE PERFIL */}
                <div className="bg-white">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-1">
                            <h3 className="text-2xl font-bold text-slate-900">{worker.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <Mail className="h-3.5 w-3.5" /> {worker.email || 'Sin correo'}
                                <span className="text-slate-300">|</span>
                                <Phone className="h-3.5 w-3.5" /> {worker.phone || 'Sin teléfono'}
                            </div>
                            <div className="pt-3 flex flex-wrap gap-2">
                                <Badge variant="outline" className="font-mono text-slate-600">
                                    {worker.rut}
                                </Badge>
                                {worker.employmentStatus === 'NOMINA' ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Activo</Badge>
                                ) : worker.employmentStatus === 'DESVINCULADO' ? (
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Desvinculado</Badge>
                                ) : (
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">En Tránsito</Badge>
                                )}
                            </div>
                        </div>

                        <div className="md:w-64 bg-slate-50 rounded p-4 space-y-3 border border-slate-100">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Puesto Actual (GES)</p>
                                {worker.currentGes ? (
                                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                        <Briefcase className="h-4 w-4" />
                                        {worker.currentGes.name}
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400 italic">Sin asignar</span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Centro de Costos</p>
                                <div className="flex items-center gap-2 text-sm text-slate-700">
                                    <Building2 className="h-4 w-4 text-slate-400" />
                                    {worker.costCenter?.name ? (
                                        <span className="truncate" title={worker.costCenter.name}>
                                            {worker.costCenter.code} | {worker.costCenter.name}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400 italic">No especificado</span>
                                    )}
                                </div>
                            </div>

                            {worker.employmentStatus === 'NOMINA' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-xs h-8 bg-white hover:bg-slate-50 text-slate-600 border-slate-200 mt-2"
                                    onClick={() => setIsTransferOpen(true)}
                                >
                                    <ArrowRightLeft className="h-3 w-3 mr-2" />
                                    Cambiar Puesto
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <Separator className="my-6" />

                {/* 4. TIMELINE */}
                <div>
                    <h4 className="text-sm font-bold mb-4 text-slate-800 flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" /> Actividad Reciente
                    </h4>
                    <WorkerMedicalTimeline worker={worker} />
                </div>

                {/* 5. ZONA DE PELIGRO (DESVINCULACIÓN) */}
                {worker.employmentStatus === 'NOMINA' && (
                    <div className="mt-8">
                        <Separator className="mb-6" />
                        <div className="bg-red-50/50 border border-red-100 rounded-lg p-6">
                            <h4 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
                                <UserMinus className="h-4 w-4" /> Ciclo de Vida Laboral
                            </h4>
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <p className="text-xs text-red-700/80 max-w-md">
                                    Al dar de baja, el sistema cerrará el historial de exposición y enviará automáticamente 
                                    la instrucción legal de <strong>Exámenes de Egreso</strong> al trabajador (si corresponde según sus riesgos).
                                </p>
                                
                                {/* MODAL DESVINCULACION */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            variant="destructive" 
                                            size="sm"
                                            className="whitespace-nowrap bg-red-600 hover:bg-red-700 shadow-sm"
                                            disabled={terminateMutation.isPending}
                                        >
                                            {terminateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserMinus className="mr-2 h-4 w-4" />}
                                            Dar de Baja / Desvincular
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                                                <AlertTriangle className="h-5 w-5" /> 
                                                ¿Confirmar Desvinculación?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Estás a punto de terminar el contrato de <strong>{worker?.name}</strong>.
                                                <br /><br />
                                                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                                    <li>El estado pasará a <strong>DESVINCULADO</strong>.</li>
                                                    <li>Se cerrará su historial de exposición a riesgos.</li>
                                                    <li>El sistema enviará automáticamente el <strong>Correo de Instrucción de Egreso</strong> al trabajador.</li>
                                                </ul>
                                                <br />
                                                Esta acción <strong>no se puede deshacer</strong> fácilmente.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction 
                                                onClick={() => terminateMutation.mutate()} 
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Sí, Desvincular
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                            </div>
                        </div>
                    </div>
                )}

              </TabsContent>


              {/* === PESTAÑA 2: HISTORIAL DE EXPOSICIÓN === */}
              <TabsContent value="history" className="p-6 m-0 space-y-6 animate-in fade-in duration-300">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <History className="h-4 w-4 text-slate-500" /> Trazabilidad de Riesgos
                    </h4>
                    <p className="text-xs text-slate-600">
                        Registro oficial de los puestos (GES) y agentes de riesgo asociados.
                        Este historial se construye automáticamente con cada cambio de puesto.
                    </p>
                </div>

                <div className="relative mt-2">
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200"></div>
                    <div className="space-y-4">
                        {worker.exposureHistory && worker.exposureHistory.length > 0 ? (
                            worker.exposureHistory.map((record: any) => (
                                <ExposureHistoryCard key={record.id} record={record} />
                            ))
                        ) : (
                            <div className="text-center py-12 ml-6">
                                <div className="bg-slate-50 inline-flex p-3 rounded-full mb-3">
                                    <History className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-medium text-slate-600">Sin historial registrado</p>
                                <p className="text-xs text-slate-400 mt-1 max-w-[250px] mx-auto">
                                    El historial comenzará a registrarse automáticamente cuando realices un 
                                    <strong> Cambio de Puesto</strong>.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
              </TabsContent>
            </ScrollArea>
            
          </Tabs>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
            No se encontraron datos del trabajador.
          </div>
        )}

        {isTransferOpen && worker && (
          <JobTransferDialog
            worker={worker}
            open={isTransferOpen}
            onOpenChange={setIsTransferOpen}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ==========================================
// SUB-COMPONENTE: TARJETA DESPLEGABLE
// ==========================================
function ExposureHistoryCard({ record }: { record: any }) {
    const [isOpen, setIsOpen] = useState(false);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Presente';
        return new Date(dateString).toLocaleDateString('es-CL', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const risks = record.ges?.riskExposures || [];
    const hasRisks = risks.length > 0;

    return (
        <div className="relative pl-10 group">
            <div className={`absolute left-[13px] top-4 h-2 w-2 rounded-full border-2 bg-white z-10 ${
                record.isActive ? 'border-primary scale-125' : 'border-slate-300'
            }`}></div>

            <div className={`rounded-lg border transition-all overflow-hidden ${
                record.isActive 
                    ? 'bg-white border-primary/30 shadow-sm' 
                    : 'bg-white border-slate-200'
            }`}>
                <div 
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex justify-between items-start"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h5 className={`font-bold text-sm ${record.isActive ? 'text-primary' : 'text-slate-800'}`}>
                                {record.ges?.name || 'Puesto Desconocido'}
                            </h5>
                            {record.isActive ? (
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none text-[10px] h-5">VIGENTE</Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-500 border-slate-200 text-[10px] h-5">HISTÓRICO</Badge>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {record.company?.name || 'Empresa Desconocida'}
                            </div>
                            <div className="hidden sm:block text-slate-300">|</div>
                            <div className="flex items-center gap-2">
                                <span>{formatDate(record.startDate)}</span>
                                <span className="text-slate-300">➜</span>
                                <span>{formatDate(record.endDate)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="pl-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {isOpen && (
                    <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-1 duration-200">
                        <Separator className="mb-3" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Skull className="h-3 w-3" /> Agentes de Riesgo ({risks.length})
                        </p>
                        {hasRisks ? (
                            <div className="space-y-2">
                                {risks.map((exp: any) => (
                                    <div key={exp.id} className="flex items-start gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                                        <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0"></div>
                                        <div>
                                            <span className="font-semibold text-slate-700 block">
                                                {exp.riskAgent?.name || 'Agente Sin Nombre'}
                                            </span>
                                            {exp.specificAgentDetails && (
                                                <span className="text-slate-500 text-[11px]">
                                                    Detalle: {exp.specificAgentDetails}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 italic bg-slate-50 p-2 rounded text-center">
                                No hay riesgos asociados a este puesto en el historial.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}