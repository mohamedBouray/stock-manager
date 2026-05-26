import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, X, Clock, CheckCircle, Eye, Play } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

function StatusBadge({ statut }) {
  const map = {
    planifie: { label: 'Planifié',  cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    en_cours: { label: 'En cours',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    finalise: { label: 'Finalisé',  cls: 'bg-green-50 text-green-700 border border-green-200' },
    annule:   { label: 'Annulé',    cls: 'bg-red-50 text-red-600 border border-red-200' },
  };
  const cfg = map[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

export default function AdminInventaire() {
  const [inventaires, setInventaires] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    magasin_id: '',
    date_debut: new Date().toISOString().split('T')[0],
    commentaire: '',
  });

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', confirmText: 'Confirmer', onConfirm: () => {},
  });
  const openConfirm = (cfg) => setConfirmModal({ ...confirmModal, isOpen: true, ...cfg });
  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => { fetchInventaires(); fetchMagasins(); }, []);

  const fetchInventaires = async () => {
    try {
      const response = await api.get('/api/admin/inventaires');
      setInventaires(response.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchMagasins = async () => {
    try {
      const response = await api.get('/api/admin/catalogue-structure');
      setMagasins(response.data.magasins || []);
    } catch (error) { console.error(error); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/inventaires', formData);
      setShowModal(false);
      setFormData({ magasin_id: '', date_debut: new Date().toISOString().split('T')[0], commentaire: '' });
      fetchInventaires();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
  };

  const handleDemarrer = (inv) => {
    openConfirm({
      type: 'info',
      title: 'Démarrer l\'inventaire',
      message: `Démarrer l'inventaire ${inv.numero_inventaire} pour le magasin "${inv.magasin?.nom_magasin}" ?`,
      confirmText: 'Oui, démarrer',
      onConfirm: async () => {
        try {
          await api.post(`/api/admin/inventaires/${inv.id}/start`);
          fetchInventaires();
        } catch (error) { alert(error.response?.data?.message || 'Erreur lors du démarrage'); }
      },
    });
  };

  const handleFinaliser = (inv) => {
    openConfirm({
      type: 'warning',
      title: 'Finaliser l\'inventaire',
      message: `Finaliser l'inventaire ${inv.numero_inventaire} ? Les écarts seront définitivement appliqués au stock. Cette action est irréversible.`,
      confirmText: 'Oui, finaliser',
      onConfirm: async () => {
        try {
          await api.post(`/api/admin/inventaires/${inv.id}/finalize`);
          fetchInventaires();
        } catch (error) { alert(error.response?.data?.message || 'Erreur lors de la finalisation'); }
      },
    });
  };

  const handleVoirDetails = async (id) => {
    try {
      const response = await api.get(`/api/admin/inventaires/${id}`);
      const inv = response.data;
      alert(`Inventaire ${inv.numero_inventaire}\nStatut: ${inv.statut}\nMagasin: ${inv.magasin?.nom_magasin}\nLignes: ${inv.lignes?.length || 0}`);
    } catch (error) { alert('Erreur lors du chargement des détails'); }
  };

  const counts = {
    planifie: inventaires.filter(i => i.statut === 'planifie').length,
    en_cours: inventaires.filter(i => i.statut === 'en_cours').length,
    finalise: inventaires.filter(i => i.statut === 'finalise').length,
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelCls = 'block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5';

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 ">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <span>Admin</span><span className="mx-1">›</span>
            <span className="text-gray-600 font-medium">Inventaire physique</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Inventaire physique</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les inventaires de stock</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm flex-shrink-0"
        >
          <Plus size={15} /> Nouvel inventaire
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Planifiés',  value: counts.planifie, accent: '#2563eb', bg: '#eff6ff' },
          { label: 'En cours',   value: counts.en_cours, accent: '#f59e0b', bg: '#fffbeb' },
          { label: 'Finalisés',  value: counts.finalise, accent: '#10b981', bg: '#f0fdf4' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-2xl font-bold" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grille inventaires */}
      {inventaires.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={26} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600">Aucun inventaire</p>
          <button onClick={() => setShowModal(true)} className="mt-3 text-xs text-blue-600 hover:underline font-medium">
            + Créer le premier inventaire
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inventaires.map(inv => {
            const accentMap = { planifie: '#2563eb', en_cours: '#f59e0b', finalise: '#10b981', annule: '#ef4444' };
            const accent = accentMap[inv.statut] || '#9ca3af';
            return (
              <div key={inv.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="h-1 w-full" style={{ backgroundColor: accent }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 pr-3">
                      <p className="text-sm font-bold text-gray-800 font-mono">{inv.numero_inventaire}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{inv.magasin?.nom_magasin}</p>
                    </div>
                    <StatusBadge statut={inv.statut} />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center gap-1"><Clock size={11} /> Début</span>
                      <span className="font-semibold text-gray-700">{new Date(inv.date_debut).toLocaleDateString('fr-FR')}</span>
                    </div>
                    {inv.date_fin && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Fin</span>
                        <span className="font-semibold text-gray-700">{new Date(inv.date_fin).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                    {inv.commentaire && (
                      <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-100">{inv.commentaire}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {inv.statut === 'planifie' && (
                      <button
                        onClick={() => handleDemarrer(inv)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
                      >
                        <Play size={12} /> Démarrer
                      </button>
                    )}
                    {inv.statut === 'en_cours' && (
                      <>
                        <button
                          onClick={() => handleVoirDetails(inv.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                        >
                          <Eye size={12} /> Voir
                        </button>
                        <button
                          onClick={() => handleFinaliser(inv)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition"
                        >
                          <CheckCircle size={12} /> Finaliser
                        </button>
                      </>
                    )}
                    {inv.statut === 'finalise' && (
                      <button
                        onClick={() => handleVoirDetails(inv.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition"
                      >
                        <Eye size={12} /> Voir rapport
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Nouvel inventaire</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Magasin <span className="text-red-500">*</span></label>
                <select className={inputCls} value={formData.magasin_id} onChange={e => setFormData({ ...formData, magasin_id: e.target.value })} required>
                  <option value="">Sélectionner un magasin</option>
                  {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Date de début <span className="text-red-500">*</span></label>
                <input type="date" className={inputCls} value={formData.date_debut} onChange={e => setFormData({ ...formData, date_debut: e.target.value })} required />
              </div>
              <div>
                <label className={labelCls}>Commentaire <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
                <textarea className={`${inputCls} resize-none`} rows="2" value={formData.commentaire} onChange={e => setFormData({ ...formData, commentaire: e.target.value })} placeholder="Notes sur cet inventaire..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ActionConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText="Annuler"
      />
    </div>
  );
}