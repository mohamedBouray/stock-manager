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

// Admin Components
import AdminDashboard from './pages/Admin/Dashboard';
import Administration from './pages/Admin/Administration';

// Magasinier Components
import MagasinierDashboard from './pages/Magasinier/Dashboard';

// User Components
import UserDashboard from './pages/User/Dashboard';

// Dashboard paths
const DASHBOARDS = {
    admin: "/admin/dashboard",
    magasinier: "/magasinier/dashboard",
    user: "/user/dashboard"
};

// ✅ Helper pour récupérer l'utilisateur (hors component)
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

// ✅ Helper pour récupérer le token
const getToken = () => {
    return localStorage.getItem('token');
};

// ✅ Protected Route simplifié
const ProtectedRoute = ({ allowedRoles }) => {
    const token = getToken();
    const user = getUser();
    const currentPath = window.location.pathname;
    
    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }
    
    // Vérifier si email vérifié (sauf pour admin)
    if (user.role !== 'admin' && !user.email_verified_at && currentPath !== '/verify-email') {
        return <Navigate to="/verify-email" replace />;
    }
    
    // Vérifier les rôles autorisés
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to={DASHBOARDS[user.role] || "/"} replace />;
    }
    
    return <Outlet />;
};

// ✅ Verify Route simplifié
const VerifyRoute = () => {
    const user = getUser();
    
    if (user && user.email_verified_at) {
        return <Navigate to={DASHBOARDS[user.role] || "/"} replace />;
    }
    
    return <VerifyEmail />;
};

/*
|--------------------------------------------------------------------------
|                            App Content
|--------------------------------------------------------------------------
*/
function AppContent() {
    const { setLoading } = useLoading();
    const [hasUsers, setHasUsers] = useState(null);
    const [loading, setAppLoading] = useState(true);
    const user = getUser();
    const token = getToken();
    const isAuthenticated = !!(token && user);
    
    useEffect(() => {
        attachLoadingHandler(setLoading);
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
    
    if (loading) {
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
                    isAuthenticated 
                        ? <Navigate to={DASHBOARDS[user.role]} replace />
                        : hasUsers 
                            ? <Navigate to="/login" replace />
                            : <Navigate to="/register" replace />
                } />
                
                {/* Auth Routes - sans PublicRoute complexe */}
                <Route path="/login" element={
                    isAuthenticated 
                        ? <Navigate to={DASHBOARDS[user.role]} replace />
                        : <Login hasUsers={hasUsers} />
                } />
                
                <Route path="/choose-role" element={
                    isAuthenticated 
                        ? <Navigate to={DASHBOARDS[user.role]} replace />
                        : <ChooseRole />
                } />
                
                <Route path="/register" element={
                    isAuthenticated && user?.role === 'admin'
                        ? <Register hasUsers={hasUsers} currentUser={user} />
                        : !isAuthenticated
                            ? <Register hasUsers={hasUsers} />
                            : <Navigate to={DASHBOARDS[user.role]} replace />
                } />
                
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/password-reset/:token" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyRoute />} />
                
                {/* Super Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route element={<Layout />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/administration" element={<Administration />} />
                    </Route>
                </Route>
                
                {/* Magasinier Routes */}
                <Route element={<ProtectedRoute allowedRoles={['magasinier']} />}>
                    <Route element={<Layout />}>
                        <Route path="/magasinier/dashboard" element={<MagasinierDashboard />} />
                    </Route>
                </Route>
                
                {/* User Routes */}
                
                <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                    <Route element={<Layout />}>
                        <Route path="/user/dashboard" element={<UserDashboard />} />
                    </Route>
                </Route>
                
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

/*
|--------------------------------------------------------------------------
|                            Main App
|--------------------------------------------------------------------------
*/
export default function App() {
    return (
        <AuthProvider>
                <LoadingProvider>
                    <AppContent />
                </LoadingProvider>
        </AuthProvider>
    );
}