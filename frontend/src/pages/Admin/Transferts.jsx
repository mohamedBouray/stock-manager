import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Search, X, CheckCircle, AlertCircle, Building2, Package } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

export default function Transferts() {
    const [articles, setArticles] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [transferts, setTransferts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        article_id: '',
        magasin_source_id: '',
        magasin_dest_id: '',
        quantite: 1,
        motif: ''
    });

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
        fetchArticles();
        fetchMagasins();
        fetchTransferts();
    }, []);

    const fetchArticles = async () => {
        try {
            const response = await api.get('/api/user/stock/articles');
            let articlesData = [];
            if (response.data?.data?.data) articlesData = response.data.data.data;
            else if (response.data?.data && Array.isArray(response.data.data)) articlesData = response.data.data;
            setArticles(articlesData);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchMagasins = async () => {
        try {
            const response = await api.get('/api/admin/catalogue-structure');
            setMagasins(response.data.magasins || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTransferts = async () => {
        try {
            const response = await api.get('/api/admin/transferts');
            setTransferts(response.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (formData.magasin_source_id === formData.magasin_dest_id) {
            openConfirmModal('warning', 'Attention', 'Les magasins source et destination doivent être différents', 'OK', null);
            return;
        }
        
        const magasinSource = magasins.find(m => m.id == formData.magasin_source_id);
        const magasinDest = magasins.find(m => m.id == formData.magasin_dest_id);
        const article = articles.find(a => a.id == formData.article_id);
        
        openConfirmModal(
            'warning',
            'Confirmation',
            `Transférer ${formData.quantite} "${article?.designation}" de ${magasinSource?.nom_magasin} vers ${magasinDest?.nom_magasin} ?`,
            'Oui, transférer',
            async () => {
                try {
                    await api.post('/api/admin/transferts', formData);
                    setShowModal(false);
                    setFormData({ article_id: '', magasin_source_id: '', magasin_dest_id: '', quantite: 1, motif: '' });
                    fetchTransferts();
                    openConfirmModal('success', 'Succès', 'Transfert effectué avec succès', 'OK', null);
                } catch (error) {
                    openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur', 'OK', null);
                }
            }
        );
    };

    const articleSelectionne = articles.find(a => a.id === parseInt(formData.article_id));
    const stockSource = articleSelectionne?.stocks?.find(s => s.magasin_id === parseInt(formData.magasin_source_id));

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Transfert d'articles</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Transférer des articles entre magasins</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)} 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >
                    <ArrowRightLeft size={16} /> Nouveau transfert
                </button>
            </div>

            {/* Historique des transferts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package size={16} /> Historique des transferts
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {transferts.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            Aucun transfert effectué
                        </div>
                    ) : (
                        transferts.map((t) => (
                            <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                                <div>
                                    <p className="font-medium text-gray-800">{t.article?.designation}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {t.quantite} unités - {t.magasinSource?.nom_magasin} → {t.magasinDest?.nom_magasin}
                                    </p>
                                    {t.motif && <p className="text-xs text-gray-400 mt-1">Motif: {t.motif}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</p>
                                    <p className="text-xs text-blue-600">Par {t.user?.name}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal transfert */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Nouveau transfert</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Article *</label>
                                <select 
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" 
                                    value={formData.article_id} 
                                    onChange={(e) => setFormData({ ...formData, article_id: e.target.value })} 
                                    required
                                >
                                    <option value="">Sélectionner un article</option>
                                    {articles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Magasin source *</label>
                                <select 
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" 
                                    value={formData.magasin_source_id} 
                                    onChange={(e) => setFormData({ ...formData, magasin_source_id: e.target.value })} 
                                    required
                                >
                                    <option value="">Sélectionner un magasin</option>
                                    {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Magasin destination *</label>
                                <select 
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" 
                                    value={formData.magasin_dest_id} 
                                    onChange={(e) => setFormData({ ...formData, magasin_dest_id: e.target.value })} 
                                    required
                                >
                                    <option value="">Sélectionner un magasin</option>
                                    {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" 
                                    value={formData.quantite} 
                                    onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) })} 
                                    required 
                                />
                                {stockSource && stockSource.quantite_disponible < formData.quantite && (
                                    <p className="text-xs text-red-500 mt-1">Stock disponible: {stockSource.quantite_disponible}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif *</label>
                                <textarea 
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none" 
                                    rows="2" 
                                    value={formData.motif} 
                                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })} 
                                    required 
                                    placeholder="Raison du transfert"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                                    Annuler
                                </button>
                                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">
                                    Transférer
                                </button>
                            </div>
                        </form>
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