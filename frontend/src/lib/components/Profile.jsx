import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, Calendar, Lock,
    Save, Camera, CheckCircle, AlertTriangle, Eye, EyeOff,
    Key, Trash2, Server, ArrowLeft, MapPin, Briefcase, Globe,
    Shield, Activity 
} from 'lucide-react';
import api from '../apis/axios';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
    if (!toast) return null;
    const danger = toast.type === 'danger';
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium shadow-lg
            ${danger ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-800'}`}
        >
            {danger ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
            {toast.msg}
        </div>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function UserAvatar({ name, role, size = 80, imageUrl }) {
    const cfg = {
        admin:      'bg-indigo-700 text-white',
        magasinier: 'bg-green-700 text-white',
        user:       'bg-blue-600 text-white',
    }[role] || 'bg-gray-700 text-white';

    const initials = name
        ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    const radius = size >= 80 ? 'rounded-xl' : 'rounded-lg';
    const fontSize = size >= 80 ? 'text-2xl' : 'text-xs';

    if (imageUrl) {
        return (
            <img
                src={imageUrl}
                alt={name}
                className={`${radius} object-cover shadow-md`}
                style={{ width: size, height: size }}
            />
        );
    }

    return (
        <div
            className={`${radius} ${cfg} ${fontSize} font-semibold flex items-center justify-center shadow-md shrink-0`}
            style={{ width: size, height: size }}
        >
            {initials}
        </div>
    );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: color + '15', color: color }}>
                <Icon size={17} />
            </div>
            <div>
                <p className="text-[10px] text-gray-400 tracking-wider uppercase font-semibold">{label}</p>
                <p className="text-base font-bold text-gray-800 mt-0.5">{value}</p>
            </div>
        </div>
    );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
    const cfg = {
        admin:      'bg-indigo-100 text-indigo-700',
        magasinier: 'bg-green-100 text-green-700',
        user:       'bg-blue-100 text-blue-700',
    }[role] || 'bg-gray-100 text-gray-600';

    const label = { admin: 'Administrateur', magasinier: 'Magasinier', user: 'Demandeur' }[role] || role;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cfg}`}>
            {label}
        </span>
    );
}

// ─── Input / Label helpers ────────────────────────────────────────────────────
const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 disabled:opacity-50 disabled:bg-gray-50';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide uppercase';

// ═════════════════════════════════════════════════════════════════════════════
export default function Profile({ initialSection = 'profile' }) {
    const [activeSection, setActiveSection] = useState(initialSection);
    const { userId }  = useParams();
    const navigate    = useNavigate();

    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [toast, setToast]         = useState(null);
    const [user, setUser]           = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(true);
    const [canEdit, setCanEdit]     = useState(true);

    const [formData, setFormData]   = useState({ name: '', email: '', phone: '', language: 'fr', bio: '', job_title: '' });
    const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword]         = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile]       = useState(null);
    const fileInputRef = useRef(null);

    const [passwordStrength, setPasswordStrength] = useState(0);
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3200);
    };

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchUser = async () => {
        try {
            const localUser = (() => {
                try { return JSON.parse(localStorage.getItem('user')); }
                catch { return null; }
            })();
            setCurrentUser(localUser);

            let isOwn = true;

            if (userId && localUser?.role === 'admin') {
                isOwn = false;
            } else if (userId && localUser?.role !== 'admin') {
                navigate('/profil');
                return;
            }

            setIsOwnProfile(isOwn);
            setCanEdit(true);

            const r = userId && localUser?.role === 'admin'
                ? await api.get(`/api/admin/users/${userId}`)
                : await api.get('/api/user');

            const userData = r.data;
            setUser(userData);
            setFormData({
                name:      userData.name      || '',
                email:     userData.email     || '',
                phone:     userData.phone     || '',
                language:  userData.language  || 'fr',
                bio:       userData.bio       || '',
                job_title: userData.job_title || '',
            });

            let imageUrl = null;
            if (userData.profile_image) {
                imageUrl = userData.profile_image.startsWith('http')
                    ? userData.profile_image
                    : `http://localhost:8000${userData.profile_image.startsWith('/storage/') ? '' : '/storage/'}${userData.profile_image}`;
            }
            setImagePreview(imageUrl);
        } catch {
            showToast('Erreur lors du chargement du profil', 'danger');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        if (initialSection === 'password') setActiveSection('password');
    }, [userId, initialSection]);

    // ── Image handlers ─────────────────────────────────────────────────────────
    const handleImageChange = (e) => {
        if (!canEdit) return;
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        if (!canEdit) return;
        setImagePreview(null);
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Update profile ─────────────────────────────────────────────────────────
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        setSaving(true);
        try {
            let profileImageUrl = null;
            if (imageFile) {
                const fd = new FormData();
                fd.append('profile_image', imageFile);
                const res = await api.post('/api/user/upload-avatar', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                profileImageUrl = res.data.url;
            }

            const updateData = { ...formData, ...(profileImageUrl ? { profile_image: profileImageUrl } : {}) };

            if (isOwnProfile) {
                const res = await api.put('/api/user/profile', updateData);
                const updated = res.data.user;
                if (updated.profile_image && !updated.profile_image.startsWith('http')) {
                    updated.profile_image_url = `http://localhost:8000${updated.profile_image}`;
                }
                localStorage.setItem('user', JSON.stringify(updated));
                window.dispatchEvent(new Event('storage'));
                setCurrentUser(updated);
            } else {
                await api.put(`/api/admin/users/${user?.id}`, updateData);
            }

            showToast('Profil mis à jour avec succès');
            fetchUser();
        } catch (err) {
            showToast(err.response?.data?.message || 'Erreur', 'danger');
        } finally {
            setSaving(false);
        }
    };

    // ── Change password ────────────────────────────────────────────────────────
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        if (passwordForm.password !== passwordForm.password_confirmation) {
            showToast('Les mots de passe ne correspondent pas', 'danger');
            return;
        }
        if (passwordForm.password.length < 8) {
            showToast('Minimum 8 caractères', 'danger');
            return;
        }
        setSaving(true);
        try {
            await api.post('/api/user/change-password', {
                current_password:      passwordForm.current_password,
                password:              passwordForm.password,
                password_confirmation: passwordForm.password_confirmation,
            });
            showToast('Mot de passe modifié avec succès');
            setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (err) {
            showToast(err.response?.data?.message || 'Erreur', 'danger');
        } finally {
            setSaving(false);
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-10 h-10 border-[3px] border-gray-200 border-t-green-600 rounded-full animate-spin" />
        </div>
    );

    const stats = [
        { icon: Calendar, label: 'MEMBRE DEPUIS', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—', color: '#006233' },
        { icon: Server, label: 'DERNIÈRE CONNEXION', value: user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString('fr-FR') : "Aujourd'hui", color: '#0288D1' },
        { icon: Server, label: 'STATUT', value: user?.is_blocked ? 'Bloqué' : 'Actif', color: user?.is_blocked ? '#C0392B' : '#006233' },
    ];

    return (
        <div className="p-2 md:p-3 max-w-6xl mx-auto min-h-screen bg-gray-50">
            <Toast toast={toast} />

            {/* Retour admin */}
            {!isOwnProfile && currentUser?.role === 'admin' && (
                <button
                    onClick={() => navigate('/admin/administration')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors cursor-pointer"
                >
                    <ArrowLeft size={15} /> Retour à la gestion
                </button>
            )}

            {/* En-tête */}
            <div className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                    {isOwnProfile ? 'Mon Profil' : `Profil de ${user?.name}`}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    {isOwnProfile ? 'Gérez vos informations personnelles' : 'Consultation du profil utilisateur'}
                </p>
            </div>

            {/* Carte principale */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 mb-6 flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <UserAvatar name={user?.name} role={user?.role} size={100} imageUrl={imagePreview} />
                    {canEdit && (
                        <>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className=" cursor-pointer absolute bottom-0 right-0 w-8 h-8 rounded-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-colors shadow-md"
                            >
                                <Camera size={14} />
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                            {imagePreview && (
                                <button
                                    onClick={handleRemoveImage}
                                    className="cursor-pointer absolute bottom-0 left-0 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-md"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Identité */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">{user?.name}</h2>
                        <RoleBadge role={user?.role} />
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 mt-2">
                        <Mail size={14} /> {user?.email}
                    </div>
                    {user?.phone && (
                        <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 mt-1">
                            <Phone size={14} /> {user?.phone}
                        </div>
                    )}
                    {user?.job_title && (
                        <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500 mt-1">
                            <Briefcase size={14} /> {user?.job_title}
                        </div>
                    )}
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {stats.map((s, i) => <StatCard key={i} {...s} />)}
            </div>

            {/* Tabs */}
            {isOwnProfile && (
                <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveSection('profile')}
                        className={` cursor-pointer flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all
                            ${activeSection === 'profile' 
                                ? 'bg-white text-green-600 border-b-2 border-green-600' 
                                : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <User size={15} /> Informations personnelles
                    </button>
                    <button
                        onClick={() => setActiveSection('password')}
                        className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all
                            ${activeSection === 'password' 
                                ? 'bg-white text-green-600 border-b-2 border-green-600' 
                                : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Lock size={15} /> Sécurité
                    </button>
                </div>
            )}

            {/* Formulaire Profil */}
            {activeSection === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label className={labelCls}>Nom complet</label>
                            <input type="text" className={inputCls} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required disabled={!canEdit} />
                        </div>
                        <div>
                            <label className={labelCls}>Email</label>
                            <input type="email" className={inputCls} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required disabled={!canEdit} />
                        </div>
                        <div>
                            <label className={labelCls}>Téléphone</label>
                            <input type="tel" className={inputCls} value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+212 XXX XXX XXX" disabled={!canEdit} />
                        </div>
                        <div>
                            <label className={labelCls}>Fonction</label>
                            <input type="text" className={inputCls} value={formData.job_title || ''} onChange={e => setFormData({ ...formData, job_title: e.target.value })} placeholder="Responsable Stock" disabled={!canEdit} />
                        </div>
                        <div>
                            <label className={labelCls}>Langue</label>
                            <select className={inputCls} value={formData.language} onChange={e => setFormData({ ...formData, language: e.target.value })} disabled={!canEdit}>
                                <option value="fr">Français</option>
                                <option value="ar">العربية</option>
                                <option value="en">English</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className={labelCls}>Bio</label>
                        <textarea
                            rows={3}
                            className={`${inputCls} resize-none`}
                            value={formData.bio || ''}
                            onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Quelques mots sur vous..."
                            disabled={!canEdit}
                        />
                    </div>

                    {canEdit && (
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={saving}
                                className=" cursor-pointer flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                            >
                                <Save size={15} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
                            </button>
                        </div>
                    )}
                </form>
            )}

            {/* Formulaire Mot de passe */}
            {isOwnProfile && activeSection === 'password' && (
                <div className="space-y-6">
                    {/* Carte principale */}
                    <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-7">
                        <div className="border-b border-gray-100 pb-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                                    <Lock size={18} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">Modifier le mot de passe</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Choisissez un mot de passe sécurisé</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Mot de passe actuel */}
                            <div>
                                <label className={labelCls}>Mot de passe actuel</label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        className={inputCls}
                                        value={passwordForm.current_password}
                                        onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                        required
                                        placeholder="Entrez votre mot de passe actuel"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                    >
                                        {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Nouveau mot de passe */}
                            <div>
                                <label className={labelCls}>Nouveau mot de passe</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        className={inputCls}
                                        value={passwordForm.password}
                                        onChange={e => {
                                            setPasswordForm({ ...passwordForm, password: e.target.value });
                                            // Vérifier la force du mot de passe
                                            const value = e.target.value;
                                            let strength = 0;
                                            if (value.length >= 8) strength++;
                                            if (/[A-Z]/.test(value)) strength++;
                                            if (/[0-9]/.test(value)) strength++;
                                            if (/[^A-Za-z0-9]/.test(value)) strength++;
                                            setPasswordStrength(strength);
                                        }}
                                        required
                                        minLength={8}
                                        placeholder="Nouveau mot de passe"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                    >
                                        {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirmation */}
                            <div>
                                <label className={labelCls}>Confirmer le mot de passe</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        className={inputCls}
                                        value={passwordForm.password_confirmation}
                                        onChange={e => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                                        required
                                        placeholder="Confirmez votre nouveau mot de passe"
                                    />
                                    {passwordForm.password_confirmation && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            {passwordForm.password === passwordForm.password_confirmation ? (
                                                <CheckCircle size={15} className="text-green-500" />
                                            ) : (
                                                <AlertTriangle size={15} className="text-red-500" />
                                            )}
                                        </div>
                                    )}
                                </div>
                                {passwordForm.password_confirmation && passwordForm.password !== passwordForm.password_confirmation && (
                                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                                )}
                            </div>

                            {/* Bouton de soumission */}
                            <button
                                type="submit"
                                disabled={saving || (passwordForm.password !== passwordForm.password_confirmation)}
                                className=" cursor-pointer w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg text-sm font-semibold transition-colors shadow-sm mt-4"
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Chargement...
                                    </>
                                ) : (
                                    <>
                                        <Key size={15} />
                                        Mettre à jour le mot de passe
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}