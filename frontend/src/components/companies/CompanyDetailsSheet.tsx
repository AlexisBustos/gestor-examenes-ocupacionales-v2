import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Loader2,
  FileSpreadsheet,
  Wallet,
  FileText,
  Layers // Icono para las áreas
} from 'lucide-react';

import { GesDocumentsSheet } from '@/components/ges/GesDocumentsSheet';

interface CompanyDetailsSheetProps {
  companyId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDetailsSheet({
  companyId,
  open,
  onOpenChange,
}: CompanyDetailsSheetProps) {
  const [selectedGesId, setSelectedGesId] = useState<string | null>(null);

  const { data: company, isLoading } = useQuery<any>({
    queryKey: ['company-details', companyId],
    queryFn: async () => {
      const { data } = await axios.get(`/companies/${companyId}`);
      return data;
    },
    enabled: !!companyId && open,
  });

  // --- LÓGICA DE AGRUPACIÓN POR ÁREA ---
  const groupedGes = company?.gesList?.reduce((acc: any, ges: any) => {
    // Si tiene área usa el nombre, si no, lo pone en 'General'
    const areaName = ges.area?.name || 'General';
    if (!acc[areaName]) {
      acc[areaName] = [];
    }
    acc[areaName].push(ges);
    return acc;
  }, {}) || {};

  // Ordenamos las llaves (nombres de áreas) alfabéticamente
  const sortedAreaNames = Object.keys(groupedGes).sort();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[800px] p-0 flex flex-col">
          <div className="border-b px-6 py-4">
             <SheetHeader>
               <SheetTitle>{company ? company.name : 'Detalle de Empresa'}</SheetTitle>
               <SheetDescription>Información general, indicadores y programas GES.</SheetDescription>
             </SheetHeader>
          </div>

          {isLoading || !company ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* CABECERA */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <span className="font-mono text-sm text-slate-500">{company.rut}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {company.contactEmail && <span>{company.contactEmail}</span>}
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className="bg-white gap-1 pl-1 pr-2 py-0.5 h-7 font-mono text-xs">
                    <Wallet className="h-3 w-3 text-emerald-600" /> Cliente activo
                  </Badge>
                </div>
              </div>

              {/* MÉTRICAS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Trabajadores</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold">{company.stats?.workersCount ?? 0}</CardContent>
                 </Card>
                 <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">GES Activos</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold text-blue-600">{company.stats?.gesCount ?? 0}</CardContent>
                 </Card>
                 <Card>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">Riesgos</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0 text-2xl font-bold text-red-600">{company.stats?.riskCount ?? 0}</CardContent>
                 </Card>
              </div>

              {/* SECCIÓN DE INFORMES TÉCNICOS (ELIMINADA COMO PEDISTE) */}

              {/* LISTA DE GES (AGRUPADA POR ÁREA) */}
              {sortedAreaNames.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 border-b bg-slate-50/50">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" /> Programas GES
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-4 space-y-6">
                    
                    {/* Iteramos por cada Área encontrada */}
                    {sortedAreaNames.map((areaName) => (
                      <div key={areaName} className="space-y-2">
                        {/* Título del Área */}
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">
                          <Layers className="h-3 w-3" />
                          {areaName}
                        </div>

                        {/* Lista de GES de esa área */}
                        <div className="space-y-1">
                          {groupedGes[areaName].map((ges: any) => (
                            <div key={ges.id} className="flex items-center justify-between py-2 px-2 hover:bg-slate-50 rounded-md transition-colors text-xs">
                              <div className="space-y-1">
                                <div className="font-semibold text-slate-800">{ges.name}</div>
                                {/* Ya no mostramos el área aquí abajo porque está en el título */}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={ges.isActive ? 'default' : 'destructive'} className="text-[10px] px-2 h-5">
                                    {ges.isActive ? 'Vigente' : 'Inactivo'}
                                </Badge>
                                <Button variant="outline" size="sm" className="gap-1 text-[11px] h-7" onClick={() => setSelectedGesId(ges.id)}>
                                  <FileText className="h-3 w-3" /> Ver documentos
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                  </CardContent>
                </Card>
              )}

            </div>
          )}
        </SheetContent>
      </Sheet>

      <GesDocumentsSheet
        gesId={selectedGesId}
        open={!!selectedGesId}
        onOpenChange={(open) => !open && setSelectedGesId(null)}
      />
    </>
  );
}