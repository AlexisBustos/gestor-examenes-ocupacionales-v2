import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/context/AuthContext';

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
  Building2,
  Activity,
  Upload,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Wallet
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. CARGA DE DATOS
  // Se agregan valores por defecto y cast a 'any' para evitar errores de tipo '{}' en el build
  const { data: orders = [], isLoading: loadingOrders } = useOrders() as any;
  const { data: gesList = [], isLoading: loadingGes } = useQuery({ queryKey: ['all-ges'], queryFn: async () => (await axios.get('/ges')).data }) as any;
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({ queryKey: ['all-companies'], queryFn: async () => (await axios.get('/companies')).data }) as any;
  const { data: analytics = {}, isLoading: loadingSurv } = useQuery({ queryKey: ['analytics'], queryFn: async () => (await axios.get('/analytics/surveillance')).data }) as any;
  
  const { data: costStats = [], isLoading: loadingCosts } = useQuery({ 
      queryKey: ['analytics-costs'], 
      queryFn: async () => (await axios.get('/analytics/costs')).data 
  }) as any;

  const isLoading = loadingOrders || loadingGes || loadingCompanies || loadingSurv || loadingCosts;

  // --- CÁLCULOS ---
  const statsOrders = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'SOLICITADO').length || 0,
    scheduled: orders?.filter((o: any) => o.status === 'AGENDADO').length || 0,
    completed: orders?.filter((o: any) => o.status === 'REALIZADO' || o.status === 'CERRADO').length || 0,
  };

  const surveillanceList = analytics?.surveillance || [];
  const healthStats = {
    total: surveillanceList.length || 0,
    vigentes: surveillanceList.filter((s: any) => s.surveillanceStatus === 'VIGENTE').length || 0,
    porVencer: surveillanceList.filter((s: any) => s.surveillanceStatus === 'POR_VENCER').length || 0,
    vencidos: surveillanceList.filter((s: any) => s.surveillanceStatus === 'VENCIDO').length || 0,
    aptos: surveillanceList.filter((s: any) => s.medicalStatus === 'APTO').length || 0,
    noAptos: surveillanceList.filter((s: any) => s.medicalStatus === 'NO_APTO').length || 0,
    observados: surveillanceList.filter((s: any) => s.medicalStatus === 'APTO_CON_OBSERVACIONES').length || 0,
  };
  
  const healthScore = healthStats.total > 0 ? Math.round((healthStats.vigentes / healthStats.total) * 100) : 100;
  const aptitudScore = healthStats.total > 0 ? Math.round((healthStats.aptos / healthStats.total) * 100) : 0;

  const statsInfra = {
    companies: companies?.length || 0,
    totalGes: gesList?.length || 0,
    totalRisks: gesList?.reduce((acc: number, ges: any) => acc + (ges.riskExposures?.length || 0), 0) || 0
  };

  const docStats = analytics?.documentStats || { totalGes: 0, withReport: 0, coverage: 0 };
  const riskStats = analytics?.prescriptionStats || { total: 0, pendientes: 0, enProceso: 0, realizadas: 0, vencidas: 0 };
  const measuresProgress = riskStats.total > 0 ? Math.round((riskStats.realizadas / riskStats.total) * 100) : 0;
  const recentOrders = orders?.slice(0, 5) || [];
  const totalOrdersInCosts = costStats?.reduce((acc: number, c: any) => acc + c.orders, 0) || 1;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SOLICITADO': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'AGENDADO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REALIZADO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ANULADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  if (isLoading) return (
    <div className="space-y-8 p-6">
       <div className="flex justify-between items-center">
          <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-40" /></div>
          <Skeleton className="h-10 w-32" />
       </div>
       <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/><Skeleton className="h-32"/></div>
       <div className="grid gap-6 md:grid-cols-3"><Skeleton className="h-80"/><Skeleton className="h-80"/><Skeleton className="h-80"/></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">

      {/* HEADER (Sin manito) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {greeting}, {user?.name?.split(' ')[0] || 'Usuario'}
          </h2>
          <p className="text-muted-foreground mt-1">
            Resumen ejecutivo de gestión HSEC y Financiera.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/dashboard/orders')} className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:shadow-md">
            <PlusIcon className="mr-2 h-4 w-4" /> Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* 1. KPIs DE FLUJO */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Solicitudes" value={statsOrders.total} icon={FileText} color="text-blue-600" bg="bg-blue-50" description="Gestión histórica" />
        <KpiCard title="Pendientes" value={statsOrders.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" description="Requieren atención" trend={statsOrders.pending > 0 ? "Activas" : "Al día"} />
        <KpiCard title="Agendadas" value={statsOrders.scheduled} icon={Calendar} color="text-indigo-600" bg="bg-indigo-50" description="Próximos exámenes" />
        <KpiCard title="Realizadas" value={statsOrders.completed} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" description="Ciclo cerrado" />
      </div>

      <Separator className="my-6" />

      {/* 2. TABLERO CENTRAL (Salud, Aptitud, Costos) */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* A. ESTADO DE SALUD */}
        <Card className="shadow-md border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><HeartPulse className="h-24 w-24 text-emerald-600" /></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-900"><HeartPulse className="h-5 w-5 text-emerald-600" /> Salud Ocupacional</CardTitle>
            <CardDescription>Cumplimiento de exámenes vigentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div><p className="text-sm font-medium text-slate-600">Cumplimiento</p><p className={`text-4xl font-extrabold ${healthScore >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>{healthScore}%</p></div>
              <div className="relative h-16 w-16 rounded-full border-4 border-slate-100 flex items-center justify-center bg-white"><span className="text-xl font-bold text-slate-400">KPI</span></div>
            </div>
            <div className="space-y-3">
              <ProgressBar label="Vigentes" value={healthStats.vigentes} total={healthStats.total} color="bg-emerald-500" />
              <ProgressBar label="Por Vencer" value={healthStats.porVencer} total={healthStats.total} color="bg-amber-500" />
              <ProgressBar label="Vencidos" value={healthStats.vencidos} total={healthStats.total} color="bg-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* B. APTITUD LABORAL */}
        <Card className="shadow-md border-blue-100 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><UserCheck className="h-24 w-24 text-blue-600" /></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900"><UserCheck className="h-5 w-5 text-blue-600" /> Aptitud Laboral</CardTitle>
            <CardDescription>Resultados de la dotación.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div><p className="text-sm font-medium text-slate-600">Tasa Aptitud</p><p className="text-4xl font-extrabold text-blue-700">{aptitudScore}%</p></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatusBox label="Aptos" value={healthStats.aptos} color="green" />
              <StatusBox label="Con Obs." value={healthStats.observados} color="amber" />
              <StatusBox label="No Aptos" value={healthStats.noAptos} color="red" />
            </div>
            {healthStats.noAptos > 0 && (
                <div className="mt-6 p-2 bg-red-50 rounded border border-red-100 flex gap-2 items-center text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span><strong>Atención:</strong> {healthStats.noAptos} casos no aptos requieren gestión.</span>
                </div>
            )}
          </CardContent>
        </Card>

        {/* C. CENTROS DE COSTOS */}
        <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Wallet className="h-5 w-5 text-purple-600" /> Actividad por CC
                </CardTitle>
                <CardDescription>Volumen de exámenes por área.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {costStats?.length > 0 ? (
                    costStats.map((cc: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]" title={cc.name}>{cc.code} - {cc.name}</span>
                                <span className="text-slate-500">{cc.orders} órdenes</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-purple-500 rounded-full transition-all duration-1000" 
                                    style={{ width: `${(cc.orders / totalOrdersInCosts) * 100}%` }} 
                                />
                            </div>
                            <div className="text-[10px] text-slate-400 text-right">
                                {cc.workers} trabajadores activos
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-xs text-muted-foreground italic py-4 border border-dashed rounded bg-slate-50">
                        No hay datos financieros aún.
                    </div>
                )}
            </CardContent>
        </Card>

      </div>

      <Separator />

      {/* 3. GESTIÓN Y PLANTA */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Gestión Riesgos */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800"><ShieldCheck className="h-5 w-5 text-slate-600" /> Gestión de Riesgos</CardTitle>
            <CardDescription>Cumplimiento documental.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
             <div className="space-y-2">
                 <div className="flex justify-between text-sm font-medium"><span>Cobertura Informes</span><span>{docStats.coverage}%</span></div>
                 <Progress value={docStats.coverage} className="h-2 bg-blue-100" />
                 <div className="text-xs text-slate-500 text-right">{docStats.withReport} de {docStats.totalGes} GES</div>
             </div>
             <div className="space-y-2">
                 <div className="flex justify-between text-sm font-medium"><span>Medidas Realizadas</span><span>{measuresProgress}%</span></div>
                 <Progress value={measuresProgress} className="h-2 bg-green-100" />
                 <div className="text-xs text-slate-500 text-right">{riskStats.realizadas} de {riskStats.total}</div>
             </div>
          </CardContent>
        </Card>

        {/* D. ESTADO DE PLANTA (Fondo BLANCO) */}
        <Card className="shadow-md border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Building2 className="h-5 w-5 text-slate-600" /> Infraestructura
            </CardTitle>
            <CardDescription>Dimensionamiento operativo actual.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-between items-center px-8 h-24">
             <div className="text-center">
                 <div className="text-3xl font-bold text-slate-900">{statsInfra.companies}</div>
                 <div className="text-xs text-slate-500 uppercase tracking-widest">Empresas</div>
             </div>
             <div className="h-10 w-px bg-slate-200"></div>
             <div className="text-center">
                 <div className="text-3xl font-bold text-slate-900">{statsInfra.totalGes}</div>
                 <div className="text-xs text-slate-500 uppercase tracking-widest">Puestos</div>
             </div>
             <div className="h-10 w-px bg-slate-200"></div>
             <div className="text-center">
                 <div className="text-3xl font-bold text-slate-900">{statsInfra.totalRisks}</div>
                 <div className="text-xs text-slate-500 uppercase tracking-widest">Riesgos</div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. ACTIVIDAD RECIENTE */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-slate-500" /> Actividad Reciente</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/orders')} className="text-blue-600 hover:bg-blue-50 text-xs">
                  Ver todo <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="pl-6">Fecha</TableHead>
                      <TableHead>Trabajador</TableHead>
                      <TableHead>Estado</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order: any) => (
                  <TableRow key={order.id} className="hover:bg-slate-50">
                    <TableCell className="pl-6 text-xs text-muted-foreground whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-sm">
                        {order.worker.name}
                        <div className="text-xs text-slate-400 font-normal">{order.ges.name}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={`border-0 font-medium ${getStatusColor(order.status)}`}>{order.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground italic">Sin actividad reciente.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm bg-slate-50 border-slate-100">
          <CardHeader><CardTitle>Accesos Rápidos</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="h-auto py-3 justify-start bg-white hover:bg-blue-50 border-blue-200" onClick={() => navigate('/dashboard/orders')}>
              <div className="bg-blue-100 p-2 rounded-full mr-3"><FileText className="h-4 w-4 text-blue-600" /></div>
              <div className="text-left"><div className="font-semibold text-slate-800 text-sm">Nueva Solicitud</div></div>
            </Button>
            <Button variant="outline" className="h-auto py-3 justify-start bg-white hover:bg-emerald-50 border-emerald-200" onClick={() => navigate('/dashboard/surveillance')}>
              <div className="bg-emerald-100 p-2 rounded-full mr-3"><Activity className="h-4 w-4 text-emerald-600" /></div>
              <div className="text-left"><div className="font-semibold text-slate-800 text-sm">Vigilancia Médica</div></div>
            </Button>
            <Button variant="outline" className="h-auto py-3 justify-start bg-white hover:bg-purple-50 border-purple-200" onClick={() => navigate('/dashboard/import')}>
              <div className="bg-purple-100 p-2 rounded-full mr-3"><Upload className="h-4 w-4 text-purple-600" /></div>
              <div className="text-left"><div className="font-semibold text-slate-800 text-sm">Carga Masiva</div></div>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// --- Componentes auxiliares (KpiCard, ProgressBar, StatusBox, PlusIcon) ---
function KpiCard({ title, value, icon: Icon, color, bg, description, trend }: any) {
    return (
        <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
                <div className={`p-2 rounded-full ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-[10px] text-muted-foreground">{description}</p>
                    {trend && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{trend}</span>}
                </div>
            </CardContent>
        </Card>
    );
}

function ProgressBar({ label, value, total, color }: any) {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="text-slate-500">{value}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
}

function StatusBox({ label, value, color }: any) {
    const colors: any = { green: "bg-green-50 text-green-700 border-green-100", amber: "bg-amber-50 text-amber-700 border-amber-100", red: "bg-red-50 text-red-700 border-red-100" };
    return (
        <div className={`p-2 rounded border ${colors[color]}`}>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-[10px] uppercase font-bold opacity-80">{label}</div>
        </div>
    );
}

function PlusIcon(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
}