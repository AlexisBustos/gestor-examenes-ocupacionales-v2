import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, BookOpen, Plus, FileText, Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
// ❌ BORRADO: import { Tooltip... } que causaba el error

export default function RisksLibraryPage() {
    const queryClient = useQueryClient();
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // 1. Cargar Riesgos
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
            toast.success('Documento agregado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['risks'] });
        } catch (error) {
            console.error(error);
            toast.error('Error al subir el archivo');
        } finally {
            setUploadingId(null);
        }
    };

    
    // 3. Eliminar PDF Específico
    const handleDeleteProtocol = async (protocolId: string) => {
        if (!confirm('¿Estás seguro de eliminar este documento específico?')) return;
        try {
            await axios.delete(`/risks/protocols/${protocolId}`);
            toast.success('Documento eliminado');
            queryClient.invalidateQueries({ queryKey: ['risks'] });
        } catch (error) {
            console.error(error);
            toast.error('No se pudo eliminar el documento');
        }
    };

    // 4. Eliminar Riesgo Completo
    const handleDeleteRisk = async (riskId: string) => {
        if (!confirm('⚠️ ¡CUIDADO! Esto eliminará el Riesgo y TODOS sus documentos. ¿Continuar?')) return;
        try {
            await axios.delete(`/risks/${riskId}`);
            toast.success('Agente de riesgo eliminado');
            queryClient.invalidateQueries({ queryKey: ['risks'] });
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar el riesgo');
        }
    };

    if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* HEADER */}
            <div className="flex items-center gap-4 border-b pb-6">
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                    <BookOpen className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Biblioteca Técnica</h1>
                    <p className="text-muted-foreground">Sube múltiples documentos (PDFs) para cada agente de riesgo.</p>
                </div>
            </div>

            {/* TABLA */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-[250px] pl-6">Agente de Riesgo</TableHead>
                                <TableHead>Documentos Cargados</TableHead>
                                <TableHead className="text-right w-[200px] pr-6">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {risks?.map((risk: any) => (
                                <TableRow key={risk.id} className="group hover:bg-slate-50/50 transition-colors">
                                    
                                    {/* NOMBRE DEL RIESGO */}
                                    <TableCell className="font-medium pl-6 align-top pt-4">
                                        <div className="flex flex-col gap-2">
                                            <Badge variant="outline" className="w-fit bg-white border-slate-300 text-slate-700 text-sm py-1 px-3">
                                                {risk.name}
                                            </Badge>
                                            <span className="text-xs text-slate-400 font-light px-1">ID: {risk.id.slice(0,6)}...</span>
                                        </div>
                                    </TableCell>

                                    {/* LISTA DE DOCUMENTOS */}
                                    <TableCell className="align-top pt-4">
                                        <div className="space-y-2">
                                            {risk.protocols && risk.protocols.length > 0 ? (
                                                risk.protocols.map((proto: any) => (
                                                    <div key={proto.id} className="flex items-center gap-3 bg-white border border-slate-100 p-2 rounded-md shadow-sm w-full max-w-md hover:border-purple-200 transition-colors">
                                                        {/* Icono PDF */}
                                                        <div className="bg-red-50 p-1.5 rounded text-red-500 shrink-0">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        
                                                        {/* Nombre y Link */}
                                                        <a 
                                                            href={proto.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="text-sm text-slate-700 hover:text-purple-600 hover:underline truncate flex-1 font-medium"
                                                        >
                                                            {proto.name}
                                                        </a>

                                                        {/* Botón Borrar Documento */}
                                                        <button 
                                                            onClick={() => handleDeleteProtocol(proto.id)}
                                                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all"
                                                            title="Eliminar documento"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400 text-sm italic bg-slate-50 p-2 rounded border border-dashed border-slate-200">
                                                    <UploadCloud className="h-4 w-4" />
                                                    Sin documentos activos
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* BOTONES DE ACCIÓN (SUBIR Y BORRAR RIESGO) */}
                                    <TableCell className="text-right pr-6 align-top pt-4">
                                        <div className="flex items-center justify-end gap-2">
                                            
                                            {/* BOTÓN 1: SUBIR NUEVO DOC */}
                                            <div className="relative">
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
                                                        variant="secondary" 
                                                        size="sm" 
                                                        className="cursor-pointer gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 shadow-sm"
                                                        asChild
                                                        disabled={uploadingId === risk.id}
                                                    >
                                                        <span>
                                                            {uploadingId === risk.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                                            Agregar
                                                        </span>
                                                    </Button>
                                                </label>
                                            </div>

                                            {/* BOTÓN 2: ELIMINAR RIESGO COMPLETO */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteRisk(risk.id)}
                                                className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                title="Eliminar Riesgo Completo"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            
                            {risks?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                                        No hay riesgos cargados. Ve a Importación Masiva para cargar la base.
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