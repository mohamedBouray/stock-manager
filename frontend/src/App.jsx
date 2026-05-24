import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import api from './lib/apis/axios';
import { attachLoadingHandler } from './lib/apis/axios';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';

// ==================== AUTH COMPONENTS ====================
import Login from './pages/Auth/Login';
import ChooseRole from './pages/Auth/ChooseRole';
import Register from './pages/Auth/Register';
import VerifyEmail from './pages/Auth/Verify-email';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// ==================== LAYOUT & COMMON ====================
import Layout from './layout/Layout';
import Profile from './lib/components/Profile';

// ==================== ADMIN COMPONENTS ====================
// Dashboard 
import AdminDashboard from './pages/Admin/Dashboard';
import AffectationMagasins from './pages/Admin/AffectationMagasins';
// Gestion Magasin
import AjouterArticle from './pages/Admin/AjouterArticle';
import Stocks from './pages/Admin/Stocks';
import EntreeSortie from './pages/Admin/EntreeSortie';
import Inventaire from './pages/Admin/inventaire';
import AlertesStock from './pages/Admin/Alertes';
import Transferts from './pages/Admin/Transferts';
import Retours from './pages/Admin/Retours';

// Direction & Achats
import CommandesMinistere from './pages/Admin/Demande';
import TraiterCommandes from './pages/Admin/TraiterCommandes';
import Rapports from './pages/Admin/Rapports';
import ExportImport from './pages/Admin/ExportImport';
// Administration
import Administration from './pages/Admin/Administration';
import SettingsPanel from './pages/Admin/SettingsPanel';
import MonProfil from '../src/lib/components/Profile';


// ==================== MAGASINIER COMPONENTS ====================
// Dashboard
import MagasinierDashboard from './pages/Magasinier/Dashboard';
// Gestion Demandes
import GestionDemandes from './pages/Magasinier/GestionDemandes';
import GestionReservations from './pages/Magasinier/GestionReservations';
import MagasinierRetours from './pages/Magasinier/Retours';
// Gestion Stock
import MagasinierStocks from './pages/Magasinier/Stocks';
import MouvementsStock from './pages/Magasinier/MouvementsStock';
import MagasinierInventaire from './pages/Magasinier/Inventaire';
import MagasinierAlertes from './pages/Magasinier/Alertes';
// Commandes
import BonsReception from './pages/Magasinier/BonsReception';
// Paramètres
import MagasinierParametres from './pages/Magasinier/Parametres';


// ==================== DEMANDEUR (USER) COMPONENTS ====================
// Dashboard
import UserDashboard from './pages/User/Dashboard';
// Espace Service
import Demandes from './pages/User/Demandes';
import Reservations from './pages/User/Reservations';
import ConsultationStock from './pages/User/ConsultationStock';
// Paramètres
import UserParametres from './pages/User/Parametres';



// ==================== CONSTANTES ====================
const DASHBOARDS = { admin: "/admin/dashboard", magasinier: "/magasinier/dashboard", user: "/user/dashboard" };

// ==================== HELPER FUNCTIONS ====================
const getUser = () => { const userString = localStorage.getItem('user');
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

// ==================== PROTECTED ROUTE COMPONENT ====================
const ProtectedRoute = ({ allowedRoles }) => {
    const token = getToken();
    const user = getUser();
    const currentPath = window.location.pathname;

    const publicRoutes = ['/login', '/register', '/choose-role', '/forgot-password', '/reset-password', '/verify-email'];
    if (publicRoutes.includes(currentPath)) {
        return <Outlet />;
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }
    
    if (user.role !== 'admin' && !user.email_verified_at && currentPath !== '/verify-email') {
        return <Navigate to="/verify-email" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const dashboard = DASHBOARDS[user.role] || "/";
        return <Navigate to={dashboard} replace />;
    }
    
    return <Outlet />;
};

// ==================== VERIFY ROUTE COMPONENT ====================
const VerifyRoute = () => {
    const user = getUser();
    
    if (user && user.email_verified_at) {
        return <Navigate to={DASHBOARDS[user.role] || "/"} replace />;
    }
    
    return <VerifyEmail />;
};

// ==================== APP CONTENT ====================
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
                {/* ==================== ROOT ==================== */}
                <Route path="/" element={ authState.isAuthenticated && authState.user ? <Navigate to={DASHBOARDS[authState.user.role]} replace /> : hasUsers ? <Navigate to="/login" replace /> : <Navigate to="/register" replace />} />
                
                {/* ==================== AUTH ROUTES ==================== */}
                <Route path="/login" element={  authState.isAuthenticated  ? <Navigate to={DASHBOARDS[authState.user?.role]} replace /> : <Login hasUsers={hasUsers} />} />
                <Route path="/choose-role" element={ authState.isAuthenticated  ? <Navigate to={DASHBOARDS[authState.user?.role]} replace /> : <ChooseRole />} />
                <Route path="/register" element={ authState.isAuthenticated && authState.user?.role === 'admin' ? <Register hasUsers={hasUsers} currentUser={authState.user} /> : !authState.isAuthenticated ? <Register hasUsers={hasUsers} /> : <Navigate to={DASHBOARDS[authState.user?.role]} replace />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/password-reset/:token" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyRoute />} />

                {/* ==================== ADMIN ROUTES ==================== */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route element={<Layout />}>
                        {/* Dashboard */}
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/affectation-magasins" element={<AffectationMagasins />} />
                        {/* Gestion Magasin */}
                        <Route path="/admin/articles" element={<AjouterArticle />} />
                        <Route path="/admin/stocks" element={<Stocks />} />
                        <Route path="/admin/entree-sortie" element={<EntreeSortie />} />
                        <Route path="/admin/inventaire" element={<Inventaire />} />
                        <Route path="/admin/alertes" element={<AlertesStock />} />
                        <Route path="/admin/transferts" element={<Transferts />} />
                        <Route path="/admin/retours" element={<Retours />} />
                        {/* Direction & Achats */}
                        <Route path="/admin/commandes" element={<CommandesMinistere />} />
                        <Route path="/admin/traiter-commandes" element={<TraiterCommandes />} />
                        <Route path="/admin/rapports" element={<Rapports />} />
                        <Route path="/admin/export" element={<ExportImport />} />
                        {/* Administration */}
                        <Route path="/admin/utilisateurs" element={<Administration />} />
                        <Route path="/admin/parametres" element={<SettingsPanel />} />
                        <Route path="/admin/Mon Profil" element={<MonProfil />} />
                    </Route>
                </Route>
                
                {/* ==================== MAGASINIER ROUTES ==================== */}
                <Route element={<ProtectedRoute allowedRoles={['magasinier']} />}>
                    <Route element={<Layout />}>
                        {/* Dashboard */}
                        <Route path="/magasinier/dashboard" element={<MagasinierDashboard />} />
                        {/* Gestion Demandes */}
                        <Route path="/magasinier/demandes" element={<GestionDemandes />} />
                        <Route path="/magasinier/reservations" element={<GestionReservations />} />
                        <Route path="/magasinier/retours" element={<MagasinierRetours />} />
                        {/* Gestion Stock */}
                        <Route path="/magasinier/stocks" element={<MagasinierStocks />} />
                        <Route path="/magasinier/mouvements" element={<MouvementsStock />} />
                        <Route path="/magasinier/inventaire" element={<MagasinierInventaire />} />
                        <Route path="/magasinier/alertes" element={<MagasinierAlertes />} />
                        {/* Commandes */}
                        <Route path="/magasinier/bons-reception" element={<BonsReception />} />
                        {/* Paramètres */}
                        <Route path="/magasinier/profil" element={<Profile />} />
                        <Route path="/magasinier/parametres" element={<MagasinierParametres />} />
                    </Route>
                </Route>
                
                {/* ==================== DEMANDEUR (USER) ROUTES ==================== */}
                <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                    <Route element={<Layout />}>
                        {/* Dashboard */}
                        <Route path="/user/dashboard" element={<UserDashboard />} />
                        {/* Espace Service */}
                        <Route path="/user/demandes" element={<Demandes />} />
                        <Route path="/user/reservations" element={<Reservations />} />
                        <Route path="/user/consultation-stock" element={<ConsultationStock />} />
                        {/* Paramètres */}
                        <Route path="/user/profil" element={<UserParametres />} />
                    </Route>
                </Route>
                
                {/* ==================== CATCH ALL ==================== */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

// ==================== APP ====================
export default function App() {
    return (
        <AuthProvider>
            <LoadingProvider>
                <AppContent />
            </LoadingProvider>
        </AuthProvider>
    );
}