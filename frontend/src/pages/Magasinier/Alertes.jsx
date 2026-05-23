// src/pages/Magasinier/Alertes.jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, CheckCircle, Filter, Bell } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function MagasinierAlertes() {
    const [alertes, setAlertes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterMagasin, setFilterMagasin] = useState('');
    const [magasins, setMagasins] = useState([]);

    useEffect(() => {
        fetchAlertes();
        fetchMagasins();
    }, []);

    const fetchAlertes = async () => {
        try {
            const response = await api.get('/api/magasinier/alertes');
            
            // 🔥 CORRECTION : Extraire correctement le tableau
            let alertesData = [];
            if (response.data?.data?.data) {
                alertesData = response.data.data.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                alertesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                alertesData = response.data;
            } else if (response.data?.data && typeof response.data.data === 'object') {
                alertesData = Object.values(response.data.data);
            }
            
            setAlertes(alertesData);
        } catch (error) {
            console.error(error);
            setAlertes([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMagasins = async () => {
        try {
            const response = await api.get('/api/magasinier/magasins');
            let magasinsData = [];
            if (response.data?.data) {
                magasinsData = Array.isArray(response.data.data) ? response.data.data : [];
            } else if (Array.isArray(response.data)) {
                magasinsData = response.data;
            }
            setMagasins(magasinsData);
        } catch (error) {
            console.error(error);
            setMagasins([]);
        }
    };

    const filteredAlertes = filterMagasin 
        ? alertes.filter(a => a.magasin_id === parseInt(filterMagasin)) 
        : alertes;

    const stats = {
        total: alertes.length,
        critiques: alertes.filter(a => a.quantite_disponible === 0).length,
        basses: alertes.filter(a => a.quantite_disponible > 0 && a.quantite_disponible <= (a.article?.seuil_alerte || 0)).length
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">🔔 Alertes stock</h1>
                <p className="text-sm text-gray-500 mt-1">Surveillance des niveaux de stock</p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-red-600 font-semibold">Total alertes</p>
                            <p className="text-2xl font-bold text-red-700">{stats.total}</p>
                        </div>
                        <AlertTriangle size={24} className="text-red-500" />
                    </div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-orange-600 font-semibold">Stock bas</p>
                            <p className="text-2xl font-bold text-orange-700">{stats.basses}</p>
                        </div>
                        <Bell size={24} className="text-orange-500" />
                    </div>
                </div>
                <div className="bg-red-100 rounded-xl p-4 border border-red-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-red-700 font-semibold">Rupture</p>
                            <p className="text-2xl font-bold text-red-800">{stats.critiques}</p>
                        </div>
                        <Package size={24} className="text-red-600" />
                    </div>
                </div>
            </div>

            {/* Filtre par magasin */}
            {magasins.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                    <Filter size={16} className="text-gray-400" />
                    <select 
                        value={filterMagasin} 
                        onChange={(e) => setFilterMagasin(e.target.value)} 
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                        <option value="">Tous les magasins</option>
                        {magasins.map(m => (
                            <option key={m.id} value={m.id}>{m.nom_magasin}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Tableau des alertes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredAlertes.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Aucune alerte</p>
                        <p className="text-sm text-gray-400 mt-1">Tous les stocks sont dans les normes</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Article</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Stock</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Seuil</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAlertes.map((alerte) => (
                                    <tr key={alerte.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-800">{alerte.article?.designation || 'Article'}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{alerte.magasin?.nom_magasin}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-800">{alerte.quantite_disponible}</td>
                                        <td className="px-6 py-4 text-center text-gray-500">{alerte.article?.seuil_alerte || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {alerte.quantite_disponible === 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                                                    🔴 Rupture
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-700">
                                                    ⚠️ Stock bas
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}