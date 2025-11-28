import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Props {
  worker: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkerFormSheet({ worker, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (worker) reset(worker);
  }, [worker, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // LIMPIEZA DE DATOS: Solo enviamos lo editable
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position,
        costCenter: data.costCenter
      };
      await axios.patch(`/workers/${worker.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      // También invalidamos la ficha individual por si está abierta
      queryClient.invalidateQueries({ queryKey: ['worker', worker.id] });
      toast.success("Trabajador actualizado");
      onOpenChange(false);
    },
    onError: (err) => {
        console.error(err);
        toast.error("Error al actualizar");
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader><SheetTitle>Editar Trabajador</SheetTitle><SheetDescription>Modificar datos personales.</SheetDescription></SheetHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div><Label>RUT</Label><Input {...register('rut')} disabled className="bg-slate-100" /></div>
                <div><Label>Nombre</Label><Input {...register('name')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input {...register('email')} placeholder="correo@empresa.com" /></div>
                <div><Label>Teléfono</Label><Input {...register('phone')} placeholder="+569..." /></div>
            </div>
            <div><Label>Cargo</Label><Input {...register('position')} /></div>
            <div><Label>Centro de Costo</Label><Input {...register('costCenter')} /></div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}