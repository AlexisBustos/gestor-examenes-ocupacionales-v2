import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building2, FileSpreadsheet, Loader2, FileText, Edit2, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GesDocumentsSheet } from '@/components/ges/GesDocumentsSheet';
import { AssignCostCenterDialog } from '@/components/finance/AssignCostCenterDialog';

interface CompanyDetailsSheetProps {
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GesItem {
  id: string;
  name: string;
  area?: {
    id: string;
    name: string;
    costCenter?: {
      id: string;
      code: string;
      name: string;
    } | null;
  };
  _count?: { riskExposures: number };
  technicalReport?: { id: string };
  nextEvaluationDate?: string;
}

export function CompanyDetailsSheet({ companyId, open, onOpenChange }: CompanyDetailsSheetProps) {
  const [selectedGesId, setSelectedGesId] = useState<string | null>(null);

  // Estado para el modal de asignar centro de costos
  const [assignCostCenterOpen, setAssignCostCenterOpen] = useState(false);
  const [selectedAreaForCostCenter, setSelectedAreaForCostCenter] = useState<{ id: string, costCenterId?: string | null } | null>(null);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data } = await axios.get(`/companies/${companyId}`);
      return data;
    },
    enabled: !!companyId && open,
  });

  // Agrupar GES por Área
  const gesByArea = useMemo(() => {
    if (!company?.gesList) return {};

    const groups: Record<string, { area: any, ges: GesItem[] }> = {};

    company.gesList.forEach((ges: GesItem) => {
      const areaId = ges.area?.id || 'unknown';
      if (!groups[areaId]) {
        groups[areaId] = {
          area: ges.area || { id: 'unknown', name: 'Sin Área Asignada' },
          ges: []
        };
      }
      groups[areaId].ges.push(ges);
    });

    return groups;
  }, [company]);

  const handleOpenAssignCostCenter = (areaId: string, currentCostCenterId?: string | null) => {
    setSelectedAreaForCostCenter({ id: areaId, costCenterId: currentCostCenterId });
    setAssignCostCenterOpen(true);
  };

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

              {/* 3. LISTADO DE GES AGRUPADO POR ÁREA */}
              <div>
                <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Estructura Operativa y Documentación
                </h3>

                <div className="space-y-6">
                  {Object.keys(gesByArea).length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground border rounded-lg">
                      No hay GES registrados.
                    </div>
                  ) : (
                    Object.values(gesByArea).map((group: any) => (
                      <div key={group.area.id} className="border rounded-lg overflow-hidden">
                        {/* HEADER DEL ÁREA */}
                        <div className="bg-slate-100 p-3 flex items-center justify-between border-b">
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            {group.area.name}
                            <span className="text-xs font-normal text-slate-500">({group.ges.length} GES)</span>
                          </div>

                          {/* CENTRO DE COSTOS */}
                          {group.area.id !== 'unknown' && (
                            <div className="flex items-center gap-2">
                              {group.area.costCenter ? (
                                <Badge variant="outline" className="bg-white gap-1 pl-1 pr-2 py-0.5 h-7 font-mono text-xs">
                                  <Wallet className="h-3 w-3 text-emerald-600" />
                                  {group.area.costCenter.code}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-white text-slate-400 border-dashed gap-1 pl-1 pr-2 py-0.5 h-7 text-xs">
                                  <Wallet className="h-3 w-3" />
                                  Sin CC
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleOpenAssignCostCenter(group.area.id, group.area.costCenter?.id)}
                              >
                                <Edit2 className="h-3 w-3 text-slate-500" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* LISTA DE GES DEL ÁREA */}
                        <div className="divide-y bg-white">
                          {group.ges.map((ges: GesItem) => {
                            const hasReport = !!ges.technicalReport;
                            const isVigente = ges.nextEvaluationDate && new Date(ges.nextEvaluationDate) > new Date();

                            return (
                              <div key={ges.id} className="p-3 pl-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div>
                                  <div className="font-medium text-sm">{ges.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Riesgos detectados: {ges._count?.riskExposures || 0}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {hasReport ? (
                                    isVigente ?
                                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 text-[10px] px-2">Vigente</Badge> :
                                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 text-[10px] px-2">Vencido</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 text-[10px] px-2">Pendiente</Badge>
                                  )}

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50 text-xs"
                                    onClick={() => setSelectedGesId(ges.id)}
                                  >
                                    <FileText className="h-3 w-3" />
                                    Docs
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* COMPONENTE FLOTANTE PARA GESTIÓN DOCUMENTAL */}
      {selectedGesId && (
        <GesDocumentsSheet
          gesId={selectedGesId}
          open={!!selectedGesId}
          onOpenChange={(open) => !open && setSelectedGesId(null)}
        />
      )}

      {/* DIÁLOGO PARA ASIGNAR CENTRO DE COSTOS */}
      {selectedAreaForCostCenter && (
        <AssignCostCenterDialog
          open={assignCostCenterOpen}
          onOpenChange={setAssignCostCenterOpen}
          areaId={selectedAreaForCostCenter.id}
          companyId={companyId}
          currentCostCenterId={selectedAreaForCostCenter.costCenterId}
        />
      )}
    </>
  );
}