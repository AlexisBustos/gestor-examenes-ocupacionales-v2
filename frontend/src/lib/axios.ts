import axios from 'axios';

/**
 * Axios instance configured for the backend API
 * Base URL is read from environment variable VITE_API_URL
 */
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Response interceptor for error handling
 */
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log errors to console for debugging
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', {
                status: error.response.status,
                data: error.response.data,
                url: error.config?.url,
            });
        } else if (error.request) {
            // Request made but no response received
            console.error('Network Error: No response received', {
                url: error.config?.url,
            });
        } else {
            // Error in request setup
            console.error('Request Error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
