import axios from "axios";

/**
 * ============================================================
 * CONFIGURACIÓN GLOBAL DE AXIOS
 * ============================================================
 */

// 👇 CORRECCIÓN: Ahora sí lee el .env o usa localhost por defecto
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Para servir archivos estáticos
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
 * INTERCEPTORES
 * ============================================================
 */

// Agregar token automáticamente
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

// Manejo de errores
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