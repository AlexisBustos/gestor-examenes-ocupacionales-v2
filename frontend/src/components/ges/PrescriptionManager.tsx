import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Plus,
  AlertCircle,
  Calendar,
  FileText,
  ShieldAlert,
  RotateCw,
} from 'lucide-react';
import { toast } from 'sonner';

// Interfaz para RiskAgent (Agente de Riesgo)
interface RiskAgent {
  id: string;
  name: string;
}

// Interfaz actualizada de Prescripción
interface Prescription {
  id: string;
  folio?: string;
  description: string;
  measureType?: string;
  isImmediate: boolean;
  implementationDate: string;
  observation?: string;
  status: 'PENDIENTE' | 'REALIZADA' | 'EN_PROCESO' | 'VENCIDA';
  riskAgent?: RiskAgent; // 👈 Aquí viene el agente si existe
}

interface Props {
  parentId: string;
  parentType: 'qualitative' | 'quantitative' | 'tmert';
  prescriptions: Prescription[];
  gesId: string | null;
}

export function PrescriptionManager({
  parentId,
  parentType,
  prescriptions,
  gesId,
}: Props) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Estados del Formulario
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [folio, setFolio] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('Ingenieril');
  const [immediate, setImmediate] = useState(false);
  const [date, setDate] = useState('');
  const [obs, setObs] = useState('');

  // 1. OBTENER AGENTES (RiskAgent)
  // Ruta confirmada gracias a tu archivo routes.ts (/risks)
  const { 
    data: agents, 
    isLoading: loadingAgents, 
    isError: errorAgents,
    refetch: retryAgents 
  } = useQuery<RiskAgent[]>({
    queryKey: ['risk-agents-list'], 
    queryFn: async () => {
      const { data } = await axios.get('/risks'); 
      return data;
    },
    enabled: isAdding, // Solo carga cuando se abre el formulario
    retry: 1,
  });

  // MUTACIÓN: CREAR
  const createMutation = useMutation({
    mutationFn: async () => {
      let url = '';
      
      if (parentType === 'qualitative') {
          url = `/reports/technical/${parentId}/prescriptions`;
      } else if (parentType === 'quantitative') {
          url = `/reports/quantitative/${parentId}/prescriptions`;
      } else if (parentType === 'tmert') {
          url = `/reports/tmert/${parentId}/prescriptions`;
      }

      await axios.post(url, {
        gesId,
        riskAgentId: selectedAgentId || undefined, // 👈 Enviamos el ID al backend
        folio,
        description: desc,
        measureType: type,
        isImmediate: immediate,
        implementationDate: date,
        observation: obs,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges-history'] });
      toast.success('Medida agregada');
      setIsAdding(false);
      resetForm();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Error al guardar medida');
    },
  });

  // MUTACIÓN: BORRAR
  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      await axios.delete(`/reports/prescriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges-history'] });
      toast.success('Eliminado');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  // MUTACIÓN: CAMBIAR ESTADO
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await axios.patch(`/reports/prescriptions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges-history'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const resetForm = () => {
    setSelectedAgentId('');
    setFolio('');
    setDesc('');
    setDate('');
    setObs('');
    setImmediate(false);
  };

  const getStatusColor = (status: string) => {
    if (status === 'REALIZADA') return 'text-green-600 font-bold';
    if (status === 'EN_PROCESO') return 'text-primary font-bold';
    if (status === 'VENCIDA') return 'text-red-600 font-bold';
    return 'text-amber-600';
  };

  return (
    <div className="space-y-4 mt-6 border-t pt-6">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-semibold flex items-center gap-2 text-slate-800">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Medidas de Control ({prescriptions?.length || 0})
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? 'Cancelar' : <><Plus className="h-3 w-3 mr-1" /> Nueva Medida</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-50 border-slate-200 animate-in fade-in">
          <CardContent className="p-4 space-y-3">
            
            {/* SELECCIÓN DE AGENTE (RiskAgent) */}
            <div>
                <Label className="text-xs font-semibold text-slate-700">
                    Asociar a Agente de Riesgo
                </Label>
                <div className="flex gap-2 items-center">
                    <Select 
                      value={selectedAgentId} 
                      onValueChange={setSelectedAgentId} 
                      disabled={errorAgents || loadingAgents}
                    >
                        <SelectTrigger className="h-9 bg-white mt-1 border-slate-300 flex-1">
                            <SelectValue placeholder={
                                loadingAgents ? "Cargando agentes..." : 
                                errorAgents ? "Error al cargar lista" : 
                                "Seleccione un agente..."
                            } />
                        </SelectTrigger>
                        <SelectContent>
                            {agents?.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {errorAgents && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 mt-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => retryAgents()}
                            title="Reintentar"
                        >
                            <RotateCw className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Folio</Label>
                <Input
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  className="h-8 bg-white"
                  placeholder="MED-001"
                />
              </div>
              <div>
                <Label className="text-xs">Tipo Medida</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ingenieril">Ingenieril</SelectItem>
                    <SelectItem value="Administrativa">Administrativa</SelectItem>
                    <SelectItem value="EPP">EPP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Descripción</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="bg-white h-20"
                placeholder="Descripción..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label className="text-xs">Fecha Límite</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 bg-white"
                />
              </div>
              <div className="flex items-center gap-2 pb-2 pl-2">
                <Checkbox
                  id="imm"
                  checked={immediate}
                  onCheckedChange={(c) => setImmediate(c as boolean)}
                />
                <label htmlFor="imm" className="text-xs font-medium">Inmediata</label>
              </div>
            </div>

            <div>
              <Label className="text-xs">Observación</Label>
              <Input
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className="h-8 bg-white"
              />
            </div>

            <Button
              size="sm"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!desc || !date || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Guardando...' : 'Guardar Medida'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* LISTADO DE MEDIDAS */}
      <div className="space-y-2">
        {prescriptions?.map((p) => (
          <div
            key={p.id}
            className={`flex items-start justify-between p-3 rounded-lg border ${
              p.status === 'REALIZADA'
                ? 'bg-green-50/50 border-green-100'
                : 'bg-white hover:bg-slate-50'
            } transition-colors`}
          >
            <div className="space-y-1 flex-1 min-w-0 mr-4">
              
              <div className="flex items-center gap-2 flex-wrap mb-1">
                 {/* Mostrar el RiskAgent asociado */}
                 {p.riskAgent && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200 gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        {p.riskAgent.name}
                    </Badge>
                 )}
                 {/* Si no tiene agente, mostramos un badge más sutil o nada */}
                 {!p.riskAgent && (
                    <Badge variant="outline" className="text-slate-400 border-dashed text-[10px]">
                        General
                    </Badge>
                 )}

                {p.folio && (
                  <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                    {p.folio}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`shrink-0 ${
                    p.status === 'REALIZADA' ? 'bg-green-600' : 
                    p.status === 'EN_PROCESO' ? 'bg-primary' : 
                    p.status === 'VENCIDA' ? 'bg-red-600' : 
                    p.isImmediate ? 'bg-amber-600' : 'bg-slate-500'
                  }`}>
                  {p.status.replace('_', ' ')}
                </Badge>
                
                {p.measureType && (
                    <span className="text-xs text-muted-foreground font-medium">
                    | {p.measureType}
                    </span>
                )}
              </div>

              <p className="text-sm font-medium text-slate-800 mt-1 break-words leading-snug">
                {p.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1 font-medium text-slate-600 shrink-0">
                  <Calendar className="h-3 w-3" /> Límite: {new Date(p.implementationDate).toLocaleDateString()}
                </span>
                {p.observation && (
                  <span className="flex items-center gap-1 break-all">
                    <FileText className="h-3 w-3 shrink-0" /> {p.observation}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-end shrink-0">
              <Select
                defaultValue={p.status}
                onValueChange={(val) => statusMutation.mutate({ id: p.id, status: val })}
              >
                <SelectTrigger className={`h-8 w-[130px] text-xs border-slate-200 ${getStatusColor(p.status)}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                  <SelectItem value="REALIZADA">Realizada</SelectItem>
                  <SelectItem value="VENCIDA">Vencida</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-slate-300 hover:text-red-600"
                onClick={() => deleteMutation.mutate(p.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
        {(!prescriptions || prescriptions.length === 0) && !isAdding && (
          <p className="text-xs text-center text-muted-foreground italic py-2">
            No hay medidas registradas.
          </p>
        )}
      </div>
    </div>
  );
}