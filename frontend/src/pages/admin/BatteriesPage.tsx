import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios'; // Usa la instancia configurada
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Stethoscope, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BatteriesPage() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Listar Baterías (GET /api/batteries)
  const { data: batteries, isLoading } = useQuery({
    queryKey: ['batteries'],
    queryFn: async () => (await axios.get('/batteries')).data,
  });

  // 2. Crear Batería (POST /api/batteries)
  const createMutation = useMutation({
    mutationFn: async () => await axios.post('/batteries', { name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteries'] });
      toast.success("Batería creada");
      setNewName('');
    },
    onError: () => toast.error("Error al crear batería")
  });

  // 3. Eliminar Batería (DELETE /api/batteries/:id)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/batteries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batteries'] });
      toast.success("Eliminada");
    },
    onError: () => toast.error("Error al eliminar")
  });

  const filtered = batteries?.filter((b: any) => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-lg text-rose-600"><Stethoscope className="h-8 w-8" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Maestro de Baterías</h1>
            <p className="text-muted-foreground">Catálogo de exámenes disponibles.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* CREADOR */}
        <Card className="h-fit sticky top-6">
          <CardHeader><CardTitle>Nueva Batería</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Nombre (Ej: Batería Covid)" value={newName} onChange={e => setNewName(e.target.value)} />
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!newName || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Crear</>}
            </Button>
          </CardContent>
        </Card>

        {/* LISTA */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered?.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(b.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}