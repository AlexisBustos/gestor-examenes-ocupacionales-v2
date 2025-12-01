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
import { Loader2, CheckCircle2, AlertTriangle, FileBarChart } from 'lucide-react';

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
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['ges-documents', gesId],
    queryFn: async () => {
      const { data } = await axios.get(`/ges/${gesId}/documents`);
      return data;
    },
    enabled: !!gesId && open,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>Documentos del GES</SheetTitle>
          <SheetDescription>
            Protocolos, matrices y respaldos asociados al programa.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-8 text-sm text-slate-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            No hay documentos registrados para este GES.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {data.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border rounded-md p-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileBarChart className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-semibold text-slate-800">
                      {doc.name || 'Documento'}
                    </div>
                    {doc.type && (
                      <div className="text-slate-500">{doc.type}</div>
                    )}
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
  );
}
