import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Search, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/apis/axios';

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.magasin_source_id === formData.magasin_dest_id) {
            alert('Les magasins source et destination doivent être différents');
            return;
        }
        try {
            await api.post('/api/admin/transferts', formData);
            setShowModal(false);
            setFormData({ article_id: '', magasin_source_id: '', magasin_dest_id: '', quantite: 1, motif: '' });
            fetchTransferts();
            alert('Transfert effectué avec succès');
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const articleSelectionne = articles.find(a => a.id === parseInt(formData.article_id));
    const stockSource = articleSelectionne?.stocks?.find(s => s.magasin_id === parseInt(formData.magasin_source_id));

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🔄 Transfert d'articles</h1>
                    <p className="text-sm text-gray-500 mt-1">Transférer des articles entre magasins</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                    <ArrowRightLeft size={16} /> Nouveau transfert
                </button>
            </div>

            {/* Historique des transferts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-800">📜 Historique des transferts</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {transferts.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">Aucun transfert</div>
                    ) : (
                        transferts.map((t) => (
                            <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="font-medium">{t.article?.designation}</p>
                                    <p className="text-sm text-gray-500">{t.quantite} unités - {t.magasinSource?.nom_magasin} → {t.magasinDest?.nom_magasin}</p>
                                    {t.motif && <p className="text-xs text-gray-400 mt-1">Motif: {t.motif}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</p>
                                    <p className="text-xs text-green-600">Par {t.user?.name}</p>
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
                            <h2 className="text-lg font-semibold">Nouveau transfert</h2>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Article</label>
                                <select className="w-full p-2 border rounded-lg" value={formData.article_id} onChange={(e) => setFormData({ ...formData, article_id: e.target.value })} required>
                                    <option value="">Sélectionner</option>
                                    {articles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Magasin source</label>
                                <select className="w-full p-2 border rounded-lg" value={formData.magasin_source_id} onChange={(e) => setFormData({ ...formData, magasin_source_id: e.target.value })} required>
                                    <option value="">Sélectionner</option>
                                    {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Magasin destination</label>
                                <select className="w-full p-2 border rounded-lg" value={formData.magasin_dest_id} onChange={(e) => setFormData({ ...formData, magasin_dest_id: e.target.value })} required>
                                    <option value="">Sélectionner</option>
                                    {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Quantité</label>
                                <input type="number" min="1" className="w-full p-2 border rounded-lg" value={formData.quantite} onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) })} required />
                                {stockSource && stockSource.quantite_disponible < formData.quantite && (
                                    <p className="text-xs text-red-500 mt-1">Stock disponible: {stockSource.quantite_disponible}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Motif</label>
                                <textarea className="w-full p-2 border rounded-lg" rows="2" value={formData.motif} onChange={(e) => setFormData({ ...formData, motif: e.target.value })} required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
                                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg">Transférer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}