// src/pages/User/Demandes.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Archive, FileText, MessageCircle } from 'lucide-react';
import api from '../../lib/apis/axios';
import MessageModal from '../../lib/components/MessageModal';

export default function Demandes() {
    const [demandes, setDemandes] = useState([]);
    const [articles, setArticles] = useState([]);
    const [archives, setArchives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDemande, setEditingDemande] = useState(null);
    const [formData, setFormData] = useState({ article_id: '', quantite_demandee: '', motif: '' });
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [messageModalOpen, setMessageModalOpen] = useState(false);
    const [selectedDemande, setSelectedDemande] = useState(null);

    useEffect(() => {
        fetchDemandes();
        fetchArticles();
        fetchArchives();
    }, []);



    const fetchDemandes = async () => {
        try {
            const response = await api.get('/api/user/demandes');
            let demandesData = [];
            
            if (response.data?.data?.data) {
                demandesData = response.data.data.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                demandesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                demandesData = response.data;
            }
            
            // Garder seulement les demandes NON archivées
            const demandesNonArchivees = demandesData.filter(d => d.is_archived !== 1);
            setDemandes(demandesNonArchivees);
        } catch (error) {
            console.error(error);
            setDemandes([]);
        } finally {
            setLoading(false);
        }
    };

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

    const fetchArchives = async () => {
        try {
            const response = await api.get('/api/user/demandes/archives/list');
            let archivesData = [];
            
            if (response.data?.data?.data) {
                archivesData = response.data.data.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                archivesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                archivesData = response.data;
            }
            
            // Garder seulement les demandes archivées
            const demandesArchivees = archivesData.filter(d => d.is_archived === 1);
            setArchives(demandesArchivees);
        } catch (error) {
            console.error(error);
            setArchives([]);
        }
    };

    const handleArchive = async (id) => {
    if (window.confirm('Archiver cette demande ?')) {
        try {
            console.log("🟢 Archivage demande ID:", id);
            
            // 1. Envoyer la requête d'archivage
            const response = await api.post(`/api/user/demandes/${id}/archive`);
            console.log("✅ Réponse API:", response.data);
            
            // 2. Recharger les demandes actives
            await fetchDemandes();
            console.log("📋 Demandes actives rechargées");
            
            // 3. Recharger les archives (même si on est sur l'onglet actif)
            await fetchArchives();
            console.log("📦 Archives rechargées");
            
            alert('Demande archivée avec succès');
        } catch (error) {
            console.error("❌ Erreur:", error);
            alert('Erreur lors de l\'archivage');
        }
    }
};

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingDemande) {
                await api.put(`/api/user/demandes/${editingDemande.id}`, formData);
            } else {
                await api.post('/api/user/demandes', formData);
            }
            setShowModal(false);
            setEditingDemande(null);
            setFormData({ article_id: '', quantite_demandee: '', motif: '' });
            await fetchDemandes();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Annuler cette demande ?')) {
            try {
                await api.delete(`/api/user/demandes/${id}`);
                await fetchDemandes();
            } catch (error) {
                console.error(error);
                alert('Erreur lors de l\'annulation');
            }
        }
    };

    const handleExportPDF = async (id) => {
        try {
            const response = await api.get(`/api/user/demandes/${id}/pdf`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `demande_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Erreur lors du téléchargement du PDF');
        }
    };

    const handleBonLivraison = async (id) => {
        try {
            const response = await api.get(`/api/user/demandes/${id}/bon-livraison`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bon_livraison_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Erreur lors du téléchargement du bon de livraison');
        }
    };

    const filteredDemandes = demandes.filter(d => {
        if (filter !== 'all' && d.statut !== filter) return false;
        if (search && !d.article?.designation?.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const getStatutBadge = (statut) => {
        const config = {
            en_attente: 'bg-yellow-100 text-yellow-800',
            approuvee: 'bg-green-100 text-green-800',
            refusee: 'bg-red-100 text-red-800',
            livree: 'bg-blue-100 text-blue-800'
        };
        const labels = {
            en_attente: 'En attente',
            approuvee: 'Approuvée',
            refusee: 'Refusée',
            livree: 'Livrée'
        };
        return <span className={`px-2 py-1 text-xs rounded-full ${config[statut]}`}>{labels[statut]}</span>;
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
                    <h1 className="text-2xl font-bold text-gray-800">📋 Mes demandes</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez vos demandes d'articles</p>
                </div>
                <button
                    onClick={() => { setEditingDemande(null); setFormData({ article_id: '', quantite_demandee: '', motif: '' }); setShowModal(true); }}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                    <Plus size={16} /> Nouvelle demande
                </button>
            </div>

            {/* Onglets */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => {
                        setActiveTab('active');
                        fetchDemandes();
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-all ${
                        activeTab === 'active'
                            ? 'border-b-2 border-emerald-600 text-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    📋 Demandes actives ({demandes.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab('archives');
                        fetchArchives();
                    }}
                    className={`px-4 py-2 text-sm font-medium transition-all ${
                        activeTab === 'archives'
                            ? 'border-b-2 border-emerald-600 text-emerald-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    📦 Archives ({archives.length})
                </button>
            </div>

            {activeTab === 'active' ? (
                <>
                    {/* Filtres */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Toutes</button>
                        <button onClick={() => setFilter('en_attente')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'en_attente' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>En attente</button>
                        <button onClick={() => setFilter('approuvee')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'approuvee' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Approuvées</button>
                        <button onClick={() => setFilter('refusee')} className={`px-3 py-1.5 text-sm rounded-lg transition ${filter === 'refusee' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Refusées</button>
                        <div className="flex-1 max-w-xs relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Rechercher..." 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm" 
                            />
                        </div>
                    </div>

                    {/* Tableau des demandes actives */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Article</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Quantité</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredDemandes.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                Aucune demande trouvée
                                             </td>
                                        </tr>
                                    ) : (
                                        filteredDemandes.map((demande) => (
                                            <tr key={demande.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-800">{demande.article?.designation || '-'}</p>
                                                    {demande.motif && <p className="text-xs text-gray-400 mt-1">{demande.motif}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{demande.quantite_demandee} {demande.article?.unite_mesure || 'pièce(s)'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(demande.created_at).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">{getStatutBadge(demande.statut)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {demande.statut === 'en_attente' && (
                                                            <>
                                                                <button 
                                                                    onClick={() => { setEditingDemande(demande); setFormData({ article_id: demande.article_id, quantite_demandee: demande.quantite_demandee, motif: demande.motif || '' }); setShowModal(true); }} 
                                                                    className="p-1 text-blue-500 hover:bg-blue-50 rounded" 
                                                                    title="Modifier"
                                                                >
                                                                    <Edit size={13} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(demande.id)} 
                                                                    className="p-1 text-red-500 hover:bg-red-50 rounded" 
                                                                    title="Annuler"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </>
                                                        )}
                                                        <button 
                                                            onClick={() => handleExportPDF(demande.id)} 
                                                            className="p-1 text-purple-500 hover:bg-purple-50 rounded" 
                                                            title="Télécharger PDF"
                                                        >
                                                            <FileText size={13} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { setSelectedDemande(demande); setMessageModalOpen(true); }} 
                                                            className="p-1 text-indigo-500 hover:bg-indigo-50 rounded" 
                                                            title="Message"
                                                        >
                                                            <MessageCircle size={13} />
                                                        </button>
                                                        {(demande.statut === 'approuvee' || demande.statut === 'refusee' || demande.statut === 'livree') && (
                                                            <button 
                                                                onClick={() => handleArchive(demande.id)} 
                                                                className="p-1 text-gray-500 hover:bg-gray-100 rounded" 
                                                                title="Archiver"
                                                            >
                                                                <Archive size={13} />
                                                            </button>
                                                        )}
                                                        {demande.statut === 'livree' && (
                                                            <button 
                                                                onClick={() => handleBonLivraison(demande.id)} 
                                                                className="p-1 text-emerald-500 hover:bg-emerald-50 rounded" 
                                                                title="Bon de livraison"
                                                            >
                                                                📄 Bon livraison
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                // Tableau des archives
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Article</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Quantité</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Archivée le</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {archives.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                            Aucune archive
                                         </td>
                                    </tr>
                                ) : (
                                    archives.map((demande) => (
                                        <tr key={demande.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-800">{demande.article?.designation || '-'}</p>
                                                {demande.motif && <p className="text-xs text-gray-400 mt-1">{demande.motif}</p>}
                                            </td>
                                            <td className="px-6 py-4">{demande.quantite_demandee} {demande.article?.unite_mesure}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(demande.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">{getStatutBadge(demande.statut)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {demande.archived_at ? new Date(demande.archived_at).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Nouvelle demande */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">{editingDemande ? 'Modifier la demande' : 'Nouvelle demande'}</h2>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Article</label>
                                <select 
                                    className="w-full p-2 border rounded-lg" 
                                    value={formData.article_id} 
                                    onChange={(e) => setFormData({ ...formData, article_id: e.target.value })} 
                                    required
                                >
                                    <option value="">Sélectionner un article</option>
                                    {articles.map(article => (
                                        <option key={article.id} value={article.id}>
                                            {article.designation} - Stock: {article.quantite_stock}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    className="w-full p-2 border rounded-lg" 
                                    value={formData.quantite_demandee} 
                                    onChange={(e) => setFormData({ ...formData, quantite_demandee: e.target.value })} 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif (optionnel)</label>
                                <textarea 
                                    className="w-full p-2 border rounded-lg" 
                                    rows="2" 
                                    value={formData.motif} 
                                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })} 
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
                                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg">Envoyer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Message Modal */}
            <MessageModal
                isOpen={messageModalOpen}
                onClose={() => setMessageModalOpen(false)}
                demandeId={selectedDemande?.id}
                demandeTitle={selectedDemande?.article?.designation}
            />
        </div>
    );
}