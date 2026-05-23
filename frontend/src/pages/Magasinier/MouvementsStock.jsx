// src/pages/Magasinier/MouvementsStock.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, TrendingDown, Settings, Eye, X, Download, Scan, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function MouvementsStock() {
    // État pour les mouvements
    const [mouvements, setMouvements] = useState([]);
    const [articles, setArticles] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    // État pour le modal
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

    // État pour le scan rapide
    const [scanMode, setScanMode] = useState(false);
    const [scanCode, setScanCode] = useState('');
    const [scannedArticle, setScannedArticle] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [scanLoading, setScanLoading] = useState(false);

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
            if (response.data?.data?.data) articlesData = response.data.data.data;
            else if (response.data?.data && Array.isArray(response.data.data)) articlesData = response.data.data;
            else if (Array.isArray(response.data)) articlesData = response.data;
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
            if (response.data?.data) magasinsData = Array.isArray(response.data.data) ? response.data.data : [];
            else if (Array.isArray(response.data)) magasinsData = response.data;
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
            if (response.data?.data?.data) mouvementsData = response.data.data.data;
            else if (response.data?.data && Array.isArray(response.data.data)) mouvementsData = response.data.data;
            else if (Array.isArray(response.data)) mouvementsData = response.data;
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
            if (response.data?.data) statsData = response.data.data;
            else statsData = response.data;
            setStats(statsData);
        } catch (error) {
            console.error(error);
            setStats({});
        }
    };

    // Scanner un article
    const handleScan = async () => {
        if (!scanCode) return;
        setScanLoading(true);
        setScanResult(null);
        try {
           const response = await api.post('/api/magasinier/scan', { code_barre: scanCode });
            setScannedArticle(response.data.article);
            setScanResult({ success: true, message: `✅ Article trouvé : ${response.data.article.designation}` });
        } catch (error) {
            setScannedArticle(null);
            setScanResult({ success: false, message: error.response?.data?.message || '❌ Article non trouvé' });
        } finally {
            setScanLoading(false);
        }
    };

    // Valider le mouvement depuis le scan
    const handleScanSubmit = async () => {
        if (!scannedArticle) return;
        if (!formData.magasin_id) {
            alert('Veuillez sélectionner un magasin');
            return;
        }
        
        setScanLoading(true);
        try {
            const endpoint = modalType === 'entree' 
                ? '/api/magasinier/mouvements/entree' 
                : '/api/magasinier/mouvements/sortie';
            
            await api.post(endpoint, {
                article_id: scannedArticle.id,
                magasin_id: formData.magasin_id,
                quantite: formData.quantite || 1,
                motif: formData.motif || `${modalType === 'entree' ? 'Entrée' : 'Sortie'} via scan`
            });
            
            setScanResult({ success: true, message: `✅ ${modalType === 'entree' ? 'Entrée' : 'Sortie'} enregistrée avec succès` });
            setScanCode('');
            setScannedArticle(null);
            setFormData({ ...formData, quantite: '', motif: '', magasin_id: '' });
            fetchMouvements();
            fetchStats();
        } catch (error) {
            setScanResult({ success: false, message: error.response?.data?.message || '❌ Erreur' });
        } finally {
            setScanLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let endpoint = '';
            let data = {};
            
            if (modalType === 'entree') {
                endpoint = '/api/magasinier/scan/entree-rapide';
                data = {
                    article_id: formData.article_id,
                    magasin_id: formData.magasin_id,
                    quantite: formData.quantite,
                    motif: formData.motif,
                    reference: formData.reference
                };
            } else if (modalType === 'sortie') {
                endpoint = '/api/magasinier/scan/sortie-rapide';
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
            alert('✅ Mouvement enregistré avec succès');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || '❌ Erreur');
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

    const openModal = (type) => {
        setModalType(type);
        setScanMode(false);
        setScanCode('');
        setScannedArticle(null);
        setScanResult(null);
        setFormData({
            article_id: '',
            magasin_id: magasins[0]?.id || '',
            quantite: '',
            motif: '',
            reference: '',
            nouvelle_quantite: ''
        });
        setShowModal(true);
    };

    const openScanMode = (type) => {
        setModalType(type);
        setScanMode(true);
        setScanCode('');
        setScannedArticle(null);
        setScanResult(null);
        setFormData({
            ...formData,
            magasin_id: magasins[0]?.id || '',
            quantite: 1,
            motif: ''
        });
        setShowModal(true);
    };

    const filteredMouvements = mouvements.filter(m => 
        search === '' || m.article?.designation?.toLowerCase().includes(search.toLowerCase())
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">📊 Mouvements de stock</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez les entrées et sorties d'articles (avec ou sans scan)</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => openScanMode('entree')} 
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <Scan size={16} /> Scan Entrée
                    </button>
                    <button 
                        onClick={() => openScanMode('sortie')} 
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <Scan size={16} /> Scan Sortie
                    </button>
                    <button 
                        onClick={() => openModal('entree')} 
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <TrendingUp size={16} /> Entrée
                    </button>
                    <button 
                        onClick={() => openModal('sortie')} 
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                        <TrendingDown size={16} /> Sortie
                    </button>
                    <button 
                        onClick={() => openModal('ajustement')} 
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
                            {filteredMouvements.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        Aucun mouvement trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredMouvements.map((m) => (
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

            {/* Modal unifié */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                {scanMode && <Scan size={18} className="text-blue-500" />}
                                {modalType === 'entree' && '📥 Nouvelle entrée'}
                                {modalType === 'sortie' && '📤 Nouvelle sortie'}
                                {modalType === 'ajustement' && '⚙️ Ajustement de stock'}
                                {scanMode && ' (Mode scan)'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Mode Scan */}
                        {scanMode ? (
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p className="text-sm text-blue-700 flex items-center gap-2">
                                        <Scan size={14} /> Scannez un code-barres
                                    </p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Code-barres</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={scanCode}
                                            onChange={(e) => setScanCode(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                                            className="flex-1 px-3 py-2 border rounded-lg font-mono"
                                            placeholder="Scannez ou saisissez le code"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={handleScan}
                                            disabled={scanLoading}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            Scanner
                                        </button>
                                    </div>
                                </div>

                                {scannedArticle && (
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <p className="text-sm font-semibold text-green-800">✅ Article trouvé</p>
                                        <p className="font-bold">{scannedArticle.designation}</p>
                                        <p className="text-xs text-gray-500">Code: {scannedArticle.code_barre}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium mb-1">Magasin</label>
                                    <select
                                        value={formData.magasin_id}
                                        onChange={(e) => setFormData({ ...formData, magasin_id: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    >
                                        <option value="">Sélectionner un magasin</option>
                                        {magasins.map(m => (
                                            <option key={m.id} value={m.id}>{m.nom_magasin}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Quantité</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.quantite}
                                        onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Motif (optionnel)</label>
                                    <textarea
                                        value={formData.motif}
                                        onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                        rows="2"
                                        placeholder="Raison du mouvement..."
                                    />
                                </div>

                                {scanResult && (
                                    <div className={`p-3 rounded-lg ${scanResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                        {scanResult.message}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
                                    <button 
                                        type="button" 
                                        onClick={handleScanSubmit} 
                                        disabled={scanLoading || !scannedArticle}
                                        className="flex-1 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
                                    >
                                        {scanLoading ? 'Traitement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Mode Formulaire normal */
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}