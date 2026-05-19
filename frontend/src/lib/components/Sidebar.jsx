// src/lib/components/Sidebar.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../apis/axios';

const ROLE_CONFIG = {
    admin: {
        label: 'Administrateur',
        initials: 'AD',
        accent: '#1A237E',
        badge: '#C0392B',
        badgeBg: 'rgba(192,57,43,0.12)',
    },
    magasinier: {
        label: 'Magasinier',
        initials: 'MG',
        accent: '#1B5E20',
        badge: '#1B5E20',
        badgeBg: 'rgba(27,94,32,0.12)',
    },
    user: {
        label: 'Demandeur',
        initials: 'DM',
        accent: '#0288D1',
        badge: '#0288D1',
        badgeBg: 'rgba(2,136,209,0.12)',
    },
};

const MENU_SECTIONS = {
    admin: [
        {
            id: 'dashboard',
            title: 'Tableau de bord',
            icon: 'layout-dashboard',
            items: [
                { label: 'Dashboard', icon: 'home', path: '/admin/dashboard' },
            ],
        },
        // {
        //     id: 'service',
        //     title: 'Espace Service',
        //     icon: 'clipboard-list',
        //     items: [

        //         // { label: 'Mes Demandes Internes', icon: 'file-description', path: '/demandes' },
        //         // { label: 'Réservations', icon: 'calendar-event', path: '/reservations' },
        //     ],
        // },
        {
            id: 'magasin',
            title: 'Gestion Magasin',
            icon: 'building-warehouse',
            items: [
                { label: 'Fiches Articles', icon: 'package', path: '/articles' },
                // { label: 'Mouvements de Stock', icon: 'arrows-transfer-up-down', path: '/mouvements' },
                // { label: 'Inventaire Physique', icon: 'scan', path: '/inventaire' },
                { label: 'Suivi & Alertes', icon: 'bell-ringing', path: '/alertes' },
            ],
        },
        {
            id: 'direction',
            title: 'Direction & Achats',
            icon: 'chart-bar',
            items: [
                { label: 'Achats & Commandes', icon: 'shopping-cart', path: '/achats' },
                { label: 'Éditions & Rapports', icon: 'report-analytics', path: '/rapports' },
                { label: 'Administration', icon: 'settings', path: '/admin/administration' },
            ],
        },
    ],
    
    magasinier: [
        {
            id: 'dashboard',
            title: 'Tableau de bord',
            icon: 'layout-dashboard',
            items: [
                { label: 'Dashboard', icon: 'home', path: '/magasinier/dashboard' },
            ],
        },
        {
            id: 'magasin',
            title: 'Gestion Magasin',
            icon: 'building-warehouse',
            items: [
                { label: 'Fiches Articles', icon: 'package', path: '/articles' },
                { label: 'Mouvements de Stock', icon: 'arrows-transfer-up-down', path: '/mouvements' },
                { label: 'Inventaire Physique', icon: 'scan', path: '/inventaire' },
                { label: 'Suivi & Alertes', icon: 'bell-ringing', path: '/alertes' },
            ],
        },
    ],
    
    user: [
        {
            id: 'dashboard',
            title: 'Tableau de bord',
            icon: 'layout-dashboard',
            items: [
                { label: 'Dashboard', icon: 'home', path: '/user/dashboard' },
            ],
        },
        {
            id: 'service',
            title: 'Espace Service',
            icon: 'clipboard-list',
            items: [
                { label: 'Mes Demandes Internes', icon: 'file-description', path: '/demandes' },
                { label: 'Réservations', icon: 'calendar-event', path: '/reservations' },
            ],
        },
    ],
};

function TI({ name, size = 18, color, className = '' }) {
    return (
        <i
            className={`ti ti-${name} ${className}`}
            aria-hidden="true"
            style={{ fontSize: size, lineHeight: 1, color }}
        />
    );
}

export default function Sidebar({ currentRole, activeItem, onNavigate, collapsed, onToggle }) {
    const role = ROLE_CONFIG[currentRole] || ROLE_CONFIG.user;
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const navigate = useNavigate();

    const menuSections = MENU_SECTIONS[currentRole] || MENU_SECTIONS.user;

    console.log("=== SIDEBAR DEBUG ===");
    console.log("currentRole reçu:", currentRole);
    console.log("menuSections trouvées:", menuSections.length);
    console.log("==================");

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const token = localStorage.getItem("token");
            if (token) {
                await api.post('/api/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (e) {
            console.error('Erreur déconnexion:', e);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    };

    return (
        <aside className={`h-screen bg-[#0D1B2A] flex flex-col overflow-hidden sticky top-0 z-50 shadow-2xl transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[260px]'}`}>
            {/* Logo */}
            <div className={`border-b border-white/10 transition-all duration-300 ${collapsed ? 'px-3 py-4' : 'px-5 py-4'}`}>
                <div className={`flex flex-col items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
                    <div className="w-16 h-16 flex items-center justify-center">
                        <img src="/image/ISTAHT.png" alt="ISTAHT" className="w-full h-full object-contain" />
                    </div>
                    {!collapsed && (
                        <div className="text-[10px] text-[#F9A825] font-medium tracking-wide mt-1 whitespace-nowrap">
                            Gestion des Stocks
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <div className="flex gap-1 mt-3">
                        {['#C0392B', '#F9A825', '#1B5E20', '#1A237E', '#0288D1'].map((c, i) => (
                            <div key={i} className="flex-1 h-0.5 rounded-full opacity-85" style={{ background: c }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
                {menuSections.map(section => (
                    <div key={section.id} className="mb-5">
                        {!collapsed ? (
                            <div className="flex items-center gap-1.5 px-2 mb-2">
                                <TI name={section.icon} size={11} color="rgba(255,255,255,0.28)" />
                                <span className="text-[9.5px] font-bold uppercase tracking-wider text-white/30 whitespace-nowrap">
                                    {section.title}
                                </span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>
                        ) : (
                            <div className="h-px bg-white/10 mx-2 mb-3" />
                        )}
                        {section.items.map(item => {
                            const isActive = activeItem === item.path;
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => onNavigate(item.path)}
                                    title={collapsed ? item.label : undefined}
                                    className={`w-full flex items-center rounded-lg mb-1 transition-all duration-150 outline-none
                                        ${collapsed ? 'justify-center gap-0 py-2 px-0' : 'justify-start gap-2 py-2 px-2.5'}
                                        ${isActive ? 'text-white' : 'text-white/60'}`}
                                    style={{
                                        background: isActive ? role.accent + '22' : 'transparent',
                                        borderLeft: !collapsed && isActive ? `3px solid ${role.accent}` : !collapsed ? '3px solid transparent' : 'none'
                                    }}
                                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <TI name={item.icon} size={17} color={isActive ? role.accent : 'rgba(255,255,255,0.35)'} />
                                    {!collapsed && <span className="text-[12.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>
// CCC
            {/* Footer */}
            <div className={`border-t border-white/10 bg-[#0A1520] ${collapsed ? 'px-2 py-3' : 'px-3 py-4'}`}>
                {/* {!collapsed && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0" style={{ background: role.accent }}>
                            {role.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                                {role.label}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-green-500" />
                                <span className="text-[10px] text-green-500">En ligne</span>
                            </div>
                        </div>
                        <div className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: role.badgeBg, color: role.badge }}>
                            {currentRole === 'admin' ? 'ADMIN' : currentRole === 'magasinier' ? 'MAG' : 'DEM'}
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div className="flex justify-center mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: role.accent }}>
                            {role.initials}
                        </div>
                    </div>
                )} */}
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full bg-transparent border border-red-500/50 rounded-lg py-1.5 text-xs font-semibold text-red-300 cursor-pointer transition-all duration-150 flex items-center justify-center gap-1.5 hover:bg-red-500/10 hover:border-red-500"
                >
                    <TI name="logout" size={14} color="#EF9A9A" />
                    {!collapsed && (isLoggingOut ? 'Déconnexion…' : 'Se déconnecter')}
                </button>
            </div>
        </aside>
    );
}