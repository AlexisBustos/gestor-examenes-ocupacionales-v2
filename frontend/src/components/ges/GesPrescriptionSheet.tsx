import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Loader2, AlertTriangle, ListChecks } from 'lucide-react';
import { PrescriptionManager } from './PrescriptionManager';

interface GesPrescriptionSheetProps {
  gesId: string | null;
  documentId: string | null;
  documentType: 'CUALITATIVO' | 'CUANTITATIVO' | 'TMERT' | null; // 👈 AGREGADO TMERT
  documentName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GesPrescriptionSheet({
  gesId,
  documentId,
  documentType,
  documentName,
  open,
  onOpenChange,
}: GesPrescriptionSheetProps) {
  
  // Consulta al historial
  const { data, isLoading, isError } = useQuery<any>({
    queryKey: ['ges-history', gesId],
    queryFn: async () => {
      if (!gesId) throw new Error('No GES ID');
      const { data } = await axios.get(`/ges/${gesId}/history`);
      return data;
    },
    enabled: !!gesId && open,
  });

  // Determinar a qué informe están asociadas las prescripciones
  let parentType: 'qualitative' | 'quantitative' | 'tmert' | null = null; // 👈 AGREGADO tmert
  let parentId: string | null = null;
  let prescriptions: any[] = [];

  if (data && documentId && documentType) {
    // CASO 1: CUALITATIVO
    if (documentType === 'CUALITATIVO' && data.technicalReport) {
      if (data.technicalReport.id === documentId) {
          parentType = 'qualitative';
          parentId = data.technicalReport.id;
          prescriptions = data.technicalReport.prescriptions || [];
      }
    
    // CASO 2: CUANTITATIVO
    } else if (documentType === 'CUANTITATIVO' && data.technicalReport) {
      const q = data.technicalReport.quantitativeReports?.find(
        (qr: any) => qr.id === documentId,
      );
      if (q) {
        parentType = 'quantitative';
        parentId = q.id;
        prescriptions = q.prescriptions || [];
      }
    
    // CASO 3: TMERT (NUEVO) 👇
    } else if (documentType === 'TMERT' && data.tmertReports) {
        const t = data.tmertReports.find((tr: any) => tr.id === documentId);
        if (t) {
            parentType = 'tmert';
            parentId = t.id;
            prescriptions = t.prescriptions || [];
        }
    }
  }

  const hasTarget = !!parentId && !!parentType;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[650px] flex flex-col h-full p-0">
        
        {/* HEADER FIJO */}
        <div className="px-6 py-6 border-b shrink-0">
            <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-emerald-600" />
                Medidas de Control del Informe
            </SheetTitle>
            <SheetDescription>
                Gestiona las prescripciones asociadas a este informe
                {documentName ? `: "${documentName}"` : ''}.
            </SheetDescription>
            </SheetHeader>
        </div>

        {/* CUERPO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
            
            {isLoading && (
            <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
            )}

            {isError && (
            <div className="py-6 flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="h-4 w-4" />
                No se pudo cargar el historial del GES.
            </div>
            )}

            {!isLoading && !isError && !hasTarget && (
            <div className="py-6 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 mt-4">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div>
                No se encontró información de prescripciones para este informe.
                Asegúrate de que el informe exista y esté correctamente cargado.
                </div>
            </div>
            )}

            {!isLoading && !isError && hasTarget && (
            <div className="mt-4 pb-10">
                <PrescriptionManager
                parentId={parentId!}
                parentType={parentType!} // Se pasa 'tmert' aquí si corresponde
                prescriptions={prescriptions as any}
                />
            </div>
            )}
        </div>

      </SheetContent>
    </Sheet>
  );
}