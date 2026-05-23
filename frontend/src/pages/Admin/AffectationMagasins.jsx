// src/pages/Admin/AffectationMagasins.jsx
import React, { useState, useEffect } from 'react';
import { User, Building2, Save, RefreshCw } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function AffectationMagasins() {
    const [magasiniers, setMagasiniers] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedMagasin, setSelectedMagasin] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Récupérer tous les magasiniers
            const usersResponse = await api.get('/api/admin/users?role=magasinier');
            const magasiniersData = usersResponse.data.data || [];
            setMagasiniers(magasiniersData);
            
            // Initialiser les valeurs sélectionnées
            const initialSelected = {};
            magasiniersData.forEach(m => {
                initialSelected[m.id] = m.magasin_id || '';
            });
            setSelectedMagasin(initialSelected);
            
            // Récupérer tous les magasins
            const magasinsResponse = await api.get('/api/admin/catalogue-structure');
            setMagasins(magasinsResponse.data.magasins || []);
        } catch (error) {
            console.error(error);
            alert('❌ Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleMagasinChange = (userId, magasinId) => {
        setSelectedMagasin(prev => ({
            ...prev,
            [userId]: magasinId
        }));
    };

    const handleSave = async (userId) => {
        setSaving(true);
        try {
            await api.put(`/api/admin/users/${userId}`, {
                magasin_id: selectedMagasin[userId] || null
            });
            alert('✅ Affectation mise à jour avec succès');
            fetchData(); // Rafraîchir
        } catch (error) {
            console.error(error);
            alert('❌ Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            const promises = magasiniers.map(m => 
                api.put(`/api/admin/users/${m.id}`, {
                    magasin_id: selectedMagasin[m.id] || null
                })
            );
            await Promise.all(promises);
            alert('✅ Toutes les affectations ont été mises à jour');
            fetchData();
        } catch (error) {
            console.error(error);
            alert('❌ Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const getMagasinName = (magasinId) => {
        const magasin = magasins.find(m => m.id === parseInt(magasinId));
        return magasin ? magasin.nom_magasin : 'Aucun magasin';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* En-tête */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Building2 size={24} className="text-emerald-600" />
                        Affectation des magasiniers
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Assignez chaque magasinier à son magasin de responsabilité
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition flex items-center gap-1"
                    >
                        <RefreshCw size={14} /> Actualiser
                    </button>
                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer tout'}
                    </button>
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-400">Total magasiniers</p>
                    <p className="text-2xl font-bold text-gray-800">{magasiniers.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-400">Magasins disponibles</p>
                    <p className="text-2xl font-bold text-gray-800">{magasins.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-400">Assignés à un magasin</p>
                    <p className="text-2xl font-bold text-emerald-600">
                        {magasiniers.filter(m => selectedMagasin[m.id] && selectedMagasin[m.id] !== '').length}
                    </p>
                </div>
            </div>

            {/* Tableau des affectations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Magasinier</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Magasin actuel</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Nouveau magasin</th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {magasiniers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <User size={40} className="mx-auto text-gray-300 mb-2" />
                                        Aucun magasinier trouvé
                                    </td>
                                </tr>
                            ) : (
                                magasiniers.map((magasinier) => (
                                    <tr key={magasinier.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                    <span className="text-emerald-700 font-medium text-sm">
                                                        {magasinier.name?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-gray-800">{magasinier.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">{magasinier.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                                                {getMagasinName(magasinier.magasin_id) || 'Non assigné'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={selectedMagasin[magasinier.id] || ''}
                                                onChange={(e) => handleMagasinChange(magasinier.id, e.target.value)}
                                                className="p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none w-48"
                                            >
                                                <option value="">-- Tous les magasins --</option>
                                                {magasins.map(m => (
                                                    <option key={m.id} value={m.id}>
                                                        {m.nom_magasin} {m.localisation ? `(${m.localisation})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {selectedMagasin[magasinier.id] ? 'Limité à ce magasin' : 'Voit tous les magasins'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleSave(magasinier.id)}
                                                disabled={saving}
                                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                                                title="Enregistrer"
                                            >
                                                <Save size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Légende */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">📌 Informations</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>Non assigné</strong> : Le magasinier voit TOUS les magasins et TOUTES les demandes</li>
                    <li>• <strong>Assigné à un magasin</strong> : Le magasinier ne voit que SON magasin et les demandes liées</li>
                    <li>• L'Admin voit toujours tous les magasins (non affecté par cette règle)</li>
                </ul>
            </div>
        </div>
    );
}