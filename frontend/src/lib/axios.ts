import axios from 'axios';

/**
 * Instancia Maestra de Axios
 * Configurada para apuntar al backend local en el puerto 3000/api
 */
const axiosInstance = axios.create({
    baseURL: 'http://localhost:3000/api', // <--- ESTA ES LA BASE DE TODO
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para logs (Opcional pero útil)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default axiosInstance;