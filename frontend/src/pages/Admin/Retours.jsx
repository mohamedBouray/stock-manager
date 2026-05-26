import React, { useState, useEffect } from 'react';
import { Undo2, Search, X, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

export default function Retours() {
    const [retours, setRetours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRefusModal, setShowRefusModal] = useState(false);
    const [selectedRetour, setSelectedRetour] = useState(null);
    const [motifRefus, setMotifRefus] = useState('');

    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        confirmText: 'OK',
        onConfirm: null
    });

    const openConfirmModal = (type, title, message, confirmText, onConfirm) => {
        setActionModal({
            isOpen: true,
            type,
            title,
            message,
            confirmText,
            onConfirm: () => {
                if (onConfirm) onConfirm();
                setActionModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

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
        openConfirmModal(
            'warning',
            'Approuver le retour',
            'Êtes-vous sûr de vouloir approuver ce retour ? Le stock sera mis à jour.',
            'Oui, approuver',
            async () => {
                try {
                    await api.post(`/api/admin/retours/${id}/approuver`);
                    fetchRetours();
                    openConfirmModal('success', 'Succès', 'Retour approuvé et stock mis à jour', 'OK', null);
                } catch (error) {
                    openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur', 'OK', null);
                }
            }
        );
    };

    const handleRefuserSubmit = async () => {
        if (!motifRefus.trim()) {
            openConfirmModal('warning', 'Attention', 'Veuillez saisir un motif de refus', 'OK', null);
            return;
        }
        try {
            await api.post(`/api/admin/retours/${selectedRetour.id}/refuser`, { motif_refus: motifRefus });
            setShowRefusModal(false);
            setSelectedRetour(null);
            setMotifRefus('');
            fetchRetours();
            openConfirmModal('success', 'Succès', 'Retour refusé', 'OK', null);
        } catch (error) {
            openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur', 'OK', null);
        }
    };

    const getStatutBadge = (statut) => {
        const config = {
            en_attente: 'bg-amber-100 text-amber-700',
            approuve: 'bg-green-100 text-green-700',
            refuse: 'bg-red-100 text-red-700'
        };
        const labels = {
            en_attente: 'En attente',
            approuve: 'Approuvé',
            refuse: 'Refusé'
        };
        return <span className={`px-2 py-1 text-xs rounded-full ${config[statut]}`}>{labels[statut]}</span>;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Retours magasin</h1>
                <p className="text-sm text-gray-500 mt-0.5">Gérez les retours de produits</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Demande</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motif</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {retours.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                                        <Undo2 size={40} className="mx-auto text-gray-300 mb-2" />
                                        Aucun retour
                                    </td>
                                </tr>
                            ) : (
                                retours.map((retour) => (
                                    <tr key={retour.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 text-sm text-gray-600">N°{retour.demande_id}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{retour.article?.designation}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">{retour.quantite}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{retour.motif}</td>
                                        <td className="px-4 py-3 text-center">{getStatutBadge(retour.statut)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {retour.statut === 'en_attente' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleApprouver(retour.id)} 
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" 
                                                        title="Approuver"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedRetour(retour); setMotifRefus(''); setShowRefusModal(true); }} 
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition" 
                                                        title="Refuser"
                                                    >
                                                        <XCircle size={16} />
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
            {showRefusModal && selectedRetour && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Refuser le retour</h2>
                            <button onClick={() => setShowRefusModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm"><strong className="text-gray-700">Article:</strong> <span className="text-gray-600">{selectedRetour.article?.designation}</span></p>
                                <p className="text-sm mt-1"><strong className="text-gray-700">Quantité:</strong> <span className="text-gray-600">{selectedRetour.quantite}</span></p>
                                <p className="text-sm mt-1"><strong className="text-gray-700">Motif retour:</strong> <span className="text-gray-600">{selectedRetour.motif}</span></p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif du refus <span className="text-red-500">*</span></label>
                                <textarea 
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none" 
                                    rows="2" 
                                    value={motifRefus} 
                                    onChange={(e) => setMotifRefus(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowRefusModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                                    Annuler
                                </button>
                                <button onClick={handleRefuserSubmit} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">
                                    Refuser
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ActionConfirmModal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={actionModal.onConfirm}
                title={actionModal.title}
                message={actionModal.message}
                type={actionModal.type}
                confirmText={actionModal.confirmText}
                cancelText="Annuler"
            />
        </div>
    );
}