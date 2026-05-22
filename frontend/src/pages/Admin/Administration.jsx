import React, { useState, useEffect } from 'react';
import {
    Users, Search, Edit, Trash2, Ban, CheckCircle,
    UserPlus, Settings, X, RefreshCw,
    Activity, AlertTriangle, Key, Download, User, UserCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useLocation } from 'react-router-dom';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';
import Profile from '../../lib/components/Profile';
import SettingsPanel from './SettingsPanel';


// ─── Avatar coloré par rôle ───────────────────────────────────────────────────
const ROLE_AVATAR = {
    admin:      { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
    magasinier: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    user:       { bg: 'bg-sky-100',     text: 'text-sky-700' },
};

function Avatar({ name, role }) {
    const cfg = ROLE_AVATAR[role] || ROLE_AVATAR.user;
    const initials = name
        ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : 'U';
    return (
        <div className={`w-9 h-9 rounded-lg ${cfg.bg} ${cfg.text} flex items-center justify-center text-xs font-semibold shrink-0`}>
            {initials}
        </div>
    );
}

// ─── Badge rôle ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
    const cfg = {
        admin:      { cls: 'bg-indigo-50 text-indigo-700',   label: 'Admin' },
        magasinier: { cls: 'bg-emerald-50 text-emerald-800', label: 'Magasinier' },
        user:       { cls: 'bg-sky-50 text-sky-700',         label: 'Demandeur' },
    }[role] || { cls: 'bg-gray-100 text-gray-500', label: role };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cfg.cls}`}>
            {cfg.label}
        </span>
    );
}

// ─── Badge statut ─────────────────────────────────────────────────────────────
function StatusBadge({ blocked }) {
    return blocked ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            Bloqué
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            Actif
        </span>
    );
}

// ─── Bouton action icône ──────────────────────────────────────────────────────
function ActBtn({ onClick, title, hoverClass, children }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`w-7 h-7 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-400 transition-all duration-100 hover:border-transparent ${hoverClass} cursor-pointer`}
        >
            {children}
        </button>
    );
}

// ─── Card stat ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accentClass, iconWrapClass, iconTextClass, Icon }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl ${accentClass}`} />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
            <p className="text-3xl font-medium tracking-tight text-gray-900 my-1">{value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
            <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center ${iconWrapClass}`}>
                <Icon size={18} className={iconTextClass} />
            </div>
        </div>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
    if (!toast) return null;
    const danger = toast.type === 'danger';
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium shadow-lg
            ${danger ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {danger ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
            {toast.msg}
        </div>
    );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 rounded-md">
                        <X size={18} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Helpers formulaire ───────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

// ─────────────────────────────────────────────────────────────────────────────
export default function Administration() {
    const [activeTab, setActiveTab]         = useState('users');
    const [profileSection, setProfileSection] = useState('profile');
    const [users, setUsers]                 = useState([]);
    const [stats, setStats]                 = useState({});
    const [search, setSearch]               = useState('');
    const [roleFilter, setRoleFilter]       = useState('');
    const [statusFilter, setStatusFilter]   = useState('');
    const [showModal, setShowModal]         = useState(false);
    const [editingUser, setEditingUser]     = useState(null);
    const [formData, setFormData]           = useState({ name: '', email: '', password: '', role: 'user', password_confirmation: '' });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser]   = useState(null);
    const [pwForm, setPwForm]               = useState({ password: '', confirmation: '' });
    const [toast, setToast]                 = useState(null);
    const [saving, setSaving]               = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);

    const location = useLocation();
    const [actionModal, setActionModal] = useState({ 
        isOpen: false, 
        data: null, 
        type: 'danger',
        title: '',
        message: '',
        confirmText: 'Confirmer',
        icon: null,
        onConfirmAction: null
    });


    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchUsers = async (showLoading = false) => {
        try {
            if (showLoading) setSearchLoading(true);
            const r = await api.get('/api/admin/users', {
                params: { search, role: roleFilter, status: statusFilter },
            });
            setUsers(r.data.data || []);
        } catch {
            showToast('Erreur chargement utilisateurs', 'danger');
        } finally {
            if (showLoading) setSearchLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const r = await api.get('/api/admin/system/stats');
            setStats(r.data);
        } catch {}
    };

    // ── Effets ─────────────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setInitialLoading(true);
            await Promise.all([fetchUsers(), fetchStats()]);
            setInitialLoading(false);
        };
        load();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab     = params.get('tab');
        const section = params.get('section');

        if (tab === 'profile') {
            setActiveTab('profile');
            if (section === 'password') setProfileSection('password');
        } else if (tab === 'settings') {
            setActiveTab('settings');
        } else {
            setActiveTab('users');
        }
    }, [location.search]);

    useEffect(() => {
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeout = setTimeout(() => {
            if (activeTab === 'users') fetchUsers(true);
        }, 500);
        setSearchTimeout(timeout);
        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers(true);
    }, [roleFilter, statusFilter]);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3200);
    };

    const handleResetFilters = () => {
        setSearch('');
        setRoleFilter('');
        setStatusFilter('');
        fetchUsers(true);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'user', password_confirmation: '' });
        setShowModal(true);
    };

    const openEditModal = (u) => {
        setEditingUser(u);
        setFormData({ name: u.name, email: u.email, password: '', role: u.role, password_confirmation: '' });
        setShowModal(true);
    };

    const openPasswordModal = (u) => {
        setSelectedUser(u);
        setPwForm({ password: '', confirmation: '' });
        setShowPasswordModal(true);
    };

    // ── Actions CRUD ───────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/api/admin/users/${editingUser.id}`, {
                    name: formData.name, email: formData.email, role: formData.role,
                });
                showToast('Utilisateur modifié');
            } else {
                await api.post('/api/admin/users', formData);
                showToast('Utilisateur créé');
            }
            setShowModal(false);
            setEditingUser(null);
            fetchUsers();
            fetchStats();
        } catch (err) {
            showToast(err.response?.data?.message || 'Erreur', 'danger');
        }
    };

    const openActionModal = ({ data, type, title, message, confirmText, icon, onConfirm }) => {
        setActionModal({
            isOpen: true,
            data,
            type, 
            title,
            message,
            confirmText: confirmText || 'Confirmer',
            icon: icon || null,
            onConfirmAction: () => onConfirm(data)
        });
    };


    const closeActionModal = () => {
        setActionModal(prev => ({ ...prev, isOpen: false, data: null }));
    };

    const handleDelete = (user) => {
        openActionModal({
            data: user,
            type: 'danger',
            title: 'Supprimer l\'utilisateur',
            message: `Êtes-vous sûr de vouloir supprimer définitivement ${user.name} ? Cette action est irréversible.`,
            confirmText: 'Supprimer',
            icon: Trash2,
            onConfirm: async (u) => {
                await api.delete(`/api/admin/users/${u.id}`);
                showToast(`${u.name} supprimé`);
                fetchUsers();
                fetchStats();
            }
        });
    };

    const handleBlock = (user) => {
        openActionModal({
            data: user,
            type: 'warning',
            title: 'Bloquer l\'utilisateur',
            message: `Êtes-vous sûr de vouloir bloquer ${user.name} ?`,
            confirmText: 'Bloquer',
            icon: Ban,
            onConfirm: async (u) => {
                await api.post(`/api/admin/users/${u.id}/block`);
                showToast(`${u.name} bloqué`);
                fetchUsers();
                fetchStats();
            }
        });
    };

    const handleUnblock = (user) => {
        openActionModal({
            data: user,
            type: 'success',
            title: 'Débloquer l\'utilisateur',
            message: `Êtes-vous sûr de vouloir débloquer ${user.name} ?`,
            confirmText: 'Débloquer',
            icon: CheckCircle,
            onConfirm: async (u) => {
                await api.post(`/api/admin/users/${u.id}/unblock`);
                showToast(`${u.name} débloqué`);
                fetchUsers();
                fetchStats();
            }
        });
    };

    const handleResetPasswordConfirm = (user) => {
        openActionModal({
            data: user,
            type: 'info',
            title: 'Réinitialiser mot de passe',
            message: `Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${user.name} ?`,
            confirmText: 'Réinitialiser',
            icon: Key,
            onConfirm: async (u) => {
                openPasswordModal(u);
            }
        });
    };
   

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (pwForm.password !== pwForm.confirmation) {
            showToast('Mots de passe différents', 'danger');
            return;
        }
        if (pwForm.password.length < 8) {
            showToast('Minimum 8 caractères', 'danger');
            return;
        }
        setSaving(true);
        try {
            await api.post(`/api/admin/users/${selectedUser.id}/reset-password`, {
                password: pwForm.password,
                password_confirmation: pwForm.confirmation,
            });
            showToast(`Mot de passe réinitialisé pour ${selectedUser.name}`);
            setShowPasswordModal(false);
            setSelectedUser(null);
        } catch (err) {
            showToast(err.response?.data?.message || 'Erreur', 'danger');
        } finally {
            setSaving(false);
        }
    };
const handleExportUsers = () => {
    try {
        // Récupérer les données (déjà dans users)
        const usersData = users;
        
        if (usersData.length === 0) {
            showToast('Aucun utilisateur à exporter', 'warning');
            return;
        }
        
        // Préparer les données pour Excel
        const excelData = usersData.map(user => ({
            'ID': user.id,
            'Nom': user.name,
            'Email': user.email,
            'Téléphone': user.phone || '',
            'Rôle': user.role === 'admin' ? 'Administrateur' : user.role === 'magasinier' ? 'Magasinier' : 'Demandeur',
            'Statut': user.is_blocked ? 'Bloqué' : 'Actif',
            'Dernière connexion': user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('fr-FR') : 'Jamais',
            'Date création': new Date(user.created_at).toLocaleDateString('fr-FR')
        }));
        
        // Créer une feuille de calcul
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Ajuster la largeur des colonnes (optionnel)
        const colWidths = [
            { wch: 8 },  // ID
            { wch: 25 }, // Nom
            { wch: 30 }, // Email
            { wch: 15 }, // Téléphone
            { wch: 15 }, // Rôle
            { wch: 10 }, // Statut
            { wch: 15 }, // Dernière connexion
            { wch: 12 }  // Date création
        ];
        worksheet['!cols'] = colWidths;
        
        // Créer un classeur
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Utilisateurs');
        
        // Exporter le fichier
        const filename = `utilisateurs_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        showToast(`${usersData.length} utilisateur(s) exporté(s) vers Excel`);
    } catch (error) {
        console.error(error);
        showToast('Erreur lors de l\'export', 'danger');
    }
};

    // ── Guard : chargement initial ─────────────────────────────────────────────
    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        );
    }

    // ── Délégation vers sous-pages ─────────────────────────────────────────────
    if (activeTab === 'profile')  return <Profile initialSection={profileSection} />;
    if (activeTab === 'settings') return <SettingsPanel />;

    // ── Rendu principal ────────────────────────────────────────────────────────
    return (
        <div className="p-3 max-w-full">
            <Toast toast={toast} />

            {/* En-tête */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-xl font-medium tracking-tight text-gray-900">Administration</h1>
                    <p className="text-sm text-gray-400 mt-0.5">Gestion des utilisateurs et configuration du système</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition"
                >
                    <UserPlus size={14} /> Nouvel utilisateur
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-5">
                <StatCard 
                    label="Total utilisateurs" 
                    value={stats.total_users || 0} 
                    sub={`${stats.new_users_this_month || 0} ce mois`}  
                    accentClass="bg-sky-500"     
                    iconWrapClass="bg-sky-50"     
                    iconTextClass="text-sky-600"     
                    Icon={Users}      
                />
                <StatCard 
                    label="Actifs"             
                    value={stats.active_users || 0}   
                    sub={`${stats.active_percentage || 0}% du total`}  
                    accentClass="bg-emerald-600" 
                    iconWrapClass="bg-emerald-50" 
                    iconTextClass="text-emerald-700" 
                    Icon={CheckCircle} 
                />
                <StatCard 
                    label="Bloqués"            
                    value={stats.blocked_users || 0}  
                    sub={`${stats.blocked_percentage || 0}% du total`}  
                    accentClass="bg-red-500"     
                    iconWrapClass="bg-red-50"     
                    iconTextClass="text-red-600"     
                    Icon={Ban}         
                />
                <StatCard 
                    label="Nouveaux (7j)"      
                    value={stats.users_last_week || 0} 
                    sub="Cette semaine" 
                    accentClass="bg-orange-400"  
                    iconWrapClass="bg-orange-50"  
                    iconTextClass="text-orange-500"  
                    Icon={UserPlus}    
                />
            </div>

            {/* Tabs */}
            <div className="inline-flex gap-0 mb-5 bg-white border border-gray-200 rounded-2xl p-1">
                {[
                    { id: 'users',    label: 'Utilisateurs',      Icon: Users      },
                    { id: 'settings', label: 'Paramètres Système', Icon: Settings   },
                    { id: 'profile',  label: 'Mon Profil',         Icon: UserCircle },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition
                            ${activeTab === t.id ? 'bg-emerald-700 text-white' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <t.Icon size={13} /> {t.label}
                    </button>
                ))}
            </div>

            {/* ── Onglet Utilisateurs ────────────────────────────────────────────── */}
            <div>
                {/* Toolbar */}
                <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
                    {/* Recherche */}
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 h-[34px] bg-white" style={{ flex: '1 1 0', maxWidth: 280 }}>
                        <Search size={13} className="text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher un utilisateur…"
                            className="border-none outline-none text-xs text-gray-900 w-full bg-transparent"
                        />
                        {searchLoading && (
                            <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin ml-1" />
                        )}
                        {!searchLoading && search && (
                            <X size={12} className="text-gray-400 cursor-pointer" onClick={() => setSearch('')} />
                        )}
                    </div>

                    {/* Filtres */}
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="h-[34px] border border-gray-200 rounded-lg px-2.5 text-xs text-gray-900 bg-white outline-none cursor-pointer"
                    >
                        <option value="">Tous les rôles</option>
                        <option value="admin">Admin</option>
                        <option value="magasinier">Magasinier</option>
                        <option value="user">Demandeur</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="h-[34px] border border-gray-200 rounded-lg px-2.5 text-xs text-gray-900 bg-white outline-none cursor-pointer"
                    >
                        <option value="">Tous les statuts</option>
                        <option value="active">Actifs</option>
                        <option value="blocked">Bloqués</option>
                    </select>

                    <button
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 h-[34px] px-3 border border-gray-200 rounded-lg bg-white text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition"
                    >
                        <RefreshCw size={12} /> Réinitialiser
                    </button>

                    <div className="relative">
                        <button
                            onClick={handleExportUsers}
                            className="inline-flex items-center gap-1.5 h-[34px] px-3 border border-gray-200 rounded-lg bg-white text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition">
                            <Download size={12} /> Exporter 
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {/* En-tête */}
                    <div className="flex items-center px-4 h-9 bg-gray-50 border-b border-gray-200">
                        <div className="flex-1 text-[10.5px] font-medium uppercase tracking-wide text-gray-400">Utilisateur</div>
                        <div className="w-28 text-[10.5px] font-medium uppercase tracking-wide text-gray-400">Rôle</div>
                        <div className="w-24 text-[10.5px] font-medium uppercase tracking-wide text-gray-400">Statut</div>
                        <div className="w-36 text-[10.5px] font-medium uppercase tracking-wide text-gray-400">Dernière connexion</div>
                        <div className="w-28 text-[10.5px] font-medium uppercase tracking-wide text-gray-400 text-right">Actions</div>
                    </div>

                    {/* Lignes */}
                    {users.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-400">Aucun utilisateur trouvé</div>
                    ) : users.map(u => (
                        <div
                            key={u.id}
                            className="flex items-center px-4 h-14 border-b border-gray-100 hover:bg-gray-50/70 transition-colors"
                        >
                            {/* Identité */}
                            <div className="flex-1 flex items-center gap-2.5">
                                <Avatar name={u.name} role={u.role} />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{u.email}</div>
                                </div>
                            </div>

                            {/* Rôle */}
                            <div className="w-28"><RoleBadge role={u.role} /></div>

                            {/* Statut */}
                            <div className="w-24"><StatusBadge blocked={u.is_blocked} /></div>

                            {/* Connexion */}
                            <div className="w-36 text-xs text-gray-400">
                                {u.last_login_at
                                    ? new Date(u.last_login_at).toLocaleDateString('fr-FR')
                                    : 'Jamais'}
                            </div>

                            {/* Actions */}
                            <div className="w-28 flex items-center justify-end gap-1">
                                <ActBtn title="Modifier" hoverClass="hover:bg-blue-50 hover:text-blue-600" onClick={() => openEditModal(u)}>
                                    <Edit size={13} />
                                </ActBtn>
                                <ActBtn title="Réinitialiser mot de passe" hoverClass="hover:bg-yellow-50 hover:text-yellow-600" onClick={() => handleResetPasswordConfirm(u)}>
                                    <Key size={13} />
                                </ActBtn>
                                {u.is_blocked ? (
                                    <ActBtn title="Débloquer" hoverClass="hover:bg-emerald-50 hover:text-emerald-700" onClick={() => handleUnblock(u)}>
                                        <CheckCircle size={13} />
                                    </ActBtn>
                                ) : (
                                    <ActBtn title="Bloquer" hoverClass="hover:bg-orange-50 hover:text-orange-600" onClick={() => handleBlock(u)}>
                                        <Ban size={13} />
                                    </ActBtn>
                                )}
                                <ActBtn title="Supprimer" hoverClass="hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(u)}>
                                    <Trash2 size={13} />
                                </ActBtn>
                            </div>
                        </div>
                    ))}

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-200">
                        <span className="text-xs text-gray-400">
                            {users.length} utilisateur{users.length !== 1 ? 's' : ''} affiché{users.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {/* Activités récentes */}
                {stats.recent_activities?.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl mt-4 p-5">
                        <div className="flex items-center gap-2 mb-3.5">
                            <Activity size={15} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Activités récentes</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {stats.recent_activities.map((a, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <User size={13} className="text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-gray-900">{a.user?.name}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{a.details}</div>
                                    </div>
                                    <div className="text-xs text-gray-300">
                                        {new Date(a.created_at).toLocaleString('fr-FR')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal Créer / Modifier ─────────────────────────────────────────── */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                    <div>
                        <label className={labelCls}>Nom complet</label>
                        <input
                            required
                            className={inputCls}
                            placeholder="Nom"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input
                            required
                            type="email"
                            placeholder="Nom@exemple.com"
                            className={inputCls}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    {!editingUser && (
                        <>
                            <div>
                                <label className={labelCls}>Mot de passe</label>
                                <input
                                    required
                                    type="password"
                                    className={inputCls}
                                    placeholder="*********"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Confirmation</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="*********"
                                    className={inputCls}
                                    value={formData.password_confirmation}
                                    onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })}
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className={labelCls}>Rôle</label>
                        <select
                            className={inputCls}
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="user">Demandeur</option>
                            <option value="magasinier">Magasinier</option>
                        </select>
                    </div>

                    <div className="flex gap-2.5 mt-1">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className=" cursor-pointer flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium transition"
                        >
                            {editingUser ? 'Modifier' : 'Créer'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Modal Reset Password ───────────────────────────────────────────── */}
            <Modal
                open={showPasswordModal && !!selectedUser}
                onClose={() => setShowPasswordModal(false)}
                title="Réinitialiser mot de passe"
            >
                {selectedUser && (
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
                        <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                            Pour : <strong className="text-gray-900">{selectedUser.name}</strong>
                        </div>
                        <div>
                            <label className={labelCls}>Nouveau mot de passe</label>
                            <input
                                required
                                type="password"
                                minLength={8}
                                className={inputCls}
                                value={pwForm.password}
                                onChange={e => setPwForm({ ...pwForm, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Confirmation</label>
                            <input
                                required
                                type="password"
                                className={inputCls}
                                value={pwForm.confirmation}
                                onChange={e => setPwForm({ ...pwForm, confirmation: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2.5 mt-1">
                            <button
                                type="button"
                                onClick={() => setShowPasswordModal(false)}
                                className="flex-1 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-lg text-sm font-medium cursor-pointer transition"
                            >
                                {saving ? 'Chargement…' : 'Confirmer'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            <ActionConfirmModal
                isOpen={actionModal.isOpen}
                onClose={closeActionModal}
                onConfirm={actionModal.onConfirmAction}
                title={actionModal.title}
                message={actionModal.message}
                type={actionModal.type}
                confirmText={actionModal.confirmText}
                icon={actionModal.icon}
                darkMode={false}
            />
        </div>
    );
}