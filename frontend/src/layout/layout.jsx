// src/layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Sidebar from '../lib/components/Sidebar';
import Header from '../lib/components/Header';

export default function Layout() {
    const [currentRole, setCurrentRole] = useState('user');
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const userString = localStorage.getItem('user');        
        if (userString) {
            try {
                const user = JSON.parse(userString);
                setCurrentRole(user.role);
            } catch (e) {
                console.error("Erreur:", e);
                setCurrentRole('user');
            }
        } else {
            setCurrentRole('user');
        }
        setLoading(false);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    // Titres des pages par chemin
    const PAGE_TITLES = {
        // Admin
        '/admin/dashboard': { title: 'Dashboard Admin', breadcrumb: ['Accueil'] },
        '/admin/articles': { title: 'Fiches Articles', breadcrumb: ['Gestion Magasin'] },
        '/admin/stocks': { title: 'Stocks par Magasin', breadcrumb: ['Gestion Magasin'] },
        '/admin/entree-sortie': { title: 'Entrée / Sortie', breadcrumb: ['Gestion Magasin'] },
        '/admin/alertes': { title: 'Alertes Stock', breadcrumb: ['Gestion Magasin'] },
        '/admin/commandes': { title: 'Commandes Fournisseurs', breadcrumb: ['Direction & Achats'] },
        '/admin/traiter-commandes': { title: 'Traiter Réceptions', breadcrumb: ['Direction & Achats'] },
        '/admin/rapports': { title: 'Rapports & Éditions', breadcrumb: ['Direction & Achats'] },
        '/admin/utilisateurs': { title: 'Gestion Utilisateurs', breadcrumb: ['Administration'] },
        '/admin/parametres': { title: 'Paramètres', breadcrumb: ['Administration'] },
        
        // Magasinier
        '/magasinier/dashboard': { title: 'Dashboard Magasinier', breadcrumb: ['Accueil'] },
        '/magasinier/demandes': { title: 'Demandes reçues', breadcrumb: ['Gestion Demandes'] },
        '/magasinier/reservations': { title: 'Réservations', breadcrumb: ['Gestion Demandes'] },
        '/magasinier/stocks': { title: 'Consultation Stock', breadcrumb: ['Gestion Stock'] },
        '/magasinier/mouvements': { title: 'Mouvements de Stock', breadcrumb: ['Gestion Stock'] },
        '/magasinier/entree-sortie': { title: 'Entrée/Sortie', breadcrumb: ['Gestion Stock'] },
        '/magasinier/alertes': { title: 'Alertes', breadcrumb: ['Gestion Stock'] },
        '/magasinier/bons-reception': { title: 'Bons de Réception', breadcrumb: ['Commandes'] },
        
        // Demandeur
        '/user/dashboard': { title: 'Dashboard Demandeur', breadcrumb: ['Accueil'] },
        '/user/demandes': { title: 'Mes Demandes', breadcrumb: ['Espace Service'] },
        '/user/nouvelle-demande': { title: 'Nouvelle Demande', breadcrumb: ['Espace Service'] },
        '/user/reservations': { title: 'Mes Réservations', breadcrumb: ['Espace Service'] },
        '/user/consultation-stock': { title: 'Consultation Stock', breadcrumb: ['Espace Service'] },
        '/user/historique-demandes': { title: 'Historique', breadcrumb: ['Espace Service'] },
        
        // Commun
        '/profil': { title: 'Mon Profil', breadcrumb: ['Mon Compte'] },
    };
    
    const current = PAGE_TITLES[location.pathname] || { title: 'Tableau de bord', breadcrumb: [] };
    const [activeItem, setActiveItem] = useState(location.pathname);

    const handleNavigate = (path) => {
        setActiveItem(path);
        navigate(path);
    };

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
        <>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css" />
            <div className="flex h-screen overflow-hidden font-sans">
                <Sidebar 
                    currentRole={currentRole} 
                    activeItem={activeItem} 
                    onNavigate={handleNavigate} 
                    collapsed={collapsed} 
                    onToggle={() => setCollapsed(c => !c)}
                />
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                    <Header 
                        currentRole={currentRole} 
                        pageTitle={current.title} 
                        breadcrumb={current.breadcrumb} 
                        onToggleSidebar={() => setCollapsed(c => !c)}
                        onNavigate={handleNavigate}  
                        onLogout={handleLogout}      
                        isLoggingOut={isLoggingOut}   
                    />
                    <main className="flex-1 overflow-y-auto p-3">
                        <Outlet />
                    </main>
                </div>
            </div>
        </>
    );
}