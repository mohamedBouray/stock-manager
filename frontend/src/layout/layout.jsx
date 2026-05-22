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
            console.log("Aucun user trouvé");
            setCurrentRole('user');
        }
        setLoading(false); 
    }, []);

   const handleLogout = () => {
    // Vider localStorage
    localStorage.clear();
    // Rediriger directement sans utiliser navigate
    window.location.href = '/login';
};
    const PAGE_TITLES = {
        '/admin/dashboard': { title: 'Dashboard Admin', breadcrumb: ['Accueil'] },
        '/magasinier/dashboard': { title: 'Dashboard Magasinier', breadcrumb: ['Accueil'] },
        '/user/dashboard': { title: 'Dashboard Demandeur', breadcrumb: ['Accueil'] },
        '/demandes': { title: 'Mes Demandes Internes', breadcrumb: ['Espace Service'] },
        '/reservations': { title: 'Réservations', breadcrumb: ['Espace Service'] },
        '/articles': { title: 'Fiches Articles', breadcrumb: ['Gestion Magasin'] },
        '/mouvements': { title: 'Mouvements de Stock', breadcrumb: ['Gestion Magasin'] },
        '/inventaire': { title: 'Inventaire Physique', breadcrumb: ['Gestion Magasin'] },
        '/alertes': { title: 'Suivi & Alertes', breadcrumb: ['Gestion Magasin'] },
        '/achats': { title: 'Achats & Commandes', breadcrumb: ['Direction & Achats'] },
        '/rapports': { title: 'Éditions & Rapports', breadcrumb: ['Direction & Achats'] },
        '/admin/administration': { title: 'Administration', breadcrumb: ['Direction & Achats'] },
        '/profil': { title: 'Mon Profil', breadcrumb: ['Mon Compte'] }, 
        '/change-password': { title: 'Changer mot de passe', breadcrumb: ['Mon Compte'] }, 
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