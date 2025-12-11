import { Resend } from 'resend';

// Inicializamos Resend con la llave del .env
const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Link donde el usuario pondrá su nueva clave
  const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: 'Vitam Security <onboarding@resend.dev>', // Email de prueba
      to: [email], // Solo funciona con tu email de registro en modo prueba
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
    console.error("Error enviando correo:", error);
    return null; 
  }
};