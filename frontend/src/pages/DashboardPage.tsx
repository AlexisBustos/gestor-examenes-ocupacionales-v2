import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { useOrders } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  FileText,
  HeartPulse,
  UserCheck,
  ShieldCheck,
  LayoutList,
  Building2,
  Activity,
  Upload,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();

  // 1. CARGA DE DATOS
  const { data: orders, isLoading: loadingOrders } = useOrders();
  const { data: gesList, isLoading: loadingGes } = useQuery({ queryKey: ['all-ges'], queryFn: async () => (await axios.get('/ges')).data });
  const { data: companies, isLoading: loadingCompanies } = useQuery({ queryKey: ['all-companies'], queryFn: async () => (await axios.get('/companies')).data });
  const { data: analytics, isLoading: loadingSurv } = useQuery({ queryKey: ['analytics'], queryFn: async () => (await axios.get('/analytics/surveillance')).data });

  const isLoading = loadingOrders || loadingGes || loadingCompanies || loadingSurv;

  // --- CÁLCULOS ---

  // A. Órdenes
  const statsOrders = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'SOLICITADO').length || 0,
    scheduled: orders?.filter((o: any) => o.status === 'AGENDADO').length || 0,
    completed: orders?.filter((o: any) => o.status === 'REALIZADO' || o.status === 'CERRADO').length || 0,
  };

  // B. Salud Ocupacional (Vigencia)
  const surveillanceList = analytics?.surveillance || [];
  const healthStats = {
    total: surveillanceList.length || 0,
    vigentes: surveillanceList.filter((s: any) => s.surveillanceStatus === 'VIGENTE').length || 0,
    porVencer: surveillanceList.filter((s: any) => s.surveillanceStatus === 'POR_VENCER').length || 0,
    vencidos: surveillanceList.filter((s: any) => s.surveillanceStatus === 'VENCIDO').length || 0,

    // C. Aptitud (Resultados)
    aptos: surveillanceList.filter((s: any) => s.medicalStatus === 'APTO').length || 0,
    noAptos: surveillanceList.filter((s: any) => s.medicalStatus === 'NO_APTO').length || 0,
    observados: surveillanceList.filter((s: any) => s.medicalStatus === 'APTO_CON_OBSERVACIONES').length || 0,
  };
  const healthScore = healthStats.total > 0 ? Math.round((healthStats.vigentes / healthStats.total) * 100) : 100;
  const aptitudScore = healthStats.total > 0 ? Math.round((healthStats.aptos / healthStats.total) * 100) : 0;

  // D. Infraestructura
  const statsInfra = {
    companies: companies?.length || 0,
    totalGes: gesList?.length || 0,
    totalRisks: gesList?.reduce((acc: number, ges: any) => acc + (ges.riskExposures?.length || 0), 0) || 0
  };

  // E. Cumplimiento Documental (Informes)
  const docStats = analytics?.documentStats || { totalGes: 0, withReport: 0, coverage: 0 };

  // F. Medidas de Control (Prescripciones)
  const riskStats = analytics?.prescriptionStats || { total: 0, pendientes: 0, enProceso: 0, realizadas: 0, vencidas: 0 };
  const measuresProgress = riskStats.total > 0 ? Math.round((riskStats.realizadas / riskStats.total) * 100) : 0;

  // G. Recientes
  const recentOrders = orders?.slice(0, 5) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SOLICITADO': return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
      case 'AGENDADO': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100';
      case 'REALIZADO': return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
      case 'ANULADO': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
      default: return 'secondary';
    }
  };

  if (isLoading) return <div className="space-y-8 p-2 animate-pulse"><div className="flex justify-between"><Skeleton className="h-8 w-64" /><Skeleton className="h-10 w-40" /></div><div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><div className="grid gap-6 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div></div>;

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

      {/* 1. KPIs DE FLUJO */}
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

      {/* 2. SALUD Y APTITUD */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* A. ESTADO DE SALUD (Vigencia) */}
        <Card className="shadow-md border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <HeartPulse className="h-5 w-5 text-emerald-600" /> Salud Ocupacional
            </CardTitle>
            <CardDescription>Cumplimiento de exámenes vigentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div><p className="text-sm font-medium text-slate-600">Cumplimiento Global</p><p className={`text-4xl font-extrabold ${healthScore >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{healthScore}%</p></div>
              <div className="relative h-16 w-16 rounded-full border-4 border-slate-100 flex items-center justify-center bg-white"><span className="text-xl font-bold text-slate-400">{healthScore}%</span></div>
            </div>
            <div className="space-y-3">
              <div><div className="flex justify-between text-xs mb-1"><span className="font-medium text-emerald-800">Vigentes</span><span>{healthStats.vigentes}</span></div><Progress value={(healthStats.vigentes / healthStats.total) * 100} className="h-2 bg-emerald-100" /></div>
              <div><div className="flex justify-between text-xs mb-1"><span className="font-medium text-amber-800">Por Vencer</span><span>{healthStats.porVencer}</span></div><Progress value={(healthStats.porVencer / healthStats.total) * 100} className="h-2 bg-amber-100" /></div>
              <div><div className="flex justify-between text-xs mb-1"><span className="font-medium text-red-800">Vencidos</span><span>{healthStats.vencidos}</span></div><Progress value={(healthStats.vencidos / healthStats.total) * 100} className="h-2 bg-red-100" /></div>
            </div>
          </CardContent>
        </Card>

        {/* B. APTITUD LABORAL (Resultados) */}
        <Card className="shadow-md border-blue-100 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <UserCheck className="h-5 w-5 text-blue-600" /> Aptitud Laboral
            </CardTitle>
            <CardDescription>Resultados médicos de la dotación.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div><p className="text-sm font-medium text-slate-600">Tasa de Aptitud</p><p className="text-4xl font-extrabold text-blue-700">{aptitudScore}%</p></div>
              <div className="relative h-16 w-16 rounded-full border-4 border-slate-100 flex items-center justify-center bg-blue-50"><span className="text-2xl">🩺</span></div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center mt-8">
              <div className="p-3 bg-green-50 rounded border border-green-100">
                <div className="text-2xl font-bold text-green-700">{healthStats.aptos}</div>
                <div className="text-[10px] uppercase font-bold text-green-600">Aptos</div>
              </div>
              <div className="p-3 bg-red-50 rounded border border-red-100">
                <div className="text-2xl font-bold text-red-700">{healthStats.noAptos}</div>
                <div className="text-[10px] uppercase font-bold text-red-600">No Aptos</div>
              </div>
              <div className="p-3 bg-amber-50 rounded border border-amber-100">
                <div className="text-2xl font-bold text-amber-700">{healthStats.observados}</div>
                <div className="text-[10px] uppercase font-bold text-amber-600">Con Obs.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 3. GESTIÓN DE RIESGOS Y PLANTA (LO QUE FALTABA) */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* C. GESTIÓN DE RIESGOS (Informes y Medidas) */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <ShieldCheck className="h-5 w-5 text-slate-600" /> Gestión de Riesgos
            </CardTitle>
            <CardDescription>Cumplimiento documental y medidas de control.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informes */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded border border-blue-100 text-center">
                <div className="text-2xl font-bold text-blue-700">{docStats.coverage}%</div>
                <div className="text-[10px] uppercase font-bold text-blue-400">Cobertura Informes</div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100 text-center">
                <div className="text-2xl font-bold text-slate-700">{docStats.withReport}/{docStats.totalGes}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">GES Documentados</div>
              </div>
            </div>
            {/* Prescripciones */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><LayoutList className="h-4 w-4" /> Medidas de Control</h4>
                <Badge variant="outline" className="text-xs">{riskStats.realizadas}/{riskStats.total} Realizadas</Badge>
              </div>
              <Progress value={measuresProgress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                <span>{riskStats.pendientes} Pendientes</span>
                <span className="text-blue-600 font-medium">{riskStats.enProceso} En Proceso</span>
                <span className="text-red-600 font-medium">{riskStats.vencidas} Vencidas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* D. ESTADO DE PLANTA (Infraestructura) */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Building2 className="h-5 w-5 text-slate-600" /> Estado de la Planta
            </CardTitle>
            <CardDescription>Dimensionamiento operativo actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center h-full items-center">
              <div className="p-4 bg-slate-50 rounded border">
                <div className="text-3xl font-bold text-slate-800">{statsInfra.companies}</div>
                <div className="text-xs font-bold text-slate-500 uppercase">Empresas</div>
              </div>
              <div className="p-4 bg-slate-50 rounded border">
                <div className="text-3xl font-bold text-blue-600">{statsInfra.totalGes}</div>
                <div className="text-xs font-bold text-slate-500 uppercase">GES Totales</div>
              </div>
              <div className="p-4 bg-slate-50 rounded border">
                <div className="text-3xl font-bold text-red-600">{statsInfra.totalRisks}</div>
                <div className="text-xs font-bold text-slate-500 uppercase">Riesgos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* 4. ACTIVIDAD Y ACCESOS */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader><CardTitle>Actividad Reciente</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Trabajador</TableHead><TableHead>GES</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.worker.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{order.ges.name}</TableCell>
                    <TableCell><Badge className={`border shadow-sm ${getStatusColor(order.status)}`}>{order.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4">Sin actividad.</TableCell></TableRow>}
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