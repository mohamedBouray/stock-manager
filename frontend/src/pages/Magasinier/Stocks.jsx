// src/pages/Magasinier/Stocks.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axios';

export default function MagasinierStocks() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchStocks();
    }, []);

    const fetchStocks = async () => {
        try {
            // 🔥 Utiliser l'API admin existante
            const response = await api.get('/api/admin/stocks');
            setStocks(response.data.stocks?.data || response.data.stocks || []);
        } catch (error) {
            console.error(error);
            setStocks([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredStocks = stocks.filter(s => 
        s.article?.designation?.toLowerCase().includes(search.toLowerCase()) ||
        s.article?.code_barre?.includes(search)
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
            <h1 className="text-2xl font-bold text-gray-800 mb-4">📦 Consultation des stocks</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Rechercher un article..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-xs px-4 py-2 border rounded-lg"
                />
            </div>
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Article</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Magasin</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Quantité</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Seuil</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStocks.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        Aucun stock trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredStocks.map((stock) => (
                                    <tr key={stock.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-800">{stock.article?.designation}</td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-500">{stock.article?.code_barre}</td>
                                        <td className="px-6 py-4 text-center text-gray-600">{stock.magasin?.nom_magasin}</td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-800">{stock.quantite_disponible}</td>
                                        <td className="px-6 py-4 text-center text-gray-500">{stock.article?.seuil_alerte}</td>
                                        <td className="px-6 py-4 text-center">
                                            {stock.quantite_disponible <= (stock.article?.seuil_alerte || 0) ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                                                    ⚠️ Alerte
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                                    ✓ OK
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}