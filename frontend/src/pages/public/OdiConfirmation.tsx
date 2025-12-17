import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '@/lib/axios';
import { 
    CheckCircle2, 
    XCircle, 
    Loader2, 
    ShieldCheck, 
    Calendar, 
    User, 
    FileSignature, 
    AlertTriangle 
} from 'lucide-react';

export default function OdiConfirmation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const [data, setData] = useState<any>(null);

  // 🛡️ Evita doble ejecución en desarrollo
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('ERROR');
      return;
    }
    if (hasFetched.current) return;
    hasFetched.current = true;

    const confirmDocument = async () => {
        try {
            // ✅ CAMBIO REALIZADO: Apuntamos a la ruta pública '/public/odi/confirm/'
            // Esta ruta NO debe requerir autenticación en el backend.
            const response = await axios.get(`/public/odi/confirm/${token}`);
            setData(response.data);
            setStatus('SUCCESS');
        } catch (error: any) {
            console.error("Error confirmando:", error);
            const errorMsg = error.response?.data?.error || 'No pudimos verificar el documento.';
            setData({ error: errorMsg });
            setStatus('ERROR');
        }
    };
    confirmDocument();
  }, [token]);

  // 1. CARGANDO
  if (status === 'LOADING') {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <div className="h-16 w-16 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <p className="text-slate-500 font-medium text-sm tracking-wide">PROCESANDO FIRMA DIGITAL...</p>
            </div>
        </div>
    );
  }

  // 2. ERROR
  if (status === 'ERROR' || (data && data.error)) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
             <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200 p-8 text-center">
                <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-red-100">
                    <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Error de Verificación</h2>
                <p className="text-slate-600 mb-6 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                    {data?.error || 'Enlace no válido o expirado.'}
                </p>
             </div>
        </div>
    );
  }

  // 3. ÉXITO (Confirmado)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* === ENCABEZADO CON TU BRANDING (MORADO) === */}
        <div className="bg-secondary p-8 text-center relative overflow-hidden">
            {/* Efecto de fondo sutil */}
            <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-30" />
            
            <div className="relative z-10 flex flex-col items-center">
                
                {/* Icono de Escudo */}
                <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center mb-3 backdrop-blur-md border border-white/20 shadow-lg">
                    <ShieldCheck className="text-white h-7 w-7" />
                </div>

                <h1 className="text-white font-bold text-xl tracking-tight">GESTUM Ocupacional</h1>
                {/* Subtexto color púrpura claro */}
                <p className="text-purple-200 text-xs font-medium uppercase tracking-widest mt-1">
                    Certificación de Recepción
                </p>
            </div>
        </div>

        <div className="p-8">
            {/* Mensaje de Éxito */}
            <div className="text-center mb-6 animate-in slide-in-from-bottom-2">
                <div className="mx-auto bg-green-50 border border-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm">
                   <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-1">¡Documento Confirmado!</h2>
                <p className="text-slate-500 text-sm">La recepción ha sido registrada exitosamente.</p>
            </div>
            
            {/* Tarjeta de Datos */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
            
                {/* Firmante */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                        <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Firmante</p>
                        {/* Usamos los datos reales del backend */}
                        <p className="text-sm font-semibold text-slate-900 truncate">
                            {data.worker?.name || 'Usuario Externo'}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                             RUT: {data.worker?.rut || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Fecha */}
                <div className="flex items-center gap-3 pt-1">
                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                        <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fecha y Hora</p>
                        <p className="text-sm font-mono text-slate-700">
                            {data.signedAt ? new Date(data.signedAt).toLocaleString('es-CL') : '-'}
                        </p>
                    </div>
                </div>

                {/* Alerta "Ya firmado" */}
                {data.alreadySigned && (
                    <div className="mt-3 pt-3 border-t border-slate-200 animate-in fade-in">
                        <div className="flex gap-2 items-start bg-amber-50 p-3 rounded-lg border border-amber-100">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0"/>
                            <p className="text-xs text-amber-700 font-medium leading-relaxed">
                                Este documento ya había sido confirmado anteriormente. Se muestran los datos originales.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-400 mb-1 flex items-center justify-center gap-1">
                   <FileSignature className="h-3 w-3"/> Firma digital válida
                </p>
                <p className="text-[10px] text-slate-300 font-mono">
                   ID: {token?.slice(0, 8)}...
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}