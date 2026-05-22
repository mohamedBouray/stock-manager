// src/pages/User/Reservations.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, X, Search } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function Reservations() {
    const [reservations, setReservations] = useState([]);
    const [historique, setHistorique] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ article_id: '', quantite: '', date_debut: '', date_fin: '', motif: '' });
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        fetchReservations();
        fetchArticles();
        if (activeTab === 'historique') {
            fetchHistorique();
        }
    }, [activeTab]);

    const fetchReservations = async () => {
        try {
            const response = await api.get('/api/user/reservations');
            setReservations(response.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistorique = async () => {
        try {
            const response = await api.get('/api/user/reservations/historique');
            setHistorique(response.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchArticles = async () => {
        try {
            const response = await api.get('/api/user/stock/articles');
            setArticles(response.data.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/user/reservations', formData);
            setShowModal(false);
            setFormData({ article_id: '', quantite: '', date_debut: '', date_fin: '', motif: '' });
            fetchReservations();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const handleCancel = async (id) => {
        if (window.confirm('Annuler cette réservation ?')) {
            try {
                await api.delete(`/api/user/reservations/${id}`);
                fetchReservations();
                if (activeTab === 'historique') {
                    fetchHistorique();
                }
            } catch (error) {
                console.error(error);
            }
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">📅 Mes réservations</h1>
                    <p className="text-sm text-gray-500 mt-1">Réservez vos articles à l'avance</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    <Plus size={16} /> Nouvelle réservation
                </button>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-2 text-sm font-medium transition-all ${
                        activeTab === 'active'
                            ? 'border-b-2 border-emerald-600 text-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    📋 Réservations actives
                </button>
                <button
                    onClick={() => setActiveTab('historique')}
                    className={`px-4 py-2 text-sm font-medium transition-all ${
                        activeTab === 'historique'
                            ? 'border-b-2 border-emerald-600 text-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    📦 Historique
                </button>
            </div>

            {activeTab === 'active' ? (
                // Réservations actives
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reservations.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">Aucune réservation active</div>
                    ) : (
                        reservations.map((res) => (
                            <div key={res.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{res.article?.designation}</h3>
                                        <p className="text-sm text-gray-500">Quantité: {res.quantite}</p>
                                    </div>
                                    {getStatutBadge(res.statut)}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                    <div className="flex items-center gap-1"><Calendar size={14} /> Du {new Date(res.date_debut).toLocaleDateString()}</div>
                                    <div className="flex items-center gap-1"><Calendar size={14} /> Au {new Date(res.date_fin).toLocaleDateString()}</div>
                                </div>
                                {res.motif && <p className="text-xs text-gray-400 mb-3">Motif: {res.motif}</p>}
                                {(res.statut === 'en_attente' || res.statut === 'confirmee') && (
                                    <button onClick={() => handleCancel(res.id)} className="w-full mt-2 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition">Annuler</button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ) : (
                // Historique des réservations (expirées/annulées)
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Article</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Quantité</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Période</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date réservation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {historique.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Aucun historique</td>
                                </tr>
                            ) : (
                                historique.map((res) => (
                                    <tr key={res.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{res.article?.designation}</p>
                                        </td>
                                        <td className="px-6 py-4">{res.quantite}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {new Date(res.date_debut).toLocaleDateString()} - {new Date(res.date_fin).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">{getStatutBadge(res.statut)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(res.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal nouvelle réservation */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Nouvelle réservation</h2>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Article</label>
                                <select className="w-full p-2 border rounded-lg" value={formData.article_id} onChange={(e) => setFormData({ ...formData, article_id: e.target.value })} required>
                                    <option value="">Sélectionner</option>
                                    {articles.map(a => <option key={a.id} value={a.id}>{a.designation} - Stock: {a.quantite_stock}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Quantité</label>
                                <input type="number" min="1" className="w-full p-2 border rounded-lg" value={formData.quantite} onChange={(e) => setFormData({ ...formData, quantite: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date début</label>
                                    <input type="date" className="w-full p-2 border rounded-lg" value={formData.date_debut} onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date fin</label>
                                    <input type="date" className="w-full p-2 border rounded-lg" value={formData.date_fin} onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Motif</label>
                                <textarea className="w-full p-2 border rounded-lg" rows="2" value={formData.motif} onChange={(e) => setFormData({ ...formData, motif: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
                                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg">Réserver</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}