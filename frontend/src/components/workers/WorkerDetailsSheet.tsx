import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Briefcase, Phone, Mail, FileText, Calendar, CheckCircle2, AlertCircle, XCircle, ArrowRightLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { JobTransferDialog } from './JobTransferDialog';

interface Props { workerId: string; open: boolean; onOpenChange: (open: boolean) => void; }

export function WorkerDetailsSheet({ workerId, open, onOpenChange }: Props) {
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const { data: worker, isLoading } = useQuery({ queryKey: ['worker', workerId], queryFn: async () => (await axios.get(`/workers/${workerId}`)).data, enabled: !!workerId && open });

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('es-CL') : '-';
  const getStatusBadge = (status: string) => {
      if (status === 'APTO') return <Badge className="bg-green-100 text-green-800 border-green-200">Apto</Badge>;
      if (status === 'NO_APTO') return <Badge className="bg-red-100 text-red-800 border-red-200">No Apto</Badge>;
      return <Badge variant="outline">Pendiente</Badge>;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] p-0 flex flex-col">
        <div className="p-6 border-b bg-slate-50">
            <SheetHeader><SheetTitle className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600"/> Ficha del Colaborador</SheetTitle><SheetDescription>Historial clínico y laboral.</SheetDescription></SheetHeader>
        </div>
        {isLoading ? <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin" /></div> : worker && (
            <ScrollArea className="flex-1 p-6">
                <div className="grid grid-cols-2 gap-4 mb-6 bg-white p-4 rounded-lg border shadow-sm">
                    <div><h3 className="text-lg font-bold text-slate-900">{worker.name}</h3><Badge variant="secondary" className="mt-1 font-mono">{worker.rut}</Badge><div className="mt-2 text-xs text-muted-foreground">GES Actual: <strong>{worker.currentGes?.name || 'Sin asignar'}</strong></div></div>
                    <div className="flex flex-col gap-2">
                        <div className="text-sm space-y-1 text-slate-600">
                            <div className="flex items-center gap-2"><Briefcase className="h-3 w-3"/> {worker.position}</div>
                            <div className="flex items-center gap-2"><User className="h-3 w-3"/> {worker.costCenter || 'Sin CC'}</div>
                            <div className="flex items-center gap-2"><Mail className="h-3 w-3"/> {worker.email || '-'}</div>
                            <div className="flex items-center gap-2"><Phone className="h-3 w-3"/> {worker.phone || '-'}</div>
                        </div>
                        <Button size="sm" variant="outline" className="mt-2 w-fit self-end text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => setIsTransferOpen(true)}><ArrowRightLeft className="h-4 w-4 mr-2"/> Cambio de Puesto</Button>
                    </div>
                </div>
                <Separator className="my-6" />
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600"/> Historial de Evaluaciones</h4>
                <div className="space-y-4">
                    {worker.examOrders?.map((order: any) => (
                        <div key={order.id} className="border rounded-lg overflow-hidden">
                            <div className="bg-slate-100 p-3 flex justify-between items-center"><div><div className="font-bold text-sm text-slate-800">{order.ges?.name || 'Examen'}</div><div className="text-xs text-muted-foreground flex items-center gap-2"><Calendar className="h-3 w-3"/> {formatDate(order.createdAt)}</div></div><Badge variant="outline">{order.status}</Badge></div>
                            <div className="p-0 divide-y">{order.orderBatteries?.map((ob: any) => (<div key={ob.id} className="p-3 flex items-center justify-between bg-white"><div className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-slate-400"/><span className="text-sm font-medium">{ob.battery.name}</span></div><div className="flex items-center gap-4">{ob.expirationDate && <span className="text-xs text-slate-500">{formatDate(ob.expirationDate)}</span>}{getStatusBadge(ob.status)}</div></div>))}</div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        )}
      </SheetContent>
      {isTransferOpen && <JobTransferDialog worker={worker} open={isTransferOpen} onOpenChange={setIsTransferOpen} />}
    </Sheet>
  );
}