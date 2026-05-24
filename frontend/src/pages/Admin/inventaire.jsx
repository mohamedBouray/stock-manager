import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, X, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function Inventaire() {
    const [inventaires, setInventaires] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedInventaire, setSelectedInventaire] = useState(null);
    const [formData, setFormData] = useState({
        magasin_id: '',
        date_debut: new Date().toISOString().split('T')[0],
        commentaire: ''
    });

    useEffect(() => {
        fetchInventaires();
        fetchMagasins();
    }, []);

    const fetchInventaires = async () => {
        try {
            const response = await api.get('/api/admin/inventaires');
            setInventaires(response.data || []);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/inventaires', formData);
            setShowModal(false);
            setFormData({ magasin_id: '', date_debut: new Date().toISOString().split('T')[0], commentaire: '' });
            fetchInventaires();
            alert('Inventaire créé avec succès');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur');
        }
    };

    // ✅ AJOUTER CETTE FONCTION - Démarrer un inventaire
    const handleDemarrer = async (id) => {
        if (!window.confirm('Démarrer cet inventaire ?')) return;
        try {
            await api.post(`/api/admin/inventaires/${id}/start`);
            alert('Inventaire démarré avec succès');
            fetchInventaires();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur lors du démarrage');
        }
    };

    // ✅ AJOUTER CETTE FONCTION - Finaliser un inventaire
    const handleFinaliser = async (id) => {
        if (!window.confirm('Finaliser cet inventaire ? Les écarts seront appliqués au stock.')) return;
        try {
            await api.post(`/api/admin/inventaires/${id}/finalize`);
            alert('Inventaire finalisé avec succès');
            fetchInventaires();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Erreur lors de la finalisation');
        }
    };

    // ✅ AJOUTER CETTE FONCTION - Voir les détails d'un inventaire
    const handleVoirDetails = async (id) => {
        try {
            const response = await api.get(`/api/admin/inventaires/${id}`);
            setSelectedInventaire(response.data);
            // Ouvrir un modal de détails (à implémenter)
            alert(`Inventaire ${response.data.numero_inventaire}\nStatut: ${response.data.statut}\nMagasin: ${response.data.magasin?.nom_magasin}\nLignes: ${response.data.lignes?.length || 0}`);
        } catch (error) {
            console.error(error);
            alert('Erreur lors du chargement des détails');
        }
    };

    const getStatutBadge = (statut) => {
        const config = {
            planifie: 'bg-blue-100 text-blue-700',
            en_cours: 'bg-yellow-100 text-yellow-700',
            finalise: 'bg-green-100 text-green-700',
            annule: 'bg-red-100 text-red-700'
        };
        const labels = {
            planifie: '📅 Planifié',
            en_cours: '⏳ En cours',
            finalise: '✅ Finalisé',
            annule: '❌ Annulé'
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
                    <h1 className="text-2xl font-bold text-gray-800">📋 Inventaire physique</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez les inventaires de stock</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                    <Plus size={16} /> Nouvel inventaire
                </button>
            </div>

            {/* Liste des inventaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventaires.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Aucun inventaire</div>
                ) : (
                    inventaires.map((inv) => (
                        <div key={inv.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-800">{inv.numero_inventaire}</h3>
                                    <p className="text-sm text-gray-500">Magasin: {inv.magasin?.nom_magasin}</p>
                                </div>
                                {getStatutBadge(inv.statut)}
                            </div>
                            <div className="space-y-2 text-sm">
                                <p><Clock size={14} className="inline mr-1" /> Début: {new Date(inv.date_debut).toLocaleDateString()}</p>
                                {inv.date_fin && <p>Fin: {new Date(inv.date_fin).toLocaleDateString()}</p>}
                                {inv.commentaire && <p className="text-gray-500">{inv.commentaire}</p>}
                            </div>
                            <div className="flex gap-2 mt-3">
                                {inv.statut === 'planifie' && (
                                    <button 
                                        onClick={() => handleDemarrer(inv.id)}
                                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                                    >
                                        ▶️ Démarrer
                                    </button>
                                )}
                                {inv.statut === 'en_cours' && (
                                    <>
                                        <button 
                                            onClick={() => handleVoirDetails(inv.id)}
                                            className="flex-1 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition"
                                        >
                                            👁️ Voir
                                        </button>
                                        <button 
                                            onClick={() => handleFinaliser(inv.id)}
                                            className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                                        >
                                            ✅ Finaliser
                                        </button>
                                    </>
                                )}
                                {inv.statut === 'finalise' && (
                                    <button 
                                        onClick={() => handleVoirDetails(inv.id)}
                                        className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition"
                                    >
                                        📄 Voir rapport
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal création */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Nouvel inventaire</h2>
                            <button onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Magasin</label>
                                <select className="w-full p-2 border rounded-lg" value={formData.magasin_id} onChange={(e) => setFormData({ ...formData, magasin_id: e.target.value })} required>
                                    <option value="">Sélectionner</option>
                                    {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Date début</label>
                                <input type="date" className="w-full p-2 border rounded-lg" value={formData.date_debut} onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Commentaire</label>
                                <textarea className="w-full p-2 border rounded-lg" rows="2" value={formData.commentaire} onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
                                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg">Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}