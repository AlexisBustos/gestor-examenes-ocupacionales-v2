import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, FileText, Calendar, Activity, AlertTriangle, CheckCircle2, AlertCircle 
} from 'lucide-react';
import type { Order } from '@/types/order.types';

interface Props {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsSheet({ order, open, onOpenChange }: Props) {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL', { 
        year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getResultColor = (status: string) => {
      if (status === 'APTO') return 'bg-green-100 text-green-800';
      if (status === 'NO_APTO') return 'bg-red-100 text-red-800';
      if (status === 'APTO_CON_OBSERVACIONES') return 'bg-yellow-100 text-yellow-800';
      return 'bg-slate-100 text-slate-600';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[600px]">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle>Ficha de Solicitud</SheetTitle>
            <Badge variant={order.status === 'AGENDADO' ? 'default' : 'secondary'}>{order.status}</Badge>
          </div>
          <SheetDescription>ID: {order.id}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* 1. TRABAJADOR */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" /> Trabajador
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div><span className="text-xs text-muted-foreground block">Nombre</span><span className="font-medium">{order.worker.name}</span></div>
              <div><span className="text-xs text-muted-foreground block">RUT</span><span className="font-mono">{order.worker.rut}</span></div>
              <div><span className="text-xs text-muted-foreground block">Cargo</span><span>{order.worker.position || '-'}</span></div>
              <div><span className="text-xs text-muted-foreground block">Empresa</span><span>{order.company.name}</span></div>
            </div>
          </section>

          <Separator />

          {/* 2. RIESGOS */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Riesgos del Puesto
            </h3>
            <div className="border rounded-lg divide-y">
              {!order.ges.riskExposures || order.ges.riskExposures.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">Sin riesgos registrados</div>
              ) : (
                order.ges.riskExposures.map((risk, idx) => (
                  <div key={idx} className="p-3 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-red-700">{risk.riskAgent.name}</span>
                      {risk.exposureType && <Badge variant="outline" className="text-xs">{risk.exposureType}</Badge>}
                    </div>
                    {risk.specificAgentDetails && (
                      <div className="text-sm text-slate-600">
                        <span className="text-xs text-muted-foreground">Detalle:</span> {risk.specificAgentDetails}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 3. RESULTADOS POR BATERÍA (AQUÍ ESTABA EL ERROR) */}
          <section className="space-y-3">
             <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Baterías y Resultados
            </h3>
            <div className="flex flex-col gap-2">
                {order.orderBatteries && order.orderBatteries.length > 0 ? (
                    order.orderBatteries.map(ob => (
                        <div key={ob.id} className="flex flex-col gap-2 bg-white border p-3 rounded-md shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 font-medium text-slate-800">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                    {ob.battery?.name || 'Batería Desconocida'}
                                </div>
                                <Badge className={getResultColor(ob.status)}>{ob.status.replace('_', ' ')}</Badge>
                            </div>
                            {ob.expirationDate && (
                                <div className="text-xs text-muted-foreground flex gap-1 ml-6">
                                    <AlertCircle className="h-3 w-3" />
                                    Vence el: <span className="font-mono">{formatDate(ob.expirationDate)}</span>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    // FALLBACK: Si es una orden antigua sin OrderBattery, intentamos mostrar examBatteries
                    order.examBatteries && order.examBatteries.length > 0 ? (
                        order.examBatteries.map(bat => (
                            <div key={bat.id} className="bg-slate-50 p-3 rounded border text-sm text-slate-600">{bat.name}</div>
                        ))
                    ) : (
                        <div className="text-sm text-muted-foreground italic">Sin baterías asignadas</div>
                    )
                )}
            </div>
          </section>

          {/* 4. AGENDAMIENTO */}
          {order.scheduledAt && (
            <section className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Cita Agendada
                </h3>
                <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center border border-slate-200">
                   <div>
                     <div className="text-xs text-muted-foreground">Fecha y Hora</div>
                     <div className="font-medium text-slate-900">{formatDate(order.scheduledAt)}</div>
                   </div>
                   <div className="text-right">
                     <div className="text-xs text-muted-foreground">Proveedor</div>
                     <div className="font-medium text-slate-900">{order.providerName || 'No especificado'}</div>
                   </div>
                </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}