// src/pages/Admin/Administration.jsx
import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Edit, Trash2, Ban, CheckCircle,
  UserPlus, Shield, Package, User, Settings, Save,
  RotateCcw, Globe, Bell, Database, X, RefreshCw,
  Activity, AlertTriangle, TrendingUp, Key
} from 'lucide-react';
import api from '../../lib/apis/axios';

export default function Administration() {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user', password_confirmation: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({});
  const [settingsTab, setSettingsTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users', {
        params: { search, role: roleFilter, status: statusFilter }
      });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error(error);
      showToast('Erreur lors du chargement des utilisateurs', 'danger');
    }
  };

  // Fetch Stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/system/stats');
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const response = await api.get(`/api/admin/settings/${settingsTab}`);
      setSettings(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      setLoading(true);
      Promise.all([fetchUsers(), fetchStats()]).finally(() => setLoading(false));
    } else {
      setLoading(true);
      fetchSettings().finally(() => setLoading(false));
    }
  }, [activeTab, search, roleFilter, statusFilter, settingsTab]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/api/admin/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
        showToast('Utilisateur modifié avec succès');
      } else {
        await api.post('/api/admin/users', formData);
        showToast('Utilisateur créé avec succès');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'user', password_confirmation: '' });
      fetchUsers();
      fetchStats();
    } catch (error) {
      showToast(error.response?.data?.message || 'Erreur', 'danger');
    }
  };

  const handleBlock = async (user) => {
    if (!confirm(`Bloquer ${user.name} ?`)) return;
    try {
      await api.post(`/api/admin/users/${user.id}/block`);
      showToast(`${user.name} bloqué`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      showToast('Erreur', 'danger');
    }
  };

  const handleUnblock = async (user) => {
    try {
      await api.post(`/api/admin/users/${user.id}/unblock`);
      showToast(`${user.name} débloqué`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      showToast('Erreur', 'danger');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Supprimer définitivement ${user.name} ?`)) return;
    try {
      await api.delete(`/api/admin/users/${user.id}`);
      showToast(`${user.name} supprimé`);
      fetchUsers();
      fetchStats();
    } catch (error) {
      showToast(error.response?.data?.message || 'Erreur', 'danger');
    }
  };

 // src/pages/Admin/Administration.jsx
const handleResetPassword = async (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    const confirmation = e.target.confirmation.value;
    
    if (password !== confirmation) {
        showToast('Les mots de passe ne correspondent pas', 'danger');
        return;
    }
    
    if (password.length < 8) {
        showToast('Le mot de passe doit contenir au moins 8 caractères', 'danger');
        return;
    }
    
    setSaving(true);
    try {
        await api.post(`/api/admin/users/${selectedUser.id}/reset-password`, { 
            password: password,
            password_confirmation: confirmation 
        });
        showToast(`Mot de passe réinitialisé pour ${selectedUser.name}`);
        setShowPasswordModal(false);
        setSelectedUser(null);
    } catch (error) {
        console.error(error);
        const message = error.response?.data?.message || 'Erreur lors de la réinitialisation';
        showToast(message, 'danger');
    } finally {
        setSaving(false);
    }
};

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/api/admin/settings/${settingsTab}`, settings);
      showToast('Paramètres sauvegardés');
    } catch (error) {
      showToast('Erreur', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('Réinitialiser tous les paramètres ?')) return;
    try {
      await api.post(`/api/admin/settings/${settingsTab}/reset`);
      fetchSettings();
      showToast('Paramètres réinitialisés');
    } catch (error) {
      showToast('Erreur', 'danger');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || (statusFilter === 'blocked' ? u.is_blocked : !u.is_blocked);
    return matchSearch && matchRole && matchStatus;
  });

  const statsCards = [
    { label: 'Total utilisateurs', value: stats.total_users || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Actifs', value: stats.active_users || 0, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Bloqués', value: stats.blocked_users || 0, icon: Ban, color: 'bg-red-500' },
    { label: 'Nouveaux (7j)', value: stats.users_last_week || 0, icon: UserPlus, color: 'bg-orange-500' },
  ];

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-800',
      magasinier: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800'
    };
    const labels = { admin: 'Admin', magasinier: 'Magasinier', user: 'Demandeur' };
    return <span className={`px-2 py-1 text-xs rounded-full ${styles[role]}`}>{labels[role]}</span>;
  };

  const settingsTabs = [
    { id: 'general', label: '🏠 Général', icon: Globe },
    { id: 'stock', label: '📦 Stock', icon: Package },
    { id: 'notifications', label: '🔔 Notifications', icon: Bell },
    { id: 'backup', label: '💾 Backup', icon: Database },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006233]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'danger' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {toast.type === 'danger' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">⚙️ Administration</h1>
          <p className="text-gray-500">Gestion des utilisateurs et configuration du système</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'users'
              ? 'border-b-2 border-[#006233] text-[#006233]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={18} /> Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-b-2 border-[#006233] text-[#006233]'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings size={18} /> Paramètres Système
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-xl`}>
                      <Icon size={20} className="text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:border-[#006233]"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none"
              >
                <option value="">Tous les rôles</option>
                <option value="admin">Administrateurs</option>
                <option value="magasinier">Magasiniers</option>
                <option value="user">Demandeurs</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="blocked">Bloqués</option>
              </select>
              <button
                onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); fetchUsers(); }}
                className="px-3 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw size={16} /> Réinitialiser
              </button>
              <button
                onClick={() => { setEditingUser(null); setFormData({ name: '', email: '', password: '', role: 'user', password_confirmation: '' }); setShowModal(true); }}
                className="px-4 py-2 bg-[#006233] text-white rounded-lg hover:bg-[#004d26] flex items-center gap-2"
              >
                <UserPlus size={18} /> Nouvel utilisateur
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière connexion</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Aucun utilisateur trouvé</td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006233] to-[#C0392B] flex items-center justify-center">
                              <span className="font-bold text-white">{user.name?.charAt(0) || 'U'}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4">
                          {user.is_blocked ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Bloqué</span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Actif</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Jamais'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditingUser(user); setFormData({ name: user.name, email: user.email, password: '', role: user.role, password_confirmation: '' }); setShowModal(true); }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}
                              className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                            >
                              <Key size={18} />
                            </button>
                            {user.is_blocked ? (
                              <button onClick={() => handleUnblock(user)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                <CheckCircle size={18} />
                              </button>
                            ) : (
                              <button onClick={() => handleBlock(user)} className="p-1 text-orange-600 hover:bg-orange-50 rounded">
                                <Ban size={18} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(user)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 size={18} />
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

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-800">Activités récentes</h3>
            </div>
            <div className="space-y-3">
              {stats.recent_activities?.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{activity.user?.name}</p>
                    <p className="text-xs text-gray-500">{activity.details}</p>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4">
            {settingsTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                    settingsTab === tab.id
                      ? 'border-b-2 border-[#006233] text-[#006233]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} /> {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSaveSettings} className="bg-white rounded-xl shadow-sm p-6">
            {/* General Settings */}
            {settingsTab === 'general' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'application</label>
                  <input
                    type="text"
                    value={settings.app_name || 'ISTAHT Stock Manager'}
                    onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#006233]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primary_color || '#006233'}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color || '#006233'}
                      onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur secondaire</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.secondary_color || '#C0392B'}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="w-12 h-10 border rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color || '#C0392B'}
                      onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format de date</label>
                  <select
                    value={settings.date_format || 'd/m/Y'}
                    onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="d/m/Y">DD/MM/YYYY</option>
                    <option value="m/d/Y">MM/DD/YYYY</option>
                    <option value="Y-m-d">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
                  <select
                    value={settings.timezone || 'Africa/Casablanca'}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Africa/Casablanca">Africa/Casablanca</option>
                    <option value="Europe/Paris">Europe/Paris</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Langue par défaut</label>
                  <select
                    value={settings.language || 'fr'}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}

            {/* Stock Settings */}
            {settingsTab === 'stock' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte stock bas</label>
                  <input
                    type="number"
                    value={settings.low_stock_threshold || 10}
                    onChange={(e) => setSettings({ ...settings, low_stock_threshold: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Notification quand le stock est inférieur à ce nombre</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seuil critique</label>
                  <input
                    type="number"
                    value={settings.critical_stock_threshold || 5}
                    onChange={(e) => setSettings({ ...settings, critical_stock_threshold: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Alerte critique quand le stock est inférieur</p>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Activer codes-barres</label>
                  <input
                    type="checkbox"
                    checked={settings.enable_barcode || false}
                    onChange={(e) => setSettings({ ...settings, enable_barcode: e.target.checked })}
                    className="w-4 h-4 text-[#006233] rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Génération automatique des commandes</label>
                  <input
                    type="checkbox"
                    checked={settings.auto_generate_orders || false}
                    onChange={(e) => setSettings({ ...settings, auto_generate_orders: e.target.checked })}
                    className="w-4 h-4 text-[#006233] rounded"
                  />
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {settingsTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Notifications par email</label>
                  <input
                    type="checkbox"
                    checked={settings.email_notifications || false}
                    onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                    className="w-4 h-4 text-[#006233] rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Alertes stock bas</label>
                  <input
                    type="checkbox"
                    checked={settings.stock_alert_notification || false}
                    onChange={(e) => setSettings({ ...settings, stock_alert_notification: e.target.checked })}
                    className="w-4 h-4 text-[#006233] rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email pour les alertes</label>
                  <input
                    type="email"
                    value={settings.low_stock_email || ''}
                    onChange={(e) => setSettings({ ...settings, low_stock_email: e.target.value })}
                    placeholder="admin@istaht.ma"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {settingsTab === 'backup' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Backup automatique</label>
                  <input
                    type="checkbox"
                    checked={settings.auto_backup || false}
                    onChange={(e) => setSettings({ ...settings, auto_backup: e.target.checked })}
                    className="w-4 h-4 text-[#006233] rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence de backup</label>
                  <select
                    value={settings.backup_frequency || 'weekly'}
                    onChange={(e) => setSettings({ ...settings, backup_frequency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!settings.auto_backup}
                  >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jours de rétention</label>
                  <input
                    type="number"
                    value={settings.backup_retention_days || 30}
                    onChange={(e) => setSettings({ ...settings, backup_retention_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    disabled={!settings.auto_backup}
                  />
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleResetSettings}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
              >
                <RotateCcw size={16} className="inline mr-2" /> Réinitialiser
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-[#006233] rounded-lg hover:bg-[#004d26] disabled:opacity-50"
              >
                <Save size={16} className="inline mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </form>

          {/* System Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Database size={16} /> Informations Système
            </h3>
            <div className="text-xs text-gray-500 space-y-1">
              <p>📊 Base de données: SQLite</p>
              <p>🔐 Authentification: Laravel Sanctum</p>
              <p>📱 Interface: React + Tailwind CSS</p>
              <p>🔄 Backup: {settings.auto_backup ? 'Activé' : 'Désactivé'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit User */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#006233]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
                    <input
                      type="password"
                      value={formData.password_confirmation}
                      onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="user">Demandeur</option>
                  <option value="magasinier">Magasinier</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#006233] text-white rounded-lg hover:bg-[#004d26]">
                  {editingUser ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
        {showPasswordModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Réinitialiser mot de passe</h2>
                        <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Pour: <span className="font-medium text-gray-800">{selectedUser.name}</span></p>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                            <input
                                type="password"
                                name="password"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#006233]"
                                required
                                minLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
                            <input
                                type="password"
                                name="confirmation"
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#006233]"
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setShowPasswordModal(false)} 
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="flex-1 px-4 py-2 bg-[#006233] text-white rounded-lg hover:bg-[#004d26] disabled:opacity-50"
                            >
                                {saving ? 'Chargement...' : 'Confirmer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}