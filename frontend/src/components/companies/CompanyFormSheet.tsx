import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  rut: z.string().min(8, 'RUT inválido'),
  name: z.string().min(2, 'Nombre requerido'),
  contactEmail: z.string().email('Email inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CompanyFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
}

export function CompanyFormSheet({
  open,
  onOpenChange,
  companyId,
}: CompanyFormSheetProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rut: '',
      name: '',
      contactEmail: '',
      phone: '',
      address: '',
    },
  });

  const {
    data: company,
    isLoading: isLoadingData,
  } = useQuery<any>({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await axios.get(`/companies/${companyId}`);
      return data;
    },
    enabled: !!companyId && open,
  });

  useEffect(() => {
    if (company) {
      form.reset({
        rut: company.rut || '',
        name: company.name || '',
        contactEmail: company.contactEmail || '',
        phone: company.phone || '',
        address: company.address || '',
      });
    } else if (!companyId && open) {
      form.reset({
        rut: '',
        name: '',
        contactEmail: '',
        phone: '',
        address: '',
      });
    }
  }, [company, companyId, open, form]);

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (companyId) {
        await axios.patch(`/companies/${companyId}`, values);
      } else {
        await axios.post('/companies', values);
      }
    },
    onSuccess: () => {
      toast.success('Empresa guardada');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al guardar la empresa');
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>
            {companyId ? 'Editar Empresa' : 'Nueva Empresa'}
          </SheetTitle>
          <SheetDescription>
            Modifica los datos de contacto y facturación.
          </SheetDescription>
        </SheetHeader>

        {isLoadingData && companyId ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                updateMutation.mutate(values)
              )}
              className="space-y-4 pt-6"
            >
              <FormField
                control={form.control}
                name="rut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón Social</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Contacto</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
