import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/Sheet';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/Button';
import {
  User, AlertTriangle, Activity, CheckCircle2, Calendar, FileText
} from 'lucide-react';
import { ResultsDialog } from './ResultsDialog';

interface RiskExposure {
  riskAgent: { name: string };
  exposureType?: string;
  specificAgentDetails?: string;
}

interface OrderBattery {
  id: string;
  status: string;
  expirationDate?: string | null;
  examBattery: {
    name: string;
  };
}

interface Order {
  id: string;
  status: string;
  worker: {
    name: string;
    rut: string;
    position?: string;
  };
  ges: {
    riskExposures?: RiskExposure[];
  };
  orderBatteries?: OrderBattery[];
  scheduledAt?: string | null;
  providerName?: string;
}

interface Props {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateBattery?: (batteryId: string, status: string, expirationDate?: string) => Promise<void>;
}

export function OrderDetailsSheet({ order, open, onOpenChange, onUpdateBattery }: Props) {
  const [resultsOpen, setResultsOpen] = useState(false);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleSaveResults = async (results: { id: string; status: string; expirationDate?: string }[]) => {
    if (!onUpdateBattery) return;
    // Process sequentially or parallel
    for (const res of results) {
      await onUpdateBattery(res.id, res.status, res.expirationDate);
    }
  };

  return (
    <>
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
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> Trabajador</h3>
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div><span className="text-xs text-muted-foreground block">Nombre</span><span className="font-medium">{order.worker.name}</span></div>
                <div><span className="text-xs text-muted-foreground block">RUT</span><span className="font-mono">{order.worker.rut}</span></div>
                <div><span className="text-xs text-muted-foreground block">Cargo</span><span>{order.worker.position || '-'}</span></div>
              </div>
            </section>

            <Separator />

            {/* 2. RIESGOS DETECTADOS */}
            <section className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Riesgos del Puesto</h3>
              <div className="border rounded-lg divide-y">
                {order.ges.riskExposures?.length === 0 ? <div className="p-3 text-sm text-muted-foreground">Sin riesgos registrados</div> :
                  order.ges.riskExposures?.map((risk, idx) => (
                    <div key={idx} className="p-3 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-red-700">{risk.riskAgent.name}</span>
                        {risk.exposureType && <Badge variant="outline">{risk.exposureType}</Badge>}
                      </div>
                      {risk.specificAgentDetails && (
                        <div className="text-sm text-slate-600">
                          <span className="text-xs text-muted-foreground">Agente Específico:</span> {risk.specificAgentDetails}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>

            {/* 3. BATERÍAS ASIGNADAS */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity className="h-4 w-4" /> Baterías Asignadas</h3>
                <Button size="sm" variant="outline" onClick={() => setResultsOpen(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Cargar Resultados
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {order.orderBatteries?.map(bat => (
                  <div key={bat.id} className="flex items-center justify-between bg-white border px-3 py-2 rounded-md text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 ${bat.status === 'APTO' ? 'text-green-600' : 'text-slate-400'}`} />
                      <span className="font-medium">{bat.examBattery.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        bat.status === 'APTO' ? 'default' :
                          bat.status === 'NO_APTO' ? 'destructive' :
                            'secondary'
                      }>
                        {bat.status}
                      </Badge>
                      {bat.expirationDate && (
                        <span className="text-xs text-muted-foreground">
                          Vence: {new Date(bat.expirationDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. AGENDAMIENTO */}
            {order.scheduledAt && (
              <section className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Cita</h3>
                <div className="bg-slate-100 p-4 rounded-lg flex justify-between">
                  <div><div className="text-xs text-muted-foreground">Fecha</div><div className="font-medium">{formatDate(order.scheduledAt)}</div></div>
                  <div className="text-right"><div className="text-xs text-muted-foreground">Proveedor</div><div className="font-medium">{order.providerName}</div></div>
                </div>
              </section>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {order.orderBatteries && (
        <ResultsDialog
          open={resultsOpen}
          onOpenChange={setResultsOpen}
          batteries={order.orderBatteries}
          onSave={handleSaveResults}
        />
      )}
    </>
  );
}