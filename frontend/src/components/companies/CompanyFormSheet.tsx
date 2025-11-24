import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Esquema de validación
const formSchema = z.object({
  rut: z.string().min(8, 'RUT inválido'),
  name: z.string().min(2, 'Nombre requerido'),
  contactEmail: z.string().email('Email inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  companyId?: string | null; // Si viene ID es editar, si no es crear
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyFormSheet({ companyId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { rut: '', name: '', contactEmail: '', phone: '', address: '' },
  });

  // 1. Cargar datos si estamos editando
  const { data: company, isLoading: isLoadingData } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await axios.get(`/companies/${companyId}`);
      return data;
    },
    enabled: !!companyId && open,
  });

  // 2. Rellenar el formulario cuando llegan los datos
  useEffect(() => {
    if (company) {
      form.reset({
        rut: company.rut,
        name: company.name,
        contactEmail: company.contactEmail,
        phone: company.phone || '',
        address: company.address || '',
      });
    } else {
        form.reset({ rut: '', name: '', contactEmail: '', phone: '', address: '' });
    }
  }, [company, form, open]);

  // 3. Guardar cambios (Patch)
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (companyId) {
        // Modo Edición
        await axios.patch(`/companies/${companyId}`, values);
      } else {
        // Modo Creación (Futuro)
        await axios.post('/companies', values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast.success(companyId ? 'Empresa actualizada' : 'Empresa creada');
      onOpenChange(false);
    },
    onError: () => toast.error('Error al guardar'),
  });

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>{companyId ? 'Editar Empresa' : 'Nueva Empresa'}</SheetTitle>
          <SheetDescription>Modifica los datos de contacto y facturación.</SheetDescription>
        </SheetHeader>

        {isLoadingData ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="rut" render={({ field }) => (
                <FormItem><FormLabel>RUT</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Razón Social</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="contactEmail" render={({ field }) => (
                <FormItem><FormLabel>Email Contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}