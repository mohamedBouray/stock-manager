import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, CheckCircle, Bell, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function MagasinierAlertes() {
    const [alertes, setAlertes] = useState([]);
    const [stats, setStats] = useState({ total: 0, ruptures: 0, stock_bas: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchAlertes();
        fetchStats();
    }, []);

    const fetchAlertes = async () => {
        try {
            const response = await api.get('/api/magasinier/alertes');
            
            let alertesData = [];
            if (response.data?.data && Array.isArray(response.data.data)) {
                alertesData = response.data.data;
            } else if (response.data?.data?.data) {
                alertesData = response.data.data.data;
            }
            
            setAlertes(alertesData);
        } catch (error) {
            console.error(error);
            setAlertes([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/api/magasinier/alertes/stats');
            setStats(response.data?.data || { total: 0, ruptures: 0, stock_bas: 0 });
        } catch (error) {
            console.error(error);
        }
    };

    const filteredAlertes = alertes.filter(a => 
        a.article?.designation?.toLowerCase().includes(search.toLowerCase()) ||
        a.article?.code_barre?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div >
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Alertes stock</h1>
                <p className="text-sm text-gray-500 mt-1">Surveillance des niveaux de stock</p>
            </div>

            {/* Statistiques rapides - Même style que Gestion demandes */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Total alertes</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                        </div>
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={20} className="text-red-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-orange-600">Stock bas</p>
                            <p className="text-2xl font-bold text-orange-700">{stats.stock_bas}</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Bell size={20} className="text-orange-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-red-600">Rupture</p>
                            <p className="text-2xl font-bold text-red-700">{stats.ruptures}</p>
                        </div>
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <Package size={20} className="text-red-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-blue-600">Taux d'alerte</p>
                            <p className="text-2xl font-bold text-blue-700">
                                {alertes.length > 0 ? Math.round((stats.total / alertes.length) * 100) : 0}%
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-blue-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Barre de recherche */}
            <div className="flex items-center justify-between mb-4">
                <div className="relative max-w-xs">
                    <input 
                        type="text" 
                        placeholder="Rechercher par article ou code barre..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Tableau - Même style que Gestion demandes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code barre</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock actuel</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Seuil alerte</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAlertes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                            <AlertCircle size={22} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">Aucune alerte trouvée</p>
                                        <p className="text-xs text-gray-400 mt-1">Tous les stocks sont dans les normes</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredAlertes.map((alerte) => (
                                    <tr key={alerte.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-800">{alerte.article?.designation || 'Article'}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{alerte.article?.unite_mesure || 'Pièce'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono text-gray-500">{alerte.article?.code_barre || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-base font-bold ${alerte.quantite_disponible === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                                                {alerte.quantite_disponible}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                                            {alerte.article?.seuil_alerte || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {alerte.quantite_disponible === 0 ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                                    Rupture
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                                                    Stock bas
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}