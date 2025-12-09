import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from "@sentry/react"; // 👈 Importamos Sentry
import './index.css';
import App from './App.tsx';

// --- INICIALIZACIÓN DE SENTRY ---
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN, // Lee la variable del .env
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Captura el 100% de las transacciones en desarrollo (bajar en prod)
  // Session Replay
  replaysSessionSampleRate: 0.1, // Captura el 10% de las sesiones
  replaysOnErrorSampleRate: 1.0, // Si hay error, captura el 100% del video de la sesión
});

// Create a client for TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);