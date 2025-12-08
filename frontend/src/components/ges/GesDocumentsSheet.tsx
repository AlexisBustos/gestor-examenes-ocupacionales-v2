import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileBarChart,
  Plus,
  ListChecks,
  Trash2, // Icono nuevo
  Download,
  FileText
} from 'lucide-react';

import { GesUploadSheet } from './GesUploadSheet';
import { GesPrescriptionSheet } from './GesPrescriptionSheet';
import { GesHistoryTimeline } from './GesHistoryTimeline';

interface GesDocumentsSheetProps {
  gesId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type GesDocumentType = 'CUALITATIVO' | 'CUANTITATIVO';

export function GesDocumentsSheet({
  gesId,
  open,
  onOpenChange,
}: GesDocumentsSheetProps) {
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Estado para prescripciones
  const [isPrescriptionsOpen, setIsPrescriptionsOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<{
    id: string;
    type: GesDocumentType;
    name?: string;
  } | null>(null);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['ges-documents', gesId],
    queryFn: async () => {
      if (!gesId) return [];
      const { data } = await axios.get(`/ges/${gesId}/documents`);
      return data;
    },
    enabled: !!gesId && open,
  });

  // 👇 MUTACIONES PARA ELIMINAR DOCUMENTOS
  const deleteMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
        const endpoint = type === 'CUALITATIVO' 
            ? 'qualitative' 
            : 'quantitative';
        
        await axios.delete(`/ges/${gesId}/documents/${endpoint}/${id}`);
    },
    onSuccess: () => {
        toast.success("Documento eliminado correctamente");
        queryClient.invalidateQueries({ queryKey: ['ges-documents', gesId] });
    },
    onError: () => toast.error("Error al eliminar documento")
  });

  const handleOpenPrescriptions = (doc: any) => {
    setSelectedDoc({
      id: doc.id,
      type: doc.type as GesDocumentType,
      name: doc.name,
    });
    setIsPrescriptionsOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader className="flex flex-row justify-between items-start">
            <div>
              <SheetTitle>Documentos del GES</SheetTitle>
              <SheetDescription>
                Protocolos, matrices y respaldos S3.
              </SheetDescription>
            </div>
            <div className="mt-0 flex gap-2">
              <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Cargar Informe
              </Button>
            </div>
          </SheetHeader>

          {isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed rounded-lg mt-6">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <AlertTriangle className="h-8 w-8 text-amber-500/50" />
                <p>No hay documentos registrados.</p>
                <Button variant="link" onClick={() => setIsUploadOpen(true)}>
                  Subir el primer documento
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {data.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between border rounded-md p-3 text-sm bg-white shadow-sm hover:border-blue-200 transition-colors"
                >
                  {/* LADO IZQUIERDO: INFO */}
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`p-2 rounded-full shrink-0 ${
                        doc.type === 'CUALITATIVO'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      {doc.type === 'CUALITATIVO' ? <FileText className="h-4 w-4" /> : <FileBarChart className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 truncate" title={doc.name}>
                        {doc.name || 'Documento sin nombre'}
                      </div>
                      <div className="text-xs text-slate-500 flex gap-2 items-center">
                        <span className="font-medium">{doc.type}</span>
                        <span>•</span>
                        <span>
                          {new Date(doc.reportDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* LADO DERECHO: ACCIONES */}
                  <div className="flex items-center gap-2 shrink-0">
                    
                    {/* BOTÓN VER (S3) */}
                    {doc.url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                        title="Ver PDF"
                        asChild
                      >
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                            <Download className="h-4 w-4 text-slate-300" />
                        </Button>
                    )}

                    {/* BOTÓN PRESCRIPCIONES */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => handleOpenPrescriptions(doc)}
                      title="Gestionar Medidas/Prescripciones"
                    >
                      <ListChecks className="h-4 w-4 mr-1" />
                      Medidas
                    </Button>

                    {/* BOTÓN ELIMINAR */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        title="Eliminar documento"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                            if(confirm("¿Estás seguro de eliminar este documento?")) {
                                deleteMutation.mutate({ id: doc.id, type: doc.type });
                            }
                        }}
                    >
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                    </Button>

                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TIMELINE DEL GES */}
          {gesId && <GesHistoryTimeline gesId={gesId} />}
        </SheetContent>
      </Sheet>

      <GesUploadSheet
        gesId={gesId}
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />

      <GesPrescriptionSheet
        gesId={gesId}
        documentId={selectedDoc?.id ?? null}
        documentType={selectedDoc?.type ?? null}
        documentName={selectedDoc?.name}
        open={isPrescriptionsOpen}
        onOpenChange={setIsPrescriptionsOpen}
      />
    </>
  );
}