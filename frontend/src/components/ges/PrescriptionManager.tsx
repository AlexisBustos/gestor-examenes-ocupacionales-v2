import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface Prescription {
  id: string;
  folio?: string;
  description: string;
  measureType?: string;
  isImmediate: boolean;
  implementationDate: string;
  observation?: string;
  status: 'PENDIENTE' | 'REALIZADA' | 'EN_PROCESO' | 'VENCIDA';
}

interface Props {
  parentId: string;
  parentType: 'qualitative' | 'quantitative' | 'tmert'; // 👈 AGREGADO tmert
  prescriptions: Prescription[];
}

export function PrescriptionManager({
  parentId,
  parentType,
  prescriptions,
}: Props) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Estado Formulario
  const [folio, setFolio] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('Ingenieril');
  const [immediate, setImmediate] = useState(false);
  const [date, setDate] = useState('');
  const [obs, setObs] = useState('');

  // MUTACIÓN: CREAR (Actualizada para TMERT)
  const createMutation = useMutation({
    mutationFn: async () => {
      let url = '';
      
      if (parentType === 'qualitative') {
          url = `/reports/technical/${parentId}/prescriptions`;
      } else if (parentType === 'quantitative') {
          url = `/reports/quantitative/${parentId}/prescriptions`;
      } else if (parentType === 'tmert') {
          // 👇 RUTA NUEVA PARA TMERT
          url = `/reports/tmert/${parentId}/prescriptions`;
      }

      await axios.post(url, {
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
      setFolio('');
      setDesc('');
      setDate('');
      setObs('');
      setImmediate(false);
    },
    onError: () => toast.error('Error al guardar'),
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
    onError: () => toast.error('Error al actualizar estado'),
  });

  const getStatusColor = (status: string) => {
    if (status === 'REALIZADA') return 'text-green-600 font-bold';
    if (status === 'EN_PROCESO') return 'text-blue-600 font-bold';
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
          {isAdding ? (
            'Cancelar'
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" /> Nueva Medida
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-50 border-slate-200 animate-in fade-in">
          <CardContent className="p-4 space-y-3">
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
                <Label className="text-xs">Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-8 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ingenieril">Ingenieril</SelectItem>
                    <SelectItem value="Administrativa">
                      Administrativa
                    </SelectItem>
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
                  onCheckedChange={(c) =>
                    setImmediate(c as boolean)
                  }
                />
                <label
                  htmlFor="imm"
                  className="text-xs font-medium"
                >
                  Inmediata
                </label>
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
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={!desc || !date || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending
                ? 'Guardando...'
                : 'Guardar Medida'}
            </Button>
          </CardContent>
        </Card>
      )}

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
            {/* PARTE IZQUIERDA (Texto) */}
            <div className="space-y-1 flex-1 min-w-0 mr-4">
              <div className="flex items-center gap-2 flex-wrap">
                {p.folio && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono shrink-0"
                  >
                    {p.folio}
                  </Badge>
                )}

                <Badge
                  className={`shrink-0 ${
                    p.status === 'REALIZADA'
                      ? 'bg-green-600 hover:bg-green-700'
                      : p.status === 'EN_PROCESO'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : p.status === 'VENCIDA'
                      ? 'bg-red-600 hover:bg-red-700'
                      : p.isImmediate
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-slate-500 hover:bg-slate-600'
                  }`}
                >
                  {p.status.replace('_', ' ')}
                </Badge>

                {p.measureType && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    | {p.measureType}
                  </span>
                )}
              </div>

              {/* Descripción */}
              <p className="text-sm font-medium text-slate-800 mt-1 break-words">
                {p.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1 font-medium text-slate-600 shrink-0">
                  <Calendar className="h-3 w-3" /> Límite:{' '}
                  {new Date(
                    p.implementationDate,
                  ).toLocaleDateString()}
                </span>
                {p.observation && (
                  <span className="flex items-center gap-1 break-all">
                    <FileText className="h-3 w-3 shrink-0" /> {p.observation}
                  </span>
                )}
              </div>
            </div>

            {/* PARTE DERECHA (Botones) */}
            <div className="flex flex-col gap-2 items-end shrink-0">
              <Select
                defaultValue={p.status}
                onValueChange={(val) =>
                  statusMutation.mutate({ id: p.id, status: val })
                }
              >
                <SelectTrigger
                  className={`h-8 w-[130px] text-xs border-slate-200 ${getStatusColor(
                    p.status,
                  )}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="EN_PROCESO">
                    En Proceso
                  </SelectItem>
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