import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as OrdersService from '@/services/orders.service';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '@/types/order.types';

interface Props {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScheduleOrderDialog({ order, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  // Estados del formulario
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [provider, setProvider] = useState('');
  const [externalId, setExternalId] = useState('');

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      // Combinar fecha y hora en un ISO string
      const scheduledAt = new Date(`${date}T${time}`).toISOString();

      await OrdersService.updateOrderStatus(
        order.id,
        'AGENDADO',
        scheduledAt,
        provider,
        externalId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success("Cita agendada correctamente");
      onOpenChange(false);
      // Reset form
      setDate('');
      setTime('');
      setProvider('');
      setExternalId('');
    },
    onError: () => {
      toast.error("Error al agendar la cita");
    }
  });

  const handleSubmit = () => {
    if (!date || !time || !provider) {
      toast.error("Fecha, hora y proveedor son obligatorios");
      return;
    }
    scheduleMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            Agendar Examen
          </DialogTitle>
          <DialogDescription>
            Asigna fecha y proveedor para <strong>{order.worker.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="provider">Proveedor / Mutualidad</Label>
            <Select onValueChange={setProvider} value={provider}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACHS">ACHS</SelectItem>
                <SelectItem value="MUTUAL">Mutual de Seguridad</SelectItem>
                <SelectItem value="IST">IST</SelectItem>
                <SelectItem value="ISL">ISL</SelectItem>
                <SelectItem value="CLINICA_PRIVADA">Clínica Privada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="folio">N° Folio / ID Externo (Opcional)</Label>
            <Input
              id="folio"
              placeholder="Ej: RES-12345"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
            />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={scheduleMutation.isPending}>
            {scheduleMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              "Confirmar Agendamiento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}