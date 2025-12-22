import { useState, useMemo, useEffect } from 'react'; // 👈 AGREGUÉ useEffect
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom'; // 👈 AGREGUÉ useLocation
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { 
  Loader2, Users, Plus, Upload, Eye, Pencil, Trash2, 
  ShieldCheck, HardHat, Filter, UserMinus, X, Building2, MapPin
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { WorkerCreateDialog } from '@/components/workers/WorkerCreateDialog';
import { WorkerDetailsSheet } from '@/components/workers/WorkerDetailsSheet'; 

export default function WorkersPage() {
  const queryClient = useQueryClient();
  
  // 👇 ESTO ES NUEVO: Para saber si venimos de una alerta
  const location = useLocation(); 
  
  // --- TUS VARIABLES DE ESTADO ORIGINALES (INTACTAS) ---
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  const [filterGes, setFilterGes] = useState<string>('ALL');       
  const [filterAgent, setFilterAgent] = useState<string>('ALL');   
  const [filterCompany, setFilterCompany] = useState<string>('ALL'); 
  const [filterCostCenter, setFilterCostCenter] = useState<string>('ALL'); 

  const [isCreating, setIsCreating] = useState(false);
  const [viewingWorkerId, setViewingWorkerId] = useState<string | null>(null);
  const [editingWorker, setEditingWorker] = useState<any>(null);

  // 1. Cargar Trabajadores (INTACTO)
  const { data: workers, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => (await axios.get('/workers')).data,
  });

  // 👇 LÓGICA DE APERTURA AUTOMÁTICA (LO ÚNICO QUE AGREGA COMPORTAMIENTO)
  useEffect(() => {
    if (location.state && location.state.action === 'OPEN_WORKER_SHEET' && location.state.workerId) {
        console.log("🚀 Redirección de alerta detectada. Abriendo trabajador:", location.state.workerId);
        
        // Abrimos el modal de detalles automáticamente
        setViewingWorkerId(location.state.workerId);

        // Limpiamos el estado para que no moleste después
        window.history.replaceState({}, document.title);
    }
  }, [location]);

  // 2. Eliminar Trabajador (INTACTO)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/workers/${id}`),
    onSuccess: () => { 
        queryClient.invalidateQueries({ queryKey: ['workers'] }); 
        toast.success("Trabajador eliminado"); 
    },
    onError: () => toast.error("Error al eliminar")
  });

  // --- TUS FUNCIONES AUXILIARES (INTACTAS) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('/workers/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Nómina cargada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    } catch (error) { toast.error('Error al cargar archivo'); }
    finally { setIsImporting(false); e.target.value = ''; }
  };

  const uniqueGes = useMemo(() => {
      if (!workers) return [];
      const set = new Set(workers.map((w: any) => w.currentGes?.name).filter(Boolean));
      return Array.from(set).sort();
  }, [workers]);

  const uniqueAgents = useMemo(() => {
      if (!workers) return [];
      const set = new Set();
      workers.forEach((w: any) => {
          if (w.currentGes?.risks) {
              w.currentGes.risks.forEach((r: any) => {
                  if (r.risk?.name) set.add(r.risk.name);
              });
          }
      });
      return Array.from(set).sort() as string[];
  }, [workers]);

  const uniqueCompanies = useMemo(() => {
      if (!workers) return [];
      const set = new Set(workers.map((w: any) => w.company?.name).filter(Boolean));
      return Array.from(set).sort();
  }, [workers]);

  const uniqueCostCenters = useMemo(() => {
      if (!workers) return [];
      const set = new Set(workers.map((w: any) => w.costCenter?.name).filter(Boolean));
      return Array.from(set).sort();
  }, [workers]);

  // --- TU FILTRADO (INTACTO) ---
  const filteredWorkers = workers?.filter((w: any) => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          w.rut.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'TRANSITO') matchesStatus = w.employmentStatus === 'TRANSITO';
    else if (filterStatus === 'NOMINA') matchesStatus = w.employmentStatus === 'NOMINA';
    else if (filterStatus === 'DESVINCULADO') matchesStatus = w.employmentStatus === 'DESVINCULADO';

    let matchesGes = true;
    if (filterGes !== 'ALL') matchesGes = w.currentGes?.name === filterGes;

    let matchesAgent = true;
    if (filterAgent !== 'ALL') {
        const workerRisks = w.currentGes?.risks?.map((r: any) => r.risk?.name) || [];
        matchesAgent = workerRisks.includes(filterAgent);
    }

    let matchesCompany = true;
    if (filterCompany !== 'ALL') matchesCompany = w.company?.name === filterCompany;

    let matchesCostCenter = true;
    if (filterCostCenter !== 'ALL') matchesCostCenter = w.costCenter?.name === filterCostCenter;

    return matchesSearch && matchesStatus && matchesGes && matchesAgent && matchesCompany && matchesCostCenter;
  });

  const countTransito = workers?.filter((w:any) => w.employmentStatus === 'TRANSITO').length || 0;
  const countNomina = workers?.filter((w:any) => w.employmentStatus === 'NOMINA').length || 0;
  const countDesvinculados = workers?.filter((w:any) => w.employmentStatus === 'DESVINCULADO').length || 0;

  const clearFilters = () => {
      setFilterGes('ALL');
      setFilterAgent('ALL');
      setFilterCompany('ALL');
      setFilterCostCenter('ALL');
      setSearchTerm('');
  };

  const hasActiveFilters = filterGes !== 'ALL' || filterAgent !== 'ALL' || filterCompany !== 'ALL' || filterCostCenter !== 'ALL' || searchTerm !== '';

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      
      {/* HEADER (INTACTO) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-primary"><Users className="h-8 w-8" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Nómina de Trabajadores</h1>
            <p className="text-muted-foreground">Gestión de dotación, puestos y riesgos.</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setIsCreating(true)} className="bg-primary text-white hover:bg-primary/90 flex-1 md:flex-none">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Trabajador
          </Button>

          <div className="relative">
            <input type="file" id="import-w" className="hidden" accept=".xlsx, .csv" onChange={handleFileUpload} disabled={isImporting} />
            <label htmlFor="import-w">
              <Button variant="outline" className="cursor-pointer w-full md:w-auto" asChild disabled={isImporting}>
                <span>{isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Excel</span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      {/* --- ZONA DE CONTROL (INTACTA) --- */}
      <div className="space-y-4">
          
          <Tabs defaultValue="ALL" className="w-full" onValueChange={setFilterStatus}>
            <TabsList className="grid w-full grid-cols-4 md:w-[600px] bg-slate-100">
              <TabsTrigger value="ALL">Todos</TabsTrigger>
              <TabsTrigger value="TRANSITO" className="gap-2">
                Tránsito 
                {countTransito > 0 && <Badge variant="secondary" className="bg-amber-100 text-amber-700 px-1.5 h-5 text-[10px]">{countTransito}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="NOMINA" className="gap-2">
                Nómina
                <Badge variant="secondary" className="bg-green-100 text-green-700 px-1.5 h-5 text-[10px]">{countNomina}</Badge>
              </TabsTrigger>
              <TabsTrigger value="DESVINCULADO" className="gap-2">
                Bajas
                {countDesvinculados > 0 && <Badge variant="secondary" className="bg-red-100 text-red-700 px-1.5 h-5 text-[10px]">{countDesvinculados}</Badge>}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* BARRA DE FILTROS */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                
                <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                    <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Buscar..." 
                        className="pl-9 bg-white border-slate-200 focus:border-primary"
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>

                <Select value={filterCompany} onValueChange={setFilterCompany}>
                    <SelectTrigger className="bg-white border-slate-200">
                        <div className="flex items-center gap-2 truncate">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Empresa" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todas las Empresas</SelectItem>
                        {uniqueCompanies.map((c: any) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterCostCenter} onValueChange={setFilterCostCenter}>
                    <SelectTrigger className="bg-white border-slate-200">
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Centro / Área" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todas las Áreas</SelectItem>
                        {uniqueCostCenters.map((cc: any) => (
                            <SelectItem key={cc} value={cc}>{cc}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterGes} onValueChange={setFilterGes}>
                    <SelectTrigger className="bg-white border-slate-200">
                        <SelectValue placeholder="Puesto (GES)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos los Puestos</SelectItem>
                        {uniqueGes.map((ges: any) => (
                            <SelectItem key={ges} value={ges}>{ges}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <Select value={filterAgent} onValueChange={setFilterAgent}>
                            <SelectTrigger className="bg-white border-slate-200">
                                <SelectValue placeholder="Riesgo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos los Riesgos</SelectItem>
                                {uniqueAgents.map((agent: any) => (
                                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {hasActiveFilters && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpiar" className="text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

              </div>
              
              <div className="mt-2 text-right text-xs text-slate-400">
                  Mostrando <strong>{filteredWorkers?.length}</strong> colaboradores
              </div>
          </div>
      </div>

      {/* TABLA PRINCIPAL (INTACTA) */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50">
                    <TableHead className="pl-6 font-semibold text-slate-700 w-[120px]">RUT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Nombre</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-[140px]">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ubicación</TableHead>
                    <TableHead className="font-semibold text-slate-700">Puesto & Riesgos</TableHead>
                    <TableHead className="text-right pr-6 font-semibold text-slate-700 w-[120px]">Acciones</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkers?.length > 0 ? (
                  filteredWorkers.map((w: any) => (
                    <TableRow key={w.id} className="hover:bg-slate-50 transition-colors group">
                      
                      <TableCell className="font-mono pl-6 text-slate-600 font-medium text-xs">
                          {w.rut}
                      </TableCell>

                      <TableCell>
                          <div className="flex flex-col">
                              <span className="font-medium text-slate-900">{w.name}</span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {w.company?.name || 'Sin Empresa'}
                              </span>
                          </div>
                      </TableCell>
                      
                      <TableCell>
                        {w.employmentStatus === 'TRANSITO' ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">
                                <HardHat className="w-3 h-3 mr-1" /> Tránsito
                            </Badge>
                        ) : w.employmentStatus === 'DESVINCULADO' ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 whitespace-nowrap">
                                <UserMinus className="w-3 h-3 mr-1" /> Baja
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap">
                                <ShieldCheck className="w-3 h-3 mr-1" /> Nómina
                            </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                         <div className="flex flex-col text-xs">
                             <span className="font-medium text-slate-700">{w.position || 'Sin Cargo'}</span>
                             {w.costCenter?.name ? (
                                <span className="text-slate-500">{w.costCenter.name}</span>
                             ) : (
                                <span className="text-slate-300 italic">--</span>
                             )}
                         </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-primary/80">
                                {w.currentGes?.name || '-'}
                            </span>
                            
                            {w.currentGes?.risks && w.currentGes.risks.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-w-[250px]">
                                    {w.currentGes.risks.slice(0, 3).map((r: any, idx: number) => (
                                        <span key={idx} className="inline-flex text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                                            {r.risk?.name?.slice(0, 15)}
                                        </span>
                                    ))}
                                    {w.currentGes.risks.length > 3 && (
                                        <span className="text-[10px] text-slate-400 px-1 font-medium">+{w.currentGes.risks.length - 3}</span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-[10px] text-slate-300 italic">Sin riesgos asociados</span>
                            )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10" onClick={() => setViewingWorkerId(w.id)}>
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50" onClick={() => setEditingWorker(w)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => { if (confirm('¿Eliminar registro?')) deleteMutation.mutate(w.id) }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                  <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                              <div className="bg-slate-50 p-4 rounded-full mb-3 border border-slate-100">
                                <Filter className="h-8 w-8 text-slate-300" />
                              </div>
                              <p className="font-medium text-slate-900">No hay resultados</p>
                              <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1 mb-4">
                                No encontramos trabajadores que coincidan con la combinación de filtros seleccionada.
                              </p>
                              <Button variant="outline" onClick={clearFilters} className="text-xs">
                                  Limpiar todos los filtros
                              </Button>
                          </div>
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODALES AUXILIARES */}
      {isCreating && (
        <WorkerCreateDialog open={isCreating} onOpenChange={setIsCreating} />
      )}

      {/* Modal Detalles (Ahora se abre también automáticamente por el useEffect) */}
      {viewingWorkerId && (
        <WorkerDetailsSheet 
            workerId={viewingWorkerId} 
            open={!!viewingWorkerId} 
            onOpenChange={(open) => !open && setViewingWorkerId(null)} 
        />
      )}

      {editingWorker && (
        <WorkerEditDialog 
            worker={editingWorker} 
            open={!!editingWorker} 
            onOpenChange={(o) => !o && setEditingWorker(null)} 
        />
      )}

    </div>
  );
}

// --- SUBCOMPONENTE DE EDICIÓN (INTACTO) ---
function WorkerEditDialog({ worker, open, onOpenChange }: { worker: any, open: boolean, onOpenChange: (o: boolean) => void }) {
    const queryClient = useQueryClient();
    const [name, setName] = useState(worker.name || '');
    const [email, setEmail] = useState(worker.email || '');
    const [phone, setPhone] = useState(worker.phone || '');
    const [position, setPosition] = useState(worker.position || '');
    const [costCenterId, setCostCenterId] = useState(worker.costCenterId || worker.costCenter?.id || '');

    const { data: costCenters } = useQuery<any[]>({ 
        queryKey: ['cost-centers'], 
        queryFn: async () => (await axios.get('/cost-centers')).data 
    });

    const updateMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                name, email, phone, position, 
                costCenterId: (costCenterId === "" || costCenterId === "ALL") ? null : costCenterId
            };
            await axios.patch(`/workers/${worker.id}`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            toast.success("Trabajador actualizado");
            onOpenChange(false);
        },
        onError: () => toast.error("Error al actualizar")
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>Editar Trabajador</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>RUT (No editable)</Label><Input value={worker.rut} disabled className="bg-slate-100" /></div>
                        <div><Label>Nombre Completo</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Cargo</Label><Input value={position} onChange={e => setPosition(e.target.value)} /></div>
                        <div>
                            <Label>Centro de Costos / Área</Label>
                            <Select value={costCenterId} onValueChange={setCostCenterId}>
                                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">-- Sin Centro --</SelectItem> 
                                    {costCenters?.map(cc => (
                                        <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} /></div>
                        <div><Label>Teléfono</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="bg-primary text-white">
                        {updateMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : null}
                        Guardar Cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}