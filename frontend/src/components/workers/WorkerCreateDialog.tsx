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
  const [costCenter, setCostCenter] = useState('');
  const [companyId, setCompanyId] = useState('');

  // Cargar Empresas (Para asignar)
  const { data: companies } = useQuery<any[]>({ queryKey: ['companies'], queryFn: async () => (await axios.get('/companies')).data });

  const createMutation = useMutation({
    mutationFn: async () => {
      await axios.post('/workers', {
        rut, name, email, phone, position, costCenter, companyId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      toast.success("Trabajador creado");
      onOpenChange(false);
      // Reset
      setRut(''); setName(''); setEmail(''); setPhone(''); setPosition('');
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
            
            <div>
                <Label>Empresa *</Label>
                <Select onValueChange={setCompanyId}>
                    <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                    <SelectContent>
                        {companies?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div><Label>Cargo</Label><Input value={position} onChange={e => setPosition(e.target.value)} /></div>
                <div><Label>Centro Costo</Label><Input value={costCenter} onChange={e => setCostCenter(e.target.value)} /></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label>Teléfono</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            </div>
        </div>
        <DialogFooter>
            <Button onClick={() => createMutation.mutate()} disabled={!rut || !name || !companyId || createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin"/> : "Guardar"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}