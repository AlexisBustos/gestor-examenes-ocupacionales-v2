import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Definimos qué forma tiene un Centro de Costos
interface CostCenter {
    id: string;
    code: string;
    name: string;
}

interface AssignCostCenterDialogProps {
    areaId: string;
    currentCostCenterId?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    availableCostCenters: CostCenter[]; // <--- NUEVA PROP: Recibimos la lista lista
}

export function AssignCostCenterDialog({
    areaId,
    currentCostCenterId,
    open,
    onOpenChange,
    availableCostCenters, // <--- La usamos aquí
}: AssignCostCenterDialogProps) {
    const queryClient = useQueryClient();
    const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>(currentCostCenterId || '');

    useEffect(() => {
        setSelectedCostCenterId(currentCostCenterId || '');
    }, [currentCostCenterId, open]);

    // YA NO NECESITAMOS EL USEQUERY AQUÍ (Borramos la carga duplicada)

    const assignMutation = useMutation({
        mutationFn: async (costCenterId: string) => {
            await axios.patch(`/areas/${areaId}`, { costCenterId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] }); // Recargamos las áreas para ver el cambio
            toast.success('Centro de Costos asignado correctamente');
            onOpenChange(false);
        },
        onError: () => {
            toast.error('Error al asignar Centro de Costos');
        },
    });

    const handleSave = () => {
        if (!selectedCostCenterId) return;
        assignMutation.mutate(selectedCostCenterId);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Asignar Centro de Costos</DialogTitle>
                    <DialogDescription>
                        Selecciona el centro de costos para esta área operativa.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Select
                        value={selectedCostCenterId}
                        onValueChange={setSelectedCostCenterId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccione un Centro de Costos" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableCostCenters?.map((cc) => (
                                <SelectItem key={cc.id} value={cc.id}>
                                    {cc.code} - {cc.name}
                                </SelectItem>
                            ))}
                            {availableCostCenters?.length === 0 && (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                    No hay centros disponibles
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={assignMutation.isPending || !selectedCostCenterId}>
                        {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}