import { useEffect, useState } from 'react';
import { CompaniesService } from '../../services/companies.service'; 
import { 
    createRisk, getRisks, deleteRisk, sendRiskDistribution, getRecipientCount, getGlobalHistory 
} from '../../services/risk.service';

import type { RiskAgent, OdiDelivery } from '../../services/risk.service';
import type { Company } from '../../services/companies.service'; 

import { 
    Shield, Upload, FileText, Trash2, Search, Send, CheckCircle2, 
    X, CheckSquare, Building2, User, History, LayoutGrid, AlertCircle,
    Megaphone, Info
} from 'lucide-react';

export default function RiskManagement() {
  // --- TABS PRINCIPALES ---
  const [activeTab, setActiveTab] = useState<'LIBRARY' | 'HISTORY'>('LIBRARY');

  // --- TABS DEL FORMULARIO ---
  const [createMode, setCreateMode] = useState<'PROTOCOL' | 'CAMPAIGN'>('PROTOCOL');

  // --- ESTADOS BIBLIOTECA ---
  const [risks, setRisks] = useState<RiskAgent[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // --- ESTADOS HISTORIAL ---
  const [history, setHistory] = useState<OdiDelivery[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // --- ESTADOS DEL MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<RiskAgent | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  
  // Configuración del Envío
  const [targetMode, setTargetMode] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');
  const [targetEmail, setTargetEmail] = useState(''); 
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('Adjunto encontrará la documentación actualizada...');
  const [sending, setSending] = useState(false);

  // Lista de Empresas
  const [companies, setCompanies] = useState<Company[]>([]);

  // CARGA INICIAL
  useEffect(() => {
    loadLibraryData();
  }, []);

  // EFECTO: Cargar historial
  useEffect(() => {
    if (activeTab === 'HISTORY') {
        loadHistoryData();
    }
  }, [activeTab]);

  // EFECTO: Contador de destinatarios
  useEffect(() => {
    const calculate = async () => {
      if (targetMode === 'INDIVIDUAL') {
        setRecipientCount(1);
      } else if (targetMode === 'COMPANY' && targetCompanyId) {
        try {
            const count = await getRecipientCount('COMPANY', targetCompanyId);
            setRecipientCount(count);
        } catch (error) {
            setRecipientCount(0);
        }
      } else {
        setRecipientCount(null);
      }
    };
    calculate();
  }, [targetMode, targetCompanyId]);

  const loadLibraryData = async () => {
    try {
      const [risksData, companiesData] = await Promise.all([
        getRisks(),
        CompaniesService.findAll()
      ]);
      setRisks(risksData);
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error cargando biblioteca", error);
    }
  };

  const loadHistoryData = async () => {
    setLoadingHistory(true);
    try {
        const data = await getGlobalHistory();
        setHistory(data);
    } catch (error) {
        console.error("Error cargando historial", error);
    } finally {
        setLoadingHistory(false);
    }
  };

  // --- LÓGICA DE GUARDADO (CRUD) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('El nombre es obligatorio');
    setLoading(true);
    
    try {
      let finalName = name;
      if (createMode === 'CAMPAIGN' && !name.toUpperCase().startsWith('[CAMPAÑA]')) {
          finalName = `[CAMPAÑA] ${name}`;
      }

      await createRisk(finalName, description, file);
      
      // Limpieza
      setName(''); setDescription(''); setFile(null);
      await loadLibraryData(); 
      alert(createMode === 'PROTOCOL' ? '✅ Protocolo Legal guardado' : '✅ Campaña Informativa guardada'); 
    } catch (error) {
      alert('❌ Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro y sus documentos?')) return;
    try {
      await deleteRisk(id);
      loadLibraryData();
    } catch (error) { alert('Error al eliminar'); }
  };

  const handleBulkSend = (risk: RiskAgent) => {
    setSelectedRisk(risk);
    
    const isCampaign = risk.name.startsWith('[CAMPAÑA]');
    const defaultSubject = isCampaign 
        ? `INFORMACIÓN IMPORTANTE: ${risk.name.replace('[CAMPAÑA]', '').trim()}`
        : `DOCUMENTACIÓN LEGAL: Protocolo ${risk.name}`;

    setEmailSubject(defaultSubject);
    if (risk.documents) setSelectedDocs(risk.documents.map(d => d.id));
    
    // Resetear formulario del modal
    setTargetMode('INDIVIDUAL'); setTargetEmail(''); setTargetCompanyId(''); setRecipientCount(1);
    setIsModalOpen(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRisk) return;
    if (selectedDocs.length === 0) return alert('⚠️ Selecciona al menos un documento.');
    if (targetMode === 'INDIVIDUAL' && !targetEmail) return alert('⚠️ Escribe un correo.');
    if (targetMode === 'COMPANY' && !targetCompanyId) return alert('⚠️ Selecciona una empresa.');

    if (targetMode === 'COMPANY') {
        const companyName = companies.find(c => c.id === targetCompanyId)?.name;
        if (!confirm(`⚠️ ¿Estás seguro de enviar esto a ${recipientCount} trabajadores activos de "${companyName}"?`)) return;
    }

    setSending(true);
    try {
        await sendRiskDistribution(
            selectedRisk.id, targetMode, targetCompanyId, targetEmail, emailSubject, emailMessage, selectedDocs 
        );
        alert(`✅ Envío exitoso. Revisa la pestaña "Historial".`);
        setIsModalOpen(false);
        if (activeTab === 'HISTORY') loadHistoryData();
    } catch (error) {
        alert('❌ Error al enviar.');
    } finally {
        setSending(false);
    }
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocs(prev => prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]);
  };

  const filteredRisks = risks.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 relative">
      
      {/* HEADER + TABS PRINCIPALES */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Gestión Documental (ODI)</h1>
                <p className="text-sm text-slate-500 mt-1">Biblioteca legal, distribución masiva y trazabilidad de firmas.</p>
            </div>
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <button 
                    onClick={() => setActiveTab('LIBRARY')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                        activeTab === 'LIBRARY' ? 'bg-primary/10 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <LayoutGrid className="h-4 w-4" /> Biblioteca
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                        activeTab === 'HISTORY' ? 'bg-primary/10 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <History className="h-4 w-4" /> Historial de Envíos
                </button>
            </div>
        </div>
      </div>

      {/* --- VISTA: BIBLIOTECA --- */}
      {activeTab === 'LIBRARY' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
            
            {/* FORMULARIO IZQUIERDA */}
            <div className="lg:col-span-4">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 sticky top-6">
                    
                    <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Upload className="h-4 w-4 text-slate-400" /> Nuevo Registro
                    </h2>

                    {/* INTERRUPTOR: PROTOCOLO (Primary) vs CAMPAÑA (Secondary) */}
                    <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
                        <button
                            onClick={() => setCreateMode('PROTOCOL')}
                            className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                                createMode === 'PROTOCOL' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Shield className="h-3 w-3" /> Protocolo
                        </button>
                        <button
                            onClick={() => setCreateMode('CAMPAIGN')}
                            className={`flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                                createMode === 'CAMPAIGN' ? 'bg-white text-secondary shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Megaphone className="h-3 w-3" /> Campaña
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* ALERTAS VISUALES SEGÚN MODO */}
                        <div className={`text-xs p-3 rounded-md border ${
                            createMode === 'PROTOCOL' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-secondary/5 border-secondary/20 text-secondary'
                        }`}>
                            {createMode === 'PROTOCOL' ? (
                                <p className="flex items-start gap-2"><Info className="h-4 w-4 shrink-0" /> Documento Legal: Se vinculará a un Agente de Riesgo para el Robot.</p>
                            ) : (
                                <p className="flex items-start gap-2"><Info className="h-4 w-4 shrink-0" /> Documento Informativo: Para difusión masiva (No se asigna a GES).</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 ml-1">
                                {createMode === 'PROTOCOL' ? 'Nombre del Riesgo (Agente)' : 'Título de la Campaña'}
                            </label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary transition-all" 
                                placeholder={createMode === 'PROTOCOL' ? "Ej: Ruido, Sílice, Altura" : "Ej: Campaña Verano Seguro"} 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 ml-1">Descripción</label>
                            <textarea className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none h-24 resize-none focus:border-primary" placeholder="Detalles..." value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 ml-1">Documento PDF</label>
                            <label className="flex flex-col items-center justify-center w-full h-32 border border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className={`p-2 rounded-full mb-2 ${file ? 'bg-green-100 text-green-600' : 'bg-white text-slate-400'}`}>
                                        {file ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                                    </div>
                                    <p className="text-xs text-slate-500">{file ? file.name : "Clic para subir PDF"}</p>
                                </div>
                                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                            </label>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className={`w-full py-2.5 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50 mt-2 transition-all ${
                                createMode === 'PROTOCOL' ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'
                            }`}
                        >
                            {loading ? 'Guardando...' : createMode === 'PROTOCOL' ? 'Guardar Protocolo' : 'Guardar Campaña'}
                        </button>
                    </form>
                </div>
            </div>

            {/* TABLA DERECHA */}
            <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 bg-transparent border border-slate-200 rounded-full text-sm outline-none focus:border-primary transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="text-xs text-slate-400 font-medium">{filteredRisks.length} registros</div>
                </div>
                <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre / Agente</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Doc Activo</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                    {filteredRisks.map((risk) => {
                        const isCampaign = risk.name.startsWith('[CAMPAÑA]');
                        const displayName = risk.name.replace('[CAMPAÑA]', '').trim();

                        return (
                            <tr key={risk.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 align-top">
                                    <div className="flex items-center gap-2">
                                        {isCampaign ? (
                                            <span className="p-1 rounded bg-secondary/10 text-secondary" title="Campaña Informativa"><Megaphone className="h-3 w-3" /></span>
                                        ) : (
                                            <span className="p-1 rounded bg-primary/10 text-primary" title="Protocolo Legal"><Shield className="h-3 w-3" /></span>
                                        )}
                                        <p className="text-sm font-medium text-slate-800">{displayName}</p>
                                    </div>
                                    <p className="text-xs text-slate-400 line-clamp-1 mt-1 pl-7">{risk.description}</p>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    {risk.documents?.[0] ? (
                                        <div className="flex flex-col items-start gap-1">
                                            <a href={risk.documents[0].publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:text-primary shadow-sm hover:shadow transition-all">
                                            <FileText className="h-3.5 w-3.5 text-red-400" /> {risk.documents[0].title}
                                            </a>
                                            {risk.documents.length > 1 && <span className="text-[10px] text-slate-400 ml-1">+ {risk.documents.length - 1} otros</span>}
                                        </div>
                                    ) : <span className="text-xs text-slate-300 italic">Sin archivo</span>}
                                </td>
                                <td className="px-6 py-4 align-top text-right">
                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleBulkSend(risk)} disabled={!risk.documents?.length} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded disabled:hidden" title="Difundir">
                                        <Send className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(risk.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                </div>
            </div>
            </div>
        </div>
      )}

      {/* --- VISTA: HISTORIAL --- */}
      {activeTab === 'HISTORY' && (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col min-h-[500px]">
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" /> Registro de Envíos y Firmas
                    </h3>
                    <button onClick={loadHistoryData} className="text-xs text-primary hover:underline">Actualizar</button>
                </div>

                <div className="flex-1 overflow-x-auto">
                    {loadingHistory ? (
                        <div className="p-10 text-center text-slate-400 text-sm">Cargando trazabilidad...</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha Envío</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Colaborador</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Documento / Riesgo</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Confirmado El</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {history.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(item.sentAt).toLocaleDateString()} <span className="text-[10px]">{new Date(item.sentAt).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-900">{item.worker.name}</p>
                                            <p className="text-xs text-slate-400">{item.worker.rut} • {item.worker.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-3 w-3 text-slate-400" />
                                                <div>
                                                    <p className="text-sm text-slate-700">{item.document.title}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase">{item.document.agent.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.status === 'CONFIRMED' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                    <CheckCircle2 className="h-3 w-3" /> Firmado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                    <AlertCircle className="h-3 w-3" /> Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {item.confirmedAt ? (
                                                <>
                                                    {new Date(item.confirmedAt).toLocaleDateString()} 
                                                    <br/><span className="text-[10px] text-slate-400">{new Date(item.confirmedAt).toLocaleTimeString()}</span>
                                                    {item.ipAddress && <div className="text-[9px] text-slate-300 mt-0.5">IP: {item.ipAddress}</div>}
                                                </>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                                {history.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                                            No hay registros de envíos aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* MODAL DE DIFUSIÓN (Compartido) */}
      {isModalOpen && selectedRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Difundir Protocolo</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-5">
              
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase mb-2">1. Selecciona adjuntos:</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedRisk.documents.map(doc => (
                        <label key={doc.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                            <div onClick={(e) => { e.preventDefault(); toggleDocument(doc.id); }} className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${selectedDocs.includes(doc.id) ? 'bg-primary border-primary' : 'bg-white border-slate-300'}`}>
                                {selectedDocs.includes(doc.id) && <CheckSquare className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-xs text-slate-700 truncate">{doc.title}</span>
                        </label>
                    ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">2. Destinatario:</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <button type="button" onClick={() => setTargetMode('INDIVIDUAL')} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${targetMode === 'INDIVIDUAL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        <User className="h-4 w-4" /> Individual
                    </button>
                    <button type="button" onClick={() => setTargetMode('COMPANY')} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${targetMode === 'COMPANY' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                        <Building2 className="h-4 w-4" /> Empresa
                    </button>
                </div>
                {targetMode === 'INDIVIDUAL' ? (
                    <input type="email" required placeholder="ejemplo@correo.com" className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm focus:border-primary transition-all" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} />
                ) : (
                    <select required className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm focus:border-primary transition-all" value={targetCompanyId} onChange={(e) => setTargetCompanyId(e.target.value)}>
                        <option value="">-- Selecciona una Empresa --</option>
                        {companies.map(c => <option key={c.id} value={c.id}>{c.name} (RUT: {c.rut})</option>)}
                    </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">3. Mensaje:</label>
                <input type="text" className="w-full mb-2 p-2 border border-slate-300 rounded text-sm font-medium focus:border-primary outline-none transition-all" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Asunto" />
                <textarea className="w-full p-2 border border-slate-300 rounded text-sm h-16 resize-none focus:border-primary outline-none transition-all" value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} placeholder="Mensaje..." />
              </div>

              <div className="pt-2 flex gap-3 justify-end border-t border-slate-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded transition-colors">Cancelar</button>
                <button type="submit" disabled={sending || (targetMode === 'COMPANY' && !targetCompanyId)} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded hover:bg-primary/90 shadow-md flex items-center gap-2 disabled:opacity-50 transition-all">
                  {sending ? 'Enviando...' : targetMode === 'COMPANY' ? `DIFUNDIR A ${recipientCount !== null ? recipientCount : '...'} PERSONAS 📢` : 'Enviar Prueba ✈️'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}