import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderBatteryResult } from '@/services/orders.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, FileText, CheckCircle2, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { Order, OrderBattery, MedicalStatus } from '@/types/order.types';

interface ResultsDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResultsDialog({ order, open, onOpenChange }: ResultsDialogProps) {
  const queryClient = useQueryClient();

  // 🧠 Estado local para reflejar cambios inmediatamente en la UI
  const [localOrder, setLocalOrder] = useState<Order>(order);

  // Si cambia la orden (por ejemplo, abriste otra), sincronizamos
  useEffect(() => {
    setLocalOrder(order);
  }, [order.id]);

  const [editingBatteryId, setEditingBatteryId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<{
    status: MedicalStatus;
    resultDate: string;
    expirationDate: string;
    clinicalNotes: string;
  }>({
    status: 'PENDIENTE',
    resultDate: '',
    expirationDate: '',
    clinicalNotes: '',
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingBatteryId) return;

      const payload = {
        status: formValues.status,
        resultDate: formValues.resultDate || null,
        // Regla: solo si está APTO se guarda fecha de caducidad,
        // en cualquier otro estado la dejamos explícitamente en null
        expirationDate:
          formValues.status === 'APTO'
            ? (formValues.expirationDate || null)
            : null,
        clinicalNotes: formValues.clinicalNotes || null,
      };

      await updateOrderBatteryResult(editingBatteryId, payload);
    },
    onSuccess: () => {
      // ✅ Actualizamos cache global
      queryClient.invalidateQueries({ queryKey: ['orders'] });

      // ✅ Actualizamos también el estado local para que la tabla se refresque al tiro
      if (editingBatteryId) {
        setLocalOrder((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            orderBatteries: prev.orderBatteries?.map((b) =>
              b.id === editingBatteryId
                ? {
                    ...b,
                    status: formValues.status,
                    resultDate: formValues.resultDate || null,
                    expirationDate:
                      formValues.status === 'APTO'
                        ? (formValues.expirationDate || null)
                        : null,
                    clinicalNotes: formValues.clinicalNotes || null,
                  }
                : b
            ),
          };
        });
      }

      toast.success('Resultado actualizado correctamente');
      setEditingBatteryId(null);
    },
    onError: () => {
      toast.error('Error al actualizar el resultado');
    },
  });

  const handleEditClick = (battery: OrderBattery) => {
    setEditingBatteryId(battery.id);
    setFormValues({
      status: battery.status,
      resultDate: battery.resultDate ? new Date(battery.resultDate).toISOString().split('T')[0] : '',
      expirationDate: battery.expirationDate ? new Date(battery.expirationDate).toISOString().split('T')[0] : '',
      clinicalNotes: battery.clinicalNotes || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingBatteryId(null);
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: MedicalStatus) => {
    switch (status) {
      case 'APTO':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Apto
          </Badge>
        );
      case 'NO_APTO':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> No Apto
          </Badge>
        );
      case 'APTO_CON_OBSERVACIONES':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Obs
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-500">
            <AlertCircle className="w-3 h-3 mr-1" /> Pendiente
          </Badge>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && editingBatteryId) return;
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gestión de Resultados Clínicos
          </DialogTitle>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-semibold">Trabajador:</span> {order.worker.name} ({order.worker.rut})
            </p>
            <p>
              <span className="font-semibold">Empresa:</span> {order.company.name}
            </p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1">
          {editingBatteryId ? (
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-5">
              <h4 className="text-sm font-bold text-slate-700 border-b pb-2 mb-4">
                Editando:{' '}
                {localOrder.orderBatteries?.find((b) => b.id === editingBatteryId)?.battery.name}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Dictamen Médico</Label>
                  <Select
                    value={formValues.status}
                    onValueChange={(val) =>
                      setFormValues({
                        ...formValues,
                        status: val as MedicalStatus,
                      })
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Seleccione estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="APTO">Apto</SelectItem>
                      <SelectItem value="NO_APTO">No Apto</SelectItem>
                      <SelectItem value="APTO_CON_OBSERVACIONES">
                        Apto con Observaciones
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha Resultado</Label>
                  <Input
                    type="date"
                    className="bg-white"
                    value={formValues.resultDate}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        resultDate: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha Vencimiento</Label>
                  <Input
                    type="date"
                    className="bg-white"
                    value={formValues.expirationDate}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        expirationDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Comentarios Clínicos</Label>
                <Textarea
                  className="bg-white min-h-[100px]"
                  placeholder="Observaciones médicas relevantes..."
                  value={formValues.clinicalNotes}
                  onChange={(e) =>
                    setFormValues({
                      ...formValues,
                      clinicalNotes: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar Resultado
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Batería</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localOrder.orderBatteries?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-slate-700">
                        {item.battery.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.battery.evaluationType
                          ? item.battery.evaluationType.replace('_', ' ')
                          : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDate(item.resultDate)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatDate(item.expirationDate)}
                      </TableCell>
                      <TableCell>
                        {item.clinicalNotes ? (
                          <div
                            className="max-w-[150px] truncate text-xs text-slate-500 cursor-help border-b border-dotted border-slate-300"
                            title={item.clinicalNotes}
                          >
                            {item.clinicalNotes}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">
                            Sin notas
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {item.resultUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(item.resultUrl!, '_blank')}
                              title="Ver Archivo"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-primary"
                            onClick={() => handleEditClick(item)}
                            title="Editar Resultado"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {(!localOrder.orderBatteries || localOrder.orderBatteries.length === 0) && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No hay baterías asociadas a esta orden.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-start border-t pt-4 mt-2">
          {!editingBatteryId && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
