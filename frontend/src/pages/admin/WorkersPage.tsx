import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { 
  Loader2, Users, Plus, Upload, Eye, Pencil, Trash2, 
  ShieldCheck, HardHat, Filter 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // 👈 IMPORTANTE: Importamos Tabs

import { WorkerCreateDialog } from '@/components/workers/WorkerCreateDialog';
import { WorkerFormSheet } from '@/components/workers/WorkerFormSheet';
import { WorkerDetailsSheet } from '@/components/workers/WorkerDetailsSheet';

export default function WorkersPage() {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 👇 NUEVO ESTADO PARA EL FILTRO (Por defecto "ALL")
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [viewingWorkerId, setViewingWorkerId] = useState<string | null>(null);
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

  // 👇 LÓGICA DE FILTRADO MEJORADA (Texto + Estado)
  const filteredWorkers = workers?.filter((w: any) => {
    // 1. Filtro por texto (Nombre o RUT)
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.rut.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Filtro por Estado (Tabs)
    let matchesStatus = true;
    if (filterStatus === 'TRANSITO') {
        matchesStatus = w.employmentStatus === 'TRANSITO';
    } else if (filterStatus === 'NOMINA') {
        matchesStatus = w.employmentStatus === 'NOMINA' || !w.employmentStatus; // Incluye los null por si acaso
    }

    return matchesSearch && matchesStatus;
  });

  // Contadores para las pestañas (Opcional, pero se ve pro)
  const countTransito = workers?.filter((w:any) => w.employmentStatus === 'TRANSITO').length || 0;
  const countNomina = workers?.filter((w:any) => w.employmentStatus !== 'TRANSITO').length || 0;

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
          {/* BOTÓN NUEVO */}
          <Button variant="secondary" onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Trabajador
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

      {/* 👇 AQUÍ ESTÁN LAS PESTAÑAS DE FILTRO */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Tabs defaultValue="ALL" className="w-full sm:w-[400px]" onValueChange={setFilterStatus}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ALL">Todos</TabsTrigger>
              <TabsTrigger value="TRANSITO" className="gap-2">
                En Tránsito 
                {countTransito > 0 && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 rounded-full">{countTransito}</span>}
              </TabsTrigger>
              <TabsTrigger value="NOMINA" className="gap-2">
                Nómina
                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 rounded-full">{countNomina}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Buscador alineado a la derecha */}
          <div className="w-full sm:w-64 relative">
             <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input 
                placeholder="Buscar por RUT o Nombre..." 
                className="pl-9"
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
             />
          </div>
      </div>

      <Card>
        {/* Quitamos el Header del buscador antiguo porque lo movimos arriba */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow className="bg-slate-50">
                    <TableHead className="pl-6">RUT</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-right pr-6">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers?.length > 0 ? (
                  filteredWorkers.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono pl-6">{w.rut}</TableCell>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      
                      <TableCell>
                        {w.employmentStatus === 'TRANSITO' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                <HardHat className="w-3 h-3 mr-1" />
                                En Tránsito
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <ShieldCheck className="w-3 h-3 mr-1" />
                                En Nómina
                            </span>
                        )}
                      </TableCell>

                      <TableCell>{w.position}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{w.email || '-'}</div>
                        <div>{w.phone || '-'}</div>
                      </TableCell>
                      <TableCell className="text-right pr-6 space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingWorkerId(w.id)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingWorker(w)}><Pencil className="h-4 w-4 text-blue-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(w.id) }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No se encontraron trabajadores con este filtro.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODALES */}
      {isCreating && <WorkerCreateDialog open={isCreating} onOpenChange={setIsCreating} />}
      {editingWorker && <WorkerFormSheet worker={editingWorker} open={!!editingWorker} onOpenChange={(o: boolean) => !o && setEditingWorker(null)} />}
      {viewingWorkerId && <WorkerDetailsSheet workerId={viewingWorkerId} open={!!viewingWorkerId} onOpenChange={(o: boolean) => !o && setViewingWorkerId(null)} />}

    </div>
  );
}