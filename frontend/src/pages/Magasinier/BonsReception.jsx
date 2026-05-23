// src/pages/Magasinier/BonsReception.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Eye } from 'lucide-react';
import api from '../../lib/apis/axios';
import { genererPDF } from '../../lib/utils/pdfUtils';

export default function BonsReception() {
    const [bons, setBons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchBons();
    }, []);
    
    const fetchBons = async () => {
        try {
            const response = await api.get('/api/magasinier/bons-reception');
            
            // 🔥 CORRECTION : Extraire correctement les données
            let bonsData = [];
            if (response.data?.data?.data) {
                bonsData = response.data.data.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                bonsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                bonsData = response.data;
            } else if (response.data?.data && typeof response.data.data === 'object') {
                bonsData = Object.values(response.data.data);
            }
            
            setBons(bonsData);
        } catch (error) {
            console.error(error);
            setBons([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (bon) => {
        const lignesFormatees = bon.lignes?.map(l => ({
            code_barre: l.article?.code_barre || '---',
            designation: l.article?.designation || 'Article',
            unite: l.article?.unite_mesure || 'Pièce',
            quantite_recue: l.quantite_recue
        })) || [];
        genererPDF('BON DE RECEPTION', bon.numero_bon, bon.date_reception, lignesFormatees, 'BR');
    };

    const filteredBons = bons.filter(b => b.numero_bon?.toLowerCase().includes(search.toLowerCase()));

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">📄 Bons de réception</h1>
                <p className="text-sm text-gray-500 mt-1">Consultez et téléchargez les bons de réception</p>
            </div>

            <div className="mb-4 max-w-xs relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Rechercher un bon..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredBons.length === 0 ? (
                    <div className="p-12 text-center"><FileText size={48} className="mx-auto text-gray-400 mb-3" /><p className="text-gray-500">Aucun bon de réception</p></div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">N° Bon</th><th className="px-6 py-3 text-left">Commande</th><th className="px-6 py-3 text-center">Date</th><th className="px-6 py-3 text-center">Lignes</th><th className="px-6 py-3 text-center">Actions</th></tr></thead>
                        <tbody className="divide-y">
                            {filteredBons.map((bon) => (
                                <tr key={bon.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono font-bold">{bon.numero_bon}</td>
                                    <td className="px-6 py-4">{bon.commande?.numero_commande}</td>
                                    <td className="px-6 py-4 text-center">{new Date(bon.date_reception).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-center">{bon.lignes?.length || 0}</td>
                                    <td className="px-6 py-4 text-center"><button onClick={() => handleDownload(bon)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded" title="Télécharger"><Download size={18} /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}