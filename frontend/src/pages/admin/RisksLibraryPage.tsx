import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, BookOpen, Plus, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function RisksLibraryPage() {
    const queryClient = useQueryClient();
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // 1. Cargar Riesgos (El backend ya trae { protocols: [...] })
    const { data: risks, isLoading } = useQuery({
        queryKey: ['risks'],
        queryFn: async () => (await axios.get('/risks')).data,
    });

    // 2. Subir Nuevo PDF
    const handleUpload = async (id: string, file: File) => {
        setUploadingId(id);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post(`/risks/${id}/protocols`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Documento subido a S3 correctamente');
            queryClient.invalidateQueries({ queryKey: ['risks'] });
        } catch (error) {
            toast.error('Error al subir el archivo');
        } finally {
            setUploadingId(null);
        }
    };

    // 3. Eliminar PDF
    const handleDeleteProtocol = async (protocolId: string) => {
        if (!confirm('¿Estás seguro de eliminar este protocolo?')) return;
        try {
            await axios.delete(`/risks/protocols/${protocolId}`);
            toast.success('Protocolo eliminado');
            queryClient.invalidateQueries({ queryKey: ['risks'] });
        } catch (error) {
            toast.error('Error al eliminar');
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
                    <p className="text-muted-foreground">Gestión de agentes de riesgo y protocolos S3.</p>
                </div>
            </div>

            {/* TABLA */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[300px] pl-6">Agente de Riesgo</TableHead>
                                <TableHead>Documentos Disponibles (S3)</TableHead>
                                <TableHead className="text-right w-[180px] pr-6">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {risks?.map((risk: any) => (
                                <TableRow key={risk.id} className="align-top hover:bg-slate-50/50">
                                    {/* COLUMNA 1: NOMBRE DEL RIESGO */}
                                    <TableCell className="font-medium pl-6 pt-4">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-slate-100">
                                                {risk.name}
                                            </Badge>
                                        </div>
                                    </TableCell>

                                    {/* COLUMNA 2: LISTA DE PDFs */}
                                    <TableCell className="pt-4">
                                        {risk.protocols && risk.protocols.length > 0 ? (
                                            <div className="space-y-2">
                                                {risk.protocols.map((proto: any) => (
                                                    <div key={proto.id} className="flex items-center gap-2 text-sm group">
                                                        <FileText className="h-4 w-4 text-red-500" />
                                                        
                                                        {/* Link al archivo en S3 */}
                                                        <a 
                                                            href={proto.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline truncate max-w-[300px]"
                                                        >
                                                            {proto.name}
                                                        </a>

                                                        {/* Botón borrar pequeño */}
                                                        <button 
                                                            onClick={() => handleDeleteProtocol(proto.id)}
                                                            className="text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Eliminar documento"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Sin protocolos cargados</span>
                                        )}
                                    </TableCell>

                                    {/* COLUMNA 3: SUBIR ARCHIVO */}
                                    <TableCell className="text-right pr-6 pt-4">
                                        <div className="relative inline-block">
                                            <input
                                                type="file"
                                                id={`upload-${risk.id}`}
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                                onChange={(e) => e.target.files?.[0] && handleUpload(risk.id, e.target.files[0])}
                                                disabled={uploadingId === risk.id}
                                            />
                                            <label htmlFor={`upload-${risk.id}`}>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    asChild
                                                    disabled={uploadingId === risk.id}
                                                >
                                                    <span>
                                                        {uploadingId === risk.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                                        Subir PDF
                                                    </span>
                                                </Button>
                                            </label>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {risks?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No hay riesgos cargados. Realiza una importación masiva primero.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}