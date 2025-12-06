import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  User,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Loader2 // Agregamos icono de carga
} from "lucide-react";
import type { Order } from "@/types/order.types";
// 👇 IMPORTACIONES NUEVAS NECESARIAS
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';

interface Props {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsSheet({ order: initialOrder, open, onOpenChange }: Props) {
  
  // 👇 MAGIA NUEVA: Consultamos los detalles frescos al abrir
  // Esto llamará a tu backend arreglado (getOrderById)
  const { data: fullOrder, isLoading } = useQuery({
    queryKey: ['order-detail', initialOrder.id],
    queryFn: async () => (await axios.get(`/orders/${initialOrder.id}`)).data,
    enabled: open, // Solo busca si la ficha está abierta
    initialData: initialOrder // Muestra lo que ya tiene mientras carga lo nuevo
  });

  // 👇 AGREGA ESTO AQUÍ:
  console.log("--- ESTADO DE LA ORDEN ---");
  console.log("1. ¿Está cargando?", isLoading);
  console.log("2. Data completa recibida:", fullOrder);
  console.log("3. Riesgos en la data:", fullOrder?.ges?.riskExposures);
  // Usamos la data fresca (fullOrder) o la inicial si falla
  const order = fullOrder || initialOrder;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const getResultColor = (status: string) => {
    if (status === 'APTO') return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (status === 'NO_APTO') return 'bg-red-100 text-red-800 hover:bg-red-200';
    if (status === 'APTO_CON_OBSERVACIONES') return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[600px]">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Ficha de Solicitud
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            </SheetTitle>
            <Badge variant={order.status === 'AGENDADO' ? 'default' : 'secondary'}>{order.status}</Badge>
          </div>
          <SheetDescription>ID: {order.id}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">

          {/* 1. INFORMACIÓN DEL PUESTO (GES) - DESTACADO */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-700 mt-1">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Grupo de Exposición Similar (GES)</h4>
                <p className="text-lg font-bold text-slate-900 leading-tight mt-1">
                  {order.ges?.name || 'GES No Asignado'}
                </p>
                <div className="text-xs text-slate-600 mt-2">
                  <strong>Riesgos Asociados:</strong> 
                  {/* BLOQUE CORREGIDO: Usando 'specificAgentDetails' */}
<div className="flex flex-wrap gap-1 mt-1">
  {order.ges?.riskExposures && order.ges.riskExposures.length > 0 ? (
     order.ges.riskExposures.map((r: any, i: number) => (
       <Badge key={i} variant="outline" className="bg-white text-blue-700 border-blue-200">
         {/* 1. Nombre del Agente General (Ej: Metales) */}
         <span className="font-semibold">{r.riskAgent.name}</span>
         
         {/* 2. Detalle Específico usando el nombre REAL de tu base de datos */}
         {r.specificAgentDetails && (
            <span className="ml-1 font-normal text-blue-600 opacity-90">
              — {r.specificAgentDetails}
            </span>
         )}
       </Badge>
     ))
  ) : (
    <span className="italic text-slate-400">Sin riesgos asociados (o cargando...)</span>
  )}
</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. TRABAJADOR */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" /> Trabajador
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
              <div><span className="text-xs text-muted-foreground block">Nombre</span><span className="font-medium">{order.worker.name}</span></div>
              <div><span className="text-xs text-muted-foreground block">RUT</span><span className="font-mono">{order.worker.rut}</span></div>
              <div><span className="text-xs text-muted-foreground block">Cargo</span><span>{order.worker.position || '-'}</span></div>
              <div><span className="text-xs text-muted-foreground block">Empresa</span><span>{order.company.name}</span></div>
            </div>
          </section>

          <Separator />

          {/* 3. RESULTADOS / BATERÍAS */}
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" /> Resultados Clínicos
            </h3>

            <div className="space-y-3">
              {(order.orderBatteries && order.orderBatteries.length > 0) ? (
                order.orderBatteries.map((ob: any) => (
                  <div key={ob.id} className="flex flex-col gap-2 bg-white border p-3 rounded-md shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 font-medium text-slate-800">
                        {ob.status === 'APTO' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                          ob.status === 'NO_APTO' ? <XCircle className="h-4 w-4 text-red-600" /> :
                            <AlertCircle className="h-4 w-4 text-slate-400" />}
                        {ob.battery?.name || 'Batería'}
                      </div>
                      <Badge className={getResultColor(ob.status)}>{ob.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    {ob.expirationDate && (
                      <div className="text-xs text-muted-foreground flex gap-1 ml-6 bg-slate-50 px-2 py-1 rounded w-fit">
                        <Calendar className="h-3 w-3" />
                        Vencimiento: <span className="font-mono font-bold text-slate-700">{new Date(ob.expirationDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                order.examBatteries?.map((bat: any) => (
                  <div key={bat.id} className="bg-slate-50 p-3 rounded border text-sm text-slate-600 flex justify-between">
                    {bat.name}
                    <Badge variant="outline">Sin resultado</Badge>
                  </div>
                )) || <div className="text-sm italic text-muted-foreground">Sin información.</div>
              )}
            </div>
          </section>

          {/* 4. CITA */}
          {order.scheduledAt && (
            <section className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Agenda
              </h3>
              <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center border border-slate-200">
                <div><div className="text-xs text-muted-foreground">Fecha</div><div className="font-medium">{formatDate(order.scheduledAt)}</div></div>
                <div className="text-right"><div className="text-xs text-muted-foreground">Proveedor</div><div className="font-medium">{order.providerName}</div></div>
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}