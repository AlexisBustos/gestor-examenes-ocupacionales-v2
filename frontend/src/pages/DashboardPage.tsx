import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress'; // 👈 ¡AQUÍ FALTABA ESTE IMPORT!
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
  Activity,
  Upload,
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Wallet,
  Plus,
  Users,
  ShieldAlert
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. CARGA DE DATOS CENTRALIZADA
  const { data: orders = [], isLoading: loadingOrders } = useOrders() as any;
  const { data: workers = [], isLoading: loadingWorkers } = useQuery({ queryKey: ['workers'], queryFn: async () => (await axios.get('/workers')).data });
  const { data: gesList = [], isLoading: loadingGes } = useQuery({ queryKey: ['all-ges'], queryFn: async () => (await axios.get('/ges')).data });
  const { data: analytics = {}, isLoading: loadingSurv } = useQuery({ queryKey: ['analytics'], queryFn: async () => (await axios.get('/analytics/surveillance')).data });

  const isLoading = loadingOrders || loadingWorkers || loadingGes || loadingSurv;

  // --- CÁLCULOS EN TIEMPO REAL (FRONTEND) ---

  // 1. Órdenes
  const statsOrders = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'SOLICITADO').length || 0,
    scheduled: orders?.filter((o: any) => o.status === 'AGENDADO').length || 0,
    completed: orders?.filter((o: any) => o.status === 'REALIZADO' || o.status === 'CERRADO').length || 0,
  };

  // 2. Salud (Vigilancia)
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

  // 3. Dotación Real (Calculado desde workers)
  const activeWorkersCount = useMemo(() => {
      if (!workers) return 0;
      return workers.filter((w: any) => w.employmentStatus === 'NOMINA' || w.employmentStatus === 'TRANSITO').length;
  }, [workers]);

  // 4. Actividad por Centro de Costos (Calculado desde orders)
  const costCenterStats = useMemo(() => {
      if (!orders) return [];
      const counts: Record<string, number> = {};
      
      orders.forEach((o: any) => {
          // Intentamos sacar el CC del trabajador asociado a la orden
          const ccName = o.worker?.costCenter?.name || 'Sin Asignar';
          counts[ccName] = (counts[ccName] || 0) + 1;
      });

      return Object.entries(counts)
          .map(([name, count]) => ({ name, orders: count }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 5); // Top 5
  }, [orders]);

  // 5. Top Riesgos (Calculado desde workers -> ges -> riesgos)
  const topRisks = useMemo(() => {
      if (!workers) return [];
      const riskCounts: Record<string, number> = {};

      workers.forEach((w: any) => {
          if (w.employmentStatus === 'NOMINA' && w.currentGes?.risks) {
              w.currentGes.risks.forEach((r: any) => {
                  const riskName = r.risk?.name;
                  if (riskName) {
                      riskCounts[riskName] = (riskCounts[riskName] || 0) + 1;
                  }
              });
          }
      });

      return Object.entries(riskCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
  }, [workers]);

  // Datos Auxiliares
  const docStats = analytics?.documentStats || { totalGes: gesList.length, withReport: 0, coverage: 0 };
  const riskStats = analytics?.prescriptionStats || { total: 0, realizadas: 0 };
  const measuresProgress = riskStats.total > 0 ? Math.round((riskStats.realizadas / riskStats.total) * 100) : 0;
  const recentOrders = orders?.slice(0, 5) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SOLICITADO': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'AGENDADO': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'REALIZADO': return 'bg-primary/10 text-primary border-primary/20';
      case 'ANULADO': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const today = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

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

      {/* HEADER GESTUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {greeting}, <span className="text-primary">{user?.name?.split(' ')[0] || 'Usuario'}</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-sm font-medium text-slate-400 capitalize">{today}</span>
             <span className="text-slate-300">•</span>
             <p className="text-sm text-muted-foreground">Panel de Control General</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/dashboard/orders')} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105">
            <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* 1. KPIs DE FLUJO (Identidad de Color GESTUM) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Usamos activeWorkersCount real */}
        <KpiCard title="Dotación Activa" value={activeWorkersCount} icon={Users} color="text-blue-600" bg="bg-blue-50" description="Trabajadores en nómina" />
        <KpiCard title="Pendientes" value={statsOrders.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" description="Requieren acción" trend={statsOrders.pending > 0 ? "Atención" : undefined} />
        <KpiCard title="Agendadas" value={statsOrders.scheduled} icon={Calendar} color="text-secondary" bg="bg-purple-50" description="Próximos eventos" />
        <KpiCard title="Realizadas" value={statsOrders.completed} icon={CheckCircle2} color="text-primary" bg="bg-teal-50" description="Ciclo completado" />
      </div>

      {/* 2. TABLERO CENTRAL */}
      <div className="grid gap-6 md:grid-cols-3">

        {/* A. SALUD OCUPACIONAL */}
        <Card className="shadow-md border-primary/20 bg-gradient-to-br from-white to-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5"><HeartPulse className="h-32 w-32 text-primary" /></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary"><HeartPulse className="h-5 w-5" /> Salud Ocupacional</CardTitle>
            <CardDescription>Estado de vigilancia médica.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                  <p className="text-sm font-medium text-slate-600">Cumplimiento</p>
                  <p className={`text-4xl font-extrabold ${healthScore >= 90 ? 'text-primary' : 'text-amber-600'}`}>{healthScore}%</p>
              </div>
              <div className="relative h-16 w-16 rounded-full border-4 border-white shadow-sm flex items-center justify-center bg-primary/10">
                  <span className="text-xs font-bold text-primary">KPI</span>
              </div>
            </div>
            <div className="space-y-3">
              <ProgressBar label="Vigentes" value={healthStats.vigentes} total={healthStats.total} color="bg-primary" />
              <ProgressBar label="Por Vencer" value={healthStats.porVencer} total={healthStats.total} color="bg-amber-500" />
              <ProgressBar label="Vencidos" value={healthStats.vencidos} total={healthStats.total} color="bg-red-500" />
            </div>
          </CardContent>
        </Card>

        {/* B. APTITUD LABORAL */}
        <Card className="shadow-md border-slate-100 bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><UserCheck className="h-32 w-32 text-slate-900" /></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800"><UserCheck className="h-5 w-5 text-primary" /> Aptitud Laboral</CardTitle>
            <CardDescription>Calificación de la dotación.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div><p className="text-sm font-medium text-slate-600">Tasa de Aptitud</p><p className="text-4xl font-extrabold text-slate-800">{aptitudScore}%</p></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <StatusBox label="Aptos" value={healthStats.aptos} color="green" />
              <StatusBox label="Con Obs." value={healthStats.observados} color="amber" />
              <StatusBox label="No Aptos" value={healthStats.noAptos} color="red" />
            </div>
            {healthStats.noAptos > 0 && (
                <div className="mt-6 p-2 bg-red-50 rounded border border-red-100 flex gap-2 items-center text-xs text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span><strong>Atención:</strong> {healthStats.noAptos} casos requieren gestión.</span>
                </div>
            )}
          </CardContent>
        </Card>

        {/* C. MAPA DE RIESGOS (CALCULADO) */}
        <Card className="shadow-md border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                    <ShieldAlert className="h-5 w-5 text-rose-500" /> Mapa de Riesgos
                </CardTitle>
                <CardDescription>Top agentes con mayor exposición.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {topRisks.length > 0 ? (
                    topRisks.map((risk: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{risk.name}</span>
                                <span className="text-slate-500">{risk.count} trabajadores</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-rose-500 rounded-full transition-all duration-1000 opacity-80" 
                                    style={{ width: `${(risk.count / (activeWorkersCount || 1)) * 100}%` }} 
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-xs text-muted-foreground italic py-8 border border-dashed rounded bg-slate-50">
                        No hay exposiciones registradas.
                        <br/>Asigna puestos (GES) a trabajadores.
                    </div>
                )}
            </CardContent>
        </Card>

      </div>

      {/* 3. GESTIÓN, INFRA Y CENTROS DE COSTOS */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Gestión Riesgos */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800"><ShieldCheck className="h-5 w-5 text-secondary" /> Gestión de Riesgos</CardTitle>
            <CardDescription>Cumplimiento documental e informes.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium"><span>Cobertura Informes</span><span>{docStats.coverage}%</span></div>
                  <Progress value={docStats.coverage} className="h-2 bg-purple-100" /> 
                  <div className="text-xs text-slate-500 text-right">{docStats.withReport} de {docStats.totalGes} GES</div>
              </div>
              <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium"><span>Medidas Realizadas</span><span>{measuresProgress}%</span></div>
                  <Progress value={measuresProgress} className="h-2 bg-teal-100" /> 
                  <div className="text-xs text-slate-500 text-right">{riskStats.realizadas} de {riskStats.total}</div>
              </div>
          </CardContent>
        </Card>

        {/* ACTIVIDAD POR CENTRO (Calculada) */}
        <Card className="shadow-sm border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Wallet className="h-5 w-5 text-slate-400" /> Actividad por Centro
            </CardTitle>
          </CardHeader>
          <CardContent>
             {costCenterStats.length > 0 ? (
                <div className="space-y-3">
                    {costCenterStats.map((cc: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-200 pb-2 last:border-0">
                            <span className="font-medium text-slate-700 truncate max-w-[140px]">{cc.name}</span>
                            <Badge variant="secondary" className="text-[10px]">{cc.orders} órdenes</Badge>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="text-center text-xs text-slate-400 italic py-4">
                    Sin órdenes asociadas a centros.
                </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* 4. ACTIVIDAD RECIENTE */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-slate-400" /> Actividad Reciente</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/orders')} className="text-primary hover:bg-primary/10 text-xs">
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
            <Button variant="outline" className="h-auto py-3 justify-start bg-white hover:bg-primary/5 hover:border-primary/30 border-slate-200 transition-all group" onClick={() => navigate('/dashboard/orders')}>
              <div className="bg-primary/10 p-2 rounded-full mr-3 group-hover:bg-primary group-hover:text-white transition-colors"><FileText className="h-4 w-4 text-primary group-hover:text-white" /></div>
              <div className="text-left"><div className="font-semibold text-slate-800 text-sm">Nueva Solicitud</div></div>
            </Button>
            <Button variant="outline" className="h-auto py-3 justify-start bg-white hover:bg-primary/5 hover:border-primary/30 border-slate-200 transition-all group" onClick={() => navigate('/dashboard/surveillance')}>
              <div className="bg-teal-100 p-2 rounded-full mr-3 group-hover:bg-teal-600 group-hover:text-white transition-colors"><Activity className="h-4 w-4 text-teal-700 group-hover:text-white" /></div>
              <div className="text-left"><div className="font-semibold text-slate-800 text-sm">Vigilancia Médica</div></div>
            </Button>
            <Button variant="outline" className="h-auto py-3 justify-start bg-white hover:bg-secondary/5 hover:border-secondary/30 border-slate-200 transition-all group" onClick={() => navigate('/dashboard/import')}>
              <div className="bg-secondary/10 p-2 rounded-full mr-3 group-hover:bg-secondary group-hover:text-white transition-colors"><Upload className="h-4 w-4 text-secondary group-hover:text-white" /></div>
              <div className="text-left"><div className="font-semibold text-slate-800 text-sm">Carga Masiva</div></div>
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// --- Componentes auxiliares (Se mantienen igual) ---

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
                    {trend && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{trend}</span>}
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
    const colors: any = { 
        green: "bg-emerald-50 text-emerald-700 border-emerald-100", 
        amber: "bg-amber-50 text-amber-700 border-amber-100", 
        red: "bg-red-50 text-red-700 border-red-100" 
    };
    return (
        <div className={`p-2 rounded border ${colors[color]}`}>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-[10px] uppercase font-bold opacity-80">{label}</div>
        </div>
    );
}