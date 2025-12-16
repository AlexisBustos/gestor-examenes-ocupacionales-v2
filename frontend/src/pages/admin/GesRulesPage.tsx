import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // 👈 IMPORTANTE
import { Loader2, Save, Search, Stethoscope, AlertTriangle, ShieldAlert, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GesRulesPage() {
  const queryClient = useQueryClient();
  const [selectedGesId, setSelectedGesId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADOS DE SELECCIÓN
  const [checkedBatteries, setCheckedBatteries] = useState<string[]>([]);
  const [checkedRisks, setCheckedRisks] = useState<string[]>([]); // 👈 NUEVO: Para documentos

  // 1. CARGA DE DATOS MAESTROS
  const { data: gesList, isLoading: loadingGes } = useQuery<any[]>({
    queryKey: ['ges'],
    queryFn: async () => (await axios.get('/ges')).data,
  });

  const { data: allBatteries, isLoading: loadingBat } = useQuery<any[]>({
    queryKey: ['batteries-list'],
    queryFn: async () => {
        try { return (await axios.get('/batteries')).data; } 
        catch { return (await axios.get('/config/batteries')).data; }
    },
  });

  // 👇 CARGAMOS LA LISTA DE RIESGOS (DOCUMENTOS)
  const { data: allRisks, isLoading: loadingRisks } = useQuery<any[]>({
    queryKey: ['risks-list'],
    queryFn: async () => (await axios.get('/risks')).data,
  });

  const selectedGes = gesList?.find(g => g.id === selectedGesId);

  // 2. CARGAR CONFIGURACIÓN ACTUAL DEL GES SELECCIONADO
  const { isLoading: loadingSelection } = useQuery({
    queryKey: ['ges-config', selectedGesId],
    queryFn: async () => {
      if (!selectedGesId) return null;
      
      // Carga paralela: Baterías y Riesgos
      const [batteriesData, risksData] = await Promise.all([
        axios.get(`/ges/${selectedGesId}/batteries`),
        axios.get(`/ges/${selectedGesId}/risks`) // 👈 NUEVO ENDPOINT
      ]);

      // Mapeo Baterías
      const bIds = Array.isArray(batteriesData.data) ? batteriesData.data.map((b: any) => b.id) : [];
      setCheckedBatteries(bIds);

      // Mapeo Riesgos
      // El backend devuelve array de IDs directos: ["id1", "id2"]
      setCheckedRisks(risksData.data || []);

      return { batteries: bIds, risks: risksData.data };
    },
    enabled: !!selectedGesId,
  });

  // 3. GUARDAR CAMBIOS
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGesId) return;
      await Promise.all([
        axios.put(`/ges/${selectedGesId}/batteries`, { batteryIds: checkedBatteries }),
        axios.put(`/ges/${selectedGesId}/risks`, { riskIds: checkedRisks }) // 👈 GUARDAMOS RIESGOS
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges-config', selectedGesId] });
      queryClient.invalidateQueries({ queryKey: ['ges'] });
      toast.success("Reglas actualizadas correctamente");
    },
    onError: () => toast.error("Error al guardar reglas")
  });

  // HELPERS DE TOGGLE
  const toggleBattery = (id: string) => {
    setCheckedBatteries(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleRisk = (id: string) => {
    setCheckedRisks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredGes = gesList?.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loadingGes || loadingBat || loadingRisks) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in">
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editor de Reglas Médicas y Legales</h1>
          <p className="text-muted-foreground">Define qué exámenes y documentos aplican a cada puesto (GES).</p>
        </div>
        {selectedGesId && (
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-blue-700 hover:bg-blue-800">
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                Guardar Configuración
            </Button>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
        {/* LISTA IZQUIERDA (Selectores de GES) */}
        <Card className="col-span-4 flex flex-col overflow-hidden shadow-sm border-slate-200">
            <CardHeader className="pb-2 bg-slate-50/50">
                <CardTitle className="text-sm font-semibold text-slate-700">Seleccionar GES</CardTitle>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400"/>
                    <Input placeholder="Buscar puesto..." className="pl-8 h-9 bg-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-2">
                <ScrollArea className="h-full pr-2">
                    <div className="space-y-1">
                        {filteredGes?.map((ges: any) => {
                            const hasRisks = ges.riskExposures && ges.riskExposures.length > 0;
                            return (
                                <button
                                    key={ges.id}
                                    onClick={() => setSelectedGesId(ges.id)}
                                    className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all flex justify-between items-center ${selectedGesId === ges.id ? 'bg-blue-100 text-blue-900 font-medium shadow-sm' : 'hover:bg-slate-100 text-slate-600'}`}
                                >
                                    <div className="flex flex-col truncate pr-2">
                                        <span>{ges.name}</span>
                                        {hasRisks && (
                                            <span className="text-[10px] flex items-center text-amber-600 mt-0.5 font-normal">
                                                <ShieldAlert className="h-3 w-3 mr-1" />
                                                {ges.riskExposures.length} Riesgos detectados
                                            </span>
                                        )}
                                    </div>
                                    {/* Indicador visual de configuración */}
                                    {(ges.examBatteries?.length > 0 || (ges.risks?.length > 0)) && (
                                        <div className="flex gap-1">
                                            {ges.examBatteries?.length > 0 && <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-blue-200 text-blue-800">Exam</Badge>}
                                            {/* Si tu backend envía 'risks' en la lista principal, podrías mostrar esto también */}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>

        {/* LISTA DERECHA (Pestañas de Configuración) */}
        <Card className="col-span-8 flex flex-col overflow-hidden border-slate-200 bg-white shadow-sm">
            {selectedGesId ? (
                <Tabs defaultValue="EXAMS" className="flex-1 flex flex-col h-full">
                    <CardHeader className="pb-0 border-b bg-slate-50/30 pt-4 px-6">
                        <div className="flex justify-between items-center mb-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                                <Stethoscope className="h-4 w-4 text-primary"/> 
                                Editando: {selectedGes.name}
                            </CardTitle>
                        </div>
                        <TabsList className="w-full justify-start h-10 p-0 bg-transparent border-b border-transparent">
                            <TabsTrigger value="EXAMS" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-6">
                                🏥 Exámenes Médicos ({checkedBatteries.length})
                            </TabsTrigger>
                            <TabsTrigger value="DOCS" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:shadow-none rounded-none px-6">
                                📜 Documentación ODI ({checkedRisks.length})
                            </TabsTrigger>
                        </TabsList>
                    </CardHeader>
                    
                    <CardContent className="flex-1 overflow-hidden p-0 bg-slate-50/30">
                        {loadingSelection ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400 h-8 w-8"/></div>
                        ) : (
                            <>
                                {/* PESTAÑA 1: EXÁMENES */}
                                <TabsContent value="EXAMS" className="h-full overflow-y-auto p-6 m-0">
                                    
                                    {/* 👇 AQUÍ ESTÁ EL CAMBIO: PANEL DE RIESGOS CON DETALLE ESPECÍFICO */}
                                    {selectedGes?.riskExposures && selectedGes.riskExposures.length > 0 && (
                                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center mb-2">
                                                <AlertTriangle className="h-4 w-4 mr-2" /> Sugerencia basada en Matriz de Riesgos
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedGes.riskExposures.map((risk: any) => (
                                                    <Badge key={risk.id} variant="outline" className="bg-white border-amber-300 text-amber-900 flex items-center gap-1">
                                                        {/* Nombre Principal */}
                                                        <span className="font-semibold">{risk.riskAgent?.name || "Riesgo s/n"}</span>
                                                        
                                                        {/* Detalle Específico (Si existe) */}
                                                        {risk.specificAgentDetails && (
                                                            <span className="text-amber-700 opacity-80 font-normal border-l border-amber-200 pl-1 ml-1 text-[10px]">
                                                                {risk.specificAgentDetails}
                                                            </span>
                                                        )}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* 👆 FIN DEL CAMBIO */}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {allBatteries?.map((bat: any) => {
                                            const isChecked = checkedBatteries.includes(bat.id);
                                            return (
                                                <div key={bat.id} className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isChecked ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`} onClick={() => toggleBattery(bat.id)}>
                                                    <Checkbox checked={isChecked} onCheckedChange={() => toggleBattery(bat.id)} className="mt-0.5" />
                                                    <label className="text-sm font-medium leading-none cursor-pointer text-slate-700">{bat.name}</label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>

                                {/* PESTAÑA 2: DOCUMENTOS (ODI) */}
                                <TabsContent value="DOCS" className="h-full overflow-y-auto p-6 m-0">
                                    <div className="mb-4 bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                                        <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                            <FileText className="h-4 w-4" /> Automatización de Envíos
                                        </h4>
                                        <p className="text-xs text-indigo-700 mt-1">
                                            Al marcar un riesgo aquí, el sistema enviará automáticamente el protocolo correspondiente (PDF activo) cuando un trabajador ingrese a este puesto.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {allRisks?.map((risk: any) => {
                                            const isChecked = checkedRisks.includes(risk.id);
                                            return (
                                                <div key={risk.id} className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isChecked ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-slate-200 hover:border-indigo-300'}`} onClick={() => toggleRisk(risk.id)}>
                                                    <Checkbox checked={isChecked} onCheckedChange={() => toggleRisk(risk.id)} className="mt-0.5 border-indigo-400 data-[state=checked]:bg-indigo-600" />
                                                    <div>
                                                        <label className="text-sm font-medium leading-none cursor-pointer text-slate-700">{risk.name}</label>
                                                        {risk.documents?.[0] ? (
                                                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                                <FileText className="h-3 w-3" /> {risk.documents[0].title}
                                                            </p>
                                                        ) : (
                                                            <p className="text-[10px] text-red-400 mt-1 italic">Sin documento PDF activo</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            </>
                        )}
                    </CardContent>
                </Tabs>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-3">
                        <AlertTriangle className="h-8 w-8 text-slate-300"/>
                    </div>
                    <p>Selecciona un GES para comenzar la edición</p>
                </div>
            )}
        </Card>
      </div>
    </div>
  );
}