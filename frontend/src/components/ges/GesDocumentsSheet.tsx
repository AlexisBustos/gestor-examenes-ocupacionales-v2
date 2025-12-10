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
  AlertTriangle,
  FileBarChart,
  Plus,
  ListChecks,
  Trash2,
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
        {/* 🔥 ARREGLO 1: Usamos flex-col y h-full para controlar la altura */}
        <SheetContent className="sm:max-w-[600px] flex flex-col h-full p-0">
          
          {/* HEADER FIJO */}
          <div className="px-6 py-6 border-b">
            <SheetHeader className="flex flex-row justify-between items-start space-y-0">
                <div className="space-y-1">
                <SheetTitle>Documentos del GES</SheetTitle>
                <SheetDescription>
                    Protocolos, matrices y respaldos S3.
                </SheetDescription>
                </div>
                <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cargar
                </Button>
            </SheetHeader>
          </div>

          {/* CUERPO CON SCROLL (Flex-1 toma el espacio restante) */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            
            {isLoading ? (
                <div className="py-10 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
            ) : !data || data.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed rounded-lg">
                <div className="flex flex-col items-center gap-2 text-slate-500">
                    <AlertTriangle className="h-8 w-8 text-amber-500/50" />
                    <p>No hay documentos registrados.</p>
                    <Button variant="link" onClick={() => setIsUploadOpen(true)}>
                    Subir el primer documento
                    </Button>
                </div>
                </div>
            ) : (
                <div className="space-y-3 pb-6"> {/* pb-6 para dar aire al final */}
                {data.map((doc: any) => (
                    <div
                    key={doc.id}
                    className="flex items-center justify-between border rounded-md p-3 text-sm bg-white shadow-sm hover:border-blue-200 transition-colors group"
                    >
                    {/* LADO IZQUIERDO: INFO */}
                    <div className="flex items-center gap-3 overflow-hidden flex-1 mr-4"> {/* flex-1 para empujar botones */}
                        <div
                        className={`p-2 rounded-full shrink-0 ${
                            doc.type === 'CUALITATIVO'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                        >
                        {doc.type === 'CUALITATIVO' ? <FileText className="h-4 w-4" /> : <FileBarChart className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 truncate" title={doc.name}>
                            {doc.name || 'Documento sin nombre'}
                        </div>
                        <div className="text-xs text-slate-500 flex gap-2 items-center mt-0.5">
                            <span className="font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">{doc.type}</span>
                            <span>•</span>
                            <span>
                            {new Date(doc.reportDate).toLocaleDateString()}
                            </span>
                        </div>
                        </div>
                    </div>

                    {/* LADO DERECHO: ACCIONES (No se aplastan) */}
                    <div className="flex items-center gap-1 shrink-0">
                        
                        {/* VER */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            title="Ver PDF"
                            asChild
                            disabled={!doc.url}
                        >
                            {doc.url ? (
                                <a href={doc.url} target="_blank" rel="noreferrer">
                                    <Download className="h-4 w-4" />
                                </a>
                            ) : (
                                <Download className="h-4 w-4 opacity-50" />
                            )}
                        </Button>

                        {/* MEDIDAS */}
                        <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200"
                        onClick={() => handleOpenPrescriptions(doc)}
                        title="Gestionar Medidas"
                        >
                        <ListChecks className="h-4 w-4 mr-1.5" />
                        <span className="hidden sm:inline">Medidas</span> {/* Texto oculto en pantallas muy chicas */}
                        </Button>

                        {/* ELIMINAR */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Eliminar"
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

            {/* TIMELINE DEL GES (Separador visual) */}
            {gesId && (
                <div className="pt-6 border-t mt-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-slate-500" /> Historial de Actividad
                    </h4>
                    <GesHistoryTimeline gesId={gesId} />
                </div>
            )}
            
          </div>

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