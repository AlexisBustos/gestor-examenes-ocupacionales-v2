import { useEffect, useState, useMemo } from 'react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; 
import { CompaniesService } from '../../services/companies.service'; 
import { 
    createRisk, deleteRisk, sendRiskDistribution, getRecipientCount, getGlobalHistory 
} from '../../services/risk.service';

import type { RiskAgent, OdiDelivery } from '../../services/risk.service';
import type { Company } from '../../services/companies.service'; 

import { 
    Shield, Upload, FileText, Trash2, Search, Send, CheckCircle2, 
    X, CheckSquare, Building2, User, History, LayoutGrid,
    Megaphone, Info, Plus, Loader2, Clock, Receipt, Briefcase, Stethoscope, AlertTriangle
} from 'lucide-react';

export default function RiskManagement() {
  const { user } = useAuth(); 
  const canEdit = user?.role === 'ADMIN_VITAM';

  // TABS
  const [activeTab, setActiveTab] = useState<'LIBRARY' | 'HISTORY'>('LIBRARY');
  const [createMode, setCreateMode] = useState<'PROTOCOL' | 'CAMPAIGN'>('PROTOCOL');

  // ESTADOS BIBLIOTECA
  const [risks, setRisks] = useState<RiskAgent[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // ESTADOS HISTORIAL
  const [history, setHistory] = useState<OdiDelivery[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // MODAL DE ENVÍO
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskAgent | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  
  // FILTROS AVANZADOS
  const [targetMode, setTargetMode] = useState<'INDIVIDUAL' | 'COMPANY' | 'COST_CENTER' | 'AREA' | 'GES' | 'RISK_AGENT'>('INDIVIDUAL');
  const [targetValue, setTargetValue] = useState('');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [workerSearchTerm, setWorkerSearchTerm] = useState(''); 

  // DATOS PARA COMBOS (Todos iniciados como arrays vacíos)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [costCentersList, setCostCentersList] = useState<any[]>([]);
  const [areasList, setAreasList] = useState<any[]>([]); // Corrección: any[] porque son objetos
  const [gesList, setGesList] = useState<any[]>([]);
  const [riskAgentsList, setRiskAgentsList] = useState<any[]>([]);
  const [workersList, setWorkersList] = useState<any[]>([]);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('Adjunto encontrará la documentación actualizada...');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadLibraryData();
    loadFiltersData();
  }, []);

  useEffect(() => {
    if (activeTab === 'HISTORY') loadHistoryData();
  }, [activeTab]);

  useEffect(() => {
    const calculate = async () => {
      if (targetMode === 'INDIVIDUAL') {
        setRecipientCount(1);
      } else if (targetValue) {
        try {
            const count = await getRecipientCount(targetMode, targetValue);
            setRecipientCount(count);
        } catch { setRecipientCount(0); }
      } else {
        setRecipientCount(null);
      }
    };
    calculate();
  }, [targetMode, targetValue]);

  const loadLibraryData = async () => {
    try {
      const data = (await axios.get('/risks')).data;
      const formatted = data.map((r: any) => ({
          ...r,
          documents: r.protocols ? r.protocols.map((p: any) => ({ id: p.id, title: p.name, publicUrl: p.url })) : []
      }));
      setRisks(formatted);
    } catch (e) { console.error("Error riesgos", e); }
  };

  const loadFiltersData = async () => {
      try {
          const comps = await CompaniesService.findAll();
          setCompanies(comps);

          const filters = (await axios.get('/risks/filters')).data;
          setCostCentersList(filters.costCenters || []);
          setAreasList(filters.areas || []); // Ahora recibimos objetos {id, name}
          setGesList(filters.gesGroups || []);
          setRiskAgentsList(filters.riskAgents || []);

          const workersRes = await axios.get('/workers?limit=1000').catch(() => ({ data: [] }));
          const wData = Array.isArray(workersRes.data) ? workersRes.data : (workersRes.data.data || []);
          setWorkersList(wData);

      } catch (e) { console.error("Error filtros", e); }
  };

  const loadHistoryData = async () => {
    setLoadingHistory(true);
    try {
        const data = await getGlobalHistory();
        setHistory(data);
    } catch { } finally { setLoadingHistory(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!name) return toast.error('Nombre obligatorio');
    setLoading(true);
    try {
      let finalName = name;
      if (createMode === 'CAMPAIGN' && !name.toUpperCase().startsWith('[CAMPAÑA]')) finalName = `[CAMPAÑA] ${name}`;
      await createRisk(finalName, description, file);
      setName(''); setDescription(''); setFile(null);
      await loadLibraryData(); 
      toast.success('Guardado'); 
    } catch { toast.error('Error al guardar'); } finally { setLoading(false); }
  };

  const handleAddProtocol = async (riskId: string, file: File) => {
    if (!canEdit) return;
    setUploadingId(riskId);
    const formData = new FormData();
    formData.append('file', file);
    try {
        await axios.post(`/risks/${riskId}/protocols`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Agregado');
        loadLibraryData();
    } catch { toast.error('Error subiendo'); } finally { setUploadingId(null); }
  };

  const handleDeleteProtocol = async (pid: string) => {
      if (!canEdit || !confirm('¿Eliminar?')) return;
      try { await axios.delete(`/risks/protocols/${pid}`); toast.success('Eliminado'); loadLibraryData(); } 
      catch { toast.error('Error eliminando'); }
  };

  const handleDeleteRisk = async (id: string) => {
    if (!canEdit || !confirm('¿Eliminar todo?')) return;
    try { await deleteRisk(id); loadLibraryData(); toast.success("Eliminado"); } 
    catch { toast.error('Error'); }
  };

  const handleBulkSend = (risk: RiskAgent) => {
    setSelectedRisk(risk);
    const isCampaign = risk.name.startsWith('[CAMPAÑA]');
    setEmailSubject(isCampaign ? `INFORMACIÓN: ${risk.name.replace('[CAMPAÑA]', '').trim()}` : `DOCUMENTACIÓN: Protocolo ${risk.name}`);
    if (risk.documents) setSelectedDocs(risk.documents.map(d => d.id));
    setTargetMode('INDIVIDUAL'); setTargetValue(''); setRecipientCount(1); setWorkerSearchTerm('');
    setIsModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk || !targetValue) return toast.error('Faltan datos');
    if (targetMode !== 'INDIVIDUAL' && !confirm(`¿Enviar a ${recipientCount} personas?`)) return;

    setSending(true);
    try {
        await sendRiskDistribution(selectedRisk.id, targetMode, targetValue, targetMode === 'INDIVIDUAL' ? targetValue : '', emailSubject, emailMessage, selectedDocs);
        toast.success(`Enviando...`); setIsModalOpen(false);
        if (activeTab === 'HISTORY') loadHistoryData();
    } catch { toast.error('Error envío'); } finally { setSending(false); }
  };

  const toggleDocument = (id: string) => setSelectedDocs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const filteredRisks = risks.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const workerOptions = useMemo(() => {
      if(!workerSearchTerm) return [];
      return workersList.filter(w => w.name.toLowerCase().includes(workerSearchTerm.toLowerCase()) || w.rut.includes(workerSearchTerm)).slice(0, 5);
  }, [workerSearchTerm, workersList]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 relative">
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center gap-4 mb-6">
            <div><h1 className="text-2xl font-semibold text-slate-800">Gestión Documental (ODI)</h1><p className="text-sm text-slate-500">Biblioteca legal y distribución.</p></div>
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button onClick={() => setActiveTab('LIBRARY')} className={`px-4 py-2 text-sm font-medium rounded-md flex gap-2 ${activeTab === 'LIBRARY' ? 'bg-primary/10 text-primary' : 'text-slate-500'}`}><LayoutGrid className="h-4 w-4" /> Biblioteca</button>
                <button onClick={() => setActiveTab('HISTORY')} className={`px-4 py-2 text-sm font-medium rounded-md flex gap-2 ${activeTab === 'HISTORY' ? 'bg-primary/10 text-primary' : 'text-slate-500'}`}><History className="h-4 w-4" /> Historial</button>
            </div>
        </div>
      </div>

      {activeTab === 'LIBRARY' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            <div className="lg:col-span-4">
                {canEdit ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-6">
                        <h2 className="text-sm font-semibold mb-4 flex gap-2"><Upload className="h-4 w-4" /> Nuevo Registro</h2>
                        <div className="grid grid-cols-2 gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
                            <button onClick={() => setCreateMode('PROTOCOL')} className={`py-1.5 text-xs rounded-md ${createMode === 'PROTOCOL' ? 'bg-white shadow-sm' : ''}`}>Protocolo</button>
                            <button onClick={() => setCreateMode('CAMPAIGN')} className={`py-1.5 text-xs rounded-md ${createMode === 'CAMPAIGN' ? 'bg-white shadow-sm' : ''}`}>Campaña</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input className="w-full p-2.5 border rounded-lg text-sm" placeholder="Nombre..." value={name} onChange={e => setName(e.target.value)} />
                            <textarea className="w-full p-2.5 border rounded-lg text-sm h-24" placeholder="Detalles..." value={description} onChange={e => setDescription(e.target.value)} />
                            <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed rounded-lg cursor-pointer bg-slate-50">
                                <div className={`p-2 rounded-full mb-2 ${file ? 'bg-green-100 text-green-600' : 'bg-white'}`}>{file ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}</div>
                                <p className="text-xs text-slate-500">{file ? file.name : "Subir PDF"}</p>
                                <input type="file" className="hidden" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
                            </label>
                            <button disabled={loading} className="w-full py-2.5 bg-primary text-white rounded-lg">{loading ? '...' : 'Guardar'}</button>
                        </form>
                    </div>
                ) : (
                    // ✨ PANEL EMPRESA ✨
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-6">
                        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Centro de Difusión</h2>
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                            <p className="text-sm font-medium text-slate-700 mb-2">Gestión de Documentación ODI</p>
                            <p className="text-xs text-slate-500 mb-4">Utiliza las herramientas para gestionar la seguridad:</p>
                            <ul className="space-y-3">
                                <li className="flex gap-2 text-xs text-slate-600"><div className="bg-white p-1 rounded border text-primary"><Search className="h-3 w-3" /></div> <span className="mt-0.5"><strong>Busca y Filtra</strong> riesgos.</span></li>
                                <li className="flex gap-2 text-xs text-slate-600"><div className="bg-white p-1 rounded border text-red-500"><FileText className="h-3 w-3" /></div> <span className="mt-0.5"><strong>Descarga</strong> PDFs vigentes.</span></li>
                                <li className="flex gap-2 text-xs text-slate-600"><div className="bg-white p-1 rounded border text-primary"><Send className="h-3 w-3" /></div> <span className="mt-0.5"><strong>Difusión Masiva</strong> a trabajadores.</span></li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
                    <div className="px-6 py-4 border-b border-slate-50 flex gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 border rounded-full text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 text-xs text-slate-500 uppercase"><tr><th className="px-6 py-3">Nombre</th><th className="px-6 py-3">Docs</th><th className="px-6 py-3 text-right">Acción</th></tr></thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRisks.map(r => (
                                    <tr key={r.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 w-1/3">
                                            <div className="flex items-center gap-2">{r.name.startsWith('[CAMPAÑA]') ? <Megaphone className="h-3 w-3 text-secondary" /> : <Shield className="h-3 w-3 text-primary" />}<span className="text-sm font-medium">{r.name.replace('[CAMPAÑA]', '')}</span></div>
                                            <p className="text-xs text-slate-400 pl-5">{r.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {r.documents?.map((d: any) => (
                                                <div key={d.id} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded mb-1 group/doc">
                                                    <FileText className="h-3 w-3 text-red-500" /><a href={d.publicUrl} target="_blank" className="text-xs truncate w-32">{d.title}</a>
                                                    {canEdit && <button onClick={() => handleDeleteProtocol(d.id)} className="ml-auto opacity-0 group-hover/doc:opacity-100 text-slate-300 hover:text-red-500"><X className="h-3 w-3" /></button>}
                                                </div>
                                            ))}
                                            {canEdit && <div className="relative mt-2"><input type="file" id={`add-${r.id}`} className="hidden" onChange={e => e.target.files && handleAddProtocol(r.id, e.target.files[0])} /><label htmlFor={`add-${r.id}`}><button onClick={() => document.getElementById(`add-${r.id}`)?.click()} className="flex gap-1 text-[10px] text-primary">{uploadingId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Agregar PDF</button></label></div>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleBulkSend(r)} disabled={!r.documents?.length} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded disabled:opacity-30"><Send className="h-4 w-4" /></button>
                                                {canEdit && <button onClick={() => handleDeleteRisk(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {isModalOpen && selectedRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex gap-2"><Send className="h-4 w-4 text-primary" /> Difundir</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-5">
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase mb-2">1. Adjuntos:</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedRisk.documents.map(d => (
                        <label key={d.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded"><div onClick={(e) => {e.preventDefault(); toggleDocument(d.id)}} className={`h-4 w-4 rounded border flex items-center justify-center ${selectedDocs.includes(d.id) ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>{selectedDocs.includes(d.id) && <CheckSquare className="h-3 w-3 text-white" />}</div><span className="text-xs truncate">{d.title}</span></label>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">2. Destinatarios:</p>
                <div className="grid grid-cols-6 gap-1 mb-3 bg-slate-100 p-1 rounded-lg">
                    {[
                        { id: 'INDIVIDUAL', icon: User, label: 'Indiv.' },
                        { id: 'COMPANY', icon: Building2, label: 'Empresa' },
                        { id: 'COST_CENTER', icon: Receipt, label: 'Centro' },
                        { id: 'AREA', icon: Briefcase, label: 'Área' },
                        { id: 'GES', icon: Stethoscope, label: 'GES' },
                        { id: 'RISK_AGENT', icon: AlertTriangle, label: 'Agente' }
                    ].map(m => (
                        <button type="button" key={m.id} onClick={() => { setTargetMode(m.id as any); setTargetValue(''); }} className={`flex flex-col items-center py-2 text-[9px] rounded ${targetMode === m.id ? 'bg-white text-primary shadow-sm font-semibold' : 'text-slate-500 hover:bg-slate-200'}`}>
                            <m.icon className="h-3 w-3 mb-1" /> {m.label}
                        </button>
                    ))}
                </div>

                {targetMode === 'INDIVIDUAL' ? (
                    <div className="relative">
                        <input className="w-full p-2.5 border rounded-lg text-sm" placeholder="Buscar trabajador..." value={workerSearchTerm} onChange={e => {setWorkerSearchTerm(e.target.value); setTargetValue('')}} />
                        {workerSearchTerm && !targetValue && (
                            <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                                {workerOptions.map(w => (
                                    <div key={w.id} onClick={() => {setTargetValue(w.email); setWorkerSearchTerm(`${w.name} (${w.rut})`)}} className="p-2 hover:bg-slate-50 cursor-pointer text-xs border-b">
                                        <p className="font-bold">{w.name}</p><p className="text-slate-400">{w.company?.name}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {targetValue && <p className="text-xs text-green-600 mt-1 flex gap-1"><CheckCircle2 className="h-3 w-3" /> Email: {targetValue}</p>}
                    </div>
                ) : (
                    <select className="w-full p-2.5 border rounded-lg text-sm" value={targetValue} onChange={e => setTargetValue(e.target.value)}>
                        <option value="">-- Seleccionar --</option>
                        {targetMode === 'COMPANY' && companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        {targetMode === 'COST_CENTER' && costCentersList.map(cc => <option key={cc.id} value={cc.id}>{cc.code} - {cc.name} ({cc.company?.name})</option>)}
                        {/* 🌟 AQUÍ ESTÁ EL FIX: USAR a.id y a.name (porque son objetos) */}
                        {targetMode === 'AREA' && areasList.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        {targetMode === 'GES' && gesList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        {targetMode === 'RISK_AGENT' && riskAgentsList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">3. Mensaje:</label>
                <input className="w-full mb-2 p-2 border rounded-lg text-sm mt-1" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                <textarea className="w-full p-2 border rounded-lg text-sm h-16 resize-none" value={emailMessage} onChange={e => setEmailMessage(e.target.value)} />
              </div>

              <div className="pt-2 flex gap-3 justify-end border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                <button type="submit" disabled={sending || !targetValue} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded shadow-md disabled:opacity-50">
                  {sending ? 'Enviando...' : `Enviar ✈️ ${recipientCount !== null && targetMode !== 'INDIVIDUAL' ? `(${recipientCount})` : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}