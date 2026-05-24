// src/pages/Magasinier/BonsReception.jsx (Version améliorée)
import React, { useState, useEffect } from 'react';
// En haut du fichier
import { FileText, Search, Download, Eye, Calendar, Filter, Printer, Package, Building2 } from 'lucide-react';
import api from '../../lib/apis/axios';
import { genererPDF } from '../../lib/utils/pdfUtils';

export default function BonsReception() {
    const [bons, setBons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [selectedBon, setSelectedBon] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchBons();
    }, [dateDebut, dateFin]);

const fetchBons = async () => {
    setLoading(true);
    try {
        const response = await api.get('/api/magasinier/bons-reception');
        
        console.log('Réponse complète:', response);
        console.log('response.data:', response.data);
        
        // 🔥 CORRECTION: Prendre response.data.data directement
        let bonsData = [];
        if (response.data?.data && Array.isArray(response.data.data)) {
            bonsData = response.data.data;
        } else if (response.data?.data && response.data.data.data) {
            // Cas pagination
            bonsData = response.data.data.data;
        } else if (Array.isArray(response.data)) {
            bonsData = response.data;
        }
        
        console.log('Bons data extraits:', bonsData);
        setBons(bonsData);
    } catch (error) {
        console.error('Erreur fetch:', error);
        setBons([]);
    } finally {
        setLoading(false);
    }
};

    const handleViewDetails = async (bon) => {
        try {
            const response = await api.get(`/api/magasinier/bons-reception/${bon.id}`);
            setSelectedBon(response.data.data || response.data);
            setShowDetailModal(true);
        } catch (error) {
            console.error(error);
            alert('Erreur lors du chargement des détails');
        }
    };

    const handleDownload = (bon) => {
        const lignesFormatees = bon.lignes?.map(l => ({
            code_barre: l.article?.code_barre || '---',
            designation: l.article?.designation || 'Article',
            unite: l.article?.unite_mesure || 'Pièce',
            quantite_recue: l.quantite_recue
        })) || [];
        
        genererPDF('BON DE RÉCEPTION', bon.numero_bon, bon.date_reception, lignesFormatees, 'BR');
    };

    const filteredBons = bons.filter(b => 
        b.numero_bon?.toLowerCase().includes(search.toLowerCase()) ||
        b.commande_fournisseur?.fournisseur?.toLowerCase().includes(search.toLowerCase()) ||
        b.commande_fournisseur?.numero_commande?.toLowerCase().includes(search.toLowerCase())
    );

    // Stats
    const totalBons = bons.length;
    const totalArticlesRecus = bons.reduce((sum, bon) => {
        return sum + (bon.lignes?.reduce((s, l) => s + (l.quantite_recue || 0), 0) || 0);
    }, 0);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* En-tête avec stats */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">📄 Bons de réception</h1>
                <p className="text-sm text-gray-500 mt-0.5">Consultez et gérez les bons de réception des commandes fournisseurs</p>
            </div>

            {/* Cartes stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Bons</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{totalBons}</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <FileText size={20} className="text-emerald-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Articles réçus</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{totalArticlesRecus}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Package size={20} className="text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fournisseurs</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {[...new Set(bons.map(b => b.commande_fournisseur?.fournisseur).filter(Boolean))].length}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Building2 size={20} className="text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-600">Période:</span>
                    </div>
                    <input 
                        type="date" 
                        value={dateDebut}
                        onChange={(e) => setDateDebut(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-gray-400">→</span>
                    <input 
                        type="date" 
                        value={dateFin}
                        onChange={(e) => setDateFin(e.target.value)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {(dateDebut || dateFin) && (
                        <button 
                            onClick={() => { setDateDebut(''); setDateFin(''); }}
                            className="text-xs text-red-500 hover:underline"
                        >
                            Effacer
                        </button>
                    )}
                    <div className="flex-1 max-w-xs relative ml-auto">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Rechercher bon ou fournisseur..." 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">N° Bon</th>
                                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Commande</th>
                                <th className="px-6 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fournisseur</th>
                                <th className="px-6 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date réception</th>
                                <th className="px-6 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Lignes</th>
                                <th className="px-6 py-3 text-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredBons.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-14 text-center">
                                        <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm text-gray-500 font-medium">Aucun bon de réception trouvé</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBons.map((bon) => (
                                    <tr key={bon.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-sm text-gray-800">{bon.numero_bon}</span>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {bon.commande_fournisseur?.numero_commande || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {bon.commande_fournisseur?.fournisseur || '—'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                                            {new Date(bon.date_reception).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {bon.lignes?.length || 0} articles
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleViewDetails(bon)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                    title="Voir détails"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDownload(bon)}
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                                    title="Télécharger PDF"
                                                >
                                                    <Download size={16} />
                                                </button>
                                                <button 
                                                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition"
                                                    title="Imprimer"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Détails */}
            {showDetailModal && selectedBon && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={18} className="text-emerald-600" />
                                Détails du bon
                            </h2>
                            <button onClick={() => setShowDetailModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                ✖️
                            </button>
                        </div>
                        <div className="p-6">
                            {/* Infos bon */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">N° Bon</p>
                                        <p className="font-mono font-bold text-gray-800">{selectedBon.numero_bon}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Date réception</p>
                                        <p className="text-gray-800">{new Date(selectedBon.date_reception).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Commande N°</p>
                                        <p className="text-gray-800">{selectedBon.commande_fournisseur?.numero_commande || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Fournisseur</p>
                                        <p className="font-semibold text-gray-800">{selectedBon.commande_fournisseur?.fournisseur || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tableau articles */}
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Articles réçus</h3>
                            <table className="w-full">
                                <thead className="bg-gray-50 rounded-lg">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500">Code barre</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500">Désignation</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500">Quantité</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedBon.lignes?.map((ligne, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-2 text-xs font-mono text-gray-500">{ligne.article?.code_barre || '—'}</td>
                                            <td className="px-3 py-2 text-sm text-gray-700">{ligne.article?.designation || '—'}</td>
                                            <td className="px-3 py-2 text-center text-sm font-semibold text-emerald-600">{ligne.quantite_recue}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Boutons */}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button onClick={() => setShowDetailModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                                    Fermer
                                </button>
                                <button onClick={() => handleDownload(selectedBon)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                                    <Download size={14} /> Télécharger PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}