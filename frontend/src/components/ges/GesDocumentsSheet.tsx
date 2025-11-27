import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertTriangle, ExternalLink, Trash2, FileBarChart, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Ges } from '@/types/ges.types';
import { PrescriptionManager } from './PrescriptionManager';

interface Props {
  gesId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GesDocumentsSheet({ gesId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  
  // Estados Cualitativo
  const [file, setFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState<string>('');
  const [reportNumber, setReportNumber] = useState<string>('');
  const [applyToArea, setApplyToArea] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Estados Cuantitativo
  const [quantFile, setQuantFile] = useState<File | null>(null);
  const [quantName, setQuantName] = useState('');
  const [quantDate, setQuantDate] = useState('');
  const [isUploadingQuant, setIsUploadingQuant] = useState(false);

  // Cargar GES con toda la profundidad (gracias al backend arreglado)
  const { data: ges, isLoading } = useQuery<Ges>({
    queryKey: ['ges', gesId],
    queryFn: async () => (await axios.get(`/ges/${gesId}`)).data,
    enabled: !!gesId && open
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await axios.post(`/ges/${gesId}/report`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges'] });
      toast.success("Informe cualitativo subido");
      setFile(null); setReportDate(''); setReportNumber('');
    },
    onError: () => toast.error("Error al subir cualitativo")
  });

  const uploadQuantMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await axios.post('/reports/quantitative', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges'] });
      toast.success("Informe cuantitativo agregado");
      setQuantFile(null); setQuantName(''); setQuantDate('');
    },
    onError: () => toast.error("Error al subir cuantitativo")
  });

  const deleteQuantMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/reports/quantitative/${id}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['ges'] });
        toast.success("Eliminado");
    }
  });

  const handleUploadQualitative = () => {
    if (!file || !reportDate) return toast.error("Faltan datos");
    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('reportDate', reportDate);
    fd.append('reportNumber', reportNumber);
    if (applyToArea) fd.append('applyToArea', 'true');
    
    uploadMutation.mutate(fd, { onSettled: () => setIsUploading(false) });
  };

  const handleUploadQuantitative = () => {
    if (!quantFile || !quantName || !quantDate || !ges?.technicalReportId) return toast.error("Faltan datos o no hay informe base");
    setIsUploadingQuant(true);
    const fd = new FormData();
    fd.append('file', quantFile);
    fd.append('name', quantName);
    fd.append('reportDate', quantDate);
    fd.append('technicalReportId', ges.technicalReportId);
    
    uploadQuantMutation.mutate(fd, { onSettled: () => setIsUploadingQuant(false) });
  };

  if (isLoading) return null;

  const report = ges?.technicalReport;
  const isVigente = ges?.nextEvaluationDate ? new Date(ges.nextEvaluationDate) > new Date() : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[800px] overflow-y-auto">
        <SheetHeader className="mb-6 bg-slate-50 -m-6 p-6 border-b">
          <SheetTitle>Gestión Documental</SheetTitle>
          <SheetDescription>
            GES: <span className="font-bold text-slate-800">{ges?.name}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
        <Tabs defaultValue="cualitativo" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="cualitativo">Evaluación Cualitativa</TabsTrigger>
            <TabsTrigger value="cuantitativo" disabled={!report}>Informes Cuantitativos</TabsTrigger>
          </TabsList>

          {/* === PESTAÑA 1: CUALITATIVO (PADRE) === */}
          <TabsContent value="cualitativo" className="space-y-6">
            
            {/* TARJETA DE ESTADO */}
            <div className={`p-5 rounded-lg border ${report ? (isVigente ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-start gap-4">
                {report ? (isVigente ? <CheckCircle2 className="text-green-600 h-8 w-8" /> : <AlertTriangle className="text-red-600 h-8 w-8" />) : <AlertTriangle className="text-amber-600 h-8 w-8" />}
                <div className="w-full">
                  <h4 className="font-bold text-lg text-slate-800">{report ? 'Informe Base Cargado' : 'Sin Informe Base'}</h4>
                  {report ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                         <span className="text-slate-500">Folio: <span className="font-mono text-slate-800">{report.reportNumber}</span></span>
                         <span className="text-slate-500">Fecha: <span className="font-medium text-slate-800">{new Date(report.reportDate).toLocaleDateString()}</span></span>
                      </div>
                      <a href={`http://localhost:3000${report.pdfUrl}`} target="_blank" className="inline-block w-full">
                        <Button size="sm" variant="outline" className="w-full bg-white hover:bg-slate-100 border-slate-300 text-blue-600">
                            <ExternalLink className="h-4 w-4 mr-2" /> Ver Documento PDF
                        </Button>
                      </a>
                    </div>
                  ) : <p className="text-sm text-amber-800 mt-1">Debes cargar la evaluación cualitativa primero.</p>}
                </div>
              </div>
            </div>

            {/* FORMULARIO SUBIDA */}
            <div className="p-4 border rounded-lg bg-slate-50/50 space-y-3">
               <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">{report ? 'Actualizar Informe' : 'Subir Nuevo Informe'}</h4>
               <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Folio</Label><Input className="h-9 bg-white" value={reportNumber} onChange={e => setReportNumber(e.target.value)} /></div>
                  <div><Label className="text-xs">Fecha Emisión</Label><Input type="date" className="h-9 bg-white" value={reportDate} onChange={e => setReportDate(e.target.value)} /></div>
               </div>
               <div><Label className="text-xs">Archivo PDF</Label><Input type="file" accept=".pdf" className="h-9 bg-white" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
               
               <div className="flex items-center gap-2 pt-1">
                  <input type="checkbox" id="apply" checked={applyToArea} onChange={e => setApplyToArea(e.target.checked)} className="rounded border-gray-300" />
                  <label htmlFor="apply" className="text-xs font-medium text-slate-600 cursor-pointer">Aplicar vigencia a toda el área</label>
               </div>

               <Button size="sm" className="w-full" onClick={handleUploadQualitative} disabled={isUploading}>
                  {isUploading ? "Procesando..." : "Guardar Informe Base"}
               </Button>
            </div>

            <Separator />

            {/* PRESCRIPCIONES DEL CUALITATIVO */}
            {report && (
                <PrescriptionManager 
                    parentId={report.id} 
                    parentType="qualitative" 
                    prescriptions={report.prescriptions || []} 
                />
            )}
          </TabsContent>

          {/* === PESTAÑA 2: CUANTITATIVOS (HIJOS) === */}
          <TabsContent value="cuantitativo" className="space-y-6">
             
             {/* FORMULARIO NUEVO */}
             <div className="p-5 border rounded-lg bg-slate-50 space-y-4 shadow-sm">
               <h4 className="text-sm font-bold flex items-center gap-2 text-slate-700"><FileBarChart className="h-4 w-4"/> Nuevo Informe Cuantitativo</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs">Nombre (Ej: Dosimetría)</Label><Input className="h-9 bg-white" value={quantName} onChange={e => setQuantName(e.target.value)} /></div>
                  <div><Label className="text-xs">Fecha Medición</Label><Input type="date" className="h-9 bg-white" value={quantDate} onChange={e => setQuantDate(e.target.value)} /></div>
               </div>
               <div><Label className="text-xs">PDF</Label><Input type="file" accept=".pdf" className="h-9 bg-white" onChange={e => setQuantFile(e.target.files?.[0] || null)} /></div>
               <Button size="sm" className="w-full bg-slate-800 hover:bg-slate-900" onClick={handleUploadQuantitative} disabled={isUploadingQuant}>
                  {isUploadingQuant ? "Subiendo..." : "Agregar Informe Específico"}
               </Button>
             </div>

             <Separator />

             {/* LISTA DE INFORMES */}
             <div className="space-y-6">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Informes Registrados ({report?.quantitativeReports?.length || 0})</h4>
                
                {report?.quantitativeReports?.map((quant) => (
                    <div key={quant.id} className="border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                        {/* Encabezado del Reporte Hijo */}
                        <div className="bg-blue-50/50 p-4 flex justify-between items-center border-b">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-full border"><FileBarChart className="h-5 w-5 text-blue-600"/></div>
                                <div>
                                    <div className="font-bold text-slate-800">{quant.name}</div>
                                    <div className="text-xs text-muted-foreground">Medición: {new Date(quant.reportDate).toLocaleDateString()}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a href={`http://localhost:3000${quant.pdfUrl}`} target="_blank"><Button size="sm" variant="outline" className="h-8"><ExternalLink className="h-3 w-3 mr-2" /> PDF</Button></a>
                                <Button size="sm" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteQuantMutation.mutate(quant.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </div>
                        
                        {/* Prescripciones del Hijo */}
                        <div className="p-4">
                            <PrescriptionManager 
                                parentId={quant.id} 
                                parentType="quantitative" 
                                prescriptions={quant.prescriptions || []} 
                            />
                        </div>
                    </div>
                ))}
                
                {(!report?.quantitativeReports || report.quantitativeReports.length === 0) && (
                    <div className="text-center py-10 border-2 border-dashed rounded-xl text-slate-400 bg-slate-50/50">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No hay informes cuantitativos cargados aún.</p>
                    </div>
                )}
             </div>
          </TabsContent>
        </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}