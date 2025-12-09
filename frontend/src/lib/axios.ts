import axios from "axios";

/**
 * ============================================================
 *  CONFIGURACIÓN GLOBAL DE AXIOS (DEV / PRODUCCIÓN)
 * ============================================================
 *
 *  - Si VITE_API_URL NO existe, usa localhost como fallback.
 *  - Debe definirse en:
 *        .env.development   → http://localhost:3000/api
 *        .env.production    → https://tu-backend.com/api
 *
 */
export const API_URL = "https://gestor-examenes-ocupacionales.onrender.com/api";
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Para servir archivos estáticos (PDFs, imágenes, etc.)
export const SERVER_URL = API_URL.replace("/api", "");

/**
 * Instancia principal de Axios
 */
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ============================================================
 *  INTERCEPTORES
 * ============================================================
 */

// 🚀 Agregar token automáticamente si existe (opcional)
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 📌 Registrar errores de forma elegante
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    console.error("⚠️ API Error:", {
      status,
      message: error.message,
      data,
    });

    return Promise.reject(error);
  }
);

export default axiosInstance;
