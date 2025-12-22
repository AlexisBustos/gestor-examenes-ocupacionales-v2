import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Eye, Pencil, Trash2 } from 'lucide-react';

import { CompanyFormSheet } from '@/components/companies/CompanyFormSheet';
import { CompanyDetailsSheet } from '@/components/companies/CompanyDetailsSheet';

export default function CompaniesPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null); 
  
  // 👇 NUEVOS ESTADOS PARA NAVEGACIÓN PROFUNDA
  const [autoOpenReportId, setAutoOpenReportId] = useState<string | null>(null);
  const [autoOpenGesId, setAutoOpenGesId] = useState<string | null>(null); // <--- NUEVO
  const [autoSubAction, setAutoSubAction] = useState<string | null>(null);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await axios.get('/companies');
      return data;
    },
  });

  // 👇 LÓGICA INTELIGENTE ACTUALIZADA
  useEffect(() => {
    if (location.state && location.state.companyId) {
        if (location.state.action === 'OPEN_GES_MODAL' || location.state.companyId) {
            setViewId(location.state.companyId);
            
            // Si viene el ID del reporte
            if (location.state.reportId) {
                setAutoOpenReportId(location.state.reportId);
            }
            // 👇 Si el backend encontró el GES ID, lo capturamos
            if (location.state.gesId) {
                console.log("🎯 Objetivo GES detectado:", location.state.gesId);
                setAutoOpenGesId(location.state.gesId);
            }
            // 👇 CAPTURAMOS LA SUB-ACCIÓN (Ej: OPEN_MEASURES)
            if (location.state.subAction) {
                console.log("🎯 Acción secundaria detectada:", location.state.subAction);
                setAutoSubAction(location.state.subAction);
            }
            
            window.history.replaceState({}, document.title);
        }
    }
  }, [location]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await axios.delete(`/companies/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa eliminada');
      setDeleteId(null);
    },
    onError: () => { toast.error('Error al eliminar'); setDeleteId(null); },
  });

  if (isLoading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">Gestiona tus clientes.</p>
        </div>
        <Button onClick={() => setEditId('new')}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Empresa
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Listado de Clientes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RUT</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies?.map((company: any) => (
                <TableRow key={company.id}>
                  <TableCell className="font-mono">{company.rut}</TableCell>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.contactEmail}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setViewId(company.id)} title="Ver Detalles">
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditId(company.id)} title="Editar">
                      <Pencil className="h-4 w-4 text-amber-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(company.id)} title="Eliminar">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {viewId && (
        <CompanyDetailsSheet 
            companyId={viewId} 
            initialReportId={autoOpenReportId}
            initialGesId={autoOpenGesId} // 👈 PASAMOS EL GES ID AL HIJO
            initialSubAction={autoSubAction} // 👈 PASAMOS LA ORDEN
            open={!!viewId} 
            onOpenChange={(open: boolean) => {
                if (!open) {
                    setViewId(null);
                    setAutoOpenReportId(null); 
                    setAutoOpenGesId(null);
                }
            }} 
        />
      )}

      {editId && (
        <CompanyFormSheet
          companyId={editId === 'new' ? null : editId}
          open={!!editId}
          onOpenChange={(open: boolean) => !open && setEditId(null)}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Empresa?</AlertDialogTitle>
            <AlertDialogDescription>Se borrarán todos los datos asociados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}