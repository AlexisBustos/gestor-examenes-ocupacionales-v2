// frontend/src/components/ges/GesPrescriptionSheet.tsx
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
  documentType: 'CUALITATIVO' | 'CUANTITATIVO' | null;
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
  let parentType: 'qualitative' | 'quantitative' | null = null;
  let parentId: string | null = null;
  let prescriptions: any[] = [];

  if (data && documentId && documentType && data.technicalReport) {
    if (documentType === 'CUALITATIVO') {
      parentType = 'qualitative';
      parentId = data.technicalReport.id;
      prescriptions = data.technicalReport.prescriptions || [];
    } else if (documentType === 'CUANTITATIVO') {
      const q = data.technicalReport.quantitativeReports?.find(
        (qr: any) => qr.id === documentId,
      );
      if (q) {
        parentType = 'quantitative';
        parentId = q.id;
        prescriptions = q.prescriptions || [];
      }
    }
  }

  const hasTarget = !!parentId && !!parentType;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* 🔥 ARREGLO DE SCROLL: 
         - flex flex-col: Para ordenar verticalmente header y cuerpo.
         - h-full: Para ocupar toda la altura.
         - p-0: Quitamos el padding por defecto para manejarlo nosotros.
      */}
      <SheetContent className="sm:max-w-[650px] flex flex-col h-full p-0">
        
        {/* 1. HEADER FIJO (No se mueve al scrollear) */}
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

        {/* 2. CUERPO SCROLLABLE (Aquí va todo el contenido largo) */}
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
                Asegúrate de haber subido primero la evaluación cualitativa
                correspondiente.
                </div>
            </div>
            )}

            {!isLoading && !isError && hasTarget && (
            <div className="mt-4 pb-10"> {/* pb-10 para dar espacio al final */}
                <PrescriptionManager
                parentId={parentId!}
                parentType={parentType!}
                prescriptions={prescriptions as any}
                />
            </div>
            )}
        </div>

      </SheetContent>
    </Sheet>
  );
}