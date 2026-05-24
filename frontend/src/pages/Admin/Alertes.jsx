// src/pages/Admin/Alertes.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, CheckCircle, Filter, Bell, TrendingUp, Building2, Search } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function AdminAlertes() {
    const [alertes, setAlertes] = useState([]);
    const [stats, setStats] = useState({ total: 0, ruptures: 0, stock_bas: 0, par_magasin: [] });
    const [loading, setLoading] = useState(true);
    const [filterMagasin, setFilterMagasin] = useState('');
    const [search, setSearch] = useState('');
    const [magasins, setMagasins] = useState([]);

    useEffect(() => {
        fetchAlertes();
        fetchStats();
        fetchMagasins();
    }, [filterMagasin]);

    const fetchAlertes = async () => {
        setLoading(true);
        try {
            const params = filterMagasin ? { magasin_id: filterMagasin } : {};
            const response = await api.get('/api/admin/alertes', { params });
            
            let alertesData = [];
            if (response.data?.data) {
                alertesData = Array.isArray(response.data.data) ? response.data.data : [];
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
            const response = await api.get('/api/admin/alertes/stats');
            setStats(response.data?.data || { total: 0, ruptures: 0, stock_bas: 0, par_magasin: [] });
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMagasins = async () => {
        try {
            const response = await api.get('/api/magasinier/magasins');
            let magasinsData = [];
            if (response.data?.data) {
                magasinsData = Array.isArray(response.data.data) ? response.data.data : [];
            }
            setMagasins(magasinsData);
        } catch (error) {
            console.error(error);
        }
    };

    const filteredAlertes = alertes.filter(a => 
        search === '' || 
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
        <div className="p-6">
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">🔔 Alertes stock</h1>
                <p className="text-sm text-gray-500 mt-1">Surveillance des niveaux de stock - Tous magasins</p>
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
                                {stats.total > 0 ? Math.round((stats.total / (alertes.length || 1)) * 100) : 0}%
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-blue-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Répartition par magasin */}
            {stats.par_magasin?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Building2 size={16} className="text-gray-500" />
                        <h2 className="text-sm font-semibold text-gray-700">Répartition par magasin</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {stats.par_magasin.map((mag) => (
                            <div key={mag.magasin_id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <p className="font-medium text-gray-700 text-sm">{mag.magasin_nom}</p>
                                <div className="flex justify-between mt-2">
                                    <span className="text-xs text-gray-500">Alertes: {mag.total}</span>
                                    <span className="text-xs text-red-500">Rupture: {mag.ruptures}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                    <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${stats.total > 0 ? (mag.total / stats.total) * 100 : 0}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filtres - Même style que Gestion demandes */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                    <Filter size={14} className="text-gray-400" />
                    <select 
                        value={filterMagasin} 
                        onChange={(e) => setFilterMagasin(e.target.value)} 
                        className="text-sm bg-transparent focus:outline-none"
                    >
                        <option value="">Tous les magasins</option>
                        {magasins.map(m => (
                            <option key={m.id} value={m.id}>{m.nom_magasin}</option>
                        ))}
                    </select>
                </div>
                {filterMagasin && (
                    <button 
                        onClick={() => setFilterMagasin('')}
                        className="text-xs text-red-500 hover:underline"
                    >
                        Effacer filtre
                    </button>
                )}
                <div className="flex-1 max-w-xs relative ml-auto">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher article ou code barre..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Tableau - Même style que Gestion demandes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magasin</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Seuil</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAlertes.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                            <CheckCircle size={22} className="text-gray-400" />
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
                                            <p className="text-xs text-gray-400 mt-0.5">{alerte.article?.code_barre}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                                {alerte.magasin?.nom_magasin}
                                            </span>
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