import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/Sheet';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { useGes } from '@/hooks/useGes';
import { useCompanies } from '@/hooks/useCompanies';
import { ordersService } from '@/services/orders.service';

const formSchema = z.object({
    rut: z.string().min(1, 'El RUT es requerido'),
    name: z.string().min(1, 'El nombre es requerido'),
    phone: z.string().optional(),
    position: z.string().optional(),
    gesId: z.string().min(1, 'El GES es requerido'),
    companyId: z.string().min(1, 'La empresa es requerida'),
    evaluationType: z.enum(['PRE_OCUPACIONAL', 'OCUPACIONAL', 'EXAMEN_SALIDA']),
});

type FormValues = z.infer<typeof formSchema>;

export function NewOrderSheet() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const { data: gesList } = useGes();
    const { data: companies } = useCompanies();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            rut: '',
            name: '',
            phone: '',
            position: '',
            evaluationType: 'PRE_OCUPACIONAL',
        },
    });

    const createOrderMutation = useMutation({
        mutationFn: (data: FormValues) => {
            const selectedGes = gesList?.find((g) => g.id === data.gesId);
            const suggestedBatteryId = selectedGes?.riskExposures?.[0]?.examBatteries?.[0]?.id;

            const payload = {
                worker: {
                    rut: data.rut,
                    name: data.name,
                    phone: data.phone,
                    position: data.position,
                },
                gesId: data.gesId,
                companyId: data.companyId,
                evaluationType: data.evaluationType,
                examBatteryId: suggestedBatteryId,
            };
            return ordersService.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            setOpen(false);
            form.reset();
        },
    });

    const onSubmit = (data: FormValues) => {
        createOrderMutation.mutate(data);
    };

    const selectedGesId = form.watch('gesId');
    const selectedGes = gesList?.find((g) => g.id === selectedGesId);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Solicitud
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-[540px]">
                <SheetHeader>
                    <SheetTitle>Nueva Solicitud de Examen</SheetTitle>
                    <SheetDescription>
                        Ingresa los datos del trabajador y selecciona el GES para generar la orden.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
                    {/* Worker Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Datos del Trabajador</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="rut">RUT</Label>
                                <Input id="rut" placeholder="12.345.678-9" {...form.register('rut')} />
                                {form.formState.errors.rut && (
                                    <p className="text-xs text-destructive">{form.formState.errors.rut.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" placeholder="+569..." {...form.register('phone')} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input id="name" placeholder="Juan Pérez" {...form.register('name')} />
                            {form.formState.errors.name && (
                                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="position">Cargo</Label>
                            <Input id="position" placeholder="Operador Maquinaria" {...form.register('position')} />
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Operational Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Datos del Examen</h3>

                        <div className="space-y-2">
                            <Label>Empresa</Label>
                            <Select
                                onValueChange={(value) => form.setValue('companyId', value)}
                                defaultValue={form.getValues('companyId')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una empresa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies?.map((company) => (
                                        <SelectItem key={company.id} value={company.id}>
                                            {company.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.companyId && (
                                <p className="text-xs text-destructive">{form.formState.errors.companyId.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo de Evaluación</Label>
                            <Select
                                onValueChange={(value: any) => form.setValue('evaluationType', value)}
                                defaultValue="PRE_OCUPACIONAL"
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRE_OCUPACIONAL">Pre-Ocupacional</SelectItem>
                                    <SelectItem value="OCUPACIONAL">Ocupacional</SelectItem>
                                    <SelectItem value="EXAMEN_SALIDA">Examen de Salida</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>GES (Grupo de Exposición Similar)</Label>
                            <Select
                                onValueChange={(value) => form.setValue('gesId', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona GES" />
                                </SelectTrigger>
                                <SelectContent>
                                    {gesList?.map((ges) => (
                                        <SelectItem key={ges.id} value={ges.id}>
                                            {ges.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.gesId && (
                                <p className="text-xs text-destructive">{form.formState.errors.gesId.message}</p>
                            )}
                        </div>

                        {/* Summary Card */}
                        {selectedGes && (
                            <Card className="bg-muted/50 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">Resumen GES</p>
                                        <p className="text-xs text-muted-foreground">
                                            Batería Sugerida:{' '}
                                            <span className="font-medium text-foreground">
                                                {selectedGes.riskExposures?.[0]?.examBatteries?.[0]?.name || 'Estándar'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={createOrderMutation.isPending}>
                            {createOrderMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Confirmar Solicitud
                        </Button>
                    </div>
                    {createOrderMutation.isError && (
                        <p className="text-sm text-destructive text-center">
                            Error al crear la solicitud. Verifique los datos.
                        </p>
                    )}
                </form>
            </SheetContent>
        </Sheet>
    );
}
