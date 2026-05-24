// src/pages/Admin/Stocks.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Package, AlertTriangle, TrendingUp, TrendingDown, Edit, X, CheckCircle } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

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

    // 🔥 ActionConfirmModal state
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
        fetchStocks();
        fetchMagasins();
        fetchAlertes();
    }, [selectedMagasin]);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const params = selectedMagasin ? { magasin_id: selectedMagasin } : {};
            const response = await api.get('/api/admin/stocks', { params });
            setStocks(response.data.stocks?.data || response.data.stocks || []);
        } catch (error) {
            console.error(error);
            openConfirmModal('danger', 'Erreur', 'Erreur lors du chargement des stocks', 'OK', null);
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
            // 🔥 CHANGER L'URL
            const response = await api.get('/api/admin/alertes');
            setAlertes(response.data.data || []);
        } catch (error) {
            console.error(error);
            setAlertes([]);
        }
    };
    const handleAjustement = async () => {
        if (!motifAjustement.trim()) {
            openConfirmModal('warning', 'Attention', 'Veuillez saisir un motif pour cet ajustement', 'OK', null);
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
            openConfirmModal('success', 'Succès', 'Stock ajusté avec succès', 'OK', null);
        } catch (error) {
            console.error(error);
            openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur lors de l\'ajustement', 'OK', null);
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
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div >
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                    Gestion des stocks
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Consultez et ajustez les stocks par magasin
                </p>
            </div>

            {/* Cartes statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Total articles</p>
                            <p className="text-2xl font-bold text-gray-800">{totalArticles}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Package size={20} className="text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Quantité totale</p>
                            <p className="text-2xl font-bold text-gray-800">{totalQuantite}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Alertes stock</p>
                            <p className="text-2xl font-bold text-orange-600">{alertesCount}</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <AlertTriangle size={20} className="text-orange-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Magasins</p>
                            <p className="text-2xl font-bold text-gray-800">{magasins.length}</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Filter size={20} className="text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alertes */}
            {alertesCount > 0 && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={18} className="text-orange-600" />
                        <h3 className="font-semibold text-orange-800 text-sm">Alertes stock bas</h3>
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
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                </div>
                <select
                    value={selectedMagasin}
                    onChange={(e) => setSelectedMagasin(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                    <option value="">Tous les magasins</option>
                    {magasins.map(m => (
                        <option key={m.id} value={m.id}>{m.nom_magasin}</option>
                    ))}
                </select>
                <button
                    onClick={() => { setSelectedMagasin(''); setSearch(''); }}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition cursor-pointer"
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
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code Barre</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magasin</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Seuil alerte</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ajuster</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStocks.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                                        <Package size={40} className="mx-auto text-gray-300 mb-2" />
                                        Aucun stock trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredStocks.map((stock) => {
                                    const estAlerte = stock.quantite_disponible <= (stock.article?.seuil_alerte || 0);
                                    return (
                                        <tr key={stock.id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 font-mono text-xs">{stock.article?.code_barre || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-medium text-gray-800">{stock.article?.designation || '-'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 text-sm">{stock.magasin?.nom_magasin || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${estAlerte ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {stock.quantite_disponible}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-500 text-sm">{stock.article?.seuil_alerte || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                {estAlerte ? (
                                                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                                                        Stock bas
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                                                        Normal
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedStock(stock);
                                                        setNouvelleQuantite(stock.quantite_disponible);
                                                        setMotifAjustement('');
                                                        setShowAjustement(true);
                                                    }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
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
                            <h2 className="text-lg font-semibold text-gray-800">Ajuster le stock</h2>
                            <button onClick={() => setShowAjustement(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm"><strong className="text-gray-700">Article:</strong> <span className="text-gray-600">{selectedStock.article?.designation}</span></p>
                                <p className="text-sm mt-1"><strong className="text-gray-700">Magasin:</strong> <span className="text-gray-600">{selectedStock.magasin?.nom_magasin}</span></p>
                                <p className="text-sm mt-1"><strong className="text-gray-700">Stock actuel:</strong> <span className="font-bold text-blue-600">{selectedStock.quantite_disponible}</span></p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nouvelle quantité</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    value={nouvelleQuantite}
                                    onChange={(e) => setNouvelleQuantite(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif de l'ajustement <span className="text-red-500">*</span></label>
                                <textarea
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                                    rows="2"
                                    value={motifAjustement}
                                    onChange={(e) => setMotifAjustement(e.target.value)}
                                    placeholder="Ex: Inventaire physique, Correction d'erreur, etc."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowAjustement(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer">
                                    Annuler
                                </button>
                                <button onClick={handleAjustement} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer">
                                    Enregistrer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ActionConfirmModal */}
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