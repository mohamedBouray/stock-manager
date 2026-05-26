// src/pages/Admin/Administration.jsx
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

// ─── Avatar coloré par rôle ───────────────────────────────────────────────────
const ROLE_AVATAR = {
    admin:      { bg: 'bg-indigo-100',  text: 'text-indigo-700' },
    magasinier: { bg: 'bg-blue-100', text: 'text-blue-800' },
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
        magasinier: { cls: 'bg-blue-50 text-blue-800', label: 'Magasinier' },
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
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
            ${danger ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
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
const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

// ─────────────────────────────────────────────────────────────────────────────
export default function Utilisateurs() {
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
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeout = setTimeout(() => {
            fetchUsers(true);
        }, 500);
        setSearchTimeout(timeout);
        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        fetchUsers(true);
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
            const usersData = users;
            
            if (usersData.length === 0) {
                showToast('Aucun utilisateur à exporter', 'warning');
                return;
            }
            
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
            
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const colWidths = [
                { wch: 8 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
                { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 }
            ];
            worksheet['!cols'] = colWidths;
            
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Utilisateurs');
            
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
                <div className="w-10 h-10 border-[3px] border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    // ── Rendu principal ────────────────────────────────────────────────────────
    return (
        <div>
            <Toast toast={toast} />

            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Gestion des utilisateurs</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gérez les utilisateurs du système</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Total utilisateurs</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total_users || 0}</p>
                            <p className="text-xs text-gray-400">{stats.new_users_this_month || 0} ce mois</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Actifs</p>
                            <p className="text-2xl font-bold text-green-600">{stats.active_users || 0}</p>
                            <p className="text-xs text-gray-400">{stats.active_percentage || 0}% du total</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Bloqués</p>
                            <p className="text-2xl font-bold text-red-600">{stats.blocked_users || 0}</p>
                            <p className="text-xs text-gray-400">{stats.blocked_percentage || 0}% du total</p>
                        </div>
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <Ban size={20} className="text-red-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Nouveaux (7j)</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.users_last_week || 0}</p>
                            <p className="text-xs text-gray-400">Cette semaine</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <UserPlus size={20} className="text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="flex-1 max-w-xs relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un utilisateur..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                </div>

                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                >
                    <option value="">Tous les rôles</option>
                    <option value="admin">Administrateur</option>
                    <option value="magasinier">Magasinier</option>
                    <option value="user">Demandeur</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                >
                    <option value="">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="blocked">Bloqués</option>
                </select>

                <button
                    onClick={handleResetFilters}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                    <RefreshCw size={14} /> Réinitialiser
                </button>

                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >
                    <UserPlus size={16} /> Nouvel utilisateur
                </button>

                <button
                    onClick={handleExportUsers}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                    <Download size={14} /> Exporter Excel
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dernière connexion</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-12 text-center text-gray-500">
                                            Aucun utilisateur trouvé
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={u.name} role={u.role} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{u.name}</p>
                                                        <p className="text-xs text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                                            <td className="px-4 py-3"><StatusBadge blocked={u.is_blocked} /></td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString('fr-FR') : 'Jamais'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => openEditModal(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Modifier">
                                                        <Edit size={15} />
                                                    </button>
                                                    <button onClick={() => handleResetPasswordConfirm(u)} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition" title="Réinitialiser mot de passe">
                                                        <Key size={15} />
                                                    </button>
                                                    {u.is_blocked ? (
                                                        <button onClick={() => handleUnblock(u)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="Débloquer">
                                                            <CheckCircle size={15} />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleBlock(u)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Bloquer">
                                                            <Ban size={15} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDelete(u)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" title="Supprimer">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Créer / Modifier */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">{editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                                <input type="text" className={inputCls} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input type="email" className={inputCls} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                            </div>
                            {!editingUser && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                                        <input type="password" className={inputCls} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation *</label>
                                        <input type="password" className={inputCls} value={formData.password_confirmation} onChange={e => setFormData({ ...formData, password_confirmation: e.target.value })} required />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                                <select className={inputCls} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="user">Demandeur</option>
                                    <option value="magasinier">Magasinier</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Annuler</button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Reset Password */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Réinitialiser mot de passe</h2>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                Pour : <strong className="text-gray-800">{selectedUser.name}</strong>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
                                <input type="password" className={inputCls} value={pwForm.password} onChange={e => setPwForm({ ...pwForm, password: e.target.value })} required minLength={8} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation *</label>
                                <input type="password" className={inputCls} value={pwForm.confirmation} onChange={e => setPwForm({ ...pwForm, confirmation: e.target.value })} required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Annuler</button>
                                <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">Confirmer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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