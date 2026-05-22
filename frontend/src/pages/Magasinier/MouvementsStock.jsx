// src/pages/Magasinier/MouvementsStock.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, TrendingDown, Settings, Eye, X, Download } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function MouvementsStock() {
    const [mouvements, setMouvements] = useState([]);
    const [articles, setArticles] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('entree');
    const [formData, setFormData] = useState({
        article_id: '',
        magasin_id: '',
        quantite: '',
        motif: '',
        reference: '',
        nouvelle_quantite: ''
    });
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchMouvements();
        fetchArticles();
        fetchMagasins();
        fetchStats();
    }, [filter]);

const fetchArticles = async () => {
    try {
        const response = await api.get('/api/user/stock/articles');
        let articlesData = [];
        if (response.data?.data?.data) {
            articlesData = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
            articlesData = response.data.data;
        } else if (Array.isArray(response.data)) {
            articlesData = response.data;
        }
        setArticles(articlesData);
    } catch (error) {
        console.error(error);
        setArticles([]);
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

const fetchMouvements = async () => {
    try {
        const params = filter !== 'all' ? { type: filter } : {};
        const response = await api.get('/api/magasinier/mouvements', { params });
        let mouvementsData = [];
        if (response.data?.data?.data) {
            mouvementsData = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
            mouvementsData = response.data.data;
        } else if (Array.isArray(response.data)) {
            mouvementsData = response.data;
        }
        setMouvements(mouvementsData);
    } catch (error) {
        console.error(error);
        setMouvements([]);
    } finally {
        setLoading(false);
    }
};

const fetchStats = async () => {
    try {
        const response = await api.get('/api/magasinier/mouvements/stats');
        let statsData = {};
        if (response.data?.data) {
            statsData = response.data.data;
        } else {
            statsData = response.data;
        }
        setStats(statsData);
    } catch (error) {
        console.error(error);
        setStats({});
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '';
            let data = {};
            
            if (modalType === 'entree') {
                endpoint = '/api/magasinier/mouvements/entree';
                data = {
                    article_id: formData.article_id,
                    magasin_id: formData.magasin_id,
                    quantite: formData.quantite,
                    motif: formData.motif,
                    reference: formData.reference
                };
            } else if (modalType === 'sortie') {
                endpoint = '/api/magasinier/mouvements/sortie';
                data = {
                    article_id: formData.article_id,
                    magasin_id: formData.magasin_id,
                    quantite: formData.quantite,
                    motif: formData.motif,
                    reference: formData.reference
                };
            } else if (modalType === 'ajustement') {
                endpoint = '/api/magasinier/mouvements/ajustement';
                data = {
                    article_id: formData.article_id,
                    magasin_id: formData.magasin_id,
                    nouvelle_quantite: formData.nouvelle_quantite,
                    motif: formData.motif
                };
            }
            
            await api.post(endpoint, data);
            setShowModal(false);
            setFormData({ article_id: '', magasin_id: '', quantite: '', motif: '', reference: '', nouvelle_quantite: '' });
            fetchMouvements();
            fetchStats();
            alert('Mouvement enregistré avec succès');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const getTypeBadge = (type) => {
        const config = {
            entree: 'bg-green-100 text-green-700',
            sortie: 'bg-red-100 text-red-700',
            ajustement: 'bg-yellow-100 text-yellow-700'
        };
        const labels = {
            entree: '📥 Entrée',
            sortie: '📤 Sortie',
            ajustement: '⚙️ Ajustement'
        };
        return <span className={`px-2 py-1 text-xs rounded-full ${config[type]}`}>{labels[type]}</span>;
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
            {/* En-tête */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">📊 Mouvements de stock</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez les entrées et sorties d'articles</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setModalType('entree'); setShowModal(true); }} 
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <TrendingUp size={16} /> Entrée
                    </button>
                    <button 
                        onClick={() => { setModalType('sortie'); setShowModal(true); }} 
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <TrendingDown size={16} /> Sortie
                    </button>
                    <button 
                        onClick={() => { setModalType('ajustement'); setShowModal(true); }} 
                        className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <Settings size={16} /> Ajustement
                    </button>
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-sm text-green-600">Total entrées</p>
                    <p className="text-2xl font-bold text-green-700">{stats.total_entrees || 0}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <p className="text-sm text-red-600">Total sorties</p>
                    <p className="text-2xl font-bold text-red-700">{stats.total_sorties || 0}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-sm text-blue-600">Mouvements aujourd'hui</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.mouvements_jour || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-sm text-purple-600">Ajustements</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.total_ajustements || 0}</p>
                </div>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>Tous</button>
                <button onClick={() => setFilter('entree')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'entree' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Entrées</button>
                <button onClick={() => setFilter('sortie')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'sortie' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>Sorties</button>
                <button onClick={() => setFilter('ajustement')} className={`px-3 py-1.5 text-sm rounded-lg ${filter === 'ajustement' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}>Ajustements</button>
                <div className="flex-1 max-w-xs relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher par article..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <button className="px-3 py-1.5 border rounded-lg text-sm flex items-center gap-1">
                    <Download size={14} /> Exporter
                </button>
            </div>

            {/* Tableau des mouvements */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Article</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Quantité</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Stock avant</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Stock après</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Motif</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Par</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mouvements.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        Aucun mouvement trouvé
                                    </td>
                                </tr>
                            ) : (
                                mouvements.map((m) => (
                                    <tr key={m.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{m.article?.designation}</td>
                                        <td className="px-6 py-4">{getTypeBadge(m.type)}</td>
                                        <td className="px-6 py-4 font-bold">{m.quantite}</td>
                                        <td className="px-6 py-4">{m.quantite_avant}</td>
                                        <td className="px-6 py-4">{m.quantite_apres}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{m.motif || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(m.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{m.user?.name}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Derniers mouvements */}
            {stats.derniers_mouvements?.length > 0 && (
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">🔄 Derniers mouvements</h3>
                    <div className="space-y-2">
                        {stats.derniers_mouvements.map((m) => (
                            <div key={m.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    {getTypeBadge(m.type)}
                                    <span className="font-medium">{m.article?.designation}</span>
                                    <span className={m.type === 'entree' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                        {m.type === 'entree' ? '+' : '-'}{m.quantite}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-400">
                                    {new Date(m.created_at).toLocaleString()} - {m.user?.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">
                                {modalType === 'entree' && '📥 Nouvelle entrée'}
                                {modalType === 'sortie' && '📤 Nouvelle sortie'}
                                {modalType === 'ajustement' && '⚙️ Ajustement de stock'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Article</label>
                                <select 
                                    className="w-full p-2 border rounded-lg" 
                                    value={formData.article_id} 
                                    onChange={(e) => setFormData({ ...formData, article_id: e.target.value })} 
                                    required
                                >
                                    <option value="">Sélectionner un article</option>
                                    {articles.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.designation} - Stock: {a.quantite_stock}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Magasin</label>
                                <select 
                                    className="w-full p-2 border rounded-lg" 
                                    value={formData.magasin_id} 
                                    onChange={(e) => setFormData({ ...formData, magasin_id: e.target.value })} 
                                    required
                                >
                                    <option value="">Sélectionner un magasin</option>
                                    {magasins.map(m => (
                                        <option key={m.id} value={m.id}>{m.nom_magasin}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {modalType !== 'ajustement' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Quantité</label>
                                    <input 
                                        type="number" 
                                        min="1" 
                                        className="w-full p-2 border rounded-lg" 
                                        value={formData.quantite} 
                                        onChange={(e) => setFormData({ ...formData, quantite: e.target.value })} 
                                        required 
                                    />
                                </div>
                            )}
                            
                            {modalType === 'ajustement' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nouvelle quantité</label>
                                    <input 
                                        type="number" 
                                        min="0" 
                                        className="w-full p-2 border rounded-lg" 
                                        value={formData.nouvelle_quantite} 
                                        onChange={(e) => setFormData({ ...formData, nouvelle_quantite: e.target.value })} 
                                        required 
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Motif</label>
                                <textarea 
                                    className="w-full p-2 border rounded-lg" 
                                    rows="2" 
                                    value={formData.motif} 
                                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })} 
                                    required={modalType === 'ajustement'}
                                    placeholder="Raison du mouvement..."
                                />
                            </div>
                            
                            {modalType !== 'ajustement' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Référence (optionnel)</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded-lg" 
                                        value={formData.reference} 
                                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })} 
                                        placeholder="N° commande, N° demande..."
                                    />
                                </div>
                            )}
                            
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
                                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}