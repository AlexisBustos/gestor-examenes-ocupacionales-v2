import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import dotenv from 'dotenv';
import path from 'path';

// 👇 TRUCO DE SEGURIDAD: Forzamos la lectura del .env aquí mismo
// Subimos 2 niveles (../../) para encontrar el archivo en la raíz del backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Verificación en consola (para que sepas si leyó la llave)
const dsn = process.env.SENTRY_DSN;
if (!dsn) {
    console.warn("⚠️ ADVERTENCIA: Sentry no encontró el DSN en el .env");
} else {
    console.log("✅ Sentry inicializado con DSN:", dsn.substring(0, 15) + "...");
}

Sentry.init({
  dsn: dsn,
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});