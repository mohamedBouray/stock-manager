import React, { useState, useRef, useEffect } from 'react';
import { 
    Menu, Search, X, ChevronDown, LogOut, User, Settings, Lock
} from 'lucide-react';
import Notifications from './Notifications';

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
// src/lib/components/Header.jsx
// Modifier la fonction getPasswordPath et le navigate

function UserDropdown({ open, onClose, currentRole, role, user, onNavigate, onLogout, isLoggingOut }) {
    if (!open) return null;

    const getProfilePath = () => {
        if (currentRole === 'admin') return '/admin/profil';
        if (currentRole === 'magasinier') return '/magasinier/profil';
        return '/user/profil';
    };

    const getPasswordPath = () => {
        if (currentRole === 'admin') return '/admin/profil?tab=password';
        if (currentRole === 'magasinier') return '/magasinier/profil?tab=password';
        return '/user/profil?tab=password';
    };

    const menuItems = [
        { icon: User, label: 'Mon Profil', path: getProfilePath(), show: true },
        { icon: Settings, label: 'Paramètres', path: '/admin/parametres', show: currentRole === 'admin' },
        { icon: Lock, label: 'Changer mot de passe', path: getPasswordPath(), show: true },
    ];

    return (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
                {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt={user.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: role.accent }}>
                        {role.initials}
                    </div>
                )}
                <div>
                    <div className="text-xs font-bold text-[#0D1B2A]">{user?.name || role.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{role.label}</div>
                </div>
            </div>
            <div className="py-1">
                {menuItems.filter(item => item.show).map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={idx}
                            onClick={() => {
                                onClose();
                                onNavigate(item.path);  // ← utilise onNavigate au lieu de navigate direct
                            }}
                            className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <Icon size={15} color="#607080" />
                            <span className="text-xs text-[#0D1B2A]">{item.label}</span>
                        </div>
                    );
                })}
                <div className="border-t border-gray-100 my-1"></div>
                <div 
                    onClick={() => {
                        if (onLogout) {
                            onLogout();
                        }
                    }}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-red-50 transition-colors"
                >
                    <LogOut size={15} color="#C0392B" />
                    <span className="text-xs text-red-600">
                        {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function Header({ 
    currentRole, 
    pageTitle, 
    breadcrumb = [], 
    onToggleSidebar, 
    onNavigate, 
    onLogout, 
    isLoggingOut,
    isMobile = false 
}) {
    const role = ROLE_CONFIG[currentRole];
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [searchMobileOpen, setSearchMobileOpen] = useState(false);
    const userDropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    
    const [user, setUser] = useState(null);
    
   useEffect(() => {
        const loadUser = () => {
            const userString = localStorage.getItem('user');
            if (userString) {
                try {
                    const userData = JSON.parse(userString);
                    if (userData.profile_image) {
                        if (userData.profile_image.startsWith('/storage/')) {
                            // 🔥 CORRECTION: Utiliser import.meta.env au lieu de process.env
                            userData.profile_image_url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${userData.profile_image}`;
                        } else if (userData.profile_image.startsWith('http')) {
                            userData.profile_image_url = userData.profile_image;
                        } else {
                            userData.profile_image_url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${userData.profile_image}`;
                        }
                    }
                    setUser(userData);
                } catch (e) {
                    console.error(e);
                }
            }
        };
        
        loadUser();
        
        const handleStorageChange = () => {
            loadUser();
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        const handler = e => { 
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        
        return () => {
            document.removeEventListener('mousedown', handler);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Close mobile search on escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && searchMobileOpen) {
                setSearchMobileOpen(false);
                setSearchValue('');
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [searchMobileOpen]);

    return (
        <>
            <header className={`bg-[#0D1B2A] border-b border-white/10 flex items-center justify-between sticky top-0 z-40 shadow-sm flex-shrink-0
                ${isMobile ? 'h-[56px] px-3 gap-2' : 'h-[62px] px-5 gap-3'}`}>
                
                {/* Left section - Menu button */}
                <button
                    onClick={onToggleSidebar}
                    className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer flex items-center justify-center flex-shrink-0 hover:bg-white/5 transition-colors"
                >
                    <Menu size={18} color="rgba(255,255,255,0.6)" />
                </button>

                {/* Center section - Title (mobile only) */}
                {isMobile && (
                    <div className="flex-1 text-center">
                        <span className="text-sm font-semibold text-white truncate block max-w-[160px] mx-auto">
                            {pageTitle}
                        </span>
                    </div>
                )}

                {/* Desktop breadcrumb */}
                {!isMobile && (
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-nowrap">
                            {breadcrumb.map((c, i) => (
                                <React.Fragment key={i}>
                                    <span className="text-xs text-white/40 cursor-pointer whitespace-nowrap transition-colors hover:text-white/60">{c}</span>
                                    <span className="text-white/20 text-xs">›</span>
                                </React.Fragment>
                            ))}
                            <span className="text-sm font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">{pageTitle}</span>
                        </div>
                        <div className="text-[11px] text-white/40 mt-0.5 capitalize">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                )}

                {/* Right section - Search, Notifications, Profile */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Search button - mobile */}
                    {isMobile && (
                        <button 
                            onClick={() => setSearchMobileOpen(true)}
                            className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center"
                        >
                            <Search size={16} color="rgba(255,255,255,0.6)" />
                        </button>
                    )}

                    {/* Desktop Search */}
                    {!isMobile && (
                        <div className={`flex items-center gap-2 px-3 h-9 rounded-lg transition-all duration-150 w-56
                            ${searchFocused ? 'bg-[#0A1520] border' : 'bg-[#0A1520] border-white/10'}`}
                            style={{ borderColor: searchFocused ? role.accent + '60' : 'rgba(255,255,255,0.1)' }}>
                            <Search size={15} color={searchFocused ? role.accent : 'rgba(255,255,255,0.4)'} />
                            <input
                                type="text"
                                placeholder="Rechercher…"
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                className="flex-1 bg-transparent border-none outline-none text-[13px] text-white font-sans placeholder:text-white/30"
                            />
                            {searchValue && (
                                <X size={13} color="rgba(255,255,255,0.4)" className="cursor-pointer" onClick={() => setSearchValue('')} />
                            )}
                        </div>
                    )}

                    {/* Notifications */}
                    <Notifications />

                    {/* User Profile - Always visible */}
                    <div ref={userDropdownRef} className="relative">
                        <button
                            onClick={() => setUserDropdownOpen(o => !o)}
                            className={`flex items-center gap-1 rounded-lg border border-white/20 cursor-pointer hover:bg-white/5 transition-colors
                                ${isMobile ? 'px-1 py-1' : 'px-2 py-1'}`}
                        >
                            {user?.profile_image_url ? (
                                <img 
                                    src={user.profile_image_url} 
                                    alt={user.name} 
                                    className="w-7 h-7 rounded-lg object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        const parent = e.target.parentElement;
                                        const div = document.createElement('div');
                                        div.className = "w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]";
                                        div.style.background = role.accent;
                                        div.textContent = role.initials;
                                        parent.insertBefore(div, e.target);
                                        e.target.remove();
                                    }}
                                />
                            ) : (
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: role.accent }}>
                                    {role.initials}
                                </div>
                            )}
                            {!isMobile && (
                                <>
                                    <div className="hidden sm:block">
                                        <div className="text-xs font-semibold text-white leading-tight">{user?.name?.split(' ')[0] || role.label}</div>
                                        <div className="text-[9px] font-bold uppercase px-1 py-0.5 rounded inline-block mt-0.5" style={{ background: role.badgeBg, color: role.badge }}>
                                            {currentRole === 'admin' ? 'ADMIN' : currentRole === 'magasinier' ? 'MAG' : 'DEM'}
                                        </div>
                                    </div>
                                    <ChevronDown size={12} color="rgba(255,255,255,0.4)" />
                                </>
                            )}
                        </button>
                        <UserDropdown 
                            open={userDropdownOpen}
                            onClose={() => setUserDropdownOpen(false)}
                            currentRole={currentRole}
                            role={role}
                            user={user}
                            onNavigate={onNavigate}
                            onLogout={onLogout}
                            isLoggingOut={isLoggingOut} 
                        />
                    </div>
                </div>
            </header>

            {/* Mobile search modal */}
            {searchMobileOpen && (
                <div className="fixed inset-0 bg-black/95 z-50 md:hidden flex items-start justify-center pt-16 px-4">
                    <div className="w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Recherche</h3>
                            <button 
                                onClick={() => {
                                    setSearchMobileOpen(false);
                                    setSearchValue('');
                                }}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                            >
                                <X size={20} color="white" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20">
                            <Search size={18} color="rgba(255,255,255,0.6)" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Rechercher un article, une demande..."
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                autoFocus
                                className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-white/40"
                            />
                            {searchValue && (
                                <X size={16} color="rgba(255,255,255,0.6)" className="cursor-pointer" onClick={() => setSearchValue('')} />
                            )}
                        </div>
                        {searchValue && (
                            <div className="mt-4 text-center text-white/40 text-xs">
                                Appuyez sur Entrée pour rechercher
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}