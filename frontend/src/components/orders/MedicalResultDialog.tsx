import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface MedicalResultDialogProps {
  battery: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MedicalResultDialog({ battery, open, onOpenChange }: MedicalResultDialogProps) {
  const queryClient = useQueryClient();
  
  // Manejo defensivo por si battery viene null o undefined al inicio
  const initialStatus = battery?.status || "PENDIENTE";
  const initialDate = battery?.expirationDate 
    ? new Date(battery.expirationDate).toISOString().split('T')[0] 
    : "";

  const [status, setStatus] = useState<string>(initialStatus);
  const [expirationDate, setExpirationDate] = useState<string>(initialDate);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!battery?.id) throw new Error("ID de batería no encontrado");
      
      // Llamamos al endpoint para guardar el resultado
      return await axios.patch(`/orders/battery/${battery.id}/result`, {
        status,
        expirationDate: status === 'APTO' ? expirationDate : null, // Solo mandamos fecha si es APTO
        resultDate: new Date(), // Fecha de hoy como fecha de resultado
      });
    },
    onSuccess: () => {
      toast.success("Resultado actualizado");
      queryClient.invalidateQueries({ queryKey: ['worker-details'] }); // Refresca el Timeline
      onOpenChange(false);
    },
    onError: () => toast.error("Error al guardar resultado"),
  });

  if (!battery) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Resultado: {battery.battery?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Dictamen</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="APTO">✅ Apto</SelectItem>
                <SelectItem value="NO_APTO">❌ No Apto</SelectItem>
                <SelectItem value="APTO_CON_OBSERVACIONES">⚠️ Apto con Obs.</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === 'APTO' && (
            <div className="grid grid-cols-4 items-center gap-4 animate-in fade-in">
              <Label className="text-right">Vence el</Label>
              <div className="col-span-3 relative">
                 <Input 
                    type="date" 
                    value={expirationDate} 
                    onChange={(e) => setExpirationDate(e.target.value)} 
                 />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Guardar Dictamen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}