import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/Table';
import { Trash2, Plus, Building, Loader2, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CostCentersPage() {
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const { data: costCenters, isLoading } = useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => (await axios.get('/cost-centers')).data,
  });

  const createMutation = useMutation({
    mutationFn: async () => await axios.post('/cost-centers', { code: newCode, name: newName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success('Creado'); setNewCode(''); setNewName('');
    },
    onError: () => toast.error('Error al crear. Revise si el código ya existe.')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await axios.delete(`/cost-centers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success('Eliminado'); setDeleteId(null);
    },
    onError: () => { toast.error('Error al eliminar'); setDeleteId(null); }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('/cost-centers/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Carga masiva exitosa');
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
    } catch (error) { toast.error('Error al importar archivo'); }
    finally { setIsImporting(false); e.target.value = ''; }
  };

  const filteredCenters = costCenters?.filter((cc: any) =>
    cc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cc.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Building className="h-8 w-8" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Centros de Costos</h1>
            <p className="text-muted-foreground">Gestión financiera.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input type="file" id="import-cc" className="hidden" accept=".xlsx, .csv" onChange={handleFileUpload} disabled={isImporting} />
            <label htmlFor="import-cc">
              <Button variant="outline" className="cursor-pointer" asChild disabled={isImporting}>
                <span>{isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Importar Excel</span>
              </Button>
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 h-fit sticky top-6">
          <CardHeader><CardTitle className="text-lg">Nuevo Centro</CardTitle><CardDescription>Ingresa los datos del nuevo CC.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Código</label><Input placeholder="Ej: CC-001" value={newCode} onChange={e => setNewCode(e.target.value)} /></div>
            <div className="space-y-2"><label className="text-sm font-medium text-slate-700">Nombre</label><Input placeholder="Ej: Operaciones" value={newName} onChange={e => setNewName(e.target.value)} /></div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => createMutation.mutate()} disabled={!newCode || !newName || createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Agregar Centro
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Listado Actual</CardTitle>
            <div className="relative w-64"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nombre</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredCenters?.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Sin resultados.</TableCell></TableRow> :
                    filteredCenters?.map((cc: any) => (
                      <TableRow key={cc.id}>
                        <TableCell className="font-mono font-bold text-slate-700">{cc.code}</TableCell>
                        <TableCell className="font-medium">{cc.name}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(cc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar Centro?</AlertDialogTitle><AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}