import { useState } from 'react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { 
    FileSpreadsheet, 
    Download, 
    Users, 
    Activity, 
    ShieldAlert,
    FileText,
    Loader2
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ReportsPage() {
    const [downloading, setDownloading] = useState<string | null>(null);

    // Función genérica para descargar archivos binarios (Blob)
    const handleDownload = async (type: 'surveillance' | 'headcount', filenamePrefix: string) => {
        try {
            setDownloading(type);
            toast.info("Generando reporte...", { description: "Esto puede tardar unos segundos dependiendo de la cantidad de datos." });

            // 1. Petición al Backend (Importante: responseType blob)
            const endpoint = type === 'surveillance' ? '/exports/surveillance' : '/exports/headcount';
            
            const response = await axios.get(endpoint, { 
                responseType: 'blob' 
            });

            // 2. Crear URL temporal para el archivo
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // 3. Crear enlace invisible y hacer clic
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `${filenamePrefix}_${dateStr}.xlsx`);
            document.body.appendChild(link);
            link.click();
            
            // 4. Limpieza
            link.remove();
            toast.success("Descarga completada", { description: "El archivo se ha guardado en tu equipo." });

        } catch (error) {
            console.error("Error descarga:", error);
            toast.error("Error al descargar", { description: "No se pudo generar el archivo. Intente nuevamente." });
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
            
            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Centro de Exportación</h1>
                    <p className="text-slate-500 mt-1">Descarga de reportes operativos y de gestión en formato Excel.</p>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 flex items-center gap-2 text-sm text-slate-600">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>Formatos compatibles: <strong>.xlsx</strong></span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {/* TARJETA 1: SÁBANA DE VIGILANCIA (La más importante) */}
                <Card className="shadow-md border-green-100 hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity className="h-24 w-24 text-green-600" />
                    </div>
                    <CardHeader>
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                            <Activity className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-lg text-slate-800">Matriz de Vigilancia</CardTitle>
                        <CardDescription>Reporte consolidado de salud.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Obtén la <strong>"Sábana de Datos"</strong> completa. Incluye a todos los trabajadores, sus exámenes asociados, fechas de realización, vencimientos y estado de vigencia actual.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Vigentes</Badge>
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Por Vencer</Badge>
                            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">Vencidos</Badge>
                        </div>
                    </CardContent>
                    <Separator />
                    <CardFooter className="pt-4 bg-slate-50/50">
                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-green-200 shadow-lg" 
                            onClick={() => handleDownload('surveillance', 'Vigilancia_Medica')}
                            disabled={downloading === 'surveillance'}
                        >
                            {downloading === 'surveillance' ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                            ) : (
                                <><Download className="mr-2 h-4 w-4" /> Descargar Excel</>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* TARJETA 2: DOTACIÓN Y RIESGOS */}
                <Card className="shadow-md border-blue-100 hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users className="h-24 w-24 text-blue-600" />
                    </div>
                    <CardHeader>
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle className="text-lg text-slate-800">Dotación y Riesgos</CardTitle>
                        <CardDescription>Resumen de exposición.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Listado maestro de trabajadores activos. Detalla sus cargos, centros de costo y el <strong>Puesto GES</strong> asignado, desglosando cada agente de riesgo (Ruido, Sílice, etc.).
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-[10px] border-slate-200">Nómina</Badge>
                            <Badge variant="outline" className="text-[10px] border-slate-200">GES</Badge>
                            <Badge variant="outline" className="text-[10px] border-slate-200">Agentes</Badge>
                        </div>
                    </CardContent>
                    <Separator />
                    <CardFooter className="pt-4 bg-slate-50/50">
                        <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-lg"
                            onClick={() => handleDownload('headcount', 'Dotacion_Riesgos')}
                            disabled={downloading === 'headcount'}
                        >
                            {downloading === 'headcount' ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                            ) : (
                                <><Download className="mr-2 h-4 w-4" /> Descargar Excel</>
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* TARJETA 3: PRÓXIMAMENTE */}
                <Card className="shadow-sm border-dashed border-slate-300 bg-slate-50/50 opacity-70">
                    <CardHeader>
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
                            <FileText className="h-6 w-6 text-slate-400" />
                        </div>
                        <CardTitle className="text-lg text-slate-500">Reporte Financiero</CardTitle>
                        <CardDescription>Próximamente</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-400">
                            Estamos trabajando en un módulo para exportar costos por centro de costo y facturación estimada de exámenes.
                        </p>
                    </CardContent>
                    <CardFooter className="pt-4">
                        <Button variant="outline" disabled className="w-full text-slate-400">
                            No disponible
                        </Button>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}