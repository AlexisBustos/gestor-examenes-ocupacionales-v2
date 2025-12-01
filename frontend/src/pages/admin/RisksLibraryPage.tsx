import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function RisksLibraryPage() {
    const queryClient = useQueryClient();
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // 1. Cargar Riesgos (Ahora traen la lista de protocolos)
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
            toast.success('Documento agregado a la biblioteca');
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
                    <p className="text-muted-foreground">Gestiona los protocolos oficiales y normativas asociados a cada riesgo.</p>
                </div>
            </div>

            {/* TABLA */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Agente de Riesgo</TableHead>
                                <TableHead>Documentos Disponibles</TableHead>
                                <TableHead className="text-right w-[180px]">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {risks?.map((risk: any) => (
                                <TableRow key={risk.id} className="align-top">
                                    <TableCell className="text-right pt-4">
                                        {/* BOTÓN DE SUBIDA */}
                                        <div className="relative inline-block">
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
                                                    className="cursor-pointer gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                    asChild
                                                    disabled={uploadingId === risk.id}
                                                >
                                                    <span>
                                                        {uploadingId === risk.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                                        Agregar PDF
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
            </Card >
        </div >
    );
}