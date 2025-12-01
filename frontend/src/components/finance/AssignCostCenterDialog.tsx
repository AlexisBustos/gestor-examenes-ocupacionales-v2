import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

interface AssignCostCenterDialogProps {
    areaId: string;
    companyId: string;
    currentCostCenterId?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssignCostCenterDialog({
    areaId,
    companyId,
    currentCostCenterId,
    open,
    onOpenChange,
}: AssignCostCenterDialogProps) {
    const queryClient = useQueryClient();
    const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>(currentCostCenterId || '');

    // Sincronizar estado cuando cambia la prop (o se abre el modal)
    useEffect(() => {
        setSelectedCostCenterId(currentCostCenterId || '');
    }, [currentCostCenterId, open]);

    // 1. Cargar Centros de Costos de la Empresa
    const { data: costCenters, isLoading } = useQuery({
        queryKey: ['cost-centers', companyId],
        queryFn: async () => {
            const { data } = await axios.get(`/cost-centers?companyId=${companyId}`);
            return data;
        },
        enabled: open && !!companyId,
    });

    // 2. Mutación para asignar
    const assignMutation = useMutation({
        mutationFn: async (costCenterId: string) => {
            await axios.patch(`/areas/${areaId}`, { costCenterId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company', companyId] }); // Recargar ficha empresa
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
                    {isLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <Select
                            value={selectedCostCenterId}
                            onValueChange={setSelectedCostCenterId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un Centro de Costos" />
                            </SelectTrigger>
                            <SelectContent>
                                {costCenters?.map((cc: any) => (
                                    <SelectItem key={cc.id} value={cc.id}>
                                        {cc.code} - {cc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
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
