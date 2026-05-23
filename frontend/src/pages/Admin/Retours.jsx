// src/pages/Admin/Retours.jsx
import React, { useState, useEffect } from 'react';
import { Undo2, Search, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function Retours() {
    const [retours, setRetours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedRetour, setSelectedRetour] = useState(null);
    const [motifRefus, setMotifRefus] = useState('');

    useEffect(() => {
        fetchRetours();
    }, []);

    const fetchRetours = async () => {
        try {
            const response = await api.get('/api/admin/retours');
            setRetours(response.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprouver = async (id) => {
        if (window.confirm('Approuver ce retour ?')) {
            try {
                await api.post(`/api/admin/retours/${id}/approuver`);
                fetchRetours();
                alert('Retour approuvé et stock mis à jour');
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur');
            }
        }
    };

    const handleRefuser = async (id) => {
        if (!motifRefus.trim()) {
            alert('Veuillez saisir un motif de refus');
            return;
        }
        try {
            await api.post(`/api/admin/retours/${id}/refuser`, { motif_refus: motifRefus });
            setSelectedRetour(null);
            setMotifRefus('');
            fetchRetours();
            alert('Retour refusé');
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur');
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

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">🔄 Retours magasin</h1>
                <p className="text-sm text-gray-500 mt-1">Gérez les retours de produits</p>
            </div>

            {/* Liste des retours */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Demande</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Article</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Quantité</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Motif</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Statut</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {retours.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Aucun retour</td>
                                </tr>
                            ) : (
                                retours.map((retour) => (
                                    <tr key={retour.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">N°{retour.demande_id}</td>
                                        <td className="px-6 py-4 font-medium">{retour.article?.designation}</td>
                                        <td className="px-6 py-4 text-center">{retour.quantite}</td>
                                        <td className="px-6 py-4 text-gray-500">{retour.motif}</td>
                                        <td className="px-6 py-4 text-center">{getStatutBadge(retour.statut)}</td>
                                        <td className="px-6 py-4 text-center">
                                            {retour.statut === 'en_attente' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleApprouver(retour.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approuver">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button onClick={() => { setSelectedRetour(retour); setMotifRefus(''); }} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Refuser">
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal refus */}
            {selectedRetour && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Refuser le retour</h2>
                            <button onClick={() => setSelectedRetour(null)}><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p><strong>Article:</strong> {selectedRetour.article?.designation}</p>
                                <p><strong>Quantité:</strong> {selectedRetour.quantite}</p>
                                <p><strong>Motif retour:</strong> {selectedRetour.motif}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Motif du refus *</label>
                                <textarea className="w-full p-2 border rounded-lg" rows="2" value={motifRefus} onChange={(e) => setMotifRefus(e.target.value)} required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setSelectedRetour(null)} className="flex-1 py-2 border rounded-lg">Annuler</button>
                                <button onClick={() => handleRefuser(selectedRetour.id)} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Refuser</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}