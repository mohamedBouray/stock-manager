import React from 'react';
import { 
    LayoutDashboard, 
    Home, 
    Building2, 
    Package, 
    Boxes, 
    ArrowUpDown, 
    Scan, 
    BellRing, 
    Repeat,
    RotateCcw, 
    ShoppingCart, 
    ClipboardList, 
    FileBarChart, 
    Upload,
    Users, 
    Settings, 
    User, 
    Calendar,
    FileText,
} from 'lucide-react';

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
            icon: LayoutDashboard,
            items: [
                { label: 'Dashboard', icon: Home, path: '/admin/dashboard' },
                { label: 'Affectation Magasins', icon: Building2, path: '/admin/affectation-magasins' },
            ],
        },
        {
            id: 'magasin',
            title: 'Gestion Magasin',
            icon: Building2,
            items: [
                { label: 'Fiches Articles', icon: Package, path: '/admin/articles' },
                { label: 'Stocks par Magasin', icon: Boxes, path: '/admin/stocks' },
                { label: 'Entrée/Sortie', icon: ArrowUpDown, path: '/admin/entree-sortie' },
                { label: 'Inventaire', icon: Scan, path: '/admin/inventaire' },
                { label: 'Alertes Stock', icon: BellRing, path: '/admin/alertes' },
                { label: 'Transfert Articles', icon: Repeat, path: '/admin/transferts' },
                { label: 'Retours Magasin', icon: RotateCcw, path: '/admin/retours' },
            ],
        },
        {
            id: 'direction',
            title: 'Direction & Achats',
            icon: FileBarChart,
            items: [
                { label: 'Commandes Fournisseurs', icon: ShoppingCart, path: '/admin/commandes' },
                { label: 'Traiter Réceptions', icon: ClipboardList, path: '/admin/traiter-commandes' },
                { label: 'Rapports & Éditions', icon: FileBarChart, path: '/admin/rapports' },
            ],
        },
        {
            id: 'administration',
            title: 'Administration',
            icon: Settings,
            items: [
                { label: 'Utilisateurs', icon: Users, path: '/admin/utilisateurs' },
                { label: 'Paramètres', icon: Settings, path: '/admin/parametres' },
                { label: 'Mon Profil', icon: User, path: '/admin/profil' },
            ],
        },
    ],
    
    magasinier: [
        {
            id: 'dashboard',
            title: 'Tableau de bord',
            icon: LayoutDashboard,
            items: [
                { label: 'Dashboard', icon: Home, path: '/magasinier/dashboard' },
            ],
        },
        {
            id: 'demandes',
            title: 'Gestion Demandes',
            icon: ClipboardList,
            items: [
                { label: 'Demandes reçues', icon: FileText, path: '/magasinier/demandes' },
                { label: 'Réservations', icon: Calendar, path: '/magasinier/reservations' },
                { label: 'Retours', icon: RotateCcw, path: '/magasinier/retours' },
            ],
        },
        {
            id: 'stock',
            title: 'Gestion Stock',
            icon: Building2,
            items: [
                { label: 'Consultation Stock', icon: Package, path: '/magasinier/stocks' },
                { label: 'Mouvements', icon: ArrowUpDown, path: '/magasinier/mouvements' },
                { label: 'Inventaire', icon: Scan, path: '/magasinier/inventaire' },
                { label: 'Alertes', icon: BellRing, path: '/magasinier/alertes' },
            ],
        },
        {
            id: 'commandes',
            title: 'Commandes',
            icon: ShoppingCart,
            items: [
                { label: 'Bons de Réception', icon: FileText, path: '/magasinier/bons-reception' },
            ],
        },
        {
            id: 'parametres',
            title: 'Paramètres',
            icon: Settings,
            items: [
                { label: 'Mon Profil', icon: User, path: '/magasinier/profil' },
            ],
        },
    ],
    
    user: [
        {
            id: 'dashboard',
            title: 'Tableau de bord',
            icon: LayoutDashboard,
            items: [
                { label: 'Dashboard', icon: Home, path: '/user/dashboard' },
            ],
        },
        {
            id: 'service',
            title: 'Espace Service',
            icon: ClipboardList,
            items: [
                { label: 'Mes Demandes', icon: FileText, path: '/user/demandes' },
                { label: 'Réservations', icon: Calendar, path: '/user/reservations' },
                { label: 'Consultation Stock', icon: Package, path: '/user/consultation-stock' },
            ],
        },
        {
            id: 'parametres',
            title: 'Paramètres',
            icon: Settings,
            items: [
                { label: 'Mon Profil', icon: User, path: '/user/profil' },
            ],
        },
    ],
};

export default function Sidebar({ currentRole, activeItem, onNavigate, collapsed, onToggle, isMobile = false }) {
    const role = ROLE_CONFIG[currentRole] || ROLE_CONFIG.user;
    const menuSections = MENU_SECTIONS[currentRole] || MENU_SECTIONS.user;

    const handleItemClick = (path) => {
        onNavigate(path);
        if (isMobile && onToggle) {
            onToggle();
        }
    };

    const sidebarWidth = isMobile ? 'w-[280px]' : (collapsed ? 'w-[68px]' : 'w-[260px]');

    return (
        <aside className={`h-screen bg-white border-r border-black/10 flex flex-col overflow-hidden sticky top-0 z-50 shadow-sm transition-all duration-300 ${sidebarWidth}`}>
            {/* Logo */}
            <div className={`border-b border-black/10 transition-all duration-300 ${collapsed && !isMobile ? 'px-3 py-4' : 'px-5 py-4'}`}>
                <div className={`flex flex-col items-center ${collapsed && !isMobile ? 'justify-center' : 'gap-2'}`}>
                    <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                        <img src="/image/ISTAHT.png" alt="ISTAHT" className="w-full h-full object-contain" />
                    </div>
                    {(!collapsed || isMobile) && (
                        <div className="text-[10px] text-[#F9A825] font-medium tracking-wide mt-1 whitespace-nowrap">
                            Gestion des Stocks
                        </div>
                    )}
                </div>
                {(!collapsed || isMobile) && (
                    <div className="flex gap-1 mt-3">
                        {['#C0392B', '#F9A825', '#1B5E20', '#1A237E', '#0288D1'].map((c, i) => (
                            <div key={i} className="flex-1 h-0.5 rounded-full opacity-85" style={{ background: c }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
                {menuSections.map(section => {
                    const SectionIcon = section.icon;
                    return (
                        <div key={section.id} className="mb-5">
                            {(!collapsed || isMobile) ? (
                                <div className="flex items-center gap-1.5 px-2 mb-2">
                                    <SectionIcon size={11} color="rgba(0,0,0,0.28)" />
                                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-black/30 whitespace-nowrap">
                                        {section.title}
                                    </span>
                                    <div className="flex-1 h-px bg-black/10" />
                                </div>
                            ) : (
                                <div className="h-px bg-black/10 mx-2 mb-3" />
                            )}
                            {section.items.map(item => {
                                const ItemIcon = item.icon;
                               const isActive = activeItem === item.path || 
                                            (item.path.includes('/profil') && activeItem.includes('/profil'));
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => handleItemClick(item.path)}
                                        title={collapsed && !isMobile ? item.label : undefined}
                                        className={`w-full flex items-center rounded-lg mb-1 transition-all duration-150 outline-none cursor-pointer
                                            ${(collapsed && !isMobile) ? 'justify-center gap-0 py-2 px-0' : 'justify-start gap-2 py-2 px-2.5'}
                                            ${isActive ? 'text-[#0D1B2A]' : 'text-[#607080]'}`}
                                        style={{
                                            background: isActive ? role.accent + '12' : 'transparent',
                                            borderLeft: (!collapsed || isMobile) && isActive ? `3px solid ${role.accent}` : (!collapsed || isMobile) ? '3px solid transparent' : 'none'
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <ItemIcon size={17} color={isActive ? role.accent : 'rgba(0,0,0,0.35)'} />
                                        {(!collapsed || isMobile) && <span className="text-[12.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* Footer with user info */}
            <div className={`border-t border-black/10 bg-gray-50 ${(collapsed && !isMobile) ? 'px-2 py-3' : 'px-3 py-4'}`}>
                {(!collapsed || isMobile) ? (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white border border-black/10">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0" style={{ background: role.accent }}>
                            {role.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-[#0D1B2A] whitespace-nowrap overflow-hidden text-ellipsis">
                                {role.label}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-1 h-1 rounded-full bg-green-500" />
                                <span className="text-[10px] text-green-600">En ligne</span>
                            </div>
                        </div>
                        <div className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: role.badgeBg, color: role.badge }}>
                            {currentRole === 'admin' ? 'ADMIN' : currentRole === 'magasinier' ? 'MAG' : 'DEM'}
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-center mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: role.accent }}>
                            {role.initials}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}