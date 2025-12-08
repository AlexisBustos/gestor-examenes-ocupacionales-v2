import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function WorkerCreateDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  
  // Estados
  const [rut, setRut] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  // CAMBIO: Ahora usamos ID para conectarlo a la tabla real
  const [costCenterId, setCostCenterId] = useState(''); 
  const [companyId, setCompanyId] = useState(''); // Opcional si ya la deduces en backend, pero la dejamos por si acaso

  // CAMBIO: Cargamos Centros de Costos Reales
  const { data: costCenters } = useQuery<any[]>({ 
      queryKey: ['cost-centers'], 
      queryFn: async () => (await axios.get('/cost-centers')).data 
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/workers', {
        rut, name, email, phone, position, 
        costCenterId, // Enviamos el ID
        // companyId, // Si el backend lo pide explícitamente, lo enviamos. Si lo deduce del usuario, no hace falta.
        evaluationType: 'NOMINA'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success("Trabajador creado");
      onOpenChange(false);
      // Reset
      setRut(''); setName(''); setEmail(''); setPhone(''); setPosition(''); setCostCenterId('');
    },
    onError: (err: any) => {
        const msg = err.response?.data?.error || "Error al crear";
        toast.error(msg);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Nuevo Trabajador</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div><Label>RUT *</Label><Input placeholder="12.345.678-9" value={rut} onChange={e => setRut(e.target.value)} /></div>
                <div><Label>Nombre Completo *</Label><Input placeholder="Juan Pérez" value={name} onChange={e => setName(e.target.value)} /></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Cargo</Label><Input value={position} onChange={e => setPosition(e.target.value)} /></div>
                
                {/* SELECTOR DE CENTRO DE COSTOS REAL */}
                <div>
                    <Label>Centro de Costos</Label>
                    <Select onValueChange={setCostCenterId} value={costCenterId}>
                        <SelectTrigger><SelectValue placeholder="Seleccione CC..." /></SelectTrigger>
                        <SelectContent>
                            {costCenters?.map(cc => (
                                <SelectItem key={cc.id} value={cc.id}>
                                    {cc.code} - {cc.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Teléfono</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            </div>
        </div>
        <DialogFooter>
            <Button onClick={() => createMutation.mutate()} disabled={!rut || !name || createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin"/> : "Guardar"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}