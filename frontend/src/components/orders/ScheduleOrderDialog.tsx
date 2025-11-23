import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/Dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { ordersService } from '@/services/orders.service';

const formSchema = z.object({
    scheduledAt: z.string().min(1, 'La fecha y hora son requeridas'),
    providerName: z.string().min(1, 'El proveedor es requerido'),
    externalId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleOrderDialogProps {
    order: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ScheduleOrderDialog({ order, open, onOpenChange }: ScheduleOrderDialogProps) {
    const queryClient = useQueryClient();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            scheduledAt: '',
            providerName: '',
            externalId: '',
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: (data: FormValues) => {
            return ordersService.updateStatus(order.id, 'AGENDADO', data.scheduledAt, data.providerName, data.externalId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            onOpenChange(false);
            form.reset();
        },
    });

    const onSubmit = (data: FormValues) => {
        updateStatusMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agendar Examen</DialogTitle>
                    <DialogDescription>
                        Ingresa los datos de la cita para cambiar el estado a AGENDADO.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="scheduledAt">Fecha y Hora</Label>
                        <Input
                            id="scheduledAt"
                            type="datetime-local"
                            {...form.register('scheduledAt')}
                        />
                        {form.formState.errors.scheduledAt && (
                            <p className="text-xs text-destructive">{form.formState.errors.scheduledAt.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="providerName">Proveedor</Label>
                        <Select
                            onValueChange={(value) => form.setValue('providerName', value)}
                            defaultValue={form.getValues('providerName')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona proveedor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACHS">ACHS</SelectItem>
                                <SelectItem value="Mutual de Seguridad">Mutual de Seguridad</SelectItem>
                                <SelectItem value="IST">IST</SelectItem>
                                <SelectItem value="ISL">ISL</SelectItem>
                                <SelectItem value="Clínica Privada">Clínica Privada</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.formState.errors.providerName && (
                            <p className="text-xs text-destructive">{form.formState.errors.providerName.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="externalId">Folio / ID Externo (Opcional)</Label>
                        <Input
                            id="externalId"
                            placeholder="Ej: 123456"
                            {...form.register('externalId')}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={updateStatusMutation.isPending}>
                            {updateStatusMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirmar Agendamiento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
