import { Resend } from 'resend';

// ============================================================
// 🛡️ INICIALIZACIÓN SEGURA (EVITA CRASH DEL SERVIDOR)
// ============================================================
const isProductionKey = !!process.env.RESEND_API_KEY;
const resendApiKey = process.env.RESEND_API_KEY || 're_dummy_key_prevent_crash';
const resend = new Resend(resendApiKey);

// Configuración de Remitentes
const SENDER_SECURITY = 'GESTUM Seguridad <security@vitam.tech>';
const SENDER_LEGAL = 'GESTUM Prevención <legal@vitam.tech>'; 
const SENDER_HEALTH = 'GESTUM Salud Ocupacional <salud@vitam.tech>';

// 🎨 CONFIGURACIÓN DE MARCA
const APP_NAME = "GESTUM Ocupacional";
const BRAND_LOGO_URL = ''; 

const COLOR_PRIMARY = '#633188'; // Morado GESTUM
const COLOR_ACCENT = '#0099a3';  // Turquesa
const COLOR_DANGER = '#be123c';  // Rojo Profundo
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================
// HELPER: PLANTILLA BASE HTML
// ============================================================
const wrapHtmlTemplate = (title: string, bodyContent: string) => {
  const headerContent = BRAND_LOGO_URL 
    ? `<img src="${BRAND_LOGO_URL}" alt="${APP_NAME}" style="max-height: 45px; border: 0;">`
    : `<h2 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 0.5px; font-weight: 700; font-family: 'Arial', sans-serif;">${APP_NAME}</h2>`;

  return `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f1f5f9; padding: 40px 0; color: #334155;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
        
        <div style="background-color: ${COLOR_PRIMARY}; padding: 35px 20px; text-align: center;">
            ${headerContent}
            <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">
                ${title}
            </p>
        </div>

        <div style="padding: 45px 35px; line-height: 1.6;">
           ${bodyContent}
        </div>

        <div style="background-color: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 11px; color: #64748b; margin: 0; margin-bottom: 5px;">
            <strong>Gestión de Seguridad y Salud Ocupacional</strong>
          </p>
          <p style="font-size: 10px; color: #94a3b8; margin: 0;">
            Este mensaje se ha generado automáticamente. Por favor, no responda a este correo.<br>
            © ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  `;
};

// 🛑 HELPER PARA DETECTAR SI PODEMOS ENVIAR
const canSendEmail = (actionName: string) => {
    if (!isProductionKey) {
        console.warn(`⚠️ [EMAIL SIMULADO] Acción: "${actionName}" - No se envió el correo real porque falta RESEND_API_KEY.`);
        return false;
    }
    return true;
};

// ============================================================
// FUNCIÓN 1: RECUPERACIÓN DE CONTRASEÑA
// ============================================================
export const sendPasswordResetEmail = async (email: string, token: string) => {
  if (!canSendEmail('Password Reset')) return true;

  const resetLink = `${FRONTEND_URL}/auth/reset-password?token=${token}`;

  const htmlContent = `
    <h2 style="color: ${COLOR_PRIMARY}; margin-top: 0; font-size: 22px; font-weight: 600;">Restablecimiento de Credenciales</h2>
    <p style="font-size: 15px; color: #475569;">Estimado usuario:</p>
    <p style="font-size: 15px; color: #475569;">
      Hemos recibido una solicitud para actualizar sus credenciales de acceso a la plataforma <strong>${APP_NAME}</strong>.
    </p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="${resetLink}" style="background-color: ${COLOR_ACCENT}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(0, 153, 163, 0.2);">
        🔐 Actualizar Contraseña
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
      Si usted no realizó esta solicitud, le recomendamos contactar al administrador del sistema o ignorar este mensaje.
    </p>
  `;

  try {
    await resend.emails.send({
      from: SENDER_SECURITY,
      to: [email], 
      subject: '🔐 Instrucciones para restablecer contraseña',
      html: wrapHtmlTemplate('Seguridad de Cuenta', htmlContent)
    });
    return true;
  } catch (error) {
    console.error("❌ Error enviando correo password:", error);
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
// FUNCIÓN 2: ENVIAR ODI (MODO LINKS DE DESCARGA - SOLUCIÓN 40MB)
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
  if (!canSendEmail('Enviar ODI')) return false;

  // 1. Generamos la lista visual de riesgos
  const riskListHtml = risks.map(r => 
    `<li style="margin-bottom: 8px; color: #475569;">
        <span style="color: ${COLOR_PRIMARY}; margin-right: 6px;">●</span> ${r}
     </li>`
  ).join('');

  // 2. 🔥 SOLUCIÓN 40MB: Generamos la lista de LINKS en lugar de adjuntar
  const documentsHtml = attachments.map(doc => `
    <li style="margin-bottom: 10px; background-color: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
        <a href="${doc.path}" target="_blank" style="text-decoration: none; color: ${COLOR_ACCENT}; font-weight: 600; font-size: 14px; display: flex; align-items: center;">
            <span style="font-size: 18px; margin-right: 8px;">📄</span>
            ${doc.filename} 
            <span style="font-size: 11px; color: #94a3b8; margin-left: auto;">(Clic para abrir)</span>
        </a>
    </li>
  `).join('');

  const confirmationLink = `${FRONTEND_URL}/confirmar-odi?token=${confirmationToken}`;

  const htmlContent = `
    <h2 style="color: ${COLOR_PRIMARY}; margin-top: 0; font-size: 22px; font-weight: 600;">Notificación Obligatoria (ODI)</h2>
    
    <p style="font-size: 15px; color: #334155; margin-bottom: 20px;">
        Estimado(a) Colaborador(a) <strong>${workerName}</strong>:
    </p>
    
    <p style="color: #475569; line-height: 1.7; font-size: 15px;">
      En cumplimiento con lo establecido en el <strong>Decreto Supremo Nº 40, Artículo 21</strong> (Derecho a Saber), 
      la empresa <strong>${companyName}</strong> pone a su disposición la información técnica, medidas preventivas y riesgos asociados inherentes a su puesto de trabajo.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h3 style="margin-top: 0; color: ${COLOR_PRIMARY}; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 15px;">
        📋 Agentes y Riesgos Identificados:
      </h3>
      <ul style="margin: 0; padding-left: 0; list-style-type: none; font-size: 14px;">
        ${riskListHtml}
      </ul>
    </div>

    <div style="margin-bottom: 30px;">
        <p style="color: #334155; font-weight: 600; font-size: 14px; margin-bottom: 10px;">
            ⬇️ Documentación Digital Disponible:
        </p>
        <ul style="list-style-type: none; padding-left: 0; margin: 0;">
            ${documentsHtml}
        </ul>
        <p style="font-size: 12px; color: #64748b; margin-top: 8px; font-style: italic;">
            * Haga clic en los nombres para visualizar o descargar los documentos PDF directamente desde nuestra nube segura.
        </p>
    </div>

    <div style="text-align: center; margin: 40px 0; border-top: 1px dashed #cbd5e1; padding-top: 30px;">
      <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">
        Una vez revisados los documentos, confirme su recepción:
      </p>
      <a href="${confirmationLink}" style="background-color: ${COLOR_ACCENT}; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 153, 163, 0.25);">
        📝 ACUSAR RECIBO Y FIRMAR
      </a>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">
        Este enlace generará un registro de trazabilidad legal válido.
      </p>
    </div>
  `;

  try {
    console.log(`📨 [EMAIL] Enviando ODI (Con Links) a: ${workerEmail}`);
    
    // 👇 CAMBIO CLAVE: Quitamos 'attachments' para que el correo pese KB en lugar de MB
    // También capturamos { data, error } para saber si Resend falla
    const { data, error } = await resend.emails.send({
      from: SENDER_LEGAL,
      to: [workerEmail],
      subject: `Documentación Obligatoria (ODI) - ${companyName}`,
      // attachments: attachments, <--- ❌ ELIMINADO para evitar error 40MB
      html: wrapHtmlTemplate('Obligación de Informar (DAS)', htmlContent)
    });

    if (error) {
        console.error("❌ [EMAIL ERROR API] Resend rechazó el correo:", error);
        return false;
    }

    console.log("✅ [EMAIL SUCCESS] ID de envío:", data?.id);
    return true;

  } catch (error) {
    console.error("❌ [EMAIL ERROR] Falló el envío de ODI:", error);
    return false;
  }
};

// ============================================================
// FUNCIÓN 3: INSTRUCCIÓN DE EXAMEN DE EGRESO (Desvinculación)
// ============================================================
export const sendExitExamEmail = async (
    toEmail: string, 
    workerName: string, 
    companyName: string, 
    riskList: string[]
) => {
    if (!canSendEmail('Aviso Egreso')) return false;

    const riskListHtml = riskList.map(r => 
        `<li style="margin-bottom: 6px; color: ${COLOR_DANGER}; font-weight: 500;">
            <span style="margin-right: 6px;">▶</span> ${r}
         </li>`
    ).join('');

    const htmlContent = `
        <h2 style="color: ${COLOR_DANGER}; margin-top: 0; font-size: 22px; font-weight: 600;">Notificación: Derecho a Evaluación de Egreso</h2>
        
        <p style="font-size: 15px; color: #334155;">Estimado(a) <strong>${workerName}</strong>:</p>
        
        <p style="color: #475569; line-height: 1.7; font-size: 15px;">
            En relación con el término de sus funciones en la empresa <strong>${companyName}</strong>, 
            y en conformidad con la normativa vigente (Ley 16.744), cumplimos con informarle lo siguiente:
        </p>

        <p style="color: #475569; font-size: 15px;">
            Nuestros registros indican que, durante el desempeño de sus labores, usted estuvo expuesto(a) a los siguientes agentes de riesgo:
        </p>

        <div style="background-color: #fff1f2; border: 1px solid #ffe4e6; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <ul style="margin: 0; padding-left: 0; list-style-type: none; font-size: 14px;">
                ${riskListHtml}
            </ul>
        </div>

        <p style="color: #334155; font-size: 15px; font-weight: 600;">
            Le asiste el derecho a realizarse una Evaluación Médica de Egreso para certificar su estado de salud actual.
        </p>
        
        <p style="color: #475569; font-size: 15px;">
            Para hacer efectivo este derecho, le solicitamos acudir a su organismo administrador (Mutualidad) a la brevedad posible, indicando que requiere realizar una "Evaluación de término de exposición".
        </p>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 35px 0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center; font-style: italic;">
            Este correo electrónico constituye un respaldo formal de la notificación realizada por el empleador.
        </p>
    `;

    try {
        console.log(`📧 [EMAIL] Enviando Instrucción de Egreso a: ${toEmail}`);
        await resend.emails.send({
            from: SENDER_HEALTH, 
            to: [toEmail],
            subject: `Aviso Legal: Exámenes de Egreso - ${companyName}`,
            html: wrapHtmlTemplate('Salud Ocupacional', htmlContent)
        });
        return true;
    } catch (error) {
        console.error("❌ [EMAIL ERROR] Falló envío de Egreso:", error);
        return false;
    }
};