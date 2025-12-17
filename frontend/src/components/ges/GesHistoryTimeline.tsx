// frontend/src/components/ges/GesHistoryTimeline.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertTriangle,
  FileText,
  CircleDot,
  CheckCircle2,
  Clock3,
  XCircle,
  ChevronDown,
  ChevronRight,
  ShieldAlert, // 👈 Nuevo icono para el Agente
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface GesHistoryTimelineProps {
  gesId: string | null;
}

type PrescriptionStatus = "PENDIENTE" | "EN_PROCESO" | "REALIZADA" | "VENCIDA";
type FilterStatus = "ALL" | PrescriptionStatus;

export function GesHistoryTimeline({ gesId }: GesHistoryTimelineProps) {
  const { data, isLoading, isError } = useQuery<any>({
    queryKey: ["ges-history", gesId],
    queryFn: async () => {
      if (!gesId) throw new Error("No GES ID");
      const { data } = await axios.get(`/ges/${gesId}/history`);
      return data;
    },
    enabled: !!gesId,
  });

  const [expandedQuali, setExpandedQuali] = useState(true);
  
  // Estado para expandir Cuantitativos
  const [expandedQuant, setExpandedQuant] = useState<Record<string, boolean>>({});
  
  // 👇 Estado para expandir TMERT (Nuevo)
  const [expandedTmert, setExpandedTmert] = useState<Record<string, boolean>>({});
  
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");

  if (!gesId) return null;

  if (isLoading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        Cargando historial del GES...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mt-6 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
        <AlertTriangle className="h-3 w-3" />
        No se pudo cargar el historial de este GES.
      </div>
    );
  }

  const tech = data.technicalReport;
  const quantList = tech?.quantitativeReports || [];
  const tmertList = data.tmertReports || []; // 👈 Obtenemos los TMERT

  // Consolidamos TODAS las prescripciones para los contadores
  const allPrescriptions = [
    ...(tech?.prescriptions || []),
    ...quantList.flatMap((q: any) => q.prescriptions || []),
    ...tmertList.flatMap((t: any) => t.prescriptions || []), // 👈 Incluimos TMERT
  ];

  const countByStatus: Record<FilterStatus, number> = {
    ALL: allPrescriptions.length,
    PENDIENTE: allPrescriptions.filter((p: any) => p.status === "PENDIENTE").length,
    EN_PROCESO: allPrescriptions.filter((p: any) => p.status === "EN_PROCESO").length,
    REALIZADA: allPrescriptions.filter((p: any) => p.status === "REALIZADA").length,
    VENCIDA: allPrescriptions.filter((p: any) => p.status === "VENCIDA").length,
  };

  const filterPrescriptions = (list: any[]) => {
    if (statusFilter === "ALL") return list;
    return list.filter((p) => p.status === statusFilter);
  };

  const getStatusIcon = (status: PrescriptionStatus) => {
    if (status === "REALIZADA")
      return <CheckCircle2 className="h-3 w-3 text-emerald-600" />;
    if (status === "VENCIDA")
      return <XCircle className="h-3 w-3 text-red-600" />;
    if (status === "EN_PROCESO")
      return <Clock3 className="h-3 w-3 text-primary" />;
    return <CircleDot className="h-3 w-3 text-amber-500" />;
  };

  const getStatusLabel = (status: FilterStatus) => {
    if (status === "ALL") return "Todos";
    if (status === "PENDIENTE") return "Pendientes";
    if (status === "EN_PROCESO") return "En proceso";
    if (status === "REALIZADA") return "Realizadas";
    if (status === "VENCIDA") return "Vencidas";
    return status;
  };

  const filterOptions: FilterStatus[] = [
    "ALL",
    "PENDIENTE",
    "EN_PROCESO",
    "REALIZADA",
    "VENCIDA",
  ];

  // --- COMPONENTE AUXILIAR PARA RENDERIZAR LA LISTA DE MEDIDAS ---
  // Esto evita repetir código en cada sección
  const renderPrescriptionsList = (list: any[]) => {
    const filtered = filterPrescriptions(list || []);
    
    if (filtered.length === 0) {
        return (
            <p className="text-[11px] text-slate-400 italic ml-1">
                Sin medidas para este filtro.
            </p>
        );
    }

    return (
        <ul className="space-y-2 ml-1 pr-2">
          {filtered.map((p: any) => (
            <li key={p.id} className="flex items-start gap-2 text-[11px] text-slate-700">
              <div className="mt-0.5 shrink-0">
                {getStatusIcon(p.status)}
              </div>
              
              <div className="flex-1 min-w-0 break-words">
                {/* 🌟 AQUÍ ESTÁ EL CAMBIO: MOSTRAR AGENTE */}
                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                    {p.riskAgent && (
                        <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 gap-1">
                            <ShieldAlert className="h-2 w-2" />
                            {p.riskAgent.name}
                        </Badge>
                    )}
                    <span className="font-semibold text-slate-800">
                        {p.folio || "Medida"}:
                    </span>
                </div>
                
                <p className="text-slate-600 leading-snug">
                    {p.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
    );
  };

  return (
    <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
      <Card className="bg-slate-50/80 border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-800">
              Historial del GES
            </h3>
            <Badge variant="outline" className="ml-1 text-[10px]">
              {data.name}
            </Badge>
          </div>

          {/* Resumen & filtros */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-medium">
              Área: <span className="font-normal">{data.area?.name}</span>
            </span>
            <span>•</span>
            <span>
              Centro:{" "}
              <span className="font-normal">
                {data.area?.workCenter?.name}
              </span>
            </span>
            <span>•</span>
            <span>
              Empresa:{" "}
              <span className="font-normal">
                {data.area?.workCenter?.company?.name}
              </span>
            </span>
            {data.nextEvaluationDate && (
              <>
                <span>•</span>
                <span className="font-medium text-emerald-700">
                  Próx. evaluación:{" "}
                  {new Date(data.nextEvaluationDate).toLocaleDateString()}
                </span>
              </>
            )}

            <div className="ml-auto flex flex-wrap gap-1 items-center mt-2 sm:mt-0">
              <span className="text-[11px] text-slate-500 mr-1">
                Filtrar medidas:
              </span>
              {filterOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatusFilter(opt)}
                  className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                    statusFilter === opt
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {getStatusLabel(opt)} ({countByStatus[opt]})
                </button>
              ))}
            </div>
          </div>

          {/* TIMELINE */}
          <div className="relative pl-5 mt-2">
            {/* Línea vertical animada */}
            <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-slate-300 via-slate-400 to-slate-300 animate-pulse" />

            {/* === 1. CUALITATIVO === */}
            {tech ? (
              <div className="relative mb-6 pl-4">
                <div className="absolute left-[-6px] top-1">
                  <CircleDot className="h-3 w-3 text-primary bg-slate-50 rounded-full" />
                </div>

                <button
                  onClick={() => setExpandedQuali(!expandedQuali)}
                  className="flex items-start gap-2 w-full text-left"
                >
                  <div className="mt-0.5 shrink-0">
                    {expandedQuali ? (
                      <ChevronDown className="h-4 w-4 text-slate-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    )}
                  </div>

                  <Badge className="bg-primary hover:bg-primary/90 shrink-0 mt-0.5">
                    Cualitativa
                  </Badge>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 break-words leading-tight">
                      {new Date(tech.reportDate).toLocaleDateString()} · Folio{" "}
                      {tech.reportNumber}
                    </p>
                  </div>

                  <span className="ml-2 text-[11px] text-slate-500 shrink-0 whitespace-nowrap mt-0.5">
                    Medidas: <strong>{tech.prescriptions?.length || 0}</strong>
                  </span>
                </button>

                {expandedQuali && (
                  <div className="mt-2 pl-6 animate-in fade-in duration-300 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText className="h-3 w-3 shrink-0" />
                      <span>Informe base del GES.</span>
                      {tech.pdfUrl && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[11px] ml-1"
                        >
                          <a
                            href={tech.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ver PDF
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Lista Renderizada con Agentes */}
                    {renderPrescriptionsList(tech.prescriptions)}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic pl-4 mb-4">
                Aún no se ha cargado una evaluación cualitativa.
              </p>
            )}

            {/* === 2. CUANTITATIVOS === */}
            {quantList.map((q: any, idx: number) => {
              const isOpen = expandedQuant[q.id] ?? false;

              return (
                <div key={q.id} className="relative mb-6 pl-4 last:mb-0">
                  <div className="absolute left-[-6px] top-1">
                    <CircleDot className="h-3 w-3 text-purple-600 bg-slate-50 rounded-full" />
                  </div>

                  <button
                    onClick={() =>
                      setExpandedQuant({
                        ...expandedQuant,
                        [q.id]: !isOpen,
                      })
                    }
                    className="flex items-start gap-2 w-full text-left"
                  >
                    <div className="mt-0.5 shrink-0">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-slate-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                      )}
                    </div>

                    <Badge className="bg-purple-600 hover:bg-purple-700 shrink-0 mt-0.5">
                      Cuantitativa {idx + 1}
                    </Badge>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 break-words leading-tight">
                        {new Date(q.reportDate).toLocaleDateString()} · {q.name}
                      </p>
                    </div>

                    <span className="ml-2 text-[11px] text-slate-500 shrink-0 whitespace-nowrap mt-0.5">
                      Medidas: <strong>{q.prescriptions?.length || 0}</strong>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-2 pl-6 animate-in fade-in duration-300 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span>Medición específica.</span>
                        {q.pdfUrl && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[11px] ml-1"
                          >
                            <a
                              href={q.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Ver PDF
                            </a>
                          </Button>
                        )}
                      </div>

                      {/* Lista Renderizada con Agentes */}
                      {renderPrescriptionsList(q.prescriptions)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* === 3. TMERT (NUEVA SECCIÓN) === */}
            {tmertList.map((t: any, idx: number) => {
                const isOpen = expandedTmert[t.id] ?? false;

                return (
                  <div key={t.id} className="relative mb-6 pl-4 last:mb-0">
                    <div className="absolute left-[-6px] top-1">
                      <CircleDot className="h-3 w-3 text-orange-500 bg-slate-50 rounded-full" />
                    </div>
  
                    <button
                      onClick={() =>
                        setExpandedTmert({
                          ...expandedTmert,
                          [t.id]: !isOpen,
                        })
                      }
                      className="flex items-start gap-2 w-full text-left"
                    >
                      <div className="mt-0.5 shrink-0">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-slate-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-600" />
                        )}
                      </div>
  
                      <Badge className="bg-orange-500 hover:bg-orange-600 shrink-0 mt-0.5">
                        TMERT
                      </Badge>
  
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500 break-words leading-tight">
                          {new Date(t.reportDate).toLocaleDateString()} · {t.name}
                        </p>
                      </div>
  
                      <span className="ml-2 text-[11px] text-slate-500 shrink-0 whitespace-nowrap mt-0.5">
                        Medidas: <strong>{t.prescriptions?.length || 0}</strong>
                      </span>
                    </button>
  
                    {isOpen && (
                      <div className="mt-2 pl-6 animate-in fade-in duration-300 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <FileText className="h-3 w-3 shrink-0" />
                          <span>Informe TMERT.</span>
                          {t.pdfUrl && (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[11px] ml-1"
                            >
                              <a
                                href={t.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Ver PDF
                              </a>
                            </Button>
                          )}
                        </div>
  
                        {/* Lista Renderizada con Agentes */}
                        {renderPrescriptionsList(t.prescriptions)}
                      </div>
                    )}
                  </div>
                );
            })}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}