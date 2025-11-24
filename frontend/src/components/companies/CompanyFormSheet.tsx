import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useUpdateCompany } from '@/hooks/useCompanies';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { Company } from '@/services/companies.service';

const companySchema = z.object({
    rut: z.string().min(1, 'RUT es requerido'),
    name: z.string().min(1, 'Nombre es requerido'),
    contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
    address: z.string().optional(),
    phone: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormSheetProps {
    isOpen: boolean;
    onClose: () => void;
    company: Company | null;
}

export function CompanyFormSheet({ isOpen, onClose, company }: CompanyFormSheetProps) {
    const updateCompanyMutation = useUpdateCompany();

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CompanyFormValues>({
        resolver: zodResolver(companySchema),
        defaultValues: {
            rut: '',
            name: '',
            contactEmail: '',
            address: '',
            phone: '',
        },
    });

    useEffect(() => {
        if (company) {
            reset({
                rut: company.rut,
                name: company.name,
                contactEmail: company.contactEmail || '',
                address: company.address || '',
                phone: company.phone || '',
            });
        }
    }, [company, reset]);

    const onSubmit = async (data: CompanyFormValues) => {
        if (!company) return;

        try {
            await updateCompanyMutation.mutateAsync({ id: company.id, data });
            toast.success('Empresa actualizada correctamente');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar la empresa');
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Editar Empresa</SheetTitle>
                    <SheetDescription>
                        Modifica los datos de la empresa.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="rut">RUT</Label>
                        <Input id="rut" {...register('rut')} disabled />
                        {errors.rut && <p className="text-sm text-red-500">{errors.rut.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactEmail">Email de Contacto</Label>
                        <Input id="contactEmail" {...register('contactEmail')} />
                        {errors.contactEmail && <p className="text-sm text-red-500">{errors.contactEmail.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" {...register('address')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" {...register('phone')} />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
