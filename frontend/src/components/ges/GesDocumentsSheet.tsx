import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
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
  Plus 
} from 'lucide-react';

// Importamos el nuevo componente
import { GesUploadSheet } from './GesUploadSheet';

interface GesDocumentsSheetProps {
  gesId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GesDocumentsSheet({
  gesId,
  open,
  onOpenChange,
}: GesDocumentsSheetProps) {
  // Estado para controlar el modal de subida (apilado sobre este sheet)
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['ges-documents', gesId],
    queryFn: async () => {
      if (!gesId) return [];
      const { data } = await axios.get(`/ges/${gesId}/documents`);
      return data;
    },
    enabled: !!gesId && open,
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[600px]">
          <SheetHeader className="flex flex-row justify-between items-start">
            <div>
              <SheetTitle>Documentos del GES</SheetTitle>
              <SheetDescription>
                Protocolos, matrices y respaldos asociados.
              </SheetDescription>
            </div>
            {/* BOTÓN NUEVO: CARGAR INFORME */}
            <div className="mt-0">
                <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Cargar Informe
                </Button>
            </div>
          </SheetHeader>

          {isLoading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
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
                  className="flex items-center justify-between border rounded-md p-3 text-sm bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${doc.type === 'CUALITATIVO' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                        <FileBarChart className={`h-4 w-4 ${doc.type === 'CUALITATIVO' ? 'text-blue-600' : 'text-purple-600'}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        {doc.name || 'Documento sin nombre'}
                      </div>
                      <div className="text-xs text-slate-500 flex gap-2">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{new Date(doc.reportDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {doc.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    {doc.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        asChild
                      >
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          Ver
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* MODAL DE SUBIDA (Se abre encima) */}
      <GesUploadSheet 
        gesId={gesId} 
        open={isUploadOpen} 
        onOpenChange={setIsUploadOpen} 
      />
    </>
  );
}