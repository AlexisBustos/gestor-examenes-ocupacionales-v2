// frontend/src/components/ges/GesHistoryTimeline.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

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
  const [expandedQuant, setExpandedQuant] = useState<Record<string, boolean>>(
    {}
  );
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

  const allPrescriptions = [
    ...(tech?.prescriptions || []),
    ...quantList.flatMap((q: any) => q.prescriptions || []),
  ];

  const countByStatus: Record<FilterStatus, number> = {
    ALL: allPrescriptions.length,
    PENDIENTE: allPrescriptions.filter((p: any) => p.status === "PENDIENTE")
      .length,
    EN_PROCESO: allPrescriptions.filter(
      (p: any) => p.status === "EN_PROCESO"
    ).length,
    REALIZADA: allPrescriptions.filter(
      (p: any) => p.status === "REALIZADA"
    ).length,
    VENCIDA: allPrescriptions.filter((p: any) => p.status === "VENCIDA")
      .length,
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
      return <Clock3 className="h-3 w-3 text-blue-600" />;
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

  return (
    <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="bg-slate-50/80 border-slate-200 shadow-sm">
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

            <div className="ml-auto flex flex-wrap gap-1 items-center">
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

            {/* === CUALITATIVO === */}
            {tech ? (
              <div className="relative mb-6 pl-4">
                <div className="absolute left-[-6px] top-1">
                  <CircleDot className="h-3 w-3 text-blue-600 bg-slate-50 rounded-full" />
                </div>

                <button
                  onClick={() => setExpandedQuali(!expandedQuali)}
                  className="flex items-center gap-2 w-full text-left"
                >
                  {expandedQuali ? (
                    <ChevronDown className="h-4 w-4 text-slate-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  )}

                  <Badge className="bg-blue-600 hover:bg-blue-700">
                    Cualitativa
                  </Badge>

                  <span className="text-xs text-slate-500">
                    {new Date(tech.reportDate).toLocaleDateString()} · Folio{" "}
                    {tech.reportNumber}
                  </span>

                  <span className="ml-auto text-[11px] text-slate-500">
                    Medidas:{" "}
                    <strong>{tech.prescriptions?.length || 0}</strong>
                  </span>
                </button>

                {expandedQuali && (
                  <div className="mt-2 pl-6 animate-in fade-in duration-300 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileText className="h-3 w-3" />
                      <span>Informe base del GES.</span>
                      {tech.pdfUrl && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[11px]"
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

                    {/* Prescripciones filtradas */}
                    {filterPrescriptions(tech.prescriptions || []).length ? (
                      <ul className="space-y-1 ml-1">
                        {filterPrescriptions(tech.prescriptions || []).map(
                          (p: any) => (
                            <li
                              key={p.id}
                              className="flex items-start gap-2 text-[11px] text-slate-700"
                            >
                              {getStatusIcon(p.status)}
                              <span>
                                <strong>{p.folio || "Medida"}:</strong>{" "}
                                {p.description}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic ml-1">
                        Sin medidas para este filtro.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic pl-4">
                Aún no se ha cargado una evaluación cualitativa para este GES.
              </p>
            )}

            {/* === CUANTITATIVOS === */}
            {quantList.map((q: any, idx: number) => {
              const isOpen = expandedQuant[q.id] ?? false;
              const filteredQPresc = filterPrescriptions(q.prescriptions || []);

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
                    className="flex items-center gap-2 w-full text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    )}

                    <Badge className="bg-purple-600 hover:bg-purple-700">
                      Cuantitativa {idx + 1}
                    </Badge>

                    <span className="text-xs text-slate-500">
                      {new Date(q.reportDate).toLocaleDateString()} · {q.name}
                    </span>

                    <span className="ml-auto text-[11px] text-slate-500">
                      Medidas: <strong>{q.prescriptions?.length || 0}</strong>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-2 pl-6 animate-in fade-in duration-300 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <FileText className="h-3 w-3" />
                        <span>Medición específica asociada al GES.</span>
                        {q.pdfUrl && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[11px]"
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

                      {filteredQPresc.length ? (
                        <ul className="space-y-1 ml-1">
                          {filteredQPresc.map((p: any) => (
                            <li
                              key={p.id}
                              className="flex items-start gap-2 text-[11px] text-slate-700"
                            >
                              {getStatusIcon(p.status)}
                              <span>
                                <strong>{p.folio || "Medida"}:</strong>{" "}
                                {p.description}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic ml-1">
                          Sin medidas para este filtro.
                        </p>
                      )}
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
