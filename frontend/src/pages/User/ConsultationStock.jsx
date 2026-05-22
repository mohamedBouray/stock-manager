// src/pages/User/ConsultationStock.jsx
import React, { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function ConsultationStock() {
    const [articles, setArticles] = useState([]);
    const [familles, setFamilles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedFamille, setSelectedFamille] = useState('');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchArticles();
        fetchFamilles();
    }, [search, selectedFamille]);

    const fetchArticles = async () => {
        try {
            const params = {};
            if (search) params.search = search;
            if (selectedFamille) params.famille_id = selectedFamille;
            const response = await api.get('/api/user/stock/articles', { params });
            
            // ✅ CORRECTION: Extraire le tableau d'articles
            let articlesData = [];
            if (response.data?.data?.data) {
                // Structure paginée: { success: true, data: { data: [...] } }
                articlesData = response.data.data.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                // Structure simple: { success: true, data: [...] }
                articlesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                articlesData = response.data;
            }
            
            setArticles(articlesData);
        } catch (error) {
            console.error(error);
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchFamilles = async () => {
        try {
            const response = await api.get('/api/user/stock/familles');
            let famillesData = [];
            if (response.data?.data) {
                famillesData = Array.isArray(response.data.data) ? response.data.data : [];
            }
            setFamilles(famillesData);
        } catch (error) {
            console.error(error);
            setFamilles([]);
        }
    };

    const getStockStatus = (quantite) => {
        if (quantite <= 0) return { icon: XCircle, color: 'text-red-500', text: 'Rupture' };
        if (quantite <= 5) return { icon: AlertTriangle, color: 'text-orange-500', text: 'Stock bas' };
        return { icon: CheckCircle, color: 'text-green-500', text: 'Disponible' };
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="p-6">
            <div className="mb-6"><h1 className="text-2xl font-bold text-gray-800">📦 Consultation du stock</h1><p className="text-sm text-gray-500 mt-1">Consultez la disponibilité des articles</p></div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex-1 max-w-xs relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher un article..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <select value={selectedFamille} onChange={(e) => setSelectedFamille(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="">Toutes les familles</option>{familles.map(f => <option key={f.id} value={f.id}>{f.nom_famille}</option>)}</select>
                <button onClick={() => { setSearch(''); setSelectedFamille(''); fetchArticles(); }} className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Réinitialiser</button>
            </div>

            {/* Liste articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Aucun article trouvé</div>
                ) : (
                    articles.map((article) => {
                        const status = getStockStatus(article.quantite_stock);
                        const Icon = status.icon;
                        return (
                            <div key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                                <div className="flex items-start justify-between mb-2"><h3 className="font-semibold text-gray-800">{article.designation}</h3><div className={`flex items-center gap-1 text-xs ${status.color}`}><Icon size={14} /> {status.text}</div></div>
                                <p className="text-sm text-gray-500 mb-1">Code: {article.code_barre}</p>
                                <p className="text-lg font-bold text-gray-800 mb-2">{article.quantite_stock} {article.unite_mesure}</p>
                                {article.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{article.description}</p>}
                                <button onClick={() => { setSelectedArticle(article); setShowModal(true); }} className="w-full py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"><Eye size={14} /> Voir détails</button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal détails */}
            {showModal && selectedArticle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold">{selectedArticle.designation}</h2><button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✖️</button></div>
                        {selectedArticle.image_url && <img src={selectedArticle.image_url} alt={selectedArticle.designation} className="w-full h-32 object-contain mb-4 rounded-lg" />}
                        <div className="space-y-2 text-sm">
                            <p><strong>Code barre:</strong> {selectedArticle.code_barre}</p>
                            <p><strong>Catégorie:</strong> {selectedArticle.categorie?.nom_categorie || '-'}</p>
                            <p><strong>Stock actuel:</strong> <span className="font-bold">{selectedArticle.quantite_stock} {selectedArticle.unite_mesure}</span></p>
                            <p><strong>Seuil alerte:</strong> {selectedArticle.seuil_alerte}</p>
                            <p><strong>Emplacement:</strong> {selectedArticle.emplacement || 'Non défini'}</p>
                            <p><strong>Description:</strong> {selectedArticle.description || '-'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}