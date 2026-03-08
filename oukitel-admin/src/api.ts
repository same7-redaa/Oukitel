import axios from 'axios';

// No base URL needed — relative paths work on any domain
const API = axios.create({ baseURL: '' });

// Add JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle session expiry
API.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem('admin_token');
            window.location.reload();
        }
        return Promise.reject(err);
    }
);

export default API;
