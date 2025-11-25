import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { useOrders } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Activity, Clock, Calendar, CheckCircle2, FileText, 
  Users, AlertTriangle, ArrowRight, Building2, FileSpreadsheet, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton'; // <--- IMPORTANTE

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // 1. CARGAR TODOS LOS DATOS
  const { data: orders, isLoading: loadingOrders } = useOrders();
  
  const { data: gesList, isLoading: loadingGes } = useQuery({
    queryKey: ['all-ges'],
    queryFn: async () => (await axios.get('/ges')).data,
  });

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['all-companies'],
    queryFn: async () => (await axios.get('/companies')).data,
  });

  const isLoading = loadingOrders || loadingGes || loadingCompanies;

  // --- ESTADO DE CARGA (SKELETONS) ---
  if (isLoading) {
    return (
      <div className="space-y-8 p-2 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* KPIs Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 border rounded-xl space-y-3 bg-slate-50/50">
               <div className="flex justify-between">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-5 w-5 rounded-full" />
               </div>
               <Skeleton className="h-8 w-16" />
               <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        <Separator />

        {/* Estructura Central Skeletons */}
        <div className="grid gap-6 md:grid-cols-2">
           <Skeleton className="h-48 w-full rounded-xl" />
           <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        
        {/* Tabla Skeleton */}
        <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // --- LÓGICA DE DATOS ---

  // A. Órdenes
  const statsOrders = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'SOLICITADO').length || 0,
    scheduled: orders?.filter((o: any) => o.status === 'AGENDADO').length || 0,
    completed: orders?.filter((o: any) => o.status === 'REALIZADO' || o.status === 'CERRADO').length || 0,
  };

  // B. Infraestructura
  const statsInfra = {
    companies: companies?.length || 0,
    totalGes: gesList?.length || 0,
    totalRisks: gesList?.reduce((acc: number, ges: any) => acc + (ges.riskExposures?.length || 0), 0) || 0
  };

  // C. Cumplimiento Legal
  const statsLegal = { vigentes: 0, vencidos: 0 };
  gesList?.forEach((ges: any) => {
    if (ges.technicalReport && ges.nextEvaluationDate) {
      if (new Date(ges.nextEvaluationDate) > new Date()) statsLegal.vigentes++;
      else statsLegal.vencidos++;
    } else {
      statsLegal.vencidos++; 
    }
  });

  const complianceRate = statsInfra.totalGes > 0 
    ? Math.round((statsLegal.vigentes / statsInfra.totalGes) * 100) 
    : 0;

  // D. Actividad Reciente
  const recentOrders = orders?.slice(0, 5) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SOLICITADO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'AGENDADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REALIZADO': return 'bg-green-100 text-green-800 border-green-200';
      case 'ANULADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Control</h2>
          <p className="text-muted-foreground">Bienvenido al <strong>Gestor de Exámenes Ocupacionales (GES)</strong>.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/dashboard/orders')} className="bg-slate-900">
            <FileText className="mr-2 h-4 w-4" /> Gestionar Órdenes
          </Button>
        </div>
      </div>

      {/* 1. KPIs DE ÓRDENES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Solicitudes</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsOrders.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{statsOrders.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-700">{statsOrders.scheduled}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Realizadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{statsOrders.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. SECCIÓN DE DATOS ESTRUCTURALES */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Building2 className="h-5 w-5 text-slate-500" /> Estado de la Planta
            </CardTitle>
            <CardDescription>Dimensionamiento actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-50 rounded-lg border">
                <div className="text-2xl font-bold text-slate-800">{statsInfra.companies}</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mt-1">Empresas</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{statsInfra.totalGes}</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mt-1">GES Totales</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">{statsInfra.totalRisks}</div>
                <div className="text-xs text-muted-foreground uppercase font-semibold mt-1">Riesgos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" /> Cumplimiento Documental
            </CardTitle>
            <CardDescription>Informes Técnicos Vigentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
               <div>
                 <p className="text-sm font-medium text-slate-600">Índice Global</p>
                 <p className="text-4xl font-extrabold text-slate-900">{complianceRate}%</p>
               </div>
               <div className="h-14 w-14 rounded-full border-4 border-white shadow-sm flex items-center justify-center bg-slate-100">
                  <span className="text-2xl">{complianceRate === 100 ? '🌟' : (complianceRate < 50 ? '⚠️' : '👍')}</span>
               </div>
            </div>
            <div className="flex gap-2 text-xs">
               <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">{statsLegal.vigentes} Vigentes</span>
               <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">{statsLegal.vencidos} Pendientes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 3. ACTIVIDAD Y ACCESOS */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trabajador</TableHead>
                  <TableHead>GES</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.worker.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{order.ges.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Sin movimientos recientes.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/orders')} className="text-blue-600 hover:bg-blue-50">
                    Ver historial completo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm bg-slate-50 border-slate-100">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
             <Button variant="outline" className="h-auto py-4 justify-start bg-white hover:bg-blue-50 border-blue-200 shadow-sm" onClick={() => navigate('/dashboard/orders')}>
                <div className="bg-blue-100 p-2 rounded-full mr-3"><FileText className="h-5 w-5 text-blue-600" /></div>
                <div className="text-left">
                    <div className="font-semibold text-slate-800">Nueva Solicitud</div>
                    <div className="text-xs text-muted-foreground">Crear orden para trabajador</div>
                </div>
             </Button>

             <Button variant="outline" className="h-auto py-4 justify-start bg-white hover:bg-green-50 border-green-200 shadow-sm" onClick={() => navigate('/dashboard/import')}>
                <div className="bg-green-100 p-2 rounded-full mr-3"><Upload className="h-5 w-5 text-green-600" /></div>
                <div className="text-left">
                    <div className="font-semibold text-slate-800">Carga Masiva</div>
                    <div className="text-xs text-muted-foreground">Importar Excel de dotación</div>
                </div>
             </Button>
             
             <div className="rounded-md bg-amber-50 p-4 border border-amber-100 flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                    <h4 className="text-sm font-semibold text-amber-800">Recordatorio</h4>
                    <p className="text-xs text-amber-700 mt-1">
                        Mantén actualizados los informes de higiene para evitar multas.
                    </p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}