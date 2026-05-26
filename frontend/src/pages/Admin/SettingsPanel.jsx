import React, { useState, useEffect } from 'react';
import {
    Globe, Package, Bell, Database, Shield, Zap,
    Save, RotateCcw, CheckCircle, AlertTriangle,
    RefreshCw, Eye, EyeOff, Copy, Check,
    Lock, Trash2, Download, Upload, Play, Activity,
    Server, Cpu, HardDrive, Wifi, Clock
} from 'lucide-react';
import api from '../../lib/apis/axios';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
    if (!toast) return null;
    const danger = toast.type === 'danger';
    const warn = toast.type === 'warn';
    return (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium shadow-lg animate-[slideIn_.2s_ease]
            ${danger ? 'bg-red-50 border-red-200 text-red-700'
            : warn ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-green-50 border-green-200 text-green-800'}`}
        >
            {danger || warn ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
            {toast.msg}
            <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}`}</style>
        </div>
    );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }) {
    return (
        <div
            onClick={() => !disabled && onChange(!checked)}
            className={`relative w-10 h-[22px] rounded-full transition-all duration-200 shrink-0
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${checked ? 'bg-green-600' : 'bg-gray-300'}`}
        >
            <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200
                ${checked ? 'left-[21px]' : 'left-[3px]'}`}
            />
        </div>
    );
}

// ─── StatChip (Health) ────────────────────────────────────────────────────────
function StatChip({ label, value, unit, status }) {
    const config = {
        ok: { bg: 'bg-green-50', text: 'text-green-700', label: 'Normal' },
        warn: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Attention' },
        danger: { bg: 'bg-red-50', text: 'text-red-700', label: 'Critique' }
    };
    const c = config[status] || config.ok;

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
            <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-gray-800 tracking-tight">{value}</span>
                {unit && <span className="text-xs text-gray-400">{unit}</span>}
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full mt-2 inline-block ${c.bg} ${c.text}`}>
                {c.label}
            </span>
        </div>
    );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ title, desc, children, action }) {
    return (
        <div className="border-b border-gray-100 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
                    {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

// ─── SettingRow ───────────────────────────────────────────────────────────────
function SettingRow({ label, desc, children }) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="flex-1 pr-0 sm:pr-6 mb-2 sm:mb-0">
                <div className="text-sm font-medium text-gray-700">{label}</div>
                {desc && <div className="text-xs text-gray-400 mt-0.5">{desc}</div>}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

// ─── Input Classes ────────────────────────────────────────────────────────────
const inputCls = 'h-[36px] px-3 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 font-normal';
const selectCls = inputCls + ' cursor-pointer';

// ─── LogItem ──────────────────────────────────────────────────────────────────
function LogItem({ level, message, time }) {
    const config = {
        info: { dot: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700', icon: 'ℹ️' },
        warning: { dot: 'bg-yellow-500', badge: 'bg-yellow-50 text-yellow-700', icon: '⚠️' },
        error: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700', icon: '❌' },
        success: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700', icon: '✅' }
    };
    const c = config[level] || config.info;

    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 group hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${c.dot}`} />
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${c.badge} shrink-0`}>
                {level.toUpperCase()}
            </span>
            <span className="flex-1 text-xs text-gray-600">{message}</span>
            <span className="text-[10px] text-gray-300 shrink-0 font-mono">{time}</span>
        </div>
    );
}

// ─── Form Actions ─────────────────────────────────────────────────────────────
function FormActions({ onReset, saving }) {
    return (
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <button
                type="button"
                onClick={onReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-red-200 rounded-lg bg-white text-xs text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            >
                <RotateCcw size={12} /> Réinitialiser
            </button>
            <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
                <Save size={12} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
        </div>
    );
}

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────
const TABS = [
    { id: 'general', label: 'Général', Icon: Globe, desc: 'Application & apparence' },
    { id: 'stock', label: 'Stock', Icon: Package, desc: 'Seuils & automatisations' },
    { id: 'notifications', label: 'Notifications', Icon: Bell, desc: 'Emails & alertes' },
    { id: 'security', label: 'Sécurité', Icon: Shield, desc: 'Auth & accès' },
    { id: 'performance', label: 'Performance', Icon: Zap, desc: 'Cache & optimisations' },
    { id: 'backup', label: 'Backup', Icon: Database, desc: 'Sauvegardes' },
    { id: 'logs', label: 'Logs', Icon: Activity, desc: 'Événements système' }
];

// Données mockées (à remplacer par API réelle)
const MOCK_HEALTH = {
    cpu: 34, ram: 61, disk: 48, uptime: '14j 6h', requests: '1.2k', latency: 42
};

const MOCK_LOGS = [
    { level: 'info', message: 'Utilisateur admin connecté', time: '09:14:32' },
    { level: 'warning', message: 'Stock REF-042 sous seuil minimum', time: '09:08:11' },
    { level: 'success', message: 'Backup hebdomadaire terminé', time: '03:00:04' },
    { level: 'error', message: 'Tentative de connexion échouée', time: '01:47:58' }
];

// ═════════════════════════════════════════════════════════════════════════════
export default function SettingsPanel() {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [health] = useState(MOCK_HEALTH);
    const [logs] = useState(MOCK_LOGS);
    const [logFilter, setLogFilter] = useState('all');
    const [cacheClearing, setCacheClearing] = useState(false);
    const [backupRunning, setBackupRunning] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [copied, setCopied] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3200);
    };

    const apiEndpoint = (tab) => ['security', 'performance', 'logs'].includes(tab) ? 'general' : tab;

    const fetchSettings = async () => {
        try {
            const res = await api.get(`/api/admin/settings/${apiEndpoint(activeTab)}`);
            setSettings(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchSettings();
    }, [activeTab]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post(`/api/admin/settings/${apiEndpoint(activeTab)}`, settings);
            showToast('Paramètres sauvegardés');
        } catch {
            showToast('Erreur lors de la sauvegarde', 'danger');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Réinitialiser tous les paramètres ?')) return;
        try {
            await api.post(`/api/admin/settings/${apiEndpoint(activeTab)}/reset`);
            await fetchSettings();
            showToast('Paramètres réinitialisés');
        } catch {
            showToast('Erreur', 'danger');
        }
    };

    const handleClearCache = async () => {
        setCacheClearing(true);
        await new Promise(r => setTimeout(r, 1400));
        setCacheClearing(false);
        showToast('Cache vidé');
    };

    const handleBackupNow = async () => {
        setBackupRunning(true);
        await new Promise(r => setTimeout(r, 2200));
        setBackupRunning(false);
        showToast('Backup terminé');
    };

    const handleCopySecret = () => {
        navigator.clipboard?.writeText('sk_prod_xxxxxxxxxxxxxxxx');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const set = (k, v) => setSettings(prev => ({ ...prev, [k]: v }));
    const filteredLogs = logFilter === 'all' ? logs : logs.filter(l => l.level === logFilter);
    const currentTab = TABS.find(t => t.id === activeTab);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-3 border-gray-200 border-t-green-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
            <Toast toast={toast} />

            {/* Sidebar - Version améliorée */}
            <div className="lg:w-56 shrink-0">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm sticky top-20 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Paramètres</h3>
                    </div>
                    <div className="p-2">
                        {TABS.map(tab => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.Icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 mb-1
                                        ${isActive 
                                            ? 'bg-green-50 text-green-700 border-l-4 border-green-600' 
                                            : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Icon size={16} className={isActive ? 'text-green-600' : 'text-gray-400'} />
                                    <div className="flex-1">
                                        <div className={`text-xs font-medium ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                                            {tab.label}
                                        </div>
                                        <div className="text-[10px] text-gray-400">{tab.desc}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Panel Principal */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2">
                        <currentTab.Icon size={20} className="text-green-600" />
                        <h2 className="text-lg font-semibold text-gray-800">{currentTab.label}</h2>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{currentTab.desc}</p>
                </div>

                {/* Formulaire Général */}
                {activeTab === 'general' && (
                    <form onSubmit={handleSave}>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="p-6">
                                <Section title="Identité" desc="Nom et apparence">
                                    <SettingRow label="Nom application" desc="Affiché dans le titre">
                                        <input className={`${inputCls} w-64`} value={settings.app_name || ''} onChange={e => set('app_name', e.target.value)} placeholder="ISTAHT Stock Manager" />
                                    </SettingRow>
                                    <SettingRow label="Couleur principale">
                                        <div className="flex gap-2">
                                            <input type="color" value={settings.primary_color || '#006233'} onChange={e => set('primary_color', e.target.value)} className="w-9 h-9 rounded-lg border cursor-pointer" />
                                            <input className={`${inputCls} w-24`} value={settings.primary_color || '#006233'} onChange={e => set('primary_color', e.target.value)} />
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="Couleur secondaire">
                                        <div className="flex gap-2">
                                            <input type="color" value={settings.secondary_color || '#C0392B'} onChange={e => set('secondary_color', e.target.value)} className="w-9 h-9 rounded-lg border cursor-pointer" />
                                            <input className={`${inputCls} w-24`} value={settings.secondary_color || '#C0392B'} onChange={e => set('secondary_color', e.target.value)} />
                                        </div>
                                    </SettingRow>
                                </Section>
                                <Section title="Régionalisation" desc="Date, heure et langue">
                                    <SettingRow label="Format date">
                                        <select className={`${selectCls} w-40`} value={settings.date_format || 'd/m/Y'} onChange={e => set('date_format', e.target.value)}>
                                            <option value="d/m/Y">DD/MM/YYYY</option>
                                            <option value="m/d/Y">MM/DD/YYYY</option>
                                            <option value="Y-m-d">YYYY-MM-DD</option>
                                        </select>
                                    </SettingRow>
                                    <SettingRow label="Fuseau horaire">
                                        <select className={`${selectCls} w-52`} value={settings.timezone || 'Africa/Casablanca'} onChange={e => set('timezone', e.target.value)}>
                                            <option value="Africa/Casablanca">Africa/Casablanca</option>
                                            <option value="Europe/Paris">Europe/Paris</option>
                                            <option value="UTC">UTC</option>
                                        </select>
                                    </SettingRow>
                                    <SettingRow label="Langue">
                                        <select className={`${selectCls} w-40`} value={settings.language || 'fr'} onChange={e => set('language', e.target.value)}>
                                            <option value="fr">Français</option>
                                            <option value="ar">العربية</option>
                                            <option value="en">English</option>
                                        </select>
                                    </SettingRow>
                                </Section>
                            </div>
                            <FormActions onReset={handleReset} saving={saving} />
                        </div>
                    </form>
                )}

                {/* Formulaire Stock */}
                {activeTab === 'stock' && (
                    <form onSubmit={handleSave}>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="p-6">
                                <Section title="Seuils d'alerte">
                                    <SettingRow label="Stock bas" desc="Notification sous ce seuil">
                                        <div className="flex gap-2">
                                            <input type="number" className={`${inputCls} w-20 text-center`} value={settings.low_stock_threshold ?? 10} onChange={e => set('low_stock_threshold', +e.target.value)} />
                                            <span className="text-xs text-gray-400">unités</span>
                                        </div>
                                    </SettingRow>
                                    <SettingRow label="Seuil critique">
                                        <div className="flex gap-2">
                                            <input type="number" className={`${inputCls} w-20 text-center`} value={settings.critical_stock_threshold ?? 5} onChange={e => set('critical_stock_threshold', +e.target.value)} />
                                            <span className="text-xs text-gray-400">unités</span>
                                        </div>
                                    </SettingRow>
                                </Section>
                                <Section title="Automatisations">
                                    <SettingRow label="Codes-barres">
                                        <Toggle checked={!!settings.enable_barcode} onChange={v => set('enable_barcode', v)} />
                                    </SettingRow>
                                    <SettingRow label="Commandes automatiques">
                                        <Toggle checked={!!settings.auto_generate_orders} onChange={v => set('auto_generate_orders', v)} />
                                    </SettingRow>
                                </Section>
                            </div>
                            <FormActions onReset={handleReset} saving={saving} />
                        </div>
                    </form>
                )}

                {/* Formulaire Notifications */}
                {activeTab === 'notifications' && (
                    <form onSubmit={handleSave}>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="p-6">
                                <Section title="Canaux">
                                    <SettingRow label="Notifications email">
                                        <Toggle checked={!!settings.email_notifications} onChange={v => set('email_notifications', v)} />
                                    </SettingRow>
                                    <SettingRow label="Email destinataire">
                                        <input type="email" className={`${inputCls} w-64 ${!settings.email_notifications ? 'opacity-50' : ''}`} value={settings.low_stock_email || ''} onChange={e => set('low_stock_email', e.target.value)} disabled={!settings.email_notifications} />
                                    </SettingRow>
                                </Section>
                                <Section title="Alertes">
                                    {[
                                        ['stock_alert_notification', 'Alertes stock bas'],
                                        ['order_status_notification', 'Statut commandes']
                                    ].map(([k, l]) => (
                                        <SettingRow key={k} label={l}>
                                            <Toggle checked={!!settings[k]} onChange={v => set(k, v)} />
                                        </SettingRow>
                                    ))}
                                </Section>
                            </div>
                            <FormActions onReset={handleReset} saving={saving} />
                        </div>
                    </form>
                )}

                {/* Sécurité */}
                {activeTab === 'security' && (
                    <form onSubmit={handleSave}>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="p-6">
                                <Section title="Mot de passe">
                                    <SettingRow label="Longueur minimum">
                                        <input type="number" className={`${inputCls} w-20 text-center`} value={settings.min_password_length ?? 8} onChange={e => set('min_password_length', +e.target.value)} />
                                    </SettingRow>
                                    <SettingRow label="Expiration">
                                        <select className={`${selectCls} w-40`} value={settings.password_expiry || 'never'} onChange={e => set('password_expiry', e.target.value)}>
                                            <option value="never">Jamais</option>
                                            <option value="30">30 jours</option>
                                            <option value="60">60 jours</option>
                                            <option value="90">90 jours</option>
                                        </select>
                                    </SettingRow>
                                    <SettingRow label="Double authentification 2FA">
                                        <Toggle checked={!!settings.require_2fa} onChange={v => set('require_2fa', v)} />
                                    </SettingRow>
                                </Section>
                                <Section title="Accès">
                                    <SettingRow label="Tentatives max">
                                        <input type="number" className={`${inputCls} w-20 text-center`} value={settings.max_login_attempts ?? 5} onChange={e => set('max_login_attempts', +e.target.value)} />
                                    </SettingRow>
                                    <SettingRow label="Session timeout">
                                        <select className={`${selectCls} w-40`} value={settings.session_timeout || '120'} onChange={e => set('session_timeout', e.target.value)}>
                                            <option value="30">30 min</option>
                                            <option value="60">1h</option>
                                            <option value="120">2h</option>
                                            <option value="480">8h</option>
                                        </select>
                                    </SettingRow>
                                </Section>
                            </div>
                            <FormActions onReset={handleReset} saving={saving} />
                        </div>
                    </form>
                )}

                {/* Performance */}
                {activeTab === 'performance' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <StatChip label="CPU" value={health.cpu} unit="%" status={health.cpu > 80 ? 'danger' : health.cpu > 60 ? 'warn' : 'ok'} />
                            <StatChip label="RAM" value={health.ram} unit="%" status={health.ram > 85 ? 'danger' : health.ram > 70 ? 'warn' : 'ok'} />
                            <StatChip label="DISQUE" value={health.disk} unit="%" status={health.disk > 90 ? 'danger' : health.disk > 75 ? 'warn' : 'ok'} />
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="p-6">
                                    <Section title="Cache" action={
                                        <button type="button" onClick={handleClearCache} disabled={cacheClearing} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border rounded-lg hover:bg-gray-50 transition">
                                            <Trash2 size={12} /> Vider cache
                                        </button>
                                    }>
                                        <SettingRow label="Cache requêtes">
                                            <Toggle checked={!!settings.enable_query_cache} onChange={v => set('enable_query_cache', v)} />
                                        </SettingRow>
                                    </Section>
                                    <Section title="Maintenance">
                                        <SettingRow label="Mode maintenance">
                                            <Toggle checked={!!settings.maintenance_mode} onChange={v => set('maintenance_mode', v)} />
                                        </SettingRow>
                                    </Section>
                                </div>
                                <FormActions onReset={handleReset} saving={saving} />
                            </div>
                        </form>
                    </div>
                )}

                {/* Backup */}
                {activeTab === 'backup' && (
                    <form onSubmit={handleSave}>
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="p-6">
                                <Section title="Planification" action={
                                    <button type="button" onClick={handleBackupNow} disabled={backupRunning} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-green-600 rounded-lg hover:bg-green-700 transition">
                                        <Download size={12} /> Backup maintenant
                                    </button>
                                }>
                                    <SettingRow label="Backup auto">
                                        <Toggle checked={!!settings.auto_backup} onChange={v => set('auto_backup', v)} />
                                    </SettingRow>
                                    <SettingRow label="Fréquence">
                                        <select className={`${selectCls} w-40 ${!settings.auto_backup ? 'opacity-50' : ''}`} disabled={!settings.auto_backup} value={settings.backup_frequency || 'weekly'} onChange={e => set('backup_frequency', e.target.value)}>
                                            <option value="daily">Quotidien</option>
                                            <option value="weekly">Hebdomadaire</option>
                                            <option value="monthly">Mensuel</option>
                                        </select>
                                    </SettingRow>
                                    <SettingRow label="Rétention (jours)">
                                        <input type="number" className={`${inputCls} w-20 text-center ${!settings.auto_backup ? 'opacity-50' : ''}`} disabled={!settings.auto_backup} value={settings.backup_retention_days ?? 30} onChange={e => set('backup_retention_days', +e.target.value)} />
                                    </SettingRow>
                                </Section>
                            </div>
                            <FormActions onReset={handleReset} saving={saving} />
                        </div>
                    </form>
                )}

                {/* Logs */}
                {activeTab === 'logs' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
                            <div className="flex flex-wrap gap-1.5">
                                {['all', 'info', 'warning', 'error', 'success'].map(f => (
                                    <button key={f} onClick={() => setLogFilter(f)} className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer
                                        ${logFilter === f ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
                                        {f === 'all' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => showToast('Logs actualisés')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border rounded-lg hover:bg-gray-50 transition">
                                <RefreshCw size={12} /> Actualiser
                            </button>
                        </div>
                        <div className="p-4 max-h-96 overflow-y-auto">
                            {filteredLogs.length === 0 ? (
                                <div className="py-12 text-center text-sm text-gray-400">Aucun log trouvé</div>
                            ) : filteredLogs.map((log, i) => <LogItem key={i} {...log} />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}