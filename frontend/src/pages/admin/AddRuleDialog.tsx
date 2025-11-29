import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios'; // Importante: Usa la instancia configurada
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function AddRuleDialog({ open, onOpenChange }: Props) {
    const queryClient = useQueryClient();

    // Estados del Formulario
    const [agent, setAgent] = useState('');
    const [detail, setDetail] = useState('');
    const [batteryId, setBatteryId] = useState('');

    // Estado para creación rápida de batería
    const [isCreatingBattery, setIsCreatingBattery] = useState(false);
    const [newBatteryName, setNewBatteryName] = useState('');

    // 1. Cargar Baterías (GET /api/batteries)
    const { data: batteries = [] } = useQuery<any[]>({
        queryKey: ['batteries-list'],
        queryFn: async () => (await axios.get('/batteries')).data
    });

    // 2. Crear Regla (POST /api/config/rules)
    const createRuleMutation = useMutation({
        mutationFn: async () => {
            await axios.post('/config/rules', {
                riskAgentName: agent,
                specificDetail: detail,
                batteryId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules'] });
            toast.success("Regla creada exitosamente");
            onOpenChange(false);
        },
        onError: () => toast.error("Error al crear regla")
    });

    // 3. Crear Batería Rápida (POST /api/batteries)
    const createBatteryMutation = useMutation({
        mutationFn: async () => {
            const { data } = await axios.post('/batteries', { name: newBatteryName });
            return data;
        },
        onSuccess: (newBattery) => {
            queryClient.invalidateQueries({ queryKey: ['batteries-list'] });
            setBatteryId(newBattery.id); // Auto-seleccionar la nueva
            setIsCreatingBattery(false);
            setNewBatteryName('');
            toast.success("Batería creada y seleccionada");
        },
        onError: () => toast.error("Error al crear batería")
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader><DialogTitle>Nueva Regla de Asignación</DialogTitle></DialogHeader>
                <div className="space-y-5 py-4">

                    {/* Campos de Riesgo */}
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label>Agente de Riesgo (Obligatorio)</Label>
                            <Input placeholder="Ej: Ruido" value={agent} onChange={e => setAgent(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Detalle Específico (Opcional)</Label>
                            <Input placeholder="Ej: Prexor" value={detail} onChange={e => setDetail(e.target.value)} />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Selector de Batería con Opción de Crear */}
                    <div className="grid gap-2">
                        <Label>Batería a Sugerir</Label>

                        {!isCreatingBattery ? (
                            <div className="space-y-2">
                                <Select value={batteryId} onValueChange={setBatteryId}>
                                    <SelectTrigger><SelectValue placeholder="Seleccione una batería..." /></SelectTrigger>
                                    <SelectContent>
                                        {batteries.map((b: any) => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex justify-end">
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="text-xs h-auto p-0 text-blue-600"
                                        onClick={() => setIsCreatingBattery(true)}
                                    >
                                        ¿No encuentras la batería? Crear nueva
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-end gap-2 animate-in fade-in slide-in-from-top-1 p-3 bg-slate-50 rounded border">
                                <div className="flex-1 gap-2">
                                    <Label className="text-xs text-slate-500">Nombre nueva batería</Label>
                                    <Input
                                        value={newBatteryName}
                                        onChange={e => setNewBatteryName(e.target.value)}
                                        autoFocus
                                        className="bg-white"
                                    />
                                </div>
                                <Button size="sm" onClick={() => createBatteryMutation.mutate()} disabled={!newBatteryName}>Guardar</Button>
                                <Button size="sm" variant="ghost" onClick={() => setIsCreatingBattery(false)}>Cancelar</Button>
                            </div>
                        )}
                    </div>

                </div>
                <DialogFooter>
                    <Button
                        onClick={() => createRuleMutation.mutate()}
                        disabled={!agent || !batteryId || createRuleMutation.isPending}
                        className="w-full"
                    >
                        {createRuleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                        Guardar Regla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}