import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Users, Upload, Search, Loader2, Pencil, Trash2, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { WorkerFormSheet } from '@/components/workers/WorkerFormSheet';
import { WorkerDetailsSheet } from '@/components/workers/WorkerDetailsSheet';
// 👇 IMPORTAR NUEVO COMPONENTE
import { WorkerCreateDialog } from '@/components/workers/WorkerCreateDialog';

export default function WorkersPage() {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [viewingWorkerId, setViewingWorkerId] = useState<string | null>(null);
  // 👇 ESTADO PARA CREAR
  const [isCreating, setIsCreating] = useState(false);

  const { data: workers, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => (await axios.get('/workers')).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/workers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workers'] }); toast.success("Eliminado"); },
    onError: () => toast.error("Error al eliminar")
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('/workers/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Nómina cargada');
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    } catch (error) { toast.error('Error al cargar'); } 
    finally { setIsImporting(false); e.target.value = ''; }
  };

  const filteredWorkers = workers?.filter((w: any) => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Users className="h-8 w-8" /></div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nómina de Trabajadores</h1>
                <p className="text-muted-foreground">Base de datos de personal activo.</p>
            </div>
        </div>
        <div className="flex gap-2">
            {/* 👇 BOTÓN NUEVO */}
            <Button variant="secondary" onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4"/> Nuevo Trabajador
            </Button>

            <div className="relative">
                <input type="file" id="import-w" className="hidden" accept=".xlsx, .csv" onChange={handleFileUpload} disabled={isImporting} />
                <label htmlFor="import-w">
                    <Button variant="outline" className="cursor-pointer" asChild disabled={isImporting}>
                        <span>{isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Excel</span>
                    </Button>
                </label>
            </div>
        </div>
      </div>

      <Card>
        <CardHeader><div className="w-64"><Input placeholder="Buscar RUT o Nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>RUT</TableHead><TableHead>Nombre</TableHead><TableHead>Cargo</TableHead><TableHead>Contacto</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                    {filteredWorkers?.map((w: any) => (
                        <TableRow key={w.id}>
                            <TableCell className="font-mono">{w.rut}</TableCell>
                            <TableCell className="font-medium">{w.name}</TableCell>
                            <TableCell>{w.position}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                <div>{w.email || '-'}</div>
                                <div>{w.phone || '-'}</div>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                                <Button variant="ghost" size="icon" onClick={() => setViewingWorkerId(w.id)}><Eye className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => setEditingWorker(w)}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => { if(confirm('¿Eliminar?')) deleteMutation.mutate(w.id) }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* MODALES */}
      {isCreating && <WorkerCreateDialog open={isCreating} onOpenChange={setIsCreating} />}
      {editingWorker && <WorkerFormSheet worker={editingWorker} open={!!editingWorker} onOpenChange={(o) => !o && setEditingWorker(null)} />}
      {viewingWorkerId && <WorkerDetailsSheet workerId={viewingWorkerId} open={!!viewingWorkerId} onOpenChange={(o) => !o && setViewingWorkerId(null)} />}

    </div>
  );
}