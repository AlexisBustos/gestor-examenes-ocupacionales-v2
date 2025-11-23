import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Eye, User, Activity, Calendar, FileText, Building2 } from 'lucide-react';
import type { Order } from '@/types/order.types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrderDetailsSheetProps {
    order: Order;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function OrderDetailsSheet({ order, open, onOpenChange }: OrderDetailsSheetProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SOLICITADO': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'AGENDADO': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'REALIZADO': return 'bg-green-100 text-green-700 border-green-200';
            case 'CERRADO': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'ANULADO': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), "d 'de' MMMM, yyyy - HH:mm", { locale: es });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto sm:max-w-[540px]">
                <SheetHeader className="mb-6">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl">Ficha Digital</SheetTitle>
                        <Badge className={getStatusColor(order.status)} variant="outline">
                            {order.status}
                        </Badge>
                    </div>
                    <SheetDescription>
                        ID: <span className="font-mono text-xs">{order.id}</span>
                        <br />
                        Solicitado el: {formatDate(order.createdAt)}
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Sección 1: El Trabajador */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary border-b pb-2">
                            <User className="h-5 w-5" />
                            <h3 className="font-semibold">Trabajador</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs">Nombre Completo</p>
                                <p className="font-medium">{order.worker.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">RUT</p>
                                <p className="font-medium">{order.worker.rut}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Cargo</p>
                                <p className="font-medium">{order.worker.position || 'Sin cargo'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Empresa</p>
                                <p className="font-medium">{order.company.name}</p>
                            </div>
                        </div>
                    </section>

                    {/* Sección 2: Datos Clínicos (GES) */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 text-primary border-b pb-2">
                            <Activity className="h-5 w-5" />
                            <h3 className="font-semibold">Datos Clínicos (GES)</h3>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs">GES Asignado</p>
                                <p className="font-medium">{order.ges.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Batería de Exámenes</p>
                                <p className="font-medium">{order.examBattery.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs mb-1">Riesgos Detectados</p>
                                <div className="flex flex-wrap gap-1">
                                    {(order.ges as any).riskExposures?.length > 0 ? (
                                        (order.ges as any).riskExposures.map((risk: any) => (
                                            <Badge key={risk.id} variant="secondary" className="text-xs">
                                                {risk.name}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground italic">Sin riesgos registrados</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Sección 3: Agendamiento */}
                    {(order.status === 'AGENDADO' || order.status === 'REALIZADO' || order.status === 'CERRADO') && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-primary border-b pb-2">
                                <Calendar className="h-5 w-5" />
                                <h3 className="font-semibold">Detalle de Cita</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-md">
                                <div className="col-span-2">
                                    <p className="text-muted-foreground text-xs">Fecha y Hora</p>
                                    <p className="font-medium text-base">
                                        {formatDate(order.scheduledAt || undefined)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Proveedor</p>
                                    <div className="flex items-center gap-1">
                                        <Building2 className="h-3 w-3 text-muted-foreground" />
                                        <p className="font-medium">{order.providerName || 'No asignado'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Folio Externo</p>
                                    <div className="flex items-center gap-1">
                                        <FileText className="h-3 w-3 text-muted-foreground" />
                                        <p className="font-medium">{order.externalId || 'S/N'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
