// src/pages/Admin/Stocks.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Package, AlertTriangle, TrendingUp, TrendingDown, Edit, X, CheckCircle } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function Stocks() {
    const [stocks, setStocks] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [alertes, setAlertes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMagasin, setSelectedMagasin] = useState('');
    const [search, setSearch] = useState('');
    const [showAjustement, setShowAjustement] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [nouvelleQuantite, setNouvelleQuantite] = useState('');
    const [motifAjustement, setMotifAjustement] = useState('');

    useEffect(() => {
        fetchStocks();
        fetchMagasins();
        fetchAlertes();
    }, [selectedMagasin]);

    const fetchStocks = async () => {
        try {
            const params = selectedMagasin ? { magasin_id: selectedMagasin } : {};
            const response = await api.get('/api/admin/stocks', { params });
            setStocks(response.data.stocks?.data || response.data.stocks || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
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

    const fetchAlertes = async () => {
        try {
            const response = await api.get('/api/admin/suivi-alertes');
            setAlertes(response.data.alertes || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAjustement = async () => {
        if (!motifAjustement.trim()) {
            alert('Veuillez saisir un motif pour cet ajustement');
            return;
        }
        
        try {
            await api.put(`/api/admin/stocks/${selectedStock.id}`, {
                quantite_disponible: nouvelleQuantite,
                motif: motifAjustement
            });
            setShowAjustement(false);
            setSelectedStock(null);
            setNouvelleQuantite('');
            setMotifAjustement('');
            fetchStocks();
            fetchAlertes();
            alert('Stock ajusté avec succès');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur lors de l\'ajustement');
        }
    };

    const handleEntreeRapide = async (stock) => {
        const quantite = prompt(`Entrez la quantité à ajouter pour ${stock.article?.designation}:`, '1');
        if (quantite && parseInt(quantite) > 0) {
            try {
                await api.post('/api/admin/stocks/entree', {
                    article_id: stock.article_id,
                    magasin_id: stock.magasin_id,
                    quantite: parseInt(quantite),
                    motif: 'Entrée rapide depuis interface stocks'
                });
                fetchStocks();
                fetchAlertes();
                alert(`✅ ${quantite} unité(s) ajoutée(s) au stock`);
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur');
            }
        }
    };

    const handleSortieRapide = async (stock) => {
        const quantite = prompt(`Entrez la quantité à retirer pour ${stock.article?.designation}:`, '1');
        if (quantite && parseInt(quantite) > 0) {
            if (parseInt(quantite) > stock.quantite_disponible) {
                alert(`Stock insuffisant! Disponible: ${stock.quantite_disponible}`);
                return;
            }
            try {
                await api.post('/api/admin/stocks/sortie', {
                    article_id: stock.article_id,
                    magasin_id: stock.magasin_id,
                    quantite: parseInt(quantite),
                    motif: 'Sortie rapide depuis interface stocks'
                });
                fetchStocks();
                fetchAlertes();
                alert(`✅ ${quantite} unité(s) retirée(s) du stock`);
            } catch (error) {
                alert(error.response?.data?.message || 'Erreur');
            }
        }
    };

    const filteredStocks = stocks.filter(s =>
        search === '' ||
        s.article?.designation?.toLowerCase().includes(search.toLowerCase()) ||
        s.article?.code_barre?.includes(search)
    );

    // Statistiques
    const totalQuantite = stocks.reduce((sum, s) => sum + s.quantite_disponible, 0);
    const totalArticles = stocks.length;
    const alertesCount = alertes.length;

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
                <h1 className="text-2xl font-bold text-gray-800">📦 Gestion des stocks</h1>
                <p className="text-sm text-gray-500 mt-1">Consultez et ajustez les stocks par magasin</p>
            </div>

            {/* Cartes statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total articles</p>
                            <p className="text-2xl font-bold text-gray-800">{totalArticles}</p>
                        </div>
                        <div className="bg-blue-500 p-3 rounded-xl">
                            <Package size={20} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Quantité totale</p>
                            <p className="text-2xl font-bold text-gray-800">{totalQuantite}</p>
                        </div>
                        <div className="bg-green-500 p-3 rounded-xl">
                            <TrendingUp size={20} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Alertes stock</p>
                            <p className="text-2xl font-bold text-orange-600">{alertesCount}</p>
                        </div>
                        <div className="bg-orange-500 p-3 rounded-xl">
                            <AlertTriangle size={20} className="text-white" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Magasins</p>
                            <p className="text-2xl font-bold text-gray-800">{magasins.length}</p>
                        </div>
                        <div className="bg-purple-500 p-3 rounded-xl">
                            <Filter size={20} className="text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alertes */}
            {alertesCount > 0 && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="text-orange-600" size={18} />
                        <h3 className="font-semibold text-orange-800">⚠️ Alertes stock bas</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {alertes.slice(0, 6).map(alerte => (
                            <div key={alerte.id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                                <span className="font-medium text-sm">{alerte.article?.designation}</span>
                                <span className="text-red-600 font-bold text-sm">{alerte.quantite_disponible} / {alerte.article?.seuil_alerte}</span>
                            </div>
                        ))}
                        {alertesCount > 6 && (
                            <div className="p-2 text-center text-orange-600 text-sm">+{alertesCount - 6} autres alertes</div>
                        )}
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="flex-1 max-w-xs relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un article..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                </div>
                <select
                    value={selectedMagasin}
                    onChange={(e) => setSelectedMagasin(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                    <option value="">Tous les magasins</option>
                    {magasins.map(m => (
                        <option key={m.id} value={m.id}>{m.nom_magasin}</option>
                    ))}
                </select>
                <button
                    onClick={() => { setSelectedMagasin(''); setSearch(''); }}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 cursor-pointer"
                >
                    Réinitialiser
                </button>
            </div>

            {/* Tableau des stocks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Code Barre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Article</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Magasin</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Quantité</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Seuil alerte</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Statut</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Actions rapides</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Ajuster</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStocks.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        Aucun stock trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredStocks.map((stock) => {
                                    const estAlerte = stock.quantite_disponible <= (stock.article?.seuil_alerte || 0);
                                    return (
                                        <tr key={stock.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-mono text-sm">{stock.article?.code_barre || '-'}</td>
                                            <td className="px-6 py-4 font-medium">{stock.article?.designation || '-'}</td>
                                            <td className="px-6 py-4">{stock.magasin?.nom_magasin || '-'}</td>
                                            <td className="px-6 py-4 text-center font-bold">{stock.quantite_disponible}</td>
                                            <td className="px-6 py-4 text-center">{stock.article?.seuil_alerte || '-'}</td>
                                            <td className="px-6 py-4 text-center">
                                                {estAlerte ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">⚠️ Stock bas</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">✓ Normal</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleEntreeRapide(stock)}
                                                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition cursor-pointer"
                                                        title="Ajouter au stock"
                                                    >
                                                        + Entrée
                                                    </button>
                                                    <button
                                                        onClick={() => handleSortieRapide(stock)}
                                                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition cursor-pointer"
                                                        title="Retirer du stock"
                                                    >
                                                        - Sortie
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStock(stock);
                                                        setNouvelleQuantite(stock.quantite_disponible);
                                                        setMotifAjustement('');
                                                        setShowAjustement(true);
                                                    }}
                                                    className="p-1 text-blue-500 hover:bg-blue-50 rounded cursor-pointer"
                                                    title="Ajuster"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal ajustement */}
            {showAjustement && selectedStock && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Ajuster le stock</h2>
                            <button onClick={() => setShowAjustement(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p><strong>Article:</strong> {selectedStock.article?.designation}</p>
                                <p><strong>Magasin:</strong> {selectedStock.magasin?.nom_magasin}</p>
                                <p><strong>Stock actuel:</strong> <span className="font-bold">{selectedStock.quantite_disponible}</span></p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nouvelle quantité</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full p-2 border rounded-lg"
                                    value={nouvelleQuantite}
                                    onChange={(e) => setNouvelleQuantite(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Motif de l'ajustement *</label>
                                <textarea
                                    className="w-full p-2 border rounded-lg"
                                    rows="2"
                                    value={motifAjustement}
                                    onChange={(e) => setMotifAjustement(e.target.value)}
                                    placeholder="Ex: Inventaire physique, Correction d'erreur, etc."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowAjustement(false)} className="flex-1 py-2 border rounded-lg cursor-pointer">
                                    Annuler
                                </button>
                                <button onClick={handleAjustement} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700">
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}