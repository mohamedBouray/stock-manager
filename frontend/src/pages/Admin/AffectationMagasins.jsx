import React, { useState, useEffect } from 'react';
import { User, Building2, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

export default function AffectationMagasins() {
    const [magasiniers, setMagasiniers] = useState([]);
    const [magasins, setMagasins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedMagasin, setSelectedMagasin] = useState({});
    const [savedItems, setSavedItems] = useState({});
    
    //  ActionConfirmModal state
    const [actionModal, setActionModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        confirmText: 'Confirmer',
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
                onConfirm();
                setActionModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const usersResponse = await api.get('/api/admin/users?role=magasinier');
            const magasiniersData = usersResponse.data.data || [];
            setMagasiniers(magasiniersData);
            
            const initialSelected = {};
            const initialSaved = {};
            magasiniersData.forEach(m => {
                initialSelected[m.id] = m.magasin_id || '';
                initialSaved[m.id] = m.magasin_id || '';
            });
            setSelectedMagasin(initialSelected);
            setSavedItems(initialSaved);
            
            const magasinsResponse = await api.get('/api/admin/catalogue-structure');
            setMagasins(magasinsResponse.data.magasins || []);
        } catch (error) {
            console.error(error);
            openConfirmModal('danger', 'Erreur', '❌ Erreur lors du chargement des données', 'OK', () => {});
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

    const hasChanges = (userId) => {
        return selectedMagasin[userId] !== savedItems[userId];
    };

    const handleSave = async (userId) => {
        setSaving(true);
        try {
            await api.put(`/api/admin/users/${userId}`, {
                magasin_id: selectedMagasin[userId] || null
            });
            setSavedItems(prev => ({
                ...prev,
                [userId]: selectedMagasin[userId]
            }));
            openConfirmModal('success', 'Succès', ' Affectation mise à jour avec succès', 'OK', () => {});
        } catch (error) {
            console.error(error);
            openConfirmModal('danger', 'Erreur', 'Erreur lors de la mise à jour', 'OK', () => {});
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAll = async () => {
        const changesCount = magasiniers.filter(m => hasChanges(m.id)).length;
        if (changesCount === 0) {
            openConfirmModal('info', 'Information', 'Aucune modification à enregistrer', 'OK', () => {});
            return;
        }
        
        openConfirmModal(
            'warning',
            'Confirmation',
            `Vous allez enregistrer ${changesCount} modification(s). Êtes-vous sûr ?`,
            'Oui, enregistrer',
            async () => {
                setSaving(true);
                try {
                    const promises = magasiniers
                        .filter(m => hasChanges(m.id))
                        .map(m => api.put(`/api/admin/users/${m.id}`, {
                            magasin_id: selectedMagasin[m.id] || null
                        }));
                    
                    await Promise.all(promises);
                    
                    const newSaved = { ...savedItems };
                    magasiniers.forEach(m => {
                        if (hasChanges(m.id)) {
                            newSaved[m.id] = selectedMagasin[m.id];
                        }
                    });
                    setSavedItems(newSaved);
                    openConfirmModal('success', 'Succès', ' Toutes les affectations ont été mises à jour', 'OK', () => {});
                } catch (error) {
                    console.error(error);
                    openConfirmModal('danger', 'Erreur', 'Erreur lors de la mise à jour', 'OK', () => {});
                } finally {
                    setSaving(false);
                }
            }
        );
    };

    const getMagasinName = (magasinId) => {
        const magasin = magasins.find(m => m.id === parseInt(magasinId));
        return magasin ? magasin.nom_magasin : 'Non assigné';
    };

    const hasAnyChanges = () => {
        return magasiniers.some(m => hasChanges(m.id));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                    Affectation des magasiniers
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Assignez chaque magasinier à son magasin de responsabilité
                </p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Total magasiniers</p>
                            <p className="text-2xl font-bold text-gray-800">{magasiniers.length}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <User size={20} className="text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Magasins disponibles</p>
                            <p className="text-2xl font-bold text-gray-800">{magasins.length}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Building2 size={20} className="text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Assignés à un magasin</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {magasiniers.filter(m => savedItems[m.id] && savedItems[m.id] !== '').length}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle size={20} className="text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Barre d'actions */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
                    >
                        <RefreshCw size={14} className="text-gray-500" />
                        Actualiser
                    </button>
                </div>
                {hasAnyChanges() && (
                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
                    >
                        <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer tout'}
                    </button>
                )}
            </div>

            {/* Tableau des affectations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magasinier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magasin actuel</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nouveau magasin</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {magasiniers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                                            <User size={22} className="text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">Aucun magasinier trouvé</p>
                                    </td>
                                </tr>
                            ) : (
                                magasiniers.map((magasinier) => {
                                    const modified = hasChanges(magasinier.id);
                                    return (
                                        <tr key={magasinier.id} className={`hover:bg-gray-50 transition ${modified ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <span className="text-blue-700 font-medium text-sm">
                                                            {magasinier.name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="font-medium text-gray-800">{magasinier.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-500">{magasinier.email}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${savedItems[magasinier.id] ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {getMagasinName(savedItems[magasinier.id])}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={selectedMagasin[magasinier.id] || ''}
                                                    onChange={(e) => handleMagasinChange(magasinier.id, e.target.value)}
                                                    className={`p-2 border rounded-lg text-sm outline-none transition w-48
                                                        ${modified 
                                                            ? 'border-blue-400 ring-2 ring-blue-100 focus:border-blue-500' 
                                                            : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'}`}
                                                >
                                                    <option value="">-- Tous les magasins --</option>
                                                    {magasins.map(m => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.nom_magasin} {m.localisation ? `(${m.localisation})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    {selectedMagasin[magasinier.id] ? ' Limité à ce magasin' : ' Voit tous les magasins'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {modified ? (
                                                    <button
                                                        onClick={() => handleSave(magasinier.id)}
                                                        disabled={saving}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                                                        title="Enregistrer"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                ) : (
                                                    <div className="w-9 h-9" />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/*  ActionConfirmModal */}
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