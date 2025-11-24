import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertTriangle, Upload, ExternalLink, Calendar, Layers } from 'lucide-react'; // Icono nuevo
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox'; // Necesitas tener checkbox instalado
import type { Ges } from '@/types/ges.types';

// Si no tienes el componente Checkbox de shadcn, usa un input type="checkbox" simple por ahora
// o instala: npx shadcn-ui@latest add checkbox

interface Props {
  gesId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GesDocumentsSheet({ gesId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [reportDate, setReportDate] = useState<string>('');
  const [reportNumber, setReportNumber] = useState<string>('');
  const [applyToArea, setApplyToArea] = useState(false); // <--- NUEVO ESTADO
  const [isUploading, setIsUploading] = useState(false);

  const { data: ges, isLoading } = useQuery<Ges>({
    queryKey: ['ges', gesId],
    queryFn: async () => {
      const { data } = await axios.get(`/ges/${gesId}`);
      return data;
    },
    enabled: !!gesId && open
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      await axios.post(`/ges/${gesId}/report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges'] });
      queryClient.invalidateQueries({ queryKey: ['company'] }); // Refrescar lista principal
      toast.success(applyToArea ? "Informe aplicado a toda el área" : "Informe subido correctamente");
      setFile(null);
      setReportDate('');
      setReportNumber('');
      setApplyToArea(false);
    },
    onError: () => toast.error("Error al subir el informe")
  });

  const handleUpload = () => {
    if (!file || !reportDate) {
      toast.error("Faltan datos obligatorios");
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('reportDate', reportDate);
    formData.append('reportNumber', reportNumber);
    // Enviamos el flag mágico
    if (applyToArea) formData.append('applyToArea', 'true');
    
    uploadMutation.mutate(formData, {
      onSettled: () => setIsUploading(false)
    });
  };

  if (isLoading) return null;

  const report = ges?.technicalReport;
  const nextEvalDate = ges?.nextEvaluationDate ? new Date(ges.nextEvaluationDate) : null;
  const isVigente = nextEvalDate ? nextEvalDate > new Date() : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Gestión Documental</SheetTitle>
          <SheetDescription>
            Informe para: <span className="font-semibold text-foreground">{ges?.name}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          {/* TARJETA ESTADO (Igual que antes) */}
          <div className={`p-4 rounded-lg border ${report ? (isVigente ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-amber-50 border-amber-200'}`}>
             <div className="flex items-start gap-3">
               {report ? <CheckCircle2 className="text-green-600 h-6 w-6" /> : <AlertTriangle className="text-amber-600 h-6 w-6" />}
               <div>
                 <h4 className="font-semibold text-sm">{report ? 'Informe Vinculado' : 'Pendiente'}</h4>
                 {report && (
                    <a href={`http://localhost:3000${report.pdfUrl}`} target="_blank" className="text-xs underline text-blue-600 block mt-1">Ver PDF Original</a>
                 )}
               </div>
             </div>
          </div>

          {/* FORMULARIO */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium text-sm">Cargar Nuevo Informe</h3>
            
            <div className="space-y-3">
              <div className="grid w-full items-center gap-1.5">
                <Label>N° Informe</Label>
                <Input value={reportNumber} onChange={(e) => setReportNumber(e.target.value)} placeholder="INF-2025..." />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Fecha Emisión</Label>
                <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Archivo PDF</Label>
                <Input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>

              {/* CHECKBOX MÁGICO */}
              <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-md border border-blue-100">
                <input 
                  type="checkbox" 
                  id="applyArea" 
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={applyToArea}
                  onChange={(e) => setApplyToArea(e.target.checked)}
                />
                <label htmlFor="applyArea" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-blue-900">
                  Aplicar este informe a TODOS los GES del área
                </label>
              </div>
            </div>

            <Button onClick={handleUpload} disabled={!file || !reportDate || isUploading} className="w-full">
              {isUploading ? "Procesando..." : "Guardar y Vincular"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}