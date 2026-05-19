
import axios from "axios";
// CCC
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    timeout: 30000,
});

let setLoadingGlobal = null;
let activeRequests = 0;

export const attachLoadingHandler = (fn) => {
    setLoadingGlobal = fn;
};

const updateLoading = (increment) => {
    if (!setLoadingGlobal) return;
    activeRequests += increment;
    
    if (activeRequests > 0) {
        setLoadingGlobal(true);
    } else {
        activeRequests = 0;
        setLoadingGlobal(false);
    }
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (config.method === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            };
        }
        
        updateLoading(1);
        return config;
    },
    (error) => {
        updateLoading(-1);
        console.error("Request Error:", error);
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        updateLoading(-1);
        return response;
    },
    (error) => {
        updateLoading(-1);

        const { status, data } = error.response || {};
        const currentPath = window.location.pathname;

        console.log(" API Error - Status:", status);
        console.log(" Current path:", currentPath);
        console.log(" Error data:", data);

        if (status === 401) {
            const publicRoutes = [
                "/login",
                "/register",
                "/choose-role",
                "/forgot-password",
                "/password-reset",
                "/verify-email",
                "/verify-notice"
            ];
            
            const isPublicRoute = publicRoutes.some(route => currentPath.includes(route));
            
            if (!isPublicRoute) {
                console.log("🚪 Token invalide - Redirection vers login");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = "/login";
            }
        }

        if (status === 403) {
            console.log("Accès interdit - Redirection");
            if (!currentPath.includes("/login")) {
                window.location.href = "/login";
            }
        }

        if (status === 404) {
            console.error(" API Endpoint not found:", error.config?.url);
        }

        if (status === 422) {
            return Promise.reject(error);
        }

        if (status === 500) {
            console.error(" Server Error:", data?.message || "Internal Server Error");
        }

        if (error.code === "ERR_NETWORK") {
            console.error(" Network Error - Vérifiez votre connexion");
        }

        return Promise.reject(error);
    }
);

export default api;