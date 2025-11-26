import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertTriangle, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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

  const { data: ges, isLoading } = useQuery<Ges>({
    queryKey: ['ges', gesId],
    queryFn: async () => (await axios.get(`/ges/${gesId}`)).data,
    enabled: !!gesId && open
  });

  // --- SUBIR CUALITATIVO ---
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await axios.post(`/ges/${gesId}/report`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      toast.success("Informe cualitativo subido");
      setFile(null); setReportDate(''); setReportNumber('');
    },
    onError: () => toast.error("Error al subir cualitativo")
  });

  // --- SUBIR CUANTITATIVO ---
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

  // --- BORRAR CUANTITATIVO ---
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
      <SheetContent side="right" className="sm:max-w-[700px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Gestión Documental</SheetTitle>
          <SheetDescription>{ges?.name}</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="cualitativo" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cualitativo">Informe Cualitativo</TabsTrigger>
            <TabsTrigger value="cuantitativo" disabled={!report}>Informes Cuantitativos</TabsTrigger>
          </TabsList>

          {/* --- PESTAÑA CUALITATIVA --- */}
          <TabsContent value="cualitativo" className="space-y-6 pt-4">

            {/* ESTADO DEL INFORME */}
            <div className={`p-4 rounded-lg border ${report ? (isVigente ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex items-start gap-3">
                {report ? (isVigente ? <CheckCircle2 className="text-green-600 h-6 w-6" /> : <AlertTriangle className="text-red-600 h-6 w-6" />) : <AlertTriangle className="text-amber-600 h-6 w-6" />}
                <div className="w-full">
                  <h4 className="font-semibold text-sm">{report ? 'Informe Base Vigente' : 'Sin Informe Base'}</h4>
                  {report && (
                    <div className="text-sm mt-2 flex justify-between items-center">
                      <div>
                        <p>Folio: {report.reportNumber}</p>
                        <p>Fecha: {new Date(report.reportDate).toLocaleDateString()}</p>
                      </div>
                      <a href={`http://localhost:3000${report.pdfUrl}`} target="_blank">
                        <Button size="sm" variant="outline"><ExternalLink className="h-3 w-3 mr-2" /> Ver PDF</Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FORMULARIO DE CARGA (Si no hay, o para actualizar) */}
            <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Subir / Actualizar Informe</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Folio</Label><Input className="h-8 bg-white" value={reportNumber} onChange={e => setReportNumber(e.target.value)} /></div>
                <div><Label className="text-xs">Fecha Emisión</Label><Input type="date" className="h-8 bg-white" value={reportDate} onChange={e => setReportDate(e.target.value)} /></div>
              </div>
              <div><Label className="text-xs">PDF</Label><Input type="file" accept=".pdf" className="h-8 bg-white" onChange={e => setFile(e.target.files?.[0] || null)} /></div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="apply" checked={applyToArea} onChange={e => setApplyToArea(e.target.checked)} />
                <label htmlFor="apply" className="text-xs">Aplicar a toda el área</label>
              </div>

              <Button size="sm" className="w-full" onClick={handleUploadQualitative} disabled={isUploading}>
                {isUploading ? "Subiendo..." : "Guardar Informe Base"}
              </Button>
            </div>

            {/* PRESCRIPCIONES DEL CUALITATIVO */}
            {report && (
              <PrescriptionManager
                parentId={report.id}
                parentType="qualitative"
                prescriptions={report.prescriptions || []}
              />
            )}
          </TabsContent>

          {/* --- PESTAÑA CUANTITATIVA --- */}
          <TabsContent value="cuantitativo" className="space-y-6 pt-4">

            {/* FORMULARIO NUEVO CUANTITATIVO */}
            <div className="p-4 border rounded-lg bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-500">Nuevo Informe Cuantitativo</h4>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Nombre (Ej: Dosimetría)</Label><Input className="h-8 bg-white" value={quantName} onChange={e => setQuantName(e.target.value)} /></div>
                <div><Label className="text-xs">Fecha Medición</Label><Input type="date" className="h-8 bg-white" value={quantDate} onChange={e => setQuantDate(e.target.value)} /></div>
              </div>
              <div><Label className="text-xs">PDF</Label><Input type="file" accept=".pdf" className="h-8 bg-white" onChange={e => setQuantFile(e.target.files?.[0] || null)} /></div>
              <Button size="sm" variant="secondary" className="w-full" onClick={handleUploadQuantitative} disabled={isUploadingQuant}>
                {isUploadingQuant ? "Subiendo..." : "Agregar Informe"}
              </Button>
            </div>

            {/* LISTA DE INFORMES CUANTITATIVOS */}
            <div className="space-y-4">
              {report?.quantitativeReports?.map((quant) => (
                <div key={quant.id} className="border rounded-lg overflow-hidden">
                  <div className="bg-slate-100 p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm">{quant.name}</div>
                      <div className="text-xs text-muted-foreground">{new Date(quant.reportDate).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`http://localhost:3000${quant.pdfUrl}`} target="_blank"><Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button></a>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => deleteQuantMutation.mutate(quant.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  {/* PRESCRIPCIONES DEL CUANTITATIVO */}
                  <div className="p-3 bg-white">
                    <PrescriptionManager
                      parentId={quant.id}
                      parentType="quantitative"
                      prescriptions={quant.prescriptions || []}
                    />
                  </div>
                </div>
              ))}
              {(!report?.quantitativeReports || report.quantitativeReports.length === 0) && (
                <p className="text-center text-sm text-muted-foreground py-4">No hay informes cuantitativos cargados.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

      </SheetContent>
    </Sheet>
  );
}