import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { 
  Loader2, Users, Plus, Upload, Eye, Pencil, Trash2, 
  ShieldCheck, HardHat, Filter, Briefcase
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// NOTA: Si tienes WorkerDetailsSheet y WorkerFormSheet reales, puedes descomentarlos.
// Por ahora los comentamos para que no explote si no existen.
// import { WorkerFormSheet } from '@/components/workers/WorkerFormSheet';
// import { WorkerDetailsSheet } from '@/components/workers/WorkerDetailsSheet';

export default function WorkersPage() {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Estados para modales
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorker, setEditingWorker] = useState<any>(null);
  const [viewingWorkerId, setViewingWorkerId] = useState<string | null>(null);

  // Estado del formulario de creación
  const [formData, setFormData] = useState({
    rut: '',
    name: '',
    email: '',
    position: '',
    costCenterId: '', // <--- Clave para la integración
  });

  // 1. Cargar Trabajadores
  const { data: workers, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => (await axios.get('/workers')).data,
  });

  // 2. Cargar Centros de Costos (Para el select)
  const { data: costCenters } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => (await axios.get('/cost-centers')).data,
  });

  // 3. Mutaciones
  const createMutation = useMutation({
    mutationFn: async (newWorker: any) => await axios.post('/workers', newWorker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success('Trabajador creado exitosamente');
      setIsCreating(false);
      setFormData({ rut: '', name: '', email: '', position: '', costCenterId: '' });
    },
    onError: () => toast.error('Error al crear trabajador')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/workers/${id}`),
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['workers'] }); 
        toast.success("Eliminado"); 
    },
    onError: () => toast.error("Error al eliminar")
  });

  const handleCreateSubmit = () => {
    if (!formData.rut || !formData.name) {
      toast.error('RUT y Nombre son obligatorios');
      return;
    }
    createMutation.mutate({
        ...formData,
        evaluationType: 'NOMINA'
    });
  };

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

  // Lógica de Filtrado
  const filteredWorkers = workers?.filter((w: any) => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.rut.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'TRANSITO') {
        matchesStatus = w.employmentStatus === 'TRANSITO';
    } else if (filterStatus === 'NOMINA') {
        matchesStatus = w.employmentStatus === 'NOMINA' || !w.employmentStatus;
    }

    return matchesSearch && matchesStatus;
  });

  const countTransito = workers?.filter((w:any) => w.employmentStatus === 'TRANSITO').length || 0;
  const countNomina = workers?.filter((w:any) => w.employmentStatus !== 'TRANSITO').length || 0;

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Users className="h-8 w-8" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nómina de Trabajadores</h1>
            <p className="text-muted-foreground">Base de datos de personal activo.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsCreating(true)} className="bg-blue-600 text-white hover:bg-blue-700">
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

      {/* FILTROS Y TABS */}
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

      {/* TABLA DE TRABAJADORES */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow className="bg-slate-50">
                    <TableHead className="pl-6">RUT</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Centro de Costos</TableHead> {/* Nueva Columna */}
                    <TableHead className="text-right pr-6">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers?.length > 0 ? (
                  filteredWorkers.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-mono pl-6 text-slate-600 font-semibold">{w.rut}</TableCell>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      
                      <TableCell>
                        {w.employmentStatus === 'TRANSITO' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                <HardHat className="w-3 h-3 mr-1" /> En Tránsito
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                <ShieldCheck className="w-3 h-3 mr-1" /> En Nómina
                            </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Briefcase className="h-3 w-3 text-slate-400" />
                            {w.position || '-'}
                        </div>
                      </TableCell>
                      
                      {/* MOSTRAR CENTRO DE COSTOS REAL */}
                      <TableCell>
                        {w.costCenter?.name ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                {w.costCenter.code} - {w.costCenter.name}
                            </span>
                        ) : (
                            <span className="text-slate-400 text-xs italic">Sin asignar</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right pr-6 space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingWorkerId(w.id)}><Eye className="h-4 w-4" /></Button>
                        {/* Botones de editar y borrar */}
                        <Button variant="ghost" size="icon" onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(w.id) }}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          No se encontraron trabajadores.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL DE CREACIÓN INTEGRADO */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">RUT</label>
                    <Input 
                        value={formData.rut} 
                        onChange={(e) => setFormData({...formData, rut: e.target.value})} 
                        placeholder="12.345.678-9"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        placeholder="correo@empresa.com"
                    />
                </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre Completo</label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Nombre Apellido"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cargo / Puesto</label>
              <Input 
                value={formData.position} 
                onChange={(e) => setFormData({...formData, position: e.target.value})} 
                placeholder="Ej: Operador Maquinaria"
              />
            </div>

            {/* SELECTOR DE CENTRO DE COSTOS (CONECTADO) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Centro de Costos</label>
              <Select 
                value={formData.costCenterId} 
                onValueChange={(val) => setFormData({...formData, costCenterId: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione CC..." />
                </SelectTrigger>
                <SelectContent>
                  {costCenters?.map((cc: any) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.code} - {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>Cancelar</Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AQUÍ PUEDES DESCOMENTAR TUS OTROS MODALES SI LOS TIENES */}
      {/* {editingWorker && <WorkerFormSheet ... />} */}
      {/* {viewingWorkerId && <WorkerDetailsSheet ... />} */}

    </div>
  );
}