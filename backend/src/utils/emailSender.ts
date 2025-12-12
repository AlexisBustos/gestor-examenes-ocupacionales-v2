import { Resend } from 'resend';

// Inicializamos Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);

// 🎨 CONFIGURACIÓN DE MARCA
// IMPORTANTE: Reemplaza esta URL con el link directo a tu logo (debe ser público, ej: en S3, tu web o Imgur)
const BRAND_LOGO_URL = 'https://tu-dominio.com/logo-vitam.png'; 
const COLOR_PRIMARY = '#633188'; // Morado
const COLOR_ACCENT = '#0099a3';  // Turquesa
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ============================================================
// HELPER: PLANTILLA BASE HTML
// ============================================================
// Esto envuelve el contenido para que todos los correos se vean iguales
const wrapHtmlTemplate = (title: string, bodyContent: string) => {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        
        <div style="background-color: ${COLOR_PRIMARY}; padding: 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">VITAM</h2> 
            </div>

        <div style="padding: 40px 30px;">
           ${bodyContent}
        </div>

        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">
            Enviado automáticamente por <strong>Vitam Security Cloud</strong>.<br>
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
      Hemos recibido una solicitud para restablecer tu contraseña en la plataforma Vitam.
    </p>
    <p style="color: #475569; font-size: 16px;">
      Si fuiste tú, haz clic en el botón de abajo para continuar. El enlace expira en 15 minutos.
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
      from: 'Vitam Security <security@vitam.tech>', 
      to: [email], 
      subject: '🔐 Recuperación de acceso - Vitam',
      html: wrapHtmlTemplate('Recuperación de Contraseña', htmlContent)
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

  // Formateamos la lista de riesgos
  const riskListHtml = risks.map(r => 
    `<li style="margin-bottom: 8px;">🔸 <span style="color: #334155;">${r}</span></li>`
  ).join('');

  const confirmationLink = `${FRONTEND_URL}/confirmar-odi?token=${confirmationToken}`;

  const htmlContent = `
    <h2 style="color: ${COLOR_PRIMARY}; margin-top: 0; font-size: 22px;">Documentación de Seguridad Disponible</h2>
    
    <p style="font-size: 16px; color: #334155;">Hola, <strong>${workerName}</strong>:</p>
    
    <p style="color: #475569; line-height: 1.6; font-size: 15px;">
      Cumpliendo con el <strong>Decreto Supremo Nº 40, Art. 21</strong> (Obligación de Informar), 
      <strong>${companyName}</strong> te hace entrega de los protocolos de seguridad para tu nuevo puesto de trabajo.
    </p>

    <div style="background-color: #fbf7ff; border-left: 5px solid ${COLOR_PRIMARY}; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h3 style="margin-top: 0; color: ${COLOR_PRIMARY}; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
        ⚠️ Riesgos Identificados en tu cargo:
      </h3>
      <ul style="margin-bottom: 0; padding-left: 20px; list-style-type: none;">
        ${riskListHtml}
      </ul>
    </div>

    <p style="color: #475569; font-size: 15px;">
      📎 <strong>Tu documento PDF está adjunto.</strong> Por favor, léelo y luego confirma su recepción haciendo clic en el botón.
    </p>

    <div style="text-align: center; margin: 35px 0;">
      <a href="${confirmationLink}" style="background-color: ${COLOR_ACCENT}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(0, 153, 163, 0.3);">
        ✅ CONFIRMAR LECTURA
      </a>
      <p style="font-size: 12px; color: #64748b; margin-top: 12px;">
        Al confirmar, generaremos un certificado digital de recepción con tu IP y fecha.
      </p>
    </div>
  `;

  try {
    // Solo logueamos lo esencial
    console.log(`📨 [EMAIL] Enviando ODI a: ${workerEmail} | Adjuntos: ${attachments.length}`);
    
    await resend.emails.send({
      from: 'Vitam Legal <legal@vitam.tech>', 
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