// src/pages/Admin/EntreeSortie.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Scan, Search, CheckCircle, XCircle, Package } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function EntreeSortie() {
    const [mode, setMode] = useState('entree');
    const [codeBarre, setCodeBarre] = useState('');
    const [article, setArticle] = useState(null);
    const [quantite, setQuantite] = useState(1);
    const [magasins, setMagasins] = useState([]);
    const [magasinId, setMagasinId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [recentMouvements, setRecentMouvements] = useState([]);

    useEffect(() => {
        fetchMagasins();
        fetchRecentMouvements();
    }, []);

    const fetchMagasins = async () => {
        try {
            const response = await api.get('/api/admin/catalogue-structure');
            setMagasins(response.data.magasins || []);
            if (response.data.magasins?.length > 0) {
                setMagasinId(response.data.magasins[0].id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchRecentMouvements = async () => {
        try {
            // 🔥 Utiliser une API qui existe (stocks à la place)
            const response = await api.get('/api/admin/stocks');
            const stocks = response.data.stocks?.data || response.data.stocks || [];
            // Formater comme des mouvements récents
            const formatted = stocks.slice(0, 5).map(s => ({
                id: s.id,
                type: s.quantite_disponible > 0 ? 'entree' : 'sortie',
                quantite: s.quantite_disponible,
                article: s.article,
                created_at: s.updated_at
            }));
            setRecentMouvements(formatted);
        } catch (error) {
            console.error(error);
            setRecentMouvements([]);
        }
    };

    const handleScan = async () => {
        if (!codeBarre) return;
        setLoading(true);
        setResult(null);
        try {
            const response = await api.post('/api/admin/scan', { code_barre: codeBarre });
            setArticle(response.data.article);
            setQuantite(1);
        } catch (error) {
            setResult({ success: false, message: error.response?.data?.message || 'Article non trouvé' });
            setArticle(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!article || !quantite || !magasinId) {
            alert('Veuillez scanner un article et saisir une quantité');
            return;
        }

        setLoading(true);
        try {
            const endpoint = mode === 'entree' ? '/api/admin/entree-rapide' : '/api/admin/sortie-rapide';
            const response = await api.post(endpoint, {
                code_barre: article.code_barre,
                magasin_id: magasinId,
                quantite: quantite
            });
            setResult({ success: true, message: response.data.message, article: article, quantite: quantite });
            setArticle(null);
            setCodeBarre('');
            setQuantite(1);
            fetchRecentMouvements();
        } catch (error) {
            setResult({ success: false, message: error.response?.data?.message || 'Erreur' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {mode === 'entree' ? '📥 Entrée de stock' : '📤 Sortie de stock'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">Scannez un code-barres pour enregistrer rapidement</p>
            </div>

            {/* Switch mode */}
            <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setMode('entree')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        mode === 'entree' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <TrendingUp size={16} /> Entrée
                </button>
                <button
                    onClick={() => setMode('sortie')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        mode === 'sortie' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <TrendingDown size={16} /> Sortie
                </button>
            </div>

            {/* Zone de scan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                        <Scan size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Scannez ou saisissez le code-barres"
                            value={codeBarre}
                            onChange={(e) => setCodeBarre(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                            className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-lg font-mono"
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={handleScan}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer"
                    >
                        Scanner
                    </button>
                </div>

                {/* Résultat scan */}
                {article && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={18} className="text-green-600" />
                            <span className="font-semibold text-green-800">Article trouvé</span>
                        </div>
                        <p><strong>Désignation:</strong> {article.designation}</p>
                        <p><strong>Code:</strong> {article.code_barre}</p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Magasin</label>
                                <select
                                    value={magasinId}
                                    onChange={(e) => setMagasinId(e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                >
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
                                    value={quantite}
                                    onChange={(e) => setQuantite(parseInt(e.target.value) || 1)}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="mt-3 w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition cursor-pointer"
                        >
                            Confirmer {mode === 'entree' ? "l'entrée" : 'la sortie'}
                        </button>
                    </div>
                )}

                {/* Message résultat */}
                {result && (
                    <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2">
                            {result.success ? <CheckCircle size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-600" />}
                            <span className={result.success ? 'text-green-800' : 'text-red-800'}>{result.message}</span>
                        </div>
                        {result.success && result.article && (
                            <p className="text-sm text-gray-600 mt-1">
                                {result.article.designation} : {result.quantite} unité(s)
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Derniers mouvements - Version sans API externe */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">🔄 Derniers mouvements</h3>
                <div className="space-y-2">
                    {recentMouvements.length === 0 ? (
                        <p className="text-center text-gray-400 py-4">Aucun mouvement récent</p>
                    ) : (
                        recentMouvements.map((m, i) => (
                            <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs rounded-full ${m.type === 'entree' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {m.type === 'entree' ? '📥 Stock' : '📦 Article'}
                                    </span>
                                    <span className="font-medium">{m.article?.designation || 'Article'}</span>
                                    <span className="text-sm">{m.quantite} unités</span>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleTimeString()}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}