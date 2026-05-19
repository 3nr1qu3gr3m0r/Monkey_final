import axios from 'axios';

// Usamos import.meta.env para leer variables de entorno en Vite
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const apiClient = axios.create({
    baseURL: `${API_URL}/api`, // Le agregamos /api como convención
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    // 1. Buscamos el token en la memoria del navegador
    const token = localStorage.getItem('token');
    
    // 2. Si existe, se lo pegamos en la cabecera
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default apiClient;