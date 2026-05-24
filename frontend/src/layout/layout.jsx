// src/layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from '../lib/components/Sidebar';
import Header from '../lib/components/Header';
import MobileBottomNav from '../lib/components/MobileBottomNav';

export default function Layout() {
    const [currentRole, setCurrentRole] = useState('user');
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile && sidebarOpen) setSidebarOpen(false);
            if (!mobile && collapsed) setCollapsed(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [collapsed, sidebarOpen]);

    useEffect(() => {
        if (isMobile && sidebarOpen) setSidebarOpen(false);
    }, [location.pathname, isMobile]);

    useEffect(() => {
        const userString = localStorage.getItem('user');        
        if (userString) {
            try {
                const user = JSON.parse(userString);
                setCurrentRole(user.role);
            } catch (e) {
                console.error(e);
                setCurrentRole('user');
            }
        } else {
            setCurrentRole('user');
        }
        setLoading(false);
    }, []);

    const handleLogout = () => {
        setIsLoggingOut(true);
        localStorage.clear();
        setTimeout(() => {
            window.location.href = '/login';
        }, 100);
    };

    const PAGE_TITLES = {
        '/admin/dashboard': { title: 'Dashboard Admin', breadcrumb: ['Accueil'] },
        '/admin/articles': { title: 'Fiches Articles', breadcrumb: ['Gestion Magasin'] },
        '/admin/stocks': { title: 'Stocks par Magasin', breadcrumb: ['Gestion Magasin'] },
        '/admin/entree-sortie': { title: 'Entrée / Sortie', breadcrumb: ['Gestion Magasin'] },
        '/admin/alertes': { title: 'Alertes Stock', breadcrumb: ['Gestion Magasin'] },
        '/admin/inventaire': { title: 'Inventaire', breadcrumb: ['Gestion Magasin'] },
        '/admin/transferts': { title: 'Transfert Articles', breadcrumb: ['Gestion Magasin'] },
        '/admin/retours': { title: 'Retours Magasin', breadcrumb: ['Gestion Magasin'] },
        '/admin/commandes': { title: 'Commandes Fournisseurs', breadcrumb: ['Direction & Achats'] },
        '/admin/traiter-commandes': { title: 'Traiter Réceptions', breadcrumb: ['Direction & Achats'] },
        '/admin/rapports': { title: 'Rapports & Éditions', breadcrumb: ['Direction & Achats'] },
        '/admin/export': { title: 'Export/Import', breadcrumb: ['Direction & Achats'] },
        '/admin/utilisateurs': { title: 'Gestion Utilisateurs', breadcrumb: ['Administration'] },
        '/admin/parametres': { title: 'Paramètres', breadcrumb: ['Administration'] },
        '/admin/profil': { title: 'Mon Profil', breadcrumb: ['Mon Compte'] },
        '/admin/affectation-magasins': { title: 'Affectation Magasins', breadcrumb: ['Tableau de bord'] },

        '/magasinier/dashboard': { title: 'Dashboard', breadcrumb: ['Accueil'] },
        '/magasinier/demandes': { title: 'Demandes reçues', breadcrumb: ['Gestion Demandes'] },
        '/magasinier/reservations': { title: 'Réservations', breadcrumb: ['Gestion Demandes'] },
        '/magasinier/retours': { title: 'Retours', breadcrumb: ['Gestion Demandes'] },
        '/magasinier/stocks': { title: 'Consultation Stock', breadcrumb: ['Gestion Stock'] },
        '/magasinier/mouvements': { title: 'Mouvements de Stock', breadcrumb: ['Gestion Stock'] },
        '/magasinier/inventaire': { title: 'Inventaire', breadcrumb: ['Gestion Stock'] },
        '/magasinier/alertes': { title: 'Alertes', breadcrumb: ['Gestion Stock'] },
        '/magasinier/bons-reception': { title: 'Bons de Réception', breadcrumb: ['Commandes'] },
        '/magasinier/profil': { title: 'Mon Profil', breadcrumb: ['Paramètres'] },

        '/user/dashboard': { title: 'Dashboard', breadcrumb: ['Accueil'] },
        '/user/demandes': { title: 'Mes Demandes', breadcrumb: ['Espace Service'] },
        '/user/reservations': { title: 'Mes Réservations', breadcrumb: ['Espace Service'] },
        '/user/consultation-stock': { title: 'Consultation Stock', breadcrumb: ['Espace Service'] },
        '/user/profil': { title: 'Mon Profil', breadcrumb: ['Paramètres'] },
        '/profil': { title: 'Mon Profil', breadcrumb: ['Mon Compte'] },
    };
    
    const current = PAGE_TITLES[location.pathname] || { title: 'Tableau de bord', breadcrumb: [] };
    const [activeItem, setActiveItem] = useState(location.pathname);

    const handleNavigate = (path) => {
        setActiveItem(path.split('?')[0]); // ← Garder seulement le chemin sans paramètres
        navigate(path);
        if (isMobile && sidebarOpen) setSidebarOpen(false);
    };

    const toggleSidebar = () => {
        if (isMobile) {
            setSidebarOpen(!sidebarOpen);
        } else {
            setCollapsed(!collapsed);
        }
    };
    useEffect(() => {
        setActiveItem(location.pathname.split('?')[0]); // ← Ignorer les paramètres
    }, [location.pathname]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006233] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar - Desktop (style original) */}
            {!isMobile && (
                <Sidebar 
                    currentRole={currentRole} 
                    activeItem={activeItem} 
                    onNavigate={handleNavigate} 
                    collapsed={collapsed} 
                    onToggle={toggleSidebar}
                    isMobile={false}
                />
            )}
            
            {/* Sidebar - Mobile Drawer (même Sidebar que desktop) */}
            {isMobile && sidebarOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/40 z-40"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 w-[280px] z-50 shadow-xl">
                        <Sidebar 
                            currentRole={currentRole} 
                            activeItem={activeItem} 
                            onNavigate={handleNavigate}
                            collapsed={false}
                            onToggle={() => setSidebarOpen(false)}
                            isMobile={true}
                        />
                    </div>
                </>
            )}
            
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    currentRole={currentRole} 
                    pageTitle={current.title} 
                    breadcrumb={current.breadcrumb} 
                    onToggleSidebar={toggleSidebar}
                    onNavigate={handleNavigate}  
                    onLogout={handleLogout}      
                    isLoggingOut={isLoggingOut}
                    isMobile={isMobile}
                />
                <main className="flex-1 overflow-y-auto p-3 md:p-5 pb-20 md:pb-5">
                    <Outlet />
                </main>
                
                {/* Mobile Bottom Navigation */}
                {isMobile && (
                    <MobileBottomNav 
                        currentRole={currentRole}
                        activeItem={activeItem}
                        onNavigate={handleNavigate}
                    />
                )}
            </div>
        </div>
    );
}