// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import api from './lib/apis/axios';
import { attachLoadingHandler } from './lib/apis/axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';

// Auth Components
import Login from './pages/Auth/Login';
import ChooseRole from './pages/Auth/ChooseRole';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/Verify-email';
import ForgotPassword from './pages/Auth/ForgotPassword'; 
import ResetPassword from './pages/Auth/ResetPassword';

// Layout
import Layout from './layout/Layout';
import Profile from './lib/components/Profile';

// Admin Components
import AdminDashboard from './pages/Admin/Dashboard';
import Administration from './pages/Admin/Administration';

// Magasinier Components
import MagasinierDashboard from './pages/Magasinier/Dashboard';
import MagasinierParametres from './pages/Magasinier/Parametres';
// User Components
import UserDashboard from './pages/User/Dashboard';
import UserParametres from './pages/User/Parametres';

// Dashboard paths
const DASHBOARDS = {
    admin: "/admin/dashboard",
    magasinier: "/magasinier/dashboard",
    user: "/user/dashboard"
};

const getUser = () => {
    const userString = localStorage.getItem('user');
    if (userString) {
        try {
            return JSON.parse(userString);
        } catch (e) {
            return null;
        }
    }
    return null;
};

const getToken = () => {
    return localStorage.getItem('token');
};

const ProtectedRoute = ({ allowedRoles }) => {
    const token = getToken();
    const user = getUser();
    const currentPath = window.location.pathname;

    // Routes publiques
    const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
    if (publicRoutes.includes(currentPath)) {
        return <Outlet />;
    }

    // Si pas authentifié
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }
    
    // Vérification email
    if (user.role !== 'admin' && !user.email_verified_at && currentPath !== '/verify-email') {
        return <Navigate to="/verify-email" replace />;
    }

    // Vérification rôle
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const dashboard = DASHBOARDS[user.role] || "/";
        return <Navigate to={dashboard} replace />;
    }
    
    return <Outlet />;
};

const VerifyRoute = () => {
    const user = getUser();
    
    if (user && user.email_verified_at) {
        return <Navigate to={DASHBOARDS[user.role] || "/"} replace />;
    }
    
    return <VerifyEmail />;
};

function AppContent() {
    const { setLoading } = useLoading();
    const [hasUsers, setHasUsers] = useState(null);
    const [appLoading, setAppLoading] = useState(true);
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        userRole: null,
        user: null
    });
    
    useEffect(() => {
        attachLoadingHandler(setLoading);
        
        // Vérifier l'authentification
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const userString = localStorage.getItem('user');
            const user = userString ? JSON.parse(userString) : null;
            setAuthState({
                isAuthenticated: !!(token && user),
                userRole: user?.role,
                user: user
            });
        };
        
        checkAuth();
        
        // Écouter les changements de localStorage
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, [setLoading]);
    
    useEffect(() => {
        api.get('/api/check-db-status')
            .then(response => {
                setHasUsers(response.data.has_users);
                setAppLoading(false);
            })
            .catch(error => {
                console.error("Error checking DB status", error);
                setAppLoading(false);
            });
    }, []);
    
    if (appLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006233] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement du système...</p>
                </div>
            </div>
        );
    }
    
    return (
        <Router>
            <Routes>
                {/* Root */}
                <Route path="/" element={
                    authState.isAuthenticated && authState.user 
                        ? <Navigate to={DASHBOARDS[authState.user.role]} replace />
                        : hasUsers 
                            ? <Navigate to="/login" replace />
                            : <Navigate to="/register" replace />
                } />
                
                {/* Auth Routes */}
                <Route path="/login" element={
                    authState.isAuthenticated 
                        ? <Navigate to={DASHBOARDS[authState.user?.role]} replace />
                        : <Login hasUsers={hasUsers} />
                } />
                
                <Route path="/choose-role" element={
                    authState.isAuthenticated 
                        ? <Navigate to={DASHBOARDS[authState.user?.role]} replace />
                        : <ChooseRole />
                } />
                
                <Route path="/register" element={
                    authState.isAuthenticated && authState.user?.role === 'admin'
                        ? <Register hasUsers={hasUsers} currentUser={authState.user} />
                        : !authState.isAuthenticated
                            ? <Register hasUsers={hasUsers} />
                            : <Navigate to={DASHBOARDS[authState.user?.role]} replace />
                } />
                
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/password-reset/:token" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyRoute />} />
                
                {/* Super Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route element={<Layout />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/administration" element={<Administration />} />
                        <Route path="/profile" element={<Profile />} /> 
                    </Route>
                </Route>
                
                {/* Magasinier Routes */}
                <Route element={<ProtectedRoute allowedRoles={['magasinier']} />}>
                    <Route element={<Layout />}>
                        <Route path="/magasinier/dashboard" element={<MagasinierDashboard />} />
                        <Route path="/magasinier/Parametres" element={<MagasinierParametres />} />
                    </Route>
                </Route>
                
                {/* User Routes */}
                <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                    <Route element={<Layout />}>
                        <Route path="/user/dashboard" element={<UserDashboard />} />
                        <Route path="/user/Parametres" element={<UserParametres />} />
                    </Route>
                </Route>
                
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <LoadingProvider>
                <AppContent />
            </LoadingProvider>
        </AuthProvider>
    );
}