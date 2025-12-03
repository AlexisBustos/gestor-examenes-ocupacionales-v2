import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { useForm } from 'react-hook-form';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, UploadCloud } from 'lucide-react';

interface GesUploadSheetProps {
  gesId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadForm {
  type: 'CUALITATIVO' | 'CUANTITATIVO';
  reportName: string;
  reportDate: string;
  file: FileList;
  applyToArea: boolean;
}

export function GesUploadSheet({
  gesId,
  open,
  onOpenChange,
}: GesUploadSheetProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, setValue, watch, reset } = useForm<UploadForm>({
    defaultValues: {
      type: 'CUALITATIVO',
      applyToArea: false,
    },
  });

  const reportType = watch('type');

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadForm) => {
      if (!gesId) throw new Error('No GES ID');

      const formData = new FormData();
      formData.append('file', data.file[0]);
      formData.append('reportName', data.reportName);
      formData.append('reportDate', data.reportDate);
      formData.append('type', data.type);
      formData.append('applyToArea', String(data.applyToArea));

      await axios.post(`/ges/${gesId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ges-documents', gesId] });
      toast.success('Documento subido correctamente');
      reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Error al subir el documento');
    },
  });

  const onSubmit = (data: UploadForm) => {
    if (!data.file || data.file.length === 0) {
      toast.error('Debes seleccionar un archivo PDF');
      return;
    }
    uploadMutation.mutate(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Cargar Informe</SheetTitle>
          <SheetDescription>
            Sube evaluaciones cualitativas o cuantitativas para este GES.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          
          {/* Tipo de Informe */}
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select
              onValueChange={(val) =>
                setValue('type', val as 'CUALITATIVO' | 'CUANTITATIVO')
              }
              defaultValue="CUALITATIVO"
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CUALITATIVO">
                  Evaluación Cualitativa (Matriz)
                </SelectItem>
                <SelectItem value="CUANTITATIVO">
                  Informe Cuantitativo (Medición)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nombre / Folio */}
          <div className="space-y-2">
            <Label>Nombre o Folio del Informe</Label>
            <Input
              {...register('reportName', { required: true })}
              placeholder="Ej: Informe Ruido 2024-01"
            />
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label>Fecha del Informe</Label>
            <Input
              type="date"
              {...register('reportDate', { required: true })}
            />
          </div>

          {/* Archivo */}
          <div className="space-y-2">
            <Label>Archivo PDF</Label>
            <Input
              type="file"
              accept="application/pdf"
              {...register('file', { required: true })}
            />
          </div>

          {/* Checkbox Área (Solo para Cualitativos) */}
          {reportType === 'CUALITATIVO' && (
            <div className="flex items-center space-x-2 border p-3 rounded-md bg-slate-50">
              <Checkbox
                id="applyArea"
                onCheckedChange={(checked) =>
                  setValue('applyToArea', checked === true)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="applyArea"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aplicar a toda el Área
                </label>
                <p className="text-xs text-muted-foreground">
                  Si se marca, este informe se vinculará a todos los GES de la
                  misma área.
                </p>
              </div>
            </div>
          )}

          {/* Footer Acciones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <UploadCloud className="mr-2 h-4 w-4" />
              Subir Documento
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}