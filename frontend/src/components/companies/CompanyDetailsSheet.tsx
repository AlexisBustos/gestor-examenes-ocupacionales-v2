import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { toast } from 'sonner';

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
  Trash2,
  Download,
  FileBarChart // Icono para Cuantitativos
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
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery<any>({
    queryKey: ['company-details', companyId],
    queryFn: async () => {
      const { data } = await axios.get(`/companies/${companyId}`);
      return data;
    },
    enabled: !!companyId && open,
  });

  // 1. Eliminar CUALITATIVO (Informe Técnico Padre)
  const deleteQualitativeMutation = useMutation({
    mutationFn: async (reportId: string) => {
        await axios.delete(`/companies/${companyId}/qualitative/${reportId}`);
    },
    onSuccess: () => {
        toast.success("Informe Técnico eliminado");
        queryClient.invalidateQueries({ queryKey: ['company-details', companyId] });
    },
    onError: () => toast.error("Error al eliminar informe")
  });

  // 2. Eliminar CUANTITATIVO (Informe Hijo)
  const deleteQuantitativeMutation = useMutation({
    mutationFn: async (reportId: string) => {
        await axios.delete(`/companies/${companyId}/quantitative/${reportId}`);
    },
    onSuccess: () => {
        toast.success("Informe Cuantitativo eliminado");
        queryClient.invalidateQueries({ queryKey: ['company-details', companyId] });
    },
    onError: () => toast.error("Error al eliminar informe")
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[800px] p-0 flex flex-col">
          <div className="border-b px-6 py-4">
             <SheetHeader>
               <SheetTitle>{company ? company.name : 'Detalle de Empresa'}</SheetTitle>
               <SheetDescription>Información general, indicadores y biblioteca técnica.</SheetDescription>
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

              {/* === SECCIÓN DE INFORMES TÉCNICOS (MEJORADA) === */}
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 border-b bg-slate-50/50">
                      <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4 text-orange-600" />
                          Informes Técnicos y Evaluaciones
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                      {company.technicalReports && company.technicalReports.length > 0 ? (
                          company.technicalReports.map((report: any) => (
                              <div key={report.id} className="border rounded-md bg-white overflow-hidden">
                                  
                                  {/* 1. INFORME CUALITATIVO (PADRE) */}
                                  <div className="flex items-center justify-between p-3 bg-slate-50 border-b">
                                      <div className="flex items-center gap-3">
                                          <div className="bg-orange-100 p-2 rounded text-orange-600">
                                              <FileText className="h-5 w-5" />
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-800">
                                                  Informe N° {report.reportNumber}
                                              </p>
                                              <p className="text-xs text-slate-500">
                                                  Fecha: {new Date(report.reportDate).toLocaleDateString()}
                                              </p>
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                          <Button 
                                            variant="outline" size="sm" className="h-8 gap-1 text-xs" 
                                            disabled={!report.pdfUrl} // Desactivar si no hay link
                                            asChild={!!report.pdfUrl}
                                          >
                                              {report.pdfUrl ? (
                                                  <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                      <Download className="h-3 w-3" /> PDF
                                                  </a>
                                              ) : (
                                                  <span>Sin Archivo</span>
                                              )}
                                          </Button>
                                          <Button 
                                              variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"
                                              onClick={() => {
                                                  if(confirm("¿Eliminar informe técnico y todos sus cuantitativos?")) deleteQualitativeMutation.mutate(report.id);
                                              }}
                                          >
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </div>
                                  </div>

                                  {/* 2. INFORMES CUANTITATIVOS (HIJOS) */}
                                  {report.quantitativeReports && report.quantitativeReports.length > 0 && (
                                      <div className="p-3 bg-white space-y-2 pl-12 border-l-4 border-orange-100">
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evaluaciones Cuantitativas Asociadas:</p>
                                          {report.quantitativeReports.map((quant: any) => (
                                              <div key={quant.id} className="flex items-center justify-between py-1 border-b last:border-0 border-slate-100">
                                                  <div className="flex items-center gap-2">
                                                      <FileBarChart className="h-4 w-4 text-blue-500" />
                                                      <span className="text-xs font-medium text-slate-700">{quant.name}</span>
                                                      <span className="text-[10px] text-slate-400">({new Date(quant.reportDate).toLocaleDateString()})</span>
                                                  </div>
                                                  <div className="flex gap-2">
                                                      <a 
                                                        href={quant.pdfUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className={`text-xs hover:underline flex items-center gap-1 ${!quant.pdfUrl ? 'pointer-events-none text-slate-300' : 'text-blue-600'}`}
                                                      >
                                                          <Download className="h-3 w-3" /> Ver
                                                      </a>
                                                      <button 
                                                          onClick={() => {
                                                              if(confirm("¿Eliminar evaluación cuantitativa?")) deleteQuantitativeMutation.mutate(quant.id);
                                                          }}
                                                          className="text-slate-400 hover:text-red-500"
                                                      >
                                                          <Trash2 className="h-3 w-3" />
                                                      </button>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-6 text-slate-400 text-xs italic">
                              No hay informes técnicos cargados.
                          </div>
                      )}
                  </CardContent>
              </Card>

              {/* LISTA DE GES (Sin cambios) */}
              {Array.isArray(company.gesList) && company.gesList.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 border-b bg-slate-50/50">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" /> Programas GES
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-2">
                    {company.gesList.map((ges: any) => (
                      <div key={ges.id} className="flex items-center justify-between border-b last:border-b-0 py-2 text-xs">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-800">{ges.name}</div>
                          {ges.area && <div className="text-slate-500">Área: {ges.area.name}</div>}
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