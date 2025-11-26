import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Upload, FileText, ExternalLink, Loader2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function RisksLibraryPage() {
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // 1. Cargar la lista de riesgos desde el backend
  const { data: risks, isLoading } = useQuery({
    queryKey: ['risks'],
    queryFn: async () => (await axios.get('/risks')).data,
  });

  // 2. Función para subir el PDF
  const handleUpload = async (id: string, file: File) => {
    setUploadingId(id);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await axios.post(`/risks/${id}/protocol`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Protocolo actualizado correctamente');
      queryClient.invalidateQueries({ queryKey: ['risks'] });
    } catch (error) {
      toast.error('Error al subir el archivo');
    } finally {
      setUploadingId(null);
    }
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
            <BookOpen className="h-8 w-8" />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Biblioteca Técnica</h1>
            <p className="text-muted-foreground">Gestiona los protocolos oficiales (MINSAL) asociados a cada riesgo.</p>
        </div>
      </div>

      {/* TABLA DE RIESGOS */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Agente de Riesgo</TableHead>
                    <TableHead>Estado del Protocolo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {risks?.map((risk: any) => (
                    <TableRow key={risk.id}>
                        <TableCell className="font-medium">{risk.name}</TableCell>
                        <TableCell>
                            {risk.protocolUrl ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex w-fit gap-2 items-center border-green-200">
                                    <FileText className="h-3 w-3" /> Protocolo Cargado
                                </Badge>
                            ) : (
                                <span className="text-sm text-muted-foreground italic pl-2">Sin documento</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2 items-center">
                            
                            {/* Botón Ver (Solo si existe) */}
                            {risk.protocolUrl && (
                                <a href={`http://localhost:3000${risk.protocolUrl}`} target="_blank" rel="noreferrer">
                                    <Button variant="ghost" size="icon" title="Ver PDF">
                                        <ExternalLink className="h-4 w-4 text-blue-600" />
                                    </Button>
                                </a>
                            )}
                            
                            {/* Botón Subir (Input oculto) */}
                            <div className="relative">
                                <input 
                                    type="file" 
                                    id={`upload-${risk.id}`} 
                                    className="hidden" 
                                    accept=".pdf"
                                    onChange={(e) => e.target.files?.[0] && handleUpload(risk.id, e.target.files[0])}
                                    disabled={uploadingId === risk.id}
                                />
                                <label htmlFor={`upload-${risk.id}`}>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="cursor-pointer" 
                                        asChild 
                                        disabled={uploadingId === risk.id}
                                    >
                                        <span>
                                            {uploadingId === risk.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                                            {risk.protocolUrl ? 'Actualizar' : 'Subir PDF'}
                                        </span>
                                    </Button>
                                </label>
                            </div>

                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}