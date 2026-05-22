// src/pages/Magasinier/GestionReservations.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Search, Eye } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function GestionReservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchReservations();
    }, [filter]);

    const fetchReservations = async () => {
        try {
            const params = filter !== 'all' ? { statut: filter } : {};
            const response = await api.get('/api/magasinier/reservations', { params });
            setReservations(response.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmer = async (id) => {
        if (!confirm('Confirmer cette réservation ?')) return;
        try {
            await api.post(`/api/magasinier/reservations/${id}/confirmer`);
            fetchReservations();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const handleAnnuler = async (id) => {
        if (!confirm('Annuler cette réservation ?')) return;
        try {
            await api.post(`/api/magasinier/reservations/${id}/annuler`);
            fetchReservations();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const getStatutBadge = (statut) => {
        const config = {
            en_attente: 'bg-yellow-100 text-yellow-800',
            confirmee: 'bg-green-100 text-green-800',
            annulee: 'bg-red-100 text-red-800',
            expiree: 'bg-gray-100 text-gray-800'
        };
        const labels = {
            en_attente: 'En attente',
            confirmee: 'Confirmée',
            annulee: 'Annulée',
            expiree: 'Expirée'
        };
        return <span className={`px-2 py-1 text-xs rounded-full ${config[statut]}`}>{labels[statut]}</span>;
    };

    const filteredReservations = reservations.filter(r => 
        search === '' || 
        r.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
        r.article?.designation?.toLowerCase().includes(search.toLowerCase())
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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">📅 Gestion des réservations</h1>
                <p className="text-sm text-gray-500 mt-1">Confirmez ou annulez les réservations des utilisateurs</p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-xl font-bold text-gray-800">{reservations.length}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-3">
                    <p className="text-xs text-yellow-600">En attente</p>
                    <p className="text-xl font-bold text-yellow-700">{reservations.filter(r => r.statut === 'en_attente').length}</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-100 p-3">
                    <p className="text-xs text-green-600">Confirmées</p>
                    <p className="text-xl font-bold text-green-700">{reservations.filter(r => r.statut === 'confirmee').length}</p>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-100 p-3">
                    <p className="text-xs text-red-600">Annulées</p>
                    <p className="text-xl font-bold text-red-700">{reservations.filter(r => r.statut === 'annulee').length}</p>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>Toutes</button>
                <button onClick={() => setFilter('en_attente')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'en_attente' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}>En attente</button>
                <button onClick={() => setFilter('confirmee')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'confirmee' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Confirmées</button>
                <div className="flex-1 max-w-xs relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                </div>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Utilisateur</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Article</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Quantité</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Période</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredReservations.map((r) => (
                            <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <p className="font-medium">{r.user?.name}</p>
                                    <p className="text-xs text-gray-400">{r.user?.email}</p>
                                </td>
                                <td className="px-6 py-4">{r.article?.designation}</td>
                                <td className="px-6 py-4">{r.quantite} {r.article?.unite_mesure}</td>
                                <td className="px-6 py-4 text-sm">
                                    {new Date(r.date_debut).toLocaleDateString()} - {new Date(r.date_fin).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">{getStatutBadge(r.statut)}</td>
                                <td className="px-6 py-4 text-right">
                                    {r.statut === 'en_attente' && (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleConfirmer(r.id)} className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Confirmer</button>
                                            <button onClick={() => handleAnnuler(r.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Annuler</button>
                                        </div>
                                    )}
                                    {r.statut === 'confirmee' && (
                                        <button onClick={() => handleAnnuler(r.id)} className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Annuler</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}