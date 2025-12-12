import { useState } from "react";
import {
  Calendar,
  FileHeart,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Briefcase,
  History,
  FileText, // Icono para ODI
  Clock     // Icono para Pendiente
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MedicalResultDialog } from "@/components/orders/MedicalResultDialog";

interface WorkerMedicalTimelineProps {
  worker: any;
}

// Helpers
function getValidityStatus(expirationDate: string | null) {
  if (!expirationDate) return null;
  const today = new Date();
  const exp = new Date(expirationDate);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Vencido', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle };
  if (diffDays <= 90) return { label: 'Vence pronto', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle };
  return { label: 'Vigente', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function WorkerMedicalTimeline({ worker }: WorkerMedicalTimelineProps) {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [selectedBattery, setSelectedBattery] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleOrder = (id: string) => {
    setExpandedOrders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 1. PREPARAR LISTAS DE DATOS
  
  // A. Eventos Administrativos (Cambios de cargo, etc)
  const events = (worker.events || []).map((e: any) => ({
    type: 'EVENT',
    date: new Date(e.createdAt),
    data: e
  }));

  // B. Órdenes Médicas
  const orders = (worker.examOrders || []).map((o: any) => ({
    type: 'ORDER',
    date: new Date(o.createdAt),
    data: o
  }));

  // C. Entregas Legales (ODI) - NUEVO 👇
  const odis = (worker.odiDeliveries || []).map((d: any) => ({
    type: 'ODI',
    date: new Date(d.sentAt), // Usamos la fecha de envío para ordenar
    data: d
  }));

  // 2. UNIFICAR Y ORDENAR (Lo más nuevo arriba)
  const timelineItems = [...events, ...orders, ...odis].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-5 w-5 text-blue-600" />
        <h3 className="font-bold text-slate-800">Historia Integral del Colaborador</h3>
      </div>

      <div className="relative pl-5">
        {/* Línea vertical conectora */}
        <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-slate-300 via-slate-200 to-slate-100" />

        {timelineItems.length > 0 ? (
          timelineItems.map((item: any) => {
            
            // =================================================================
            // CASO 1: EVENTO ADMINISTRATIVO
            // =================================================================
            if (item.type === 'EVENT') {
                const evt = item.data;
                const isCreation = evt.eventType === 'CREACION';
                const isPromo = evt.eventType === 'CAMBIO_ESTADO';
                
                let Icon = Briefcase;
                let colorClass = "bg-slate-200 text-slate-600";
                
                if (isCreation) { Icon = UserPlus; colorClass = "bg-blue-100 text-blue-600"; }
                if (isPromo) { Icon = ShieldCheck; colorClass = "bg-green-100 text-green-600"; }

                return (
                    <div key={evt.id} className="relative mb-8 pl-6 group">
                        <div className={`absolute left-[-6px] top-0 p-1 rounded-full border border-white shadow-sm z-10 ${colorClass}`}>
                            <Icon className="h-3 w-3" />
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                            <p className="text-xs text-slate-400 font-medium mb-1">{formatDate(evt.createdAt)}</p>
                            <p className="text-sm font-bold text-slate-800">{evt.title}</p>
                            {evt.details && <p className="text-xs text-slate-600 mt-1">{evt.details}</p>}
                        </div>
                    </div>
                );
            }

            // =================================================================
            // CASO 2: ENTREGA LEGAL (ODI) - NUEVO BLOQUE
            // =================================================================
            if (item.type === 'ODI') {
                const delivery = item.data;
                const isConfirmed = delivery.status === 'CONFIRMED';
                
                return (
                    <div key={delivery.id} className="relative mb-8 pl-6 group">
                        {/* Icono del nodo */}
                        <div className={`absolute left-[-6px] top-0 p-1 rounded-full border border-white shadow-sm z-10 ${isConfirmed ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                            <FileText className="h-3 w-3" />
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs text-slate-400 font-medium">
                                    {formatDate(delivery.sentAt)}
                                </span>
                                {isConfirmed ? (
                                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 px-1.5 h-5 gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Firmado
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 px-1.5 h-5 gap-1">
                                        <Clock className="h-3 w-3" /> Pendiente
                                    </Badge>
                                )}
                            </div>
                            
                            <p className="text-sm font-bold text-slate-800 mb-0.5">
                                Entrega de Documento Legal
                            </p>
                            <p className="text-xs text-slate-600">
                                {delivery.document?.title || 'Documento sin título'}
                            </p>
                            
                            {/* Detalles extra si está firmado */}
                            {isConfirmed && delivery.confirmedAt && (
                                <div className="mt-2 pt-2 border-t border-slate-50 text-[10px] text-slate-400 flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3 text-indigo-400" />
                                    Firma digital registrada el {new Date(delivery.confirmedAt).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                );
            }

            // =================================================================
            // CASO 3: ORDEN MÉDICA
            // =================================================================
            if (item.type === 'ORDER') {
                const order = item.data;
                const isExpanded = expandedOrders[order.id];
                const hasAlerts = order.orderBatteries?.some((b: any) => {
                      const st = getValidityStatus(b.expirationDate);
                      return st?.label === 'Vencido' || st?.label === 'Vence pronto';
                });

                return (
                  <div key={order.id} className="relative mb-8 pl-6">
                    <div className="absolute left-[-4px] top-2 h-3 w-3 bg-white border-2 border-slate-400 rounded-full z-10" />

                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => toggleOrder(order.id)}
                        className="flex items-center gap-2 group text-left transition-all hover:bg-slate-50 p-2 rounded-lg -ml-2"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                        
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-700">
                                    {order.evaluationType === 'PRE_OCUPACIONAL' ? 'Pre-Ocupacional' : 'Control Ocupacional'}
                                </span>
                                <Badge variant="outline" className="text-[10px] h-5">{order.status}</Badge>
                                {hasAlerts && !isExpanded && <AlertCircle className="h-3 w-3 text-red-500 animate-pulse" />}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <Calendar className="h-3 w-3" />
                                {formatDate(order.createdAt)}
                                <span className="text-slate-300">|</span>
                                <span>{order.ges?.name || 'Examen General'}</span>
                            </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="bg-slate-50 rounded-md border border-slate-100 p-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                            {order.orderBatteries?.map((ob: any) => {
                                const validity = getValidityStatus(ob.expirationDate);
                                const ValidityIcon = validity?.icon;
                                return (
                                    <div key={ob.id} onClick={() => { setSelectedBattery(ob); setIsDialogOpen(true); }} className="flex items-start justify-between bg-white p-2 rounded border border-slate-100 shadow-sm hover:border-blue-300 cursor-pointer group transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-full ${ob.status === 'APTO' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    <FileHeart className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold text-slate-700 group-hover:text-blue-700">{ob.battery?.name}</p>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
                                                        Dictamen: <span className={ob.status === 'APTO' ? 'text-green-600' : ''}>{ob.status}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            {validity && ob.status === 'APTO' && (
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium border ${validity.color} ${validity.bg} ${validity.border}`}>
                                                    {ValidityIcon && <ValidityIcon className="h-3 w-3" />}
                                                    <div><p>{validity.label}</p><p className="opacity-80 text-[9px]">Vence: {formatDate(ob.expirationDate)}</p></div>
                                                </div>
                                            )}
                                    </div>
                                )
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                );
            }
            return null;
          })
        ) : (
           <div className="pl-6 text-xs text-slate-500 italic pb-4">
             No hay historia registrada aún.
           </div>
        )}
      </div>

      {selectedBattery && (
        <MedicalResultDialog 
            battery={selectedBattery} 
            open={isDialogOpen} 
            onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setSelectedBattery(null); }} 
        />
      )}
    </div>
  );
}