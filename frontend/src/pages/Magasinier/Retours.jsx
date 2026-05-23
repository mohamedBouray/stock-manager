// src/pages/Magasinier/Retours.jsx
import React, { useState, useEffect } from 'react';
import { Undo2, Search, X, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function MagasinierRetours() {
    const [retours, setRetours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [showRefusModal, setShowRefusModal] = useState(false);
    const [selectedRetour, setSelectedRetour] = useState(null);
    const [motifRefus, setMotifRefus] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchRetours();
    }, []);

    const fetchRetours = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/magasinier/retours');
            setRetours(response.data.data || response.data || []);
        } catch (error) {
            console.error(error);
            setRetours([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprouver = async (retour) => {
        if (!window.confirm(`Approuver le retour de ${retour.quantite} ${retour.article?.designation} ?`)) return;
        
        setActionLoading(true);
        try {
            await api.post(`/api/magasinier/retours/${retour.id}/approuver`);
            alert('✅ Retour approuvé et stock mis à jour');
            fetchRetours();
        } catch (error) {
            alert(error.response?.data?.message || '❌ Erreur lors de l\'approbation');
        } finally {
            setActionLoading(false);
        }
    };

    const openRefusModal = (retour) => {
        setSelectedRetour(retour);
        setMotifRefus('');
        setShowRefusModal(true);
    };

    const handleRefuser = async () => {
        if (!motifRefus.trim()) {
            alert('Veuillez saisir un motif de refus');
            return;
        }
        
        setActionLoading(true);
        try {
            await api.post(`/api/magasinier/retours/${selectedRetour.id}/refuser`, {
                motif_refus: motifRefus
            });
            alert('❌ Retour refusé');
            setShowRefusModal(false);
            setSelectedRetour(null);
            fetchRetours();
        } catch (error) {
            alert(error.response?.data?.message || '❌ Erreur lors du refus');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatutBadge = (statut) => {
        const config = {
            en_attente: 'bg-yellow-100 text-yellow-700',
            approuve: 'bg-green-100 text-green-700',
            refuse: 'bg-red-100 text-red-700'
        };
        const labels = {
            en_attente: '⏳ En attente',
            approuve: '✅ Approuvé',
            refuse: '❌ Refusé'
        };
        return <span className={`px-2 py-1 text-xs rounded-full ${config[statut]}`}>{labels[statut]}</span>;
    };

    const filteredRetours = retours.filter(r => {
        if (filter !== 'all' && r.statut !== filter) return false;
        if (search && !r.article?.designation?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">🔄 Retours magasin</h1>
                        <p className="text-sm text-gray-500 mt-1">Gérez les demandes de retour des demandeurs</p>
                    </div>
                    <button 
                        onClick={fetchRetours} 
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                        title="Actualiser"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
                    <p className="text-xs text-yellow-600">En attente</p>
                    <p className="text-xl font-bold text-yellow-700">
                        {retours.filter(r => r.statut === 'en_attente').length}
                    </p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                    <p className="text-xs text-green-600">Approuvés</p>
                    <p className="text-xl font-bold text-green-700">
                        {retours.filter(r => r.statut === 'approuve').length}
                    </p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                    <p className="text-xs text-red-600">Refusés</p>
                    <p className="text-xl font-bold text-red-700">
                        {retours.filter(r => r.statut === 'refuse').length}
                    </p>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex-1 max-w-xs relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher un article..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" 
                    />
                </div>
                <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)} 
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                    <option value="all">Tous les statuts</option>
                    <option value="en_attente">En attente</option>
                    <option value="approuve">Approuvés</option>
                    <option value="refuse">Refusés</option>
                </select>
            </div>

            {/* Liste des retours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Demandeur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Article</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Qté</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Motif</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Statut</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Date</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRetours.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <Undo2 size={40} className="mx-auto text-gray-300 mb-2" />
                                        Aucun retour trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredRetours.map((retour) => (
                                    <tr key={retour.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <p className="font-medium">{retour.user?.name || '-'}</p>
                                            <p className="text-xs text-gray-400">{retour.user?.email}</p>
                                        </td>
                                        <td className="px-6 py-4 font-medium">{retour.article?.designation || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold">{retour.quantite}</span>
                                            <span className="text-xs text-gray-400"> {retour.article?.unite_mesure || 'pièce(s)'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 max-w-xs">
                                            <p className="truncate">{retour.motif}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">{getStatutBadge(retour.statut)}</td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                                            {new Date(retour.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {retour.statut === 'en_attente' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleApprouver(retour)} 
                                                        disabled={actionLoading}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" 
                                                        title="Approuver"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => openRefusModal(retour)} 
                                                        disabled={actionLoading}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" 
                                                        title="Refuser"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                            {retour.statut !== 'en_attente' && (
                                                <span className="text-xs text-gray-400">Traité</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de refus */}
            {showRefusModal && selectedRetour && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <XCircle size={20} className="text-red-500" />
                                Refuser le retour
                            </h2>
                            <button onClick={() => setShowRefusModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p><strong>Demandeur:</strong> {selectedRetour.user?.name}</p>
                                <p><strong>Article:</strong> {selectedRetour.article?.designation}</p>
                                <p><strong>Quantité:</strong> {selectedRetour.quantite}</p>
                                <p><strong>Motif:</strong> {selectedRetour.motif}</p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Motif du refus *</label>
                                <textarea 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                                    rows="3"
                                    value={motifRefus}
                                    onChange={(e) => setMotifRefus(e.target.value)}
                                    placeholder="Expliquez pourquoi ce retour est refusé..."
                                />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setShowRefusModal(false)} 
                                    className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition"
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={handleRefuser} 
                                    disabled={actionLoading}
                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                >
                                    {actionLoading ? 'Traitement...' : 'Confirmer le refus'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}