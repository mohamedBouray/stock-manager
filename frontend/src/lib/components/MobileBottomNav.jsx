import React from 'react';
import { Home, Package, BellRing, User, ClipboardList, ShoppingCart } from 'lucide-react';

const MOBILE_MENU = {
    admin: [
        { label: 'Accueil', icon: Home, path: '/admin/dashboard' },
        { label: 'Stock', icon: Package, path: '/admin/stocks' },
        { label: 'Commandes', icon: ShoppingCart, path: '/admin/commandes' },
        { label: 'Alertes', icon: BellRing, path: '/admin/alertes' },
        { label: 'Profil', icon: User, path: '/admin/profil' },
    ],
    magasinier: [
        { label: 'Accueil', icon: Home, path: '/magasinier/dashboard' },
        { label: 'Demandes', icon: ClipboardList, path: '/magasinier/demandes' },
        { label: 'Stock', icon: Package, path: '/magasinier/stocks' },
        { label: 'Alertes', icon: BellRing, path: '/magasinier/alertes' },
        { label: 'Profil', icon: User, path: '/magasinier/profil' },
    ],
    user: [
        { label: 'Accueil', icon: Home, path: '/user/dashboard' },
        { label: 'Demandes', icon: ClipboardList, path: '/user/demandes' },
        { label: 'Stock', icon: Package, path: '/user/consultation-stock' },
        { label: 'Profil', icon: User, path: '/user/profil' },
    ],
};

export default function MobileBottomNav({ currentRole, activeItem, onNavigate }) {
    const items = MOBILE_MENU[currentRole] || MOBILE_MENU.user;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-40 md:hidden">
            <div className="flex items-center justify-around py-2">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeItem === item.path;
                    return (
                        <button
                            key={item.path}
                            onClick={() => onNavigate(item.path)}
                            className="flex flex-col items-center gap-1 py-1 px-3"
                        >
                            <Icon 
                                size={22} 
                                className={isActive ? 'text-gray-800' : 'text-gray-400'}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`text-[10px] font-medium ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}