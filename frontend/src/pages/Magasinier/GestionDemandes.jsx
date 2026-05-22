// src/pages/Magasinier/GestionDemandes.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Search, Filter, Package, Truck } from 'lucide-react';
import api from '../../lib/apis/axios';
import MessageModal from '../../lib/components/MessageModal';

export default function GestionDemandes() {
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedDemande, setSelectedDemande] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'approve', 'refuse', 'livrer'
    const [quantiteAccorde, setQuantiteAccorde] = useState('');
    const [commentaireRefus, setCommentaireRefus] = useState('');
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [selectedDemandeMessages, setSelectedDemandeMessages] = useState(null);

    useEffect(() => {
        fetchDemandes();
    }, [filter]);
    const openMessageModal = async (demande) => {
        setSelectedDemandeMessages(demande);
        setMessageModalOpen(true);
    };
    const fetchDemandes = async () => {
        try {
            const params = filter !== 'all' ? { statut: filter } : {};
            const response = await api.get('/api/magasinier/demandes', { params });
            setDemandes(response.data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprouver = async () => {
        if (!quantiteAccorde || quantiteAccorde <= 0) {
            alert('Veuillez saisir une quantité accordée');
            return;
        }
        if (quantiteAccorde > selectedDemande.quantite_demandee) {
            alert('La quantité accordée ne peut pas dépasser la quantité demandée');
            return;
        }
        try {
            await api.post(`/api/magasinier/demandes/${selectedDemande.id}/approuver`, { 
                quantite_accorde: quantiteAccorde 
            });
            setShowModal(false);
            setSelectedDemande(null);
            setQuantiteAccorde('');
            fetchDemandes();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const handleRefuser = async () => {
        if (!commentaireRefus.trim()) {
            alert('Veuillez saisir un motif de refus');
            return;
        }
        try {
            await api.post(`/api/magasinier/demandes/${selectedDemande.id}/refuser`, { 
                commentaire: commentaireRefus 
            });
            setShowModal(false);
            setSelectedDemande(null);
            setCommentaireRefus('');
            fetchDemandes();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const handleLivrer = async () => {
        try {
            await api.post(`/api/magasinier/demandes/${selectedDemande.id}/livrer`);
            setShowModal(false);
            setSelectedDemande(null);
            fetchDemandes();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const openModal = (demande, type) => {
        setSelectedDemande(demande);
        setModalType(type);
        if (type === 'approve') {
            setQuantiteAccorde(demande.quantite_demandee);
        }
        setShowModal(true);
    };

    const getStatutBadge = (statut) => {
        const config = {
            en_attente: 'bg-yellow-100 text-yellow-800',
            approuvee: 'bg-green-100 text-green-800',
            refusee: 'bg-red-100 text-red-800',
            livree: 'bg-blue-100 text-blue-800'
        };
        const labels = {
            en_attente: 'En attente',
            approuvee: 'Approuvée',
            refusee: 'Refusée',
            livree: 'Livrée'
        };
        return <span className={`px-2 py-1 text-xs rounded-full ${config[statut]}`}>{labels[statut]}</span>;
    };

    const filteredDemandes = demandes.filter(d => 
        search === '' || 
        d.user?.name?.toLowerCase().includes(search.toLowerCase()) || 
        d.article?.designation?.toLowerCase().includes(search.toLowerCase())
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
                <h1 className="text-2xl font-bold text-gray-800">📋 Gestion des demandes</h1>
                <p className="text-sm text-gray-500 mt-1">Approuvez, refusez ou livrez les demandes des utilisateurs</p>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-xl font-bold text-gray-800">{demandes.length}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-3">
                    <p className="text-xs text-yellow-600">En attente</p>
                    <p className="text-xl font-bold text-yellow-700">{demandes.filter(d => d.statut === 'en_attente').length}</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-100 p-3">
                    <p className="text-xs text-green-600">Approuvées</p>
                    <p className="text-xl font-bold text-green-700">{demandes.filter(d => d.statut === 'approuvee').length}</p>
                </div>
                <div className="bg-blue-50 rounded-xl border border-blue-100 p-3">
                    <p className="text-xs text-blue-600">Livrées</p>
                    <p className="text-xl font-bold text-blue-700">{demandes.filter(d => d.statut === 'livree').length}</p>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Toutes
                </button>
                <button onClick={() => setFilter('en_attente')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'en_attente' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    En attente
                </button>
                <button onClick={() => setFilter('approuvee')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'approuvee' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Approuvées
                </button>
                <button onClick={() => setFilter('refusee')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'refusee' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Refusées
                </button>
                <div className="flex-1 max-w-xs relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher par demandeur ou article..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
            </div>

            {/* Tableau des demandes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Demandeur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Article</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Quantité</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredDemandes.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        Aucune demande trouvée
                                    </td>
                                </tr>
                            ) : (
                                filteredDemandes.map((demande) => (
                                    <tr key={demande.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-800">{demande.user?.name}</p>
                                            <p className="text-xs text-gray-400">{demande.user?.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-800">{demande.article?.designation}</p>
                                            {demande.motif && <p className="text-xs text-gray-400 mt-1">Motif: {demande.motif}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-800">{demande.quantite_demandee} {demande.article?.unite_mesure}</p>
                                            {demande.quantite_accorde && (
                                                <p className="text-xs text-green-600">Accordé: {demande.quantite_accorde}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(demande.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatutBadge(demande.statut)}
                                            {demande.commentaire_refus && (
                                                <p className="text-xs text-red-500 mt-1">Motif: {demande.commentaire_refus}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {demande.statut === 'en_attente' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => openModal(demande, 'approve')}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                                                    >
                                                        Approuver
                                                    </button>
                                                    <button 
                                                        onClick={() => openModal(demande, 'refuse')}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                                                    >
                                                        Refuser
                                                    </button>
                                                </div>
                                            )}
                                            {demande.statut === 'approuvee' && (
                                                <button 
                                                    onClick={() => openModal(demande, 'livrer')}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                                                >
                                                    Marquer livrée
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => openMessageModal(demande)} 
                                                className="p-1 text-indigo-500 hover:bg-indigo-50 rounded" 
                                                title="Voir les messages"
                                            >
                                                💬
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de traitement */}
            {showModal && selectedDemande && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                {modalType === 'approve' && '✅ Approuver la demande'}
                                {modalType === 'refuse' && '❌ Refuser la demande'}
                                {modalType === 'livrer' && '🚚 Confirmer la livraison'}
                            </h2>
                            <button onClick={() => { setShowModal(false); setSelectedDemande(null); }} className="text-gray-400 hover:text-gray-600">✖️</button>
                        </div>
                        
                        <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg">
                            <p><strong>Demandeur:</strong> {selectedDemande.user?.name}</p>
                            <p><strong>Article:</strong> {selectedDemande.article?.designation}</p>
                            <p><strong>Quantité demandée:</strong> {selectedDemande.quantite_demandee}</p>
                            <p><strong>Stock disponible:</strong> {selectedDemande.article?.quantite_stock}</p>
                        </div>

                        {modalType === 'approve' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité accordée</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={selectedDemande.quantite_demandee}
                                    className="w-full p-2 border border-gray-200 rounded-lg mb-4"
                                    value={quantiteAccorde}
                                    onChange={(e) => setQuantiteAccorde(e.target.value)}
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg">Annuler</button>
                                    <button onClick={handleApprouver} className="flex-1 py-2 bg-green-600 text-white rounded-lg">Approuver</button>
                                </div>
                            </div>
                        )}

                        {modalType === 'refuse' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif du refus</label>
                                <textarea 
                                    className="w-full p-2 border border-gray-200 rounded-lg mb-4"
                                    rows="3"
                                    value={commentaireRefus}
                                    onChange={(e) => setCommentaireRefus(e.target.value)}
                                    placeholder="Expliquez la raison du refus..."
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg">Annuler</button>
                                    <button onClick={handleRefuser} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Refuser</button>
                                </div>
                            </div>
                        )}

                        {modalType === 'livrer' && (
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Confirmez-vous que l'utilisateur a récupéré sa commande ?
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg">Annuler</button>
                                    <button onClick={handleLivrer} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Confirmer la livraison</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {messageModalOpen && selectedDemandeMessages && (
                <MessageModal
                    isOpen={messageModalOpen}
                    onClose={() => setMessageModalOpen(false)}
                    demandeId={selectedDemandeMessages.id}
                    demandeTitle={selectedDemandeMessages.article?.designation}
                />
            )}
        </div>
    );
}