import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Activity, Search, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export default function MedicalSurveillancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, VIGENTE, POR_VENCER, VENCIDO

  const { data: surveillanceData, isLoading } = useQuery({
    queryKey: ['surveillance'],
    queryFn: async () => (await axios.get('/analytics/surveillance')).data,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VIGENTE': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Vigente</Badge>;
      case 'POR_VENCER': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"><AlertTriangle className="w-3 h-3 mr-1"/> Por Vencer</Badge>;
      case 'VENCIDO': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200"><XCircle className="w-3 h-3 mr-1"/> Vencido</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('es-CL');

  const filteredData = surveillanceData?.filter((item: any) => {
    const matchesSearch = item.workerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.workerRut.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.surveillanceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center gap-4 border-b pb-6">
        <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600"><Activity className="h-8 w-8" /></div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vigilancia Médica</h1>
            <p className="text-muted-foreground">Monitoreo de vencimientos y aptitud laboral.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar trabajador..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar Estado" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="VIGENTE">Vigentes</SelectItem>
                <SelectItem value="POR_VENCER">Por Vencer (45 días)</SelectItem>
                <SelectItem value="VENCIDO">Vencidos</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Trabajador</TableHead>
                        <TableHead>Batería / Examen</TableHead>
                        <TableHead>Aptitud</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredData?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se encontraron registros.</TableCell></TableRow>
                    ) : (
                        filteredData?.map((item: any) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="font-medium">{item.workerName}</div>
                                    <div className="text-xs text-muted-foreground">{item.workerRut}</div>
                                    <div className="text-xs text-slate-500 mt-1">{item.companyName}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium text-slate-700">{item.batteryName}</div>
                                    <div className="text-xs text-muted-foreground">GES: {item.gesName}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={item.medicalStatus === 'APTO' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}>
                                        {item.medicalStatus.replace(/_/g, ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                    {formatDate(item.expirationDate)}
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(item.surveillanceStatus)}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}