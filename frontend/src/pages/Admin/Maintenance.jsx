// src/pages/Admin/Maintenance.jsx
import React, { useState } from 'react';
import { Shield, Database, RefreshCw, Download, Upload, AlertTriangle, CheckCircle, Server, Clock } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function Maintenance() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleBackup = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/maintenance/backup', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `backup_${new Date().toISOString().slice(0, 19)}.sql`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setResult({ success: true, message: 'Backup créé avec succès' });
        } catch (error) {
            setResult({ success: false, message: 'Erreur lors du backup' });
        } finally {
            setLoading(false);
            setTimeout(() => setResult(null), 3000);
        }
    };

    const handleClearCache = async () => {
        setLoading(true);
        try {
            await api.post('/api/admin/maintenance/clear-cache');
            setResult({ success: true, message: 'Cache vidé avec succès' });
        } catch (error) {
            setResult({ success: false, message: 'Erreur lors du vidage du cache' });
        } finally {
            setLoading(false);
            setTimeout(() => setResult(null), 3000);
        }
    };

    const handleOptimize = async () => {
        setLoading(true);
        try {
            await api.post('/api/admin/maintenance/optimize');
            setResult({ success: true, message: 'Base de données optimisée' });
        } catch (error) {
            setResult({ success: false, message: 'Erreur lors de l\'optimisation' });
        } finally {
            setLoading(false);
            setTimeout(() => setResult(null), 3000);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">🛠️ Maintenance</h1>
                <p className="text-sm text-gray-500 mt-1">Outils de maintenance du système</p>
            </div>

            {result && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.success ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {result.message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Backup */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Database size={20} className="text-blue-600" /></div>
                        <h3 className="font-semibold text-gray-800">Sauvegarde</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Créer une sauvegarde complète de la base de données</p>
                    <button onClick={handleBackup} disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                        <Download size={16} /> {loading ? 'Chargement...' : 'Télécharger backup'}
                    </button>
                </div>

                {/* Cache */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><RefreshCw size={20} className="text-orange-600" /></div>
                        <h3 className="font-semibold text-gray-800">Vider le cache</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Vider les caches de l'application</p>
                    <button onClick={handleClearCache} disabled={loading} className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center justify-center gap-2">
                        <RefreshCw size={16} /> {loading ? 'Chargement...' : 'Vider le cache'}
                    </button>
                </div>

                {/* Optimisation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><Server size={20} className="text-green-600" /></div>
                        <h3 className="font-semibold text-gray-800">Optimisation</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Optimiser les performances de la base de données</p>
                    <button onClick={handleOptimize} disabled={loading} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2">
                        <Upload size={16} /> {loading ? 'Chargement...' : 'Optimiser'}
                    </button>
                </div>
            </div>

            {/* Informations système */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Server size={18} /> Informations système</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Version</span><span className="font-medium">1.0.0</span></div>
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Dernière maintenance</span><span className="font-medium">{new Date().toLocaleDateString()}</span></div>
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Statut</span><span className="text-green-600 flex items-center gap-1"><Clock size={12} /> Opérationnel</span></div>
                    <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Prochain backup planifié</span><span className="font-medium">Dimanche 00:00</span></div>
                </div>
            </div>
        </div>
    );
}