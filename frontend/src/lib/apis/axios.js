// src/lib/apis/axios.js
import axios from "axios";

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

// ✅ SYSTÈME DE CACHE POUR LES GET
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const responseCache = new Map();

// Nettoyer le cache toutes les heures
setInterval(() => {
    const now = Date.now();
    for (const [key, { timestamp }] of responseCache.entries()) {
        if (now - timestamp > CACHE_DURATION) {
            responseCache.delete(key);
        }
    }
}, 60 * 60 * 1000);

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

// ✅ GÉNÉRER UNE CLÉ DE CACHE UNIQUE
const getCacheKey = (config) => {
    return `${config.method}:${config.url}:${JSON.stringify(config.params)}:${JSON.stringify(config.data)}`;
};

// ✅ INTERCEPTEUR REQUÊTE OPTIMISÉ
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // ✅ NE PAS AJOUTER _t POUR LE CACHE !!
        // On ajoute seulement pour les requêtes importantes
        if (config.params?.noCache === true) {
            config.params = {
                ...config.params,
                _t: Date.now()
            };
            delete config.params.noCache;
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

// ✅ INTERCEPTEUR RÉPONSE AVEC CACHE
api.interceptors.response.use(
    (response) => {
        updateLoading(-1);
        
        // ✅ Mettre en cache les réponses GET uniquement
        if (response.config.method === 'get') {
            const cacheKey = getCacheKey(response.config);
            responseCache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now(),
                config: response.config
            });
        }
        
        return response;
    },
    (error) => {
        updateLoading(-1);

        const { status, data } = error.response || {};
        const currentPath = window.location.pathname;

        if (status === 403 && data?.message?.includes('bloqué')) {
            let email = '';
            const userString = localStorage.getItem('user');
            if (userString) {
                try {
                    const user = JSON.parse(userString);
                    email = user.email || '';
                } catch(e) {}
            }
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            window.dispatchEvent(new CustomEvent('user-blocked', { detail: { email } }));
            return Promise.reject(error);
        }

        if (status === 401) {
            const publicRoutes = [
                "/login", "/register", "/choose-role",
                "/forgot-password", "/password-reset",
                "/verify-email", "/verify-notice"
            ];
            
            const isPublicRoute = publicRoutes.some(route => currentPath.includes(route));
            
            if (!isPublicRoute && !currentPath.includes("/login")) {
                console.log("🚪 Token invalide - Redirection vers login");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = "/login";
            }
        }

        if (status === 403 && !currentPath.includes("/login")) {
            console.log("Accès interdit - Redirection");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = "/login?forbidden=true";
        }

        if (status === 404) {
            console.error("API Endpoint not found:", error.config?.url);
        }

        if (status === 500) {
            console.error("Server Error:", data?.message || "Internal Server Error");
        }

        if (error.code === "ERR_NETWORK") {
            console.error("Network Error - Vérifiez votre connexion");
        }

        return Promise.reject(error);
    }
);

// ✅ FONCTION POUR RÉCUPÉRER AVEC CACHE (utiliser dans vos composants)
export const getWithCache = async (url, options = {}) => {
    const { forceRefresh = false, params = {}, cacheTime = CACHE_DURATION } = options;
    
    const config = {
        method: 'get',
        url,
        params: forceRefresh ? { ...params, noCache: true } : params
    };
    
    const cacheKey = getCacheKey(config);
    
    // Vérifier le cache
    if (!forceRefresh && responseCache.has(cacheKey)) {
        const cached = responseCache.get(cacheKey);
        if (Date.now() - cached.timestamp < cacheTime) {
            console.log(`✅ Cache hit for: ${url}`);
            return cached.data;
        }
    }
    
    console.log(`🔄 Cache miss for: ${url}`);
    const response = await api(config);
    return response.data;
};


export const clearCache = () => {
    responseCache.clear();
    console.log('🗑️ Cache vidé');
};


export const invalidateCache = (url) => {
    for (const [key, value] of responseCache.entries()) {
        if (value.config?.url === url) {
            responseCache.delete(key);
        }
    }
    console.log(`🗑️ Cache invalidé pour: ${url}`);
};

export default api;