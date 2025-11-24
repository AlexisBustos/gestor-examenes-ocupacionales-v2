import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ShieldAlert, FileSpreadsheet, Loader2 } from 'lucide-react';

interface CompanyDetailsSheetProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDetailsSheet({ companyId, open, onOpenChange }: CompanyDetailsSheetProps) {
  // CONSULTA AL BACKEND PARA TRAER LOS DATOS REALES
  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await axios.get(`/companies/${companyId}`);
      return data;
    },
    enabled: !!companyId && open, // Solo busca si está abierto
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px]">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Ficha de Empresa
          </SheetTitle>
          <SheetDescription>
            Resumen ejecutivo y métricas operativas.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : company ? (
          <div className="space-y-6">
            
            {/* Datos Básicos */}
            <div className="grid gap-4 p-4 bg-slate-50 rounded-lg border">
              <div>
                <div className="text-sm text-muted-foreground">Razón Social</div>
                <div className="font-semibold text-lg">{company.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">RUT</div>
                  <div className="font-mono">{company.rut}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div>{company.contactEmail}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dirección</div>
                <div>{company.address || 'Sin dirección registrada'}</div>
              </div>
            </div>

            {/* Métricas (Lo que querías ver) */}
            <div className="grid grid-cols-2 gap-4">
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trabajadores</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{company.stats?.workersCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">GES Activos</CardTitle>
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{company.stats?.gesCount || 0}</div>
                  <p className="text-xs text-muted-foreground">Puestos evaluados</p>
                </CardContent>
              </Card>

              <Card className="col-span-2 bg-red-50 border-red-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-800">Riesgos Identificados</CardTitle>
                  <ShieldAlert className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-700">{company.stats?.riskCount || 0}</div>
                  <p className="text-xs text-red-600/80">Exposiciones totales en planta</p>
                </CardContent>
              </Card>

            </div>

          </div>
        ) : (
          <div className="text-center text-red-500">No se encontró información</div>
        )}
      </SheetContent>
    </Sheet>
  );
}