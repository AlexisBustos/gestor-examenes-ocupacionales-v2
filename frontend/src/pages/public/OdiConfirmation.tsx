import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
// Asegúrate de que esta ruta al servicio sea correcta según tu estructura
import { confirmOdiToken } from '../../services/risk.service';
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function OdiConfirmation() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const [workerName, setWorkerName] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDate, setConfirmDate] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('ERROR');
      setMessage('Token no válido o enlace roto.');
      return;
    }

    // Llamamos al backend para firmar
    confirmOdiToken(token)
      .then((data) => {
        if (data.success || data.alreadyConfirmed) {
            setWorkerName(data.workerName || 'Colaborador');
            setConfirmDate(new Date(data.date).toLocaleString());
            setStatus('SUCCESS');
            if (data.alreadyConfirmed) {
                setMessage('Este documento ya había sido confirmado previamente.');
            }
        } else {
            setStatus('ERROR');
            setMessage(data.error || 'Error desconocido');
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus('ERROR');
        setMessage('No pudimos verificar el documento. Puede que haya expirado o el enlace sea inválido.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      {/* TARJETA CENTRAL */}
      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* ENCABEZADO */}
        <div className="bg-slate-900 p-6 text-center">
            <div className="mx-auto bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="text-green-400 h-6 w-6" />
            </div>
            <h1 className="text-white font-bold text-lg">Vitam Security Cloud</h1>
            <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">Certificación de Recepción</p>
        </div>

        <div className="p-8 text-center">
          
          {/* ESTADO: CARGANDO */}
          {status === 'LOADING' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Verificando firma digital...</p>
            </div>
          )}

          {/* ESTADO: ÉXITO */}
          {status === 'SUCCESS' && (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">¡Recepción Confirmada!</h2>
              <p className="text-slate-600 mb-6">
                Gracias <strong>{workerName}</strong>. Hemos registrado exitosamente tu confirmación de lectura.
              </p>
              
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-500 border border-slate-200">
                <p className="mb-1">📅 <strong>Fecha:</strong> {confirmDate}</p>
                <p>🔒 <strong>Firma Digital:</strong> Verificada</p>
                {message && <p className="mt-2 text-blue-600 font-medium">{message}</p>}
              </div>

              <p className="text-xs text-slate-400 mt-6">
                Puedes cerrar esta ventana de forma segura.
              </p>
            </div>
          )}

          {/* ESTADO: ERROR */}
          {status === 'ERROR' && (
            <div>
              <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Error de Verificación</h2>
              <p className="text-slate-600 mb-4">{message}</p>
              <a href="/" className="text-blue-600 hover:underline text-sm">
                Volver al inicio
              </a>
            </div>
          )}

        </div>
        
        {/* FOOTER */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400">
                Identificador Único: {token?.slice(0, 8)}...
            </p>
        </div>
      </div>
    </div>
  );
}