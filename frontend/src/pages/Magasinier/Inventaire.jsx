// src/pages/Magasinier/Inventaire.jsx
import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, CheckCircle, X, Save } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function MagasinierInventaire() {
    const [inventaireActuel, setInventaireActuel] = useState(null);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantitesSaisies, setQuantitesSaisies] = useState({});

    useEffect(() => {
        fetchInventaireActuel();
    }, []);

    const fetchInventaireActuel = async () => {
        try {
            const response = await api.get('/api/magasinier/inventaire/actuel');
            setInventaireActuel(response.data);
            if (response.data?.lignes) {
                const initialQuantites = {};
                response.data.lignes.forEach(ligne => {
                    initialQuantites[ligne.article_id] = ligne.quantite_reelle || ligne.quantite_theorique;
                });
                setQuantitesSaisies(initialQuantites);
                setArticles(response.data.lignes.map(l => l.article));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantiteChange = (articleId, value) => {
        setQuantitesSaisies({ ...quantitesSaisies, [articleId]: parseInt(value) || 0 });
    };

    const handleSave = async () => {
    if (!inventaireActuel?.id) {
        alert('Aucun inventaire en cours. Veuillez contacter l\'administrateur.');
        return;
    }
    
    try {
        const lignes = Object.entries(quantitesSaisies).map(([articleId, quantite]) => ({
            article_id: articleId,
            quantite_reelle: quantite
        }));
        await api.post(`/api/magasinier/inventaire/${inventaireActuel.id}/save`, { lignes });
        alert('Inventaire sauvegardé');
        fetchInventaireActuel();
    } catch (error) {
        alert(error.response?.data?.message || 'Erreur');
    }
};

const handleFinaliser = async () => {
    if (!inventaireActuel?.id) {
        alert('Aucun inventaire en cours');
        return;
    }
    
    if (window.confirm('Finaliser cet inventaire ? Les écarts seront appliqués au stock.')) {
        try {
            await api.post(`/api/magasinier/inventaire/${inventaireActuel.id}/finaliser`);
            alert('Inventaire finalisé');
            fetchInventaireActuel();
        } catch (error) {
            alert(error.response?.data?.message || 'Erreur');
        }
    }
};

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    if (!inventaireActuel) {
        return (
            <div className="p-6 text-center">
                <ClipboardList size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">Aucun inventaire en cours</p>
                <p className="text-sm text-gray-400 mt-1">Attendez qu'un administrateur crée un inventaire</p>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">📋 Inventaire physique</h1>
                    <p className="text-sm text-gray-500 mt-1">{inventaireActuel.numero_inventaire} - {inventaireActuel.magasin?.nom_magasin}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSave} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                        <Save size={16} /> Sauvegarder
                    </button>
                    <button onClick={handleFinaliser} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
                        <CheckCircle size={16} /> Finaliser
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left">Article</th>
                            <th className="px-6 py-3 text-center">Code barre</th>
                            <th className="px-6 py-3 text-center">Stock théorique</th>
                            <th className="px-6 py-3 text-center">Stock réel</th>
                            <th className="px-6 py-3 text-center">Écart</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {articles.map((article) => {
                            const quantiteTheorique = article?.pivot?.quantite_theorique || 0;
                            const quantiteReelle = quantitesSaisies[article.id] || 0;
                            const ecart = quantiteReelle - quantiteTheorique;
                            return (
                                <tr key={article.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium">{article.designation}</td>
                                    <td className="px-6 py-4 text-center font-mono text-sm">{article.code_barre}</td>
                                    <td className="px-6 py-4 text-center font-bold">{quantiteTheorique}</td>
                                    <td className="px-6 py-4 text-center">
                                        <input type="number" min="0" className="w-24 p-2 border rounded-lg text-center" value={quantiteReelle} onChange={(e) => handleQuantiteChange(article.id, e.target.value)} />
                                    </td>
                                    <td className={`px-6 py-4 text-center font-bold ${ecart !== 0 ? (ecart > 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}`}>
                                        {ecart !== 0 ? (ecart > 0 ? `+${ecart}` : ecart) : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}