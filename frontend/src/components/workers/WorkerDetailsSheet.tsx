import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Briefcase, Phone, Mail, FileText, Calendar, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  workerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkerDetailsSheet({ workerId, open, onOpenChange }: Props) {
  const { data: worker, isLoading } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: async () => (await axios.get(`/workers/${workerId}`)).data,
    enabled: !!workerId && open
  });

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('es-CL') : '-';

  const getStatusBadge = (status: string) => {
      if (status === 'APTO') return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Apto</Badge>;
      if (status === 'NO_APTO') return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">No Apto</Badge>;
      if (status === 'APTO_CON_OBSERVACIONES') return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Obs</Badge>;
      return <Badge variant="outline">Pendiente</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] p-0 flex flex-col">
        
        {/* HEADER FIJO */}
        <div className="p-6 border-b bg-slate-50">
            <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600"/> Ficha del Colaborador
                </SheetTitle>
                <SheetDescription>Historial clínico y laboral.</SheetDescription>
            </SheetHeader>
        </div>

        {isLoading ? <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div> : worker && (
            <ScrollArea className="flex-1 p-6">
                {/* DATOS PERSONALES */}
                <div className="grid grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-lg border shadow-sm">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">{worker.name}</h3>
                        <Badge variant="secondary" className="mt-1 font-mono">{worker.rut}</Badge>
                    </div>
                    <div className="text-sm space-y-1 text-slate-600">
                        <div className="flex items-center gap-2"><Briefcase className="h-3 w-3"/> {worker.position}</div>
                        <div className="flex items-center gap-2"><User className="h-3 w-3"/> {worker.costCenter || 'Sin CC'}</div>
                        <div className="flex items-center gap-2"><Mail className="h-3 w-3"/> {worker.email || '-'}</div>
                        <div className="flex items-center gap-2"><Phone className="h-3 w-3"/> {worker.phone || '-'}</div>
                    </div>
                </div>

                <Separator className="my-6" />
                
                {/* HISTORIAL CLÍNICO */}
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600"/> Historial de Evaluaciones
                </h4>

                <div className="space-y-4">
                    {worker.examOrders?.length > 0 ? worker.examOrders.map((order: any) => (
                        <div key={order.id} className="border rounded-lg overflow-hidden">
                            {/* ENCABEZADO DE LA ORDEN */}
                            <div className="bg-slate-100 p-3 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-sm text-slate-800">
                                        {order.ges?.name || 'Examen General'}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-3 w-3"/> {formatDate(order.createdAt)}
                                    </div>
                                </div>
                                <Badge variant={order.status === 'REALIZADO' ? 'default' : 'secondary'}>
                                    {order.status}
                                </Badge>
                            </div>

                            {/* DETALLE DE RESULTADOS (BATERÍAS) */}
                            <div className="p-0 divide-y">
                                {order.orderBatteries?.length > 0 ? order.orderBatteries.map((ob: any) => (
                                    <div key={ob.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            {ob.status === 'APTO' ? <CheckCircle2 className="h-4 w-4 text-green-600"/> : 
                                             ob.status === 'NO_APTO' ? <XCircle className="h-4 w-4 text-red-600"/> : 
                                             <AlertCircle className="h-4 w-4 text-slate-400"/>}
                                            
                                            <span className="text-sm font-medium">{ob.battery.name}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            {ob.expirationDate && (
                                                <div className="text-xs text-right">
                                                    <span className="block text-muted-foreground">Vence</span>
                                                    <span className={`font-bold ${new Date(ob.expirationDate) < new Date() ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {formatDate(ob.expirationDate)}
                                                    </span>
                                                </div>
                                            )}
                                            {getStatusBadge(ob.status)}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="p-3 text-xs text-muted-foreground italic text-center">Sin resultados registrados</p>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No hay historial médico registrado.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}