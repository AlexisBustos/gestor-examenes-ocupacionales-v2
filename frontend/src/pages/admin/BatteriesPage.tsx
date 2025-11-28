import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Stethoscope, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BatteriesPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Usa la ruta que creamos en config/batteries
  const { data: batteries, isLoading } = useQuery({
    queryKey: ['batteries'],
    queryFn: async () => (await axios.get('/config/batteries')).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => await axios.post('/batteries', { name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteries'] });
      toast.success("Batería creada");
      setNewName('');
    },
    onError: () => toast.error("Error al crear")
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/batteries/${id}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['batteries'] });
        toast.success("Eliminada");
    },
    onError: () => toast.error("Error (Puede estar en uso)")
  });

  const filtered = batteries?.filter((b: any) => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-100 rounded-lg text-rose-600"><Stethoscope className="h-8 w-8" /></div>
            <div><h1 className="text-3xl font-bold tracking-tight text-slate-900">Baterías</h1><p className="text-muted-foreground">Catálogo de exámenes.</p></div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
         <Card className="h-fit sticky top-6">
            <CardHeader><CardTitle>Nueva</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
                <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!newName}><Plus className="mr-2 h-4 w-4"/> Crear</Button>
            </CardContent>
         </Card>
         <Card className="md:col-span-2">
            <CardHeader><div className="w-64"><Input className="pl-8" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
                    <TableBody>{filtered?.map((b: any) => (<TableRow key={b.id}><TableCell>{b.name}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(b.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button></TableCell></TableRow>))}</TableBody>
                </Table>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}