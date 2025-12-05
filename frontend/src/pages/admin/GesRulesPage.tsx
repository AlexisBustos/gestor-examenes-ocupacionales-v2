import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Search, Stethoscope, AlertTriangle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function GesRulesPage() {
  const queryClient = useQueryClient();
  const [selectedGesId, setSelectedGesId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [checkedBatteries, setCheckedBatteries] = useState<string[]>([]);

  // 1. Cargar GES (Ahora pedimos que incluya los riesgos si el backend lo soporta por defecto, 
  // si no, asegúrate de que el endpoint /ges traiga riskExposures)
  const { data: gesList, isLoading: loadingGes } = useQuery<any[]>({
    queryKey: ['ges'],
    queryFn: async () => (await axios.get('/ges')).data,
  });

  // Encuentra el objeto GES completo seleccionado para ver sus detalles
  const selectedGes = gesList?.find(g => g.id === selectedGesId);

  // 2. Cargar Baterías
  const { data: allBatteries, isLoading: loadingBat } = useQuery<any[]>({
    queryKey: ['batteries-list'],
    queryFn: async () => {
        try { return (await axios.get('/batteries')).data; } 
        catch { return (await axios.get('/config/batteries')).data; }
    },
  });

  // 3. Cargar Selección
  const { isLoading: loadingSelection } = useQuery({
    queryKey: ['ges-batteries', selectedGesId],
    queryFn: async () => {
      if (!selectedGesId) return [];
      const { data } = await axios.get(`/ges/${selectedGesId}/batteries`);
      // Si data es un array de baterías, mapeamos IDs. Si es null, array vacío.
      const batteryIds = Array.isArray(data) ? data.map((b: any) => b.id) : [];
      setCheckedBatteries(batteryIds);
      return data;
    },
    enabled: !!selectedGesId,
  });

  // 4. Guardar
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedGesId) return;
      await axios.put(`/ges/${selectedGesId}/batteries`, { batteryIds: checkedBatteries });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges-batteries', selectedGesId] });
      // También invalidamos la lista de GES para refrescar contadores si fuera necesario
      queryClient.invalidateQueries({ queryKey: ['ges'] });
      toast.success("Reglas actualizadas correctamente");
    },
    onError: () => toast.error("Error al guardar reglas")
  });

  const toggleBattery = (batteryId: string) => {
    setCheckedBatteries(prev => 
      prev.includes(batteryId) ? prev.filter(id => id !== batteryId) : [...prev, batteryId]
    );
  };

  const filteredGes = gesList?.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loadingGes || loadingBat) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600"/></div>;

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-in fade-in">
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editor de Reglas Médicas</h1>
          <p className="text-muted-foreground">Asigna manualmente las baterías requeridas por cada GES.</p>
        </div>
        {selectedGesId && (
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-blue-700 hover:bg-blue-800">
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                Guardar Cambios
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
                            // Verificamos si tiene riesgos (asumiendo que el backend trae riskExposures)
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
                                    
                                    {/* Contador de baterías ya asignadas */}
                                    {ges.examBatteries && ges.examBatteries.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-blue-200 text-blue-800">
                                            {ges.examBatteries.length}
                                        </Badge>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>

        {/* LISTA DERECHA (Baterías) */}
        <Card className="col-span-8 flex flex-col overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b bg-slate-50/30">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                    <Stethoscope className="h-4 w-4 text-blue-600"/> 
                    {selectedGes ? `Editando: ${selectedGes.name}` : 'Baterías Asignadas'}
                    {selectedGesId && <Badge variant="outline" className="ml-2 font-normal bg-white">{checkedBatteries.length} seleccionadas</Badge>}
                </CardTitle>
                <CardDescription>
                    {selectedGesId ? "Marca las baterías obligatorias para este puesto." : "Selecciona un GES a la izquierda para editar."}
                </CardDescription>
            </CardHeader>
            
            {selectedGesId ? (
                <CardContent className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    
                    {/* --- NUEVO: PANEL DE RIESGOS DETECTADOS --- */}
                    {selectedGes?.riskExposures && selectedGes.riskExposures.length > 0 && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg animate-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center mb-2">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Riesgos detectados en la carga masiva
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedGes.riskExposures.map((risk: any) => (
                                    <Badge key={risk.id} variant="outline" className="bg-white border-amber-300 text-amber-900">
                                        {risk.riskAgent?.name || "Riesgo s/n"} 
                                        {risk.specificAgentDetails && <span className="ml-1 text-amber-700 opacity-75">({risk.specificAgentDetails})</span>}
                                    </Badge>
                                ))}
                            </div>
                            <p className="text-[11px] text-amber-700 mt-2">
                                * Tip: Selecciona las baterías que cubran estos riesgos.
                            </p>
                        </div>
                    )}
                    {/* ------------------------------------------ */}

                    {loadingSelection ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400 h-8 w-8"/></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {allBatteries?.map((bat: any) => {
                                const isChecked = checkedBatteries.includes(bat.id);
                                return (
                                    <div key={bat.id} className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer select-none ${isChecked ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500/20' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`} onClick={() => toggleBattery(bat.id)}>
                                        <Checkbox checked={isChecked} onCheckedChange={() => toggleBattery(bat.id)} className="mt-0.5" />
                                        <div className="space-y-1 leading-none">
                                            <label className="text-sm font-medium leading-none cursor-pointer text-slate-700">{bat.name}</label>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
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