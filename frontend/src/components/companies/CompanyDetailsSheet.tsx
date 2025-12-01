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
  Edit2,
  FileText,
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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[800px]">
          <SheetHeader>
            <SheetTitle>
              {company ? company.name : 'Detalle de Empresa'}
            </SheetTitle>
            <SheetDescription>
              Información general, indicadores y riesgos asociados a la
              empresa.
            </SheetDescription>
          </SheetHeader>

          {isLoading || !company ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Resumen principal */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <span className="font-mono text-sm text-slate-500">
                      {company.rut}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {company.name}
                  </h2>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {company.contactEmail && (
                      <span>{company.contactEmail}</span>
                    )}
                    {company.phone && (
                      <span className="inline-flex items-center gap-1">
                        • {company.phone}
                      </span>
                    )}
                    {company.address && (
                      <span className="inline-flex items-center gap-1">
                        • {company.address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-white gap-1 pl-1 pr-2 py-0.5 h-7 font-mono text-xs"
                  >
                    <Wallet className="h-3 w-3 text-emerald-600" />
                    Cliente activo
                  </Badge>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-xs"
                    // Sólo para UI; CompaniesPage maneja la edición real
                    onClick={() => {
                      // Podrías disparar algo global si quisieras
                    }}
                  >
                    <Edit2 className="h-3 w-3 text-slate-500" />
                    Editar
                  </Button>
                </div>
              </div>

              {/* Tarjetas de métricas (usamos stats si vienen, si no 0) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Trabajadores</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-2xl font-bold">
                    {company.stats?.workersCount ?? 0}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">GES Activos</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-2xl font-bold text-blue-600">
                    {company.stats?.gesCount ?? 0}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Riesgos</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-2xl font-bold text-red-600">
                    {company.stats?.riskCount ?? 0}
                  </CardContent>
                </Card>
              </div>

              {/* Sección de GES asociados (si el backend expone algo así) */}
              {Array.isArray(company.gesList) && company.gesList.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Programas GES
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-2">
                    {company.gesList.map((ges: any) => (
                      <div
                        key={ges.id}
                        className="flex items-center justify-between border-b last:border-b-0 py-2 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800">
                            {ges.name}
                          </div>
                          {ges.area && (
                            <div className="text-slate-500">
                              Área: {ges.area.name}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {ges.isActive ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 text-[10px] px-2">
                              Vigente
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 text-[10px] px-2">
                              Inactivo
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-[11px]"
                            onClick={() => setSelectedGesId(ges.id)}
                          >
                            <FileText className="h-3 w-3" />
                            Ver documentos
                          </Button>
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

      {/* Sheet para documentos del GES */}
      <GesDocumentsSheet
        gesId={selectedGesId}
        open={!!selectedGesId}
        onOpenChange={(open) => !open && setSelectedGesId(null)}
      />
    </>
  );
}
