import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { useOrders } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Activity, Clock, Calendar, CheckCircle2, FileText, 
  Building2, FileSpreadsheet, Upload, HeartPulse, AlertTriangle, ArrowRight // <--- AQUÍ ESTABA EL ERROR
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  // 1. CARGA DE DATOS
  const { data: orders, isLoading: loadingOrders } = useOrders();
  const { data: gesList, isLoading: loadingGes } = useQuery({ queryKey: ['all-ges'], queryFn: async () => (await axios.get('/ges')).data });
  const { data: companies, isLoading: loadingCompanies } = useQuery({ queryKey: ['all-companies'], queryFn: async () => (await axios.get('/companies')).data });
  
  const { data: surveillance, isLoading: loadingSurv } = useQuery({
    queryKey: ['surveillance'],
    queryFn: async () => (await axios.get('/analytics/surveillance')).data,
  });

  const isLoading = loadingOrders || loadingGes || loadingCompanies || loadingSurv;

  // --- CÁLCULOS ---
  const statsOrders = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'SOLICITADO').length || 0,
    scheduled: orders?.filter((o: any) => o.status === 'AGENDADO').length || 0,
    completed: orders?.filter((o: any) => o.status === 'REALIZADO' || o.status === 'CERRADO').length || 0,
  };

  const statsHealth = {
    total: surveillance?.length || 0,
    vigentes: surveillance?.filter((s: any) => s.surveillanceStatus === 'VIGENTE').length || 0,
    porVencer: surveillance?.filter((s: any) => s.surveillanceStatus === 'POR_VENCER').length || 0,
    vencidos: surveillance?.filter((s: any) => s.surveillanceStatus === 'VENCIDO').length || 0,
  };

  const healthScore = statsHealth.total > 0 
    ? Math.round((statsHealth.vigentes / statsHealth.total) * 100) 
    : 100;

  const statsInfra = {
    companies: companies?.length || 0,
    totalGes: gesList?.length || 0,
    totalRisks: gesList?.reduce((acc: number, ges: any) => acc + (ges.riskExposures?.length || 0), 0) || 0
  };

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

  if (isLoading) {
    return (
      <div className="space-y-8 p-2 animate-pulse">
        <div className="flex justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-10 w-40" /></div>
        <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div>
        <div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-64"/><Skeleton className="h-64"/></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Panel de Control</h2>
          <p className="text-muted-foreground">Resumen ejecutivo de gestión HSEC.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/dashboard/orders')} className="bg-slate-900">
            <FileText className="mr-2 h-4 w-4" /> Gestionar Órdenes
          </Button>
        </div>
      </div>

      {/* 1. KPIs SUPERIORES */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Solicitudes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{statsOrders.total}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-700">{statsOrders.pending}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Agendadas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-indigo-700">{statsOrders.scheduled}</div></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Realizadas</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-700">{statsOrders.completed}</div></CardContent>
        </Card>
      </div>

      <Separator />

      {/* 2. SEMÁFORO DE SALUD */}
      <div className="grid gap-6 md:grid-cols-2">
        
        <Card className="shadow-md border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <HeartPulse className="h-5 w-5 text-emerald-600" /> Estado de Salud Dotación
            </CardTitle>
            <CardDescription>Cumplimiento de exámenes ocupacionales vigentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
               <div>
                 <p className="text-sm font-medium text-slate-600">Cumplimiento Global</p>
                 <p className={`text-4xl font-extrabold ${healthScore >= 90 ? 'text-emerald-600' : (healthScore >= 70 ? 'text-amber-600' : 'text-red-600')}`}>
                    {healthScore}%
                 </p>
               </div>
               <div className="relative h-20 w-20 rounded-full border-8 border-slate-100 flex items-center justify-center"
                    style={{ background: `conic-gradient(${healthScore >= 90 ? '#10b981' : '#f59e0b'} ${healthScore * 3.6}deg, transparent 0deg)` }}>
                  <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center font-bold text-slate-400">
                    {healthScore}%
                  </div>
               </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-medium text-emerald-800">Vigentes</span> <span>{statsHealth.vigentes}</span></div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${(statsHealth.vigentes/statsHealth.total)*100}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-medium text-amber-800">Por Vencer (30 días)</span> <span>{statsHealth.porVencer}</span></div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-500" style={{ width: `${(statsHealth.porVencer/statsHealth.total)*100}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="font-medium text-red-800">Vencidos</span> <span>{statsHealth.vencidos}</span></div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${(statsHealth.vencidos/statsHealth.total)*100}%` }}></div></div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => navigate('/dashboard/surveillance')}>
                    Ver Detalle de Vigilancia <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tarjeta de Infraestructura */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Building2 className="h-5 w-5 text-slate-500" /> Mapa de Riesgos
            </CardTitle>
            <CardDescription>Cobertura de la planta.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 rounded border text-center">
                <div className="text-3xl font-bold text-blue-600">{statsInfra.totalGes}</div>
                <div className="text-xs font-bold text-slate-500 uppercase">Puestos (GES)</div>
             </div>
             <div className="p-4 bg-slate-50 rounded border text-center">
                <div className="text-3xl font-bold text-red-500">{statsInfra.totalRisks}</div>
                <div className="text-xs font-bold text-slate-500 uppercase">Riesgos Totales</div>
             </div>
             <div className="col-span-2 p-4 bg-slate-50 rounded border flex items-center justify-between px-6">
                <div className="text-left">
                    <div className="text-2xl font-bold text-slate-800">{statsInfra.companies}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Empresas</div>
                </div>
                <Building2 className="h-8 w-8 text-slate-300" />
             </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 3. ACTIVIDAD Y ACCESOS */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Trabajador</TableHead><TableHead>GES</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-4 text-muted-foreground">Sin actividad.</TableCell></TableRow> :
                recentOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.worker.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{order.ges.name}</TableCell>
                    <TableCell><Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge></TableCell>
                  </TableRow>
                ))}
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
          <CardHeader><CardTitle>Accesos Rápidos</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
             <Button variant="outline" className="h-auto py-3 justify-start bg-white hover:bg-blue-50 border-blue-200" onClick={() => navigate('/dashboard/orders')}>
                <div className="bg-blue-100 p-2 rounded-full mr-3"><FileText className="h-4 w-4 text-blue-600" /></div>
                <div className="text-left"><div className="font-semibold text-slate-800">Nueva Solicitud</div></div>
             </Button>
             <Button variant="outline" className="h-auto py-3 justify-start bg-white hover:bg-emerald-50 border-emerald-200" onClick={() => navigate('/dashboard/surveillance')}>
                <div className="bg-emerald-100 p-2 rounded-full mr-3"><Activity className="h-4 w-4 text-emerald-600" /></div>
                <div className="text-left"><div className="font-semibold text-slate-800">Vigilancia Médica</div></div>
             </Button>
             <Button variant="outline" className="h-auto py-3 justify-start bg-white hover:bg-purple-50 border-purple-200" onClick={() => navigate('/dashboard/import')}>
                <div className="bg-purple-100 p-2 rounded-full mr-3"><Upload className="h-4 w-4 text-purple-600" /></div>
                <div className="text-left"><div className="font-semibold text-slate-800">Carga Masiva</div></div>
             </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}