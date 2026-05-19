import React, { useState, useRef, useEffect } from 'react';

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

function TI({ name, size = 18, color, className = '' }) {
    return (
        <i className={`ti ti-${name} ${className}`} aria-hidden="true" style={{ fontSize: size, lineHeight: 1, color }}/>
    );
}

function NotifDropdown({ open, onClose }) {
    const NOTIFS = [
        { id: 1, icon: 'bell-ringing', color: '#C0392B', title: 'Stock critique', desc: 'Article REF-042 sous le seuil minimum', time: 'il y a 5 min' },
        { id: 2, icon: 'file-description', color: '#0288D1', title: 'Nouvelle demande', desc: 'Demande #DEM-2024-087 en attente', time: 'il y a 23 min' },
        { id: 3, icon: 'shopping-cart', color: '#1B5E20', title: 'Commande livrée', desc: 'BC-2024-031 réceptionnée au magasin', time: 'il y a 1h' },
    ];

    if (!open) return null;

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-[#0D1B2A]">Notifications</span>
            <span className="text-[11px] text-[#0288D1] cursor-pointer font-medium">Tout marquer lu</span>
        </div>
        {NOTIFS.map(n => (
            <div key={n.id} className="flex gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: n.color + '15' }}>
                <TI name={n.icon} size={15} color={n.color} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#0D1B2A]">{n.title}</div>
                <div className="text-[11px] text-[#607080] mt-0.5 truncate">{n.desc}</div>
                <div className="text-[10px] text-gray-400 mt-1">{n.time}</div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: n.color }} />
            </div>
        ))}
        <div className="px-4 py-2 text-center">
            <span className="text-xs text-[#0288D1] cursor-pointer font-medium">Voir toutes les notifications</span>
        </div>
        </div>
    );
}

export default function Header({ currentRole, pageTitle, breadcrumb = [], onToggleSidebar }) {
    const role = ROLE_CONFIG[currentRole];
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const notifRef = useRef(null);

    useEffect(() => {
        const handler = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <header className="h-[62px] bg-white border-b border-black/10 flex items-center px-5 gap-3 sticky top-0 z-40 shadow-sm flex-shrink-0">
        <button
            onClick={onToggleSidebar}
            className="w-8 h-8 rounded-lg border border-black/10 bg-transparent cursor-pointer flex items-center justify-center flex-shrink-0 hover:bg-gray-50 transition-colors">
            <TI name="menu-2" size={17} color="#607080" />
        </button>

        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-nowrap">
            {breadcrumb.map((c, i) => (
                <React.Fragment key={i}>
                <span className="text-xs text-gray-400 cursor-pointer whitespace-nowrap transition-colors hover:text-[#1A237E]">{c}</span>
                <TI name="chevron-right" size={11} color="#C8D6DF" />
                </React.Fragment>
            ))}
            <span className="text-sm font-bold text-[#0D1B2A] whitespace-nowrap overflow-hidden text-ellipsis">{pageTitle}</span>
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5 capitalize">{today}</div>
        </div>

        <div className={`flex items-center gap-2 px-3 h-9 rounded-lg transition-all duration-150 w-56 flex-shrink-0
            ${searchFocused ? 'bg-gray-50 border' : 'bg-gray-100 border-transparent'}`}
            style={{ borderColor: searchFocused ? role.accent + '60' : 'transparent' }}>
            <TI name="search" size={15} color={searchFocused ? role.accent : '#90A4AE'} />
            <input
                type="text"
                placeholder="Rechercher…"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#0D1B2A] font-sans"
                />
            {searchValue && (
                <TI name="x" size={13} color="#90A4AE" className="cursor-pointer" onClick={() => setSearchValue('')} />
            )}
        </div>

        <div ref={notifRef} className="relative">
            <button
                onClick={() => setNotifOpen(o => !o)}
                className={`w-9 h-9 rounded-lg cursor-pointer flex items-center justify-center relative transition-all duration-150
                    ${notifOpen ? 'bg-opacity-10 border' : 'bg-transparent border border-black/10'}`}
                style={{
                    background: notifOpen ? role.accent + '12' : 'transparent',
                    borderColor: notifOpen ? role.accent + '40' : 'rgba(0,0,0,0.08)'
                }}
                onMouseEnter={e => { if (!notifOpen) e.currentTarget.style.background = '#F4F6F8'; }}
                onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.background = 'transparent'; }}
            >
            <TI name="bell" size={17} color={notifOpen ? role.accent : '#607080'} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C0392B] border border-white" />
            </button>
            <NotifDropdown open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <div className="w-px h-5 bg-black/10" />

        <div className="flex items-center gap-2 px-2 py-1 rounded-lg border border-black/10 cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px]" style={{ background: role.accent }}>
            {role.initials}
            </div>
            <div>
            <div className="text-xs font-semibold text-[#0D1B2A] leading-tight">{role.label}</div>
            <div className="text-[9px] font-bold uppercase px-1 py-0.5 rounded inline-block mt-0.5" style={{ background: role.badgeBg, color: role.badge }}>
                {currentRole === 'admin' ? 'ADMIN' : currentRole === 'magasinier' ? 'MAG' : 'DEM'}
            </div>
            </div>
            <TI name="chevron-down" size={12} color="#B0BEC5" />
        </div>
        </header>
    );
}