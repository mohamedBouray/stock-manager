import React, { useState, useEffect } from 'react';
import { Undo2, Search, X, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

function StatusBadge({ statut }) {
  const map = {
    en_attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    approuve:   { label: 'Approuvé',   cls: 'bg-green-50 text-green-700 border border-green-200' },
    refuse:     { label: 'Refusé',     cls: 'bg-red-50 text-red-600 border border-red-200' },
  };
  const cfg = map[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

export default function MagasinierRetours() {
  const [retours, setRetours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showRefusModal, setShowRefusModal] = useState(false);
  const [selectedRetour, setSelectedRetour] = useState(null);
  const [motifRefus, setMotifRefus] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', confirmText: 'Confirmer', onConfirm: () => {},
  });
  const openConfirm = (cfg) => setConfirmModal({ ...confirmModal, isOpen: true, ...cfg });
  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => { fetchRetours(); }, []);

  const fetchRetours = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/magasinier/retours');
      setRetours(response.data.data || response.data || []);
    } catch { setRetours([]); }
    finally { setLoading(false); }
  };

  const handleApprouver = (retour) => {
    openConfirm({
      type: 'success',
      title: 'Approuver le retour',
      message: `Approuver le retour de ${retour.quantite} "${retour.article?.designation}" de ${retour.user?.name} et mettre à jour le stock ?`,
      confirmText: 'Oui, approuver',
      onConfirm: async () => {
        setActionLoading(true);
        try {
          await api.post(`/api/magasinier/retours/${retour.id}/approuver`);
          fetchRetours();
        } catch (error) { alert(error.response?.data?.message || 'Erreur lors de l\'approbation'); }
        finally { setActionLoading(false); }
      },
    });
  };

  const openRefusModal = (retour) => {
    setSelectedRetour(retour);
    setMotifRefus('');
    setShowRefusModal(true);
  };

  const handleRefuser = async () => {
    if (!motifRefus.trim()) { alert('Veuillez saisir un motif de refus'); return; }
    setActionLoading(true);
    try {
      await api.post(`/api/magasinier/retours/${selectedRetour.id}/refuser`, { motif_refus: motifRefus });
      setShowRefusModal(false);
      setSelectedRetour(null);
      fetchRetours();
    } catch (error) { alert(error.response?.data?.message || 'Erreur lors du refus'); }
    finally { setActionLoading(false); }
  };

  const filteredRetours = retours.filter(r => {
    if (filter !== 'all' && r.statut !== filter) return false;
    if (search && !r.article?.designation?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filterButtons = [
    { key: 'all',        label: 'Tous',        count: retours.length },
    { key: 'en_attente', label: 'En attente',  count: retours.filter(r => r.statut === 'en_attente').length },
    { key: 'approuve',   label: 'Approuvés',   count: retours.filter(r => r.statut === 'approuve').length },
    { key: 'refuse',     label: 'Refusés',     count: retours.filter(r => r.statut === 'refuse').length },
  ];

  const stats = [
    { label: 'En attente', value: retours.filter(r => r.statut === 'en_attente').length, accent: '#f59e0b', bg: '#fffbeb' },
    { label: 'Approuvés',  value: retours.filter(r => r.statut === 'approuve').length,   accent: '#10b981', bg: '#f0fdf4' },
    { label: 'Refusés',    value: retours.filter(r => r.statut === 'refuse').length,      accent: '#ef4444', bg: '#fef2f2' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 ">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <span>Magasinier</span><span className="mx-1">›</span>
            <span className="text-gray-600 font-medium">Retours magasin</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Retours magasin</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les demandes de retour des demandeurs</p>
        </div>
        <button
          onClick={fetchRetours}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
            <div className="mt-2 h-1 rounded-full bg-gray-100">
              <div className="h-1 rounded-full" style={{ backgroundColor: s.accent, width: '100%', opacity: 0.5 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filtres + recherche */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1 flex-wrap">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${filter === btn.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {btn.label}
              {btn.count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${filter === btn.key ? 'bg-blue-500' : 'bg-gray-100 text-gray-500'}`}>{btn.count}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Rechercher un article..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Demandeur', 'Article', 'Quantité', 'Motif', 'Statut', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRetours.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Undo2 size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Aucun retour trouvé</p>
                  </td>
                </tr>
              ) : filteredRetours.map(retour => (
                <tr key={retour.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{retour.user?.name || '—'}</p>
                    <p className="text-[11px] text-gray-400">{retour.user?.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">{retour.article?.designation || '—'}</td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-800">
                    {retour.quantite} <span className="text-xs font-normal text-gray-400">{retour.article?.unite_mesure || 'pcs'}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[160px]">
                    <p className="truncate">{retour.motif}</p>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge statut={retour.statut} /></td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(retour.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3.5">
                    {retour.statut === 'en_attente' ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApprouver(retour)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          title="Approuver"
                        >
                          <CheckCircle size={12} /> Approuver
                        </button>
                        <button
                          onClick={() => openRefusModal(retour)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                          title="Refuser"
                        >
                          <XCircle size={12} /> Refuser
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Traité</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Refus */}
      {showRefusModal && selectedRetour && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <XCircle size={17} className="text-red-500" /> Refuser le retour
              </h2>
              <button onClick={() => setShowRefusModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-1.5 text-sm">
                <p><span className="font-semibold text-gray-600">Demandeur:</span> <span className="text-gray-800">{selectedRetour.user?.name}</span></p>
                <p><span className="font-semibold text-gray-600">Article:</span> <span className="text-gray-800">{selectedRetour.article?.designation}</span></p>
                <p><span className="font-semibold text-gray-600">Quantité:</span> <span className="font-bold text-amber-600">{selectedRetour.quantite} {selectedRetour.article?.unite_mesure || 'pcs'}</span></p>
                <p><span className="font-semibold text-gray-600">Motif retour:</span> <span className="text-gray-500">{selectedRetour.motif}</span></p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Motif du refus <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  rows="3"
                  placeholder="Expliquez pourquoi ce retour est refusé..."
                  value={motifRefus}
                  onChange={e => setMotifRefus(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowRefusModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                <button
                  onClick={handleRefuser}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Confirmer le refus'}
                </button>
              </div>
            </div>
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