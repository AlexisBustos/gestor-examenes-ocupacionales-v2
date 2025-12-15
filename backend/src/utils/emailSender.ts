import { Resend } from 'resend';

// Inicializamos Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);

// 🎨 CONFIGURACIÓN DE MARCA
const APP_NAME = "GESTUM Ocupacional";
// Si tienes el logo alojado públicamente (S3, Imgur, tu web), pon la URL aquí:
const BRAND_LOGO_URL = ''; // Ej: 'https://tusitio.com/logo-email.png'

const COLOR_PRIMARY = '#633188'; // Morado GESTUM
const COLOR_ACCENT = '#0099a3';  // Turquesa
const COLOR_DANGER = '#e11d48';  // Rojo (Alertas)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================
// HELPER: PLANTILLA BASE HTML
// ============================================================
const wrapHtmlTemplate = (title: string, bodyContent: string) => {
  // Encabezado dinámico: Si hay logo URL, úsalo. Si no, usa texto.
  const headerContent = BRAND_LOGO_URL 
    ? `<img src="${BRAND_LOGO_URL}" alt="${APP_NAME}" style="max-height: 40px; border: 0;">`
    : `<h2 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 700;">${APP_NAME}</h2>`;

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <div style="background-color: ${COLOR_PRIMARY}; padding: 30px; text-align: center;">
            ${headerContent}
            <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
                ${title}
            </p>
        </div>

        <div style="padding: 40px 30px;">
           ${bodyContent}
        </div>

        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            Enviado automáticamente por <strong>${APP_NAME}</strong>.<br>
            Este mensaje es confidencial. Si lo recibiste por error, elimínalo.
          </p>
        </div>
      </div>
    </div>
  `;
};

// ============================================================
// FUNCIÓN 1: RECUPERACIÓN DE CONTRASEÑA
// ============================================================
export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${FRONTEND_URL}/auth/reset-password?token=${token}`;

  const htmlContent = `
    <h2 style="color: ${COLOR_PRIMARY}; margin-top: 0;">Restablecer Contraseña</h2>
    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
      Hemos recibido una solicitud para restablecer tu contraseña en la plataforma.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="background-color: ${COLOR_ACCENT}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
        🔐 Crear Nueva Contraseña
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 14px;">Si no solicitaste este cambio, ignora este correo.</p>
  `;

  try {
    await resend.emails.send({
      from: 'Gestum Security <security@vitam.tech>', // Mantén tu dominio verificado
      to: [email], 
      subject: '🔐 Recuperación de acceso - GESTUM',
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
// FUNCIÓN 2: ENVIAR ODI CON ADJUNTOS (Ingreso)
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

  const riskListHtml = risks.map(r => 
    `<li style="margin-bottom: 8px;">🔸 <span style="color: #334155;">${r}</span></li>`
  ).join('');

  // Enlace directo a la pantalla de confirmación corregida
  const confirmationLink = `${FRONTEND_URL}/confirmar-odi?token=${confirmationToken}`;

  const htmlContent = `
    <h2 style="color: ${COLOR_PRIMARY}; margin-top: 0; font-size: 22px;">Documentación de Seguridad Disponible</h2>
    
    <p style="font-size: 16px; color: #334155;">Hola, <strong>${workerName}</strong>:</p>
    
    <p style="color: #475569; line-height: 1.6; font-size: 15px;">
      Cumpliendo con el <strong>Decreto Supremo Nº 40, Art. 21</strong> (Obligación de Informar), 
      <strong>${companyName}</strong> te hace entrega de los protocolos de seguridad para tu puesto de trabajo.
    </p>

    <div style="background-color: #fbf7ff; border-left: 5px solid ${COLOR_PRIMARY}; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: ${COLOR_PRIMARY}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
        ⚠️ Riesgos Identificados:
      </h3>
      <ul style="margin-bottom: 0; padding-left: 20px; list-style-type: none;">
        ${riskListHtml}
      </ul>
    </div>

    <p style="color: #475569; font-size: 15px;">
      📎 <strong>Tu documento PDF está adjunto.</strong> Por favor, léelo y luego confirma su recepción.
    </p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${confirmationLink}" style="background-color: ${COLOR_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(0, 153, 163, 0.3);">
        ✅ CONFIRMAR LECTURA
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 12px;">
        Al confirmar, generaremos un certificado digital de recepción.
      </p>
    </div>
  `;

  try {
    console.log(`📨 [EMAIL] Enviando ODI a: ${workerEmail}`);
    
    await resend.emails.send({
      from: 'Gestum Legal <legal@vitam.tech>', // Remitente profesional
      to: [workerEmail],
      subject: `📝 Firma Pendiente: Documentación ODI - ${companyName}`,
      attachments: attachments, 
      html: wrapHtmlTemplate('Obligación de Informar', htmlContent)
    });

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
    
    const riskListHtml = riskList.map(r => 
        `<li style="margin-bottom: 8px;">🔴 <span style="color: #9f1239; font-weight: 500;">${r}</span></li>`
    ).join('');

    const htmlContent = `
        <h2 style="color: ${COLOR_DANGER}; margin-top: 0; font-size: 22px;">Aviso de Término de Exposición</h2>
        
        <p style="font-size: 16px; color: #334155;">Estimado(a) <strong>${workerName}</strong>:</p>
        
        <p style="color: #475569; line-height: 1.6; font-size: 15px;">
            En el contexto de su desvinculación de la empresa <strong>${companyName}</strong>, 
            y en estricto cumplimiento con la <strong>Ley 16.744</strong>, 
            cumplimos con informarle lo siguiente:
        </p>

        <p style="color: #475569; font-size: 15px;">
            Durante el desempeño de sus funciones, nuestros registros indican que usted estuvo expuesto a los siguientes agentes de riesgo:
        </p>

        <div style="background-color: #fff1f2; border-left: 5px solid ${COLOR_DANGER}; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <ul style="margin-bottom: 0; padding-left: 20px; list-style-type: none;">
                ${riskListHtml}
            </ul>
        </div>

        <p style="color: #475569; font-size: 15px; font-weight: bold;">
            Es su derecho y obligación realizarse una Evaluación de Egreso para certificar su estado de salud.
        </p>
        
        <p style="color: #475569; font-size: 15px;">
            Por favor, acérquese a la brevedad a su organismo administrador (Mutualidad) indicando que requiere realizar evaluación de término de exposición.
        </p>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 13px; color: #64748b; text-align: center;">
            Este documento constituye respaldo legal de notificación.
        </p>
    `;

    try {
        console.log(`📧 [EMAIL] Enviando Instrucción de Egreso a: ${toEmail}`);
        
        await resend.emails.send({
            from: 'Gestum Salud <salud@vitam.tech>', 
            to: [toEmail],
            subject: `⚠️ IMPORTANTE: Instrucción de Exámenes de Egreso - ${companyName}`,
            html: wrapHtmlTemplate('Examen de Egreso', htmlContent)
        });

        return true;
    } catch (error) {
        console.error("❌ [EMAIL ERROR] Falló envío de Egreso:", error);
        return false;
    }
};