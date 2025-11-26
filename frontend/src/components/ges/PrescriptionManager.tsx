import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Prescription } from '@/types/ges.types';

interface Props {
  parentId: string;
  parentType: 'qualitative' | 'quantitative';
  prescriptions: Prescription[];
}

export function PrescriptionManager({ parentId, parentType, prescriptions }: Props) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);

  // Form States
  const [folio, setFolio] = useState('');
  const [description, setDescription] = useState('');
  const [measureType, setMeasureType] = useState('INGENIERIA');
  const [isImmediate, setIsImmediate] = useState(false);
  const [implementationDate, setImplementationDate] = useState('');
  const [observation, setObservation] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        technicalReportId: parentType === 'qualitative' ? parentId : undefined,
        quantitativeReportId: parentType === 'quantitative' ? parentId : undefined,
        folio,
        description,
        measureType,
        isImmediate,
        implementationDate,
        observation
      };
      await axios.post('/reports/prescriptions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges'] });
      toast.success("Prescripción agregada");
      setIsAdding(false);
      resetForm();
    },
    onError: () => toast.error("Error al agregar prescripción")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/reports/prescriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges'] });
      toast.success("Prescripción eliminada");
    }
  });

  const resetForm = () => {
    setFolio('');
    setDescription('');
    setMeasureType('INGENIERIA');
    setIsImmediate(false);
    setImplementationDate('');
    setObservation('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-700">Prescripciones ({prescriptions.length})</h3>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-2" /> Agregar
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nueva Prescripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Folio (Opcional)</Label><Input value={folio} onChange={e => setFolio(e.target.value)} className="h-8 bg-white" /></div>
              <div><Label className="text-xs">Fecha Implementación</Label><Input type="date" value={implementationDate} onChange={e => setImplementationDate(e.target.value)} className="h-8 bg-white" /></div>
            </div>

            <div>
              <Label className="text-xs">Descripción</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} className="bg-white text-xs" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo Medida</Label>
                <Select value={measureType} onValueChange={setMeasureType}>
                  <SelectTrigger className="h-8 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INGENIERIA">Ingeniería</SelectItem>
                    <SelectItem value="ADMINISTRATIVA">Administrativa</SelectItem>
                    <SelectItem value="EPP">EPP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" id="immediate" checked={isImmediate} onChange={e => setIsImmediate(e.target.checked)} />
                <label htmlFor="immediate" className="text-xs font-medium">Medida Inmediata</label>
              </div>
            </div>

            <div><Label className="text-xs">Observación</Label><Input value={observation} onChange={e => setObservation(e.target.value)} className="h-8 bg-white" /></div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
              <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {prescriptions.map((p) => (
          <div key={p.id} className="border rounded-md p-3 bg-white text-sm shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex gap-2 items-center">
                <Badge variant={p.status === 'PENDIENTE' ? 'secondary' : 'default'} className="text-[10px]">
                  {p.status}
                </Badge>
                {p.folio && <span className="text-xs font-mono bg-slate-100 px-1 rounded text-slate-500">#{p.folio}</span>}
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => deleteMutation.mutate(p.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            <p className="font-medium text-slate-800 mb-1">{p.description}</p>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-2">
              <div className="flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {p.measureType}</div>
              <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {new Date(p.implementationDate).toLocaleDateString()}</div>
            </div>

            {p.observation && <p className="text-xs text-slate-400 mt-2 italic border-t pt-1">Obs: {p.observation}</p>}
          </div>
        ))}
        {prescriptions.length === 0 && !isAdding && (
          <p className="text-center text-xs text-slate-400 py-4 italic">No hay prescripciones registradas.</p>
        )}
      </div>
    </div>
  );
}