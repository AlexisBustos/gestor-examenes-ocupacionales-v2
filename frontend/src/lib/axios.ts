import axios from 'axios';

/**
 * Instancia de Axios configurada para el Backend
 * FORZADA A LOCALHOST para depuración
 */
const axiosInstance = axios.create({
    // 👇 AQUÍ ESTÁ EL CAMBIO: Lo forzamos a tu PC
    baseURL: 'http://localhost:3000/api', 
    timeout: 120000, // 60 segundos de paciencia
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Interceptor de respuesta para manejo de errores
 */
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log errors to console for debugging
        if (error.response) {
            // El servidor respondió con error (ej: 400, 500)
            console.error('API Error:', {
                status: error.response.status,
                data: error.response.data,
                url: error.config?.url,
            });
        } else if (error.request) {
            // La petición salió pero nadie respondió (Network Error)
            console.error('Network Error: No response received', {
                url: error.config?.url,
            });
        } else {
            // Error configurando la petición
            console.error('Request Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;