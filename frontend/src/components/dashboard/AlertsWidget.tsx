import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { ArrowUpRight } from 'lucide-react';
import { getDashboardAlerts, type AlertsSummary, type AlertItem } from '../../services/alerts.service';

export const AlertsWidget = () => {
    const navigate = useNavigate(); 
    const [data, setData] = useState<AlertsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            const result = await getDashboardAlerts();
            setData(result);
        } catch (error) {
            console.error("Error cargando alertas", error);
        } finally {
            setLoading(false);
        }
    };

    // 👇 NAVEGACIÓN INTELIGENTE CON ESTADO (STATE)
    const handleNavigate = (item: AlertItem) => {
        const stateData = item.redirectData || {}; // Datos extra (IDs)

        switch (item.type) {
            case 'PRESCRIPCION':
                // Enviamos a Gestión Documental, pasando filtros si es necesario
                navigate('/dashboard/companies', { state: stateData }); 
                break;
            
            case 'EXAMENES_GES':
                // Enviamos a Vigilancia Médica
                navigate('/dashboard/companies', { state: stateData });
                break;
            
            case 'DOCUMENTACION':
                // Enviamos a Empresas con la orden de ABRIR EL MODAL
                navigate('/dashboard/companies', { state: stateData });
                break;
            
            case 'EXAMEN_TRABAJADOR': 
                // Enviamos a Nómina buscando al RUT
                navigate('/dashboard/workers', { state: stateData });
                break;
                
            default:
                console.warn("Ruta desconocida:", item.type);
                break;
        }
    };

    const getTypeBadge = (type: string, title: string) => {
        if (type === 'PRESCRIPCION') {
            const isQuant = title.toLowerCase().includes('cuantitativa');
            return (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-wider ${
                    isQuant ? 'bg-indigo-600' : 'bg-blue-500'
                }`}>
                    {isQuant ? 'MEDIDA CUANTITATIVA' : 'MEDIDA CUALITATIVA'}
                </span>
            );
        }
        if (type === 'EXAMENES_GES') return <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-purple-500 uppercase tracking-wider">VIGENCIA GES</span>;
        if (type === 'DOCUMENTACION') return <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-gray-500 uppercase tracking-wider">DOCUMENTO LEGAL</span>;
        if (type === 'EXAMEN_TRABAJADOR') return <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-orange-500 uppercase tracking-wider">EXAMEN PERSONAL</span>;
        
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white bg-gray-400">ALERTA</span>;
    };

    if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Analizando vencimientos...</div>;
    if (!data) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 mt-8">
            <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        🚨 Centro de Control de Vencimientos
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">Monitoreo en tiempo real de plazos legales y medidas.</p>
                </div>
                
                <div className="flex gap-3 mt-4 md:mt-0">
                    <div className="flex flex-col items-center px-4 py-1 bg-red-50 border border-red-100 rounded-lg">
                        <span className="text-2xl font-black text-red-600 leading-none">{data.summary.expired}</span>
                        <span className="text-[10px] font-bold text-red-400 uppercase">Vencidos</span>
                    </div>
                    <div className="flex flex-col items-center px-4 py-1 bg-amber-50 border border-amber-100 rounded-lg">
                        <span className="text-2xl font-black text-amber-600 leading-none">{data.summary.warning}</span>
                        <span className="text-[10px] font-bold text-amber-400 uppercase">Por Vencer</span>
                    </div>
                </div>
            </div>

            <div className="max-h-[450px] overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {data.items.length === 0 ? (
                    <div className="text-center py-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mb-3">✅</div>
                        <h3 className="text-green-800 font-bold">Todo en orden</h3>
                        <p className="text-green-600 text-sm">No hay vencimientos ni medidas pendientes.</p>
                    </div>
                ) : (
                    data.items.map((item: AlertItem) => (
                        <div 
                            key={`${item.type}-${item.id}`}
                            className={`relative bg-white p-4 rounded-lg border shadow-sm transition-all hover:shadow-md group ${
                                item.status === 'VENCIDO' 
                                    ? 'border-l-4 border-l-red-500 border-gray-200' 
                                    : 'border-l-4 border-l-amber-500 border-gray-200'
                            }`}
                        >
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {getTypeBadge(item.type, item.title)}
                                        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                                            🏢 {item.company}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-1 leading-snug">
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 italic bg-gray-50 p-2 rounded border border-gray-100 mt-2">
                                        {item.details}
                                    </p>
                                </div>

                                <div className="flex flex-row sm:flex-col items-end gap-3 min-w-[120px]">
                                    <div className="text-right">
                                        <div className={`text-xl font-black leading-none ${
                                            item.status === 'VENCIDO' ? 'text-red-600' : 'text-amber-600'
                                        }`}>
                                            {Math.abs(item.daysLeft)}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-gray-400 mt-1">
                                            {item.status === 'VENCIDO' ? 'Días Atraso' : 'Días Restantes'}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => handleNavigate(item)}
                                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-primary hover:text-white rounded-md transition-colors"
                                    >
                                        Ver Detalle
                                        <ArrowUpRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};