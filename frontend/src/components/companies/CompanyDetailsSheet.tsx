import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Building2, Users, ShieldAlert, FileSpreadsheet, Loader2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GesDocumentsSheet } from '@/components/ges/GesDocumentsSheet';

interface CompanyDetailsSheetProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Definir el tipo de GES aquí para evitar errores de TS en el map
interface GesItem {
  id: string;
  name: string;
  area?: { name: string };
  _count?: { riskExposures: number };
  technicalReport?: { id: string };
  nextEvaluationDate?: string;
}

export function CompanyDetailsSheet({ companyId, open, onOpenChange }: CompanyDetailsSheetProps) {
  const [selectedGesId, setSelectedGesId] = useState<string | null>(null);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await axios.get(`/companies/${companyId}`);
      return data;
    },
    enabled: !!companyId && open,
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-[700px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
              Ficha de Empresa
            </SheetTitle>
            <SheetDescription>
              Detalle operativo y gestión documental.
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : company ? (
            <div className="space-y-8">
              
              {/* 1. DATOS GENERALES */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-2">
                <h3 className="text-lg font-bold text-slate-900">{company.name}</h3>
                <div className="text-sm text-slate-500 font-mono">{company.rut}</div>
                <div className="text-sm text-slate-600">{company.contactEmail}</div>
              </div>

              {/* 2. ESTADÍSTICAS */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Trabajadores</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 text-2xl font-bold">{company.stats?.workersCount || 0}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">GES Activos</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 text-2xl font-bold text-blue-600">{company.stats?.gesCount || 0}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Riesgos</CardTitle></CardHeader>
                  <CardContent className="p-4 pt-0 text-2xl font-bold text-red-600">{company.stats?.riskCount || 0}</CardContent>
                </Card>
              </div>

              {/* 3. LISTADO DE GES */}
              <div>
                <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Documentación GES
                </h3>
                
                <div className="border rounded-lg divide-y">
                  {(!company.gesList || company.gesList.length === 0) ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No hay GES registrados.</div>
                  ) : (
                    company.gesList.map((ges: GesItem) => {
                      const hasReport = !!ges.technicalReport;
                      const isVigente = ges.nextEvaluationDate && new Date(ges.nextEvaluationDate) > new Date();
                      
                      return (
                        <div key={ges.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div>
                            <div className="font-medium">{ges.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Área: {ges.area?.name || 'Sin Área'} • Riesgos: {ges._count?.riskExposures || 0}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {hasReport ? (
                               isVigente ? 
                               <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Vigente</Badge> : 
                               <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Vencido</Badge>
                            ) : (
                               <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Pendiente</Badge>
                            )}

                            <Button 
                              size="sm" 
                              variant="outline"
                              className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => setSelectedGesId(ges.id)}
                            >
                              <FileText className="h-4 w-4" />
                              Docs
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* COMPONENTE FLOTANTE */}
      {selectedGesId && (
        <GesDocumentsSheet 
          gesId={selectedGesId} 
          open={!!selectedGesId} 
          onOpenChange={(open) => !open && setSelectedGesId(null)} 
        />
      )}
    </>
  );
}