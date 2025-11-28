import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Upload, Settings, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { AddRuleDialog } from './AddRuleDialog'; // Asegúrate que esté en la misma carpeta

export default function ConfigPage() {
  const queryClient = useQueryClient();
  const [isImporting, setIsImporting] = useState(false);
  const [isAdding, setIsAdding] = useState(false); // Estado para el modal

  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: async () => (await axios.get('/config/rules')).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/config/rules/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rules'] }); toast.success("Eliminada"); },
    onError: () => toast.error("Error")
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('/config/import-rules', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Reglas actualizadas');
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    } catch (error) { toast.error('Error al cargar'); } 
    finally { setIsImporting(false); e.target.value = ''; }
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg text-gray-600"><Settings className="h-8 w-8" /></div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configuración Médica</h1>
                <p className="text-muted-foreground">Asocia riesgos a baterías de exámenes.</p>
            </div>
        </div>
        <div className="flex gap-2">
            {/* BOTÓN MANUAL */}
            <Button variant="secondary" onClick={() => setIsAdding(true)}>
                <Plus className="mr-2 h-4 w-4"/> Nueva Regla Manual
            </Button>
            
            {/* BOTÓN EXCEL */}
            <div className="relative">
                <input type="file" id="import-rules" className="hidden" accept=".xlsx, .csv" onChange={handleFileUpload} disabled={isImporting} />
                <label htmlFor="import-rules">
                    <Button variant="outline" className="cursor-pointer" asChild disabled={isImporting}>
                        <span>{isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Cargar Excel</span>
                    </Button>
                </label>
            </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Reglas Activas</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Riesgo Detectado</TableHead><TableHead>Detalle Específico</TableHead><TableHead>Batería Asignada</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
                <TableBody>
                    {rules?.map((rule: any) => (
                        <TableRow key={rule.id}>
                            <TableCell className="font-medium font-mono text-blue-700">{rule.riskAgentName}</TableCell>
                            <TableCell>{rule.specificDetail || <span className="text-slate-400 italic">Cualquiera</span>}</TableCell>
                            <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{rule.battery?.name || 'Sin nombre'}</Badge></TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(rule.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button></TableCell>
                        </TableRow>
                    ))}
                    {(!rules || rules.length === 0) && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No hay reglas definidas.</TableCell></TableRow>}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* MODAL MANUAL */}
      {isAdding && <AddRuleDialog open={isAdding} onOpenChange={setIsAdding} />}
    </div>
  );
}