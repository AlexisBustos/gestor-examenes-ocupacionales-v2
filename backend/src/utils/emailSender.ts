import { Resend } from 'resend';

// Inicializamos Resend con la llave del .env
const resendApiKey = process.env.RESEND_API_KEY; // 👈 DEBUG: Guardamos en variable
console.log("🔑 [DEBUG INICIO] API Key cargada:", resendApiKey ? `${resendApiKey.substring(0, 5)}...` : 'NINGUNA'); // 👈 DEBUG

const resend = new Resend(resendApiKey);

// ============================================================
// FUNCIÓN 1: RECUPERACIÓN DE CONTRASEÑA
// ============================================================
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: 'Vitam Security <security@vitam.tech>', 
      to: [email], 
      subject: 'Recuperación de Contraseña - Vitam',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Recuperación de Contraseña</h2>
          <p>Has solicitado restablecer tu contraseña en Vitam.</p>
          <p>Haz clic en el siguiente botón (válido por 15 minutos):</p>
          <a href="${resetLink}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">
            Restablecer Contraseña
          </a>
        </div>
      `
    });
    return data;
  } catch (error) {
    console.error("Error enviando correo password:", error);
    return null; 
  }
};

// ============================================================
// INTERFAZ PARA ADJUNTOS
// ============================================================
interface OdiAttachment {
  filename: string;
  path: string; 
}

// ============================================================
// FUNCIÓN 2: ENVIAR ODI CON ADJUNTOS
// ============================================================
export const sendODIEmail = async (
  workerEmail: string,
  workerName: string,
  companyName: string,
  risks: string[],
  attachments: OdiAttachment[],
  confirmationToken: string
) => {
  
  if (!risks || risks.length === 0) return;

  const riskListHtml = risks.map(r => `<li>⚠️ <strong>${r}</strong></li>`).join('');
  const confirmationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirmar-odi?token=${confirmationToken}`;

  try {
    // 👇👇👇 ZONA DE DEBUG 👇👇👇
    console.log("------------------------------------------------");
    console.log("🚀 [DEBUG] Intentando enviar con Resend...");
    console.log(`📧 Para: ${workerEmail}`);
    console.log(`📎 Adjuntos: ${attachments.length}`);
    console.log(`🔑 Key actual: ${process.env.RESEND_API_KEY ? 'CARGADA OK' : 'FALTA'}`);
    
    const result = await resend.emails.send({
      from: 'Vitam Legal <legal@vitam.tech>', 
      to: [workerEmail],
      subject: `📜 IMPORTANTE: Documentación ODI - ${companyName}`,
      attachments: attachments, 
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0f172a; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Obligación de Informar (ODI)</h2>
            <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px;">Decreto Supremo Nº 40, Art. 21</p>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #334155;">Hola, <strong>${workerName}</strong>:</p>
            <p style="color: #475569; line-height: 1.6;">
              Por instrucción de <strong>${companyName}</strong> y en cumplimiento de la normativa legal vigente, te hacemos entrega de los protocolos de seguridad asociados a tu puesto de trabajo.
            </p>
            <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 15px; margin: 25px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #9f1239; font-size: 14px; text-transform: uppercase;">Riesgos Identificados:</h3>
              <ul style="margin-bottom: 0; padding-left: 20px; color: #881337;">
                ${riskListHtml}
              </ul>
            </div>
            <p style="color: #475569; font-size: 14px;">
              📎 <strong>Hemos adjuntado los protocolos en PDF a este correo.</strong> Es tu responsabilidad leerlos y aplicarlos.
            </p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${confirmationLink}" style="background-color: #16a34a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                ✅ CONFIRMAR RECEPCIÓN
              </a>
              <p style="font-size: 11px; color: #64748b; margin-top: 10px;">
                Al hacer clic, se registrará digitalmente tu confirmación (IP y Fecha).
              </p>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center;">
              Este mensaje fue enviado automáticamente por Vitam Security Cloud.<br>
              No respondas a este correo.
            </p>
          </div>
        </div>
      `
    });

    console.log("✅ Resend respondió:", result); // 👈 VEREMOS SI RESEND DICE OK O ERROR
    console.log("------------------------------------------------");
    return true;

  } catch (error) {
    console.error("❌ Error CRÍTICO enviando ODI:", error);
    return false;
  }
};