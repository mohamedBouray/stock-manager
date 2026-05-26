import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Package, Truck, MessageCircle, X } from 'lucide-react';
import api from '../../lib/apis/axios';
import MessageModal from '../../lib/components/MessageModal';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

function StatusBadge({ statut }) {
  const map = {
    en_attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    approuvee:  { label: 'Approuvée',  cls: 'bg-green-50 text-green-700 border border-green-200' },
    refusee:    { label: 'Refusée',    cls: 'bg-red-50 text-red-600 border border-red-200' },
    livree:     { label: 'Livrée',     cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  };
  const cfg = map[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

export default function GestionDemandes() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [quantiteAccorde, setQuantiteAccorde] = useState('');
  const [commentaireRefus, setCommentaireRefus] = useState('');
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedDemandeMessages, setSelectedDemandeMessages] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, type: 'danger', title: '', message: '', confirmText: 'Confirmer', onConfirm: () => {},
  });
  const openConfirm = (cfg) => setConfirmModal({ ...confirmModal, isOpen: true, ...cfg });
  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => { fetchDemandes(); }, [filter]);

  const fetchDemandes = async () => {
    try {
      const params = filter !== 'all' ? { statut: filter } : {};
      const response = await api.get('/api/magasinier/demandes', { params });
      setDemandes(response.data.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleApprouver = async () => {
    if (!quantiteAccorde || quantiteAccorde <= 0) { alert('Veuillez saisir une quantité accordée'); return; }
    if (quantiteAccorde > selectedDemande.quantite_demandee) { alert('La quantité accordée ne peut pas dépasser la quantité demandée'); return; }
    try {
      await api.post(`/api/magasinier/demandes/${selectedDemande.id}/approuver`, { quantite_accorde: quantiteAccorde });
      setShowModal(false); setSelectedDemande(null); setQuantiteAccorde('');
      fetchDemandes();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
  };

  const handleRefuser = async () => {
    if (!commentaireRefus.trim()) { alert('Veuillez saisir un motif de refus'); return; }
    try {
      await api.post(`/api/magasinier/demandes/${selectedDemande.id}/refuser`, { commentaire: commentaireRefus });
      setShowModal(false); setSelectedDemande(null); setCommentaireRefus('');
      fetchDemandes();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
  };

  const handleLivrer = async () => {
    try {
      await api.post(`/api/magasinier/demandes/${selectedDemande.id}/livrer`);
      setShowModal(false); setSelectedDemande(null);
      fetchDemandes();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
  };

  const openModal = (demande, type) => {
    setSelectedDemande(demande);
    setModalType(type);
    if (type === 'approve') setQuantiteAccorde(demande.quantite_demandee);
    if (type === 'refuse') setCommentaireRefus('');
    setShowModal(true);
  };

  const filteredDemandes = demandes.filter(d =>
    search === '' ||
    d.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.article?.designation?.toLowerCase().includes(search.toLowerCase())
  );

  const filterButtons = [
    { key: 'all',        label: 'Toutes',      count: demandes.length },
    { key: 'en_attente', label: 'En attente',  count: demandes.filter(d => d.statut === 'en_attente').length },
    { key: 'approuvee',  label: 'Approuvées',  count: demandes.filter(d => d.statut === 'approuvee').length },
    { key: 'refusee',    label: 'Refusées',    count: demandes.filter(d => d.statut === 'refusee').length },
  ];

  const stats = [
    { label: 'Total',       value: demandes.length,                                         accent: '#2563eb', bg: '#eff6ff' },
    { label: 'En attente',  value: demandes.filter(d => d.statut === 'en_attente').length,  accent: '#f59e0b', bg: '#fffbeb' },
    { label: 'Approuvées',  value: demandes.filter(d => d.statut === 'approuvee').length,   accent: '#10b981', bg: '#f0fdf4' },
    { label: 'Livrées',     value: demandes.filter(d => d.statut === 'livree').length,      accent: '#2563eb', bg: '#eff6ff' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 ">

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>Magasinier</span><span className="mx-1">›</span>
          <span className="text-gray-600 font-medium">Gestion des demandes</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Gestion des demandes</h1>
        <p className="text-sm text-gray-500 mt-0.5">Approuvez, refusez ou livrez les demandes des utilisateurs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
            <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: s.bg }}>
              <div className="h-1 rounded-full w-full opacity-60" style={{ backgroundColor: s.accent }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
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
            type="text" placeholder="Rechercher par demandeur ou article..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Demandeur', 'Article', 'Quantité', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredDemandes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Package size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Aucune demande trouvée</p>
                  </td>
                </tr>
              ) : filteredDemandes.map(demande => (
                <tr key={demande.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{demande.user?.name}</p>
                    <p className="text-[11px] text-gray-400">{demande.user?.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-700">{demande.article?.designation}</p>
                    {demande.motif && <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[160px]">Motif: {demande.motif}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-700">{demande.quantite_demandee} <span className="text-gray-400 font-normal">{demande.article?.unite_mesure}</span></p>
                    {demande.quantite_accorde && (
                      <p className="text-[11px] text-green-600 font-semibold mt-0.5">Accordé: {demande.quantite_accorde}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge statut={demande.statut} />
                    {demande.commentaire_refus && (
                      <p className="text-[11px] text-red-500 mt-1 truncate max-w-[120px]">{demande.commentaire_refus}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      {demande.statut === 'en_attente' && (
                        <>
                          <button
                            onClick={() => openModal(demande, 'approve')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <CheckCircle size={12} /> Approuver
                          </button>
                          <button
                            onClick={() => openModal(demande, 'refuse')}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <XCircle size={12} /> Refuser
                          </button>
                        </>
                      )}
                      {demande.statut === 'approuvee' && (
                        <button
                          onClick={() => openModal(demande, 'livrer')}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                        >
                          <Truck size={12} /> Livrer
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedDemandeMessages(demande); setMessageModalOpen(true); }}
                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition"
                        title="Messages"
                      >
                        <MessageCircle size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Approuver / Refuser / Livrer */}
      {showModal && selectedDemande && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                {modalType === 'approve' && '✅ Approuver la demande'}
                {modalType === 'refuse'  && '❌ Refuser la demande'}
                {modalType === 'livrer' && '🚚 Confirmer la livraison'}
              </h2>
              <button onClick={() => { setShowModal(false); setSelectedDemande(null); }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Résumé demande */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm border border-gray-100">
                <p><span className="font-semibold text-gray-600">Demandeur:</span> <span className="text-gray-800">{selectedDemande.user?.name}</span></p>
                <p><span className="font-semibold text-gray-600">Article:</span> <span className="text-gray-800">{selectedDemande.article?.designation}</span></p>
                <p><span className="font-semibold text-gray-600">Quantité demandée:</span> <span className="font-bold text-blue-600">{selectedDemande.quantite_demandee} {selectedDemande.article?.unite_mesure}</span></p>
                <p><span className="font-semibold text-gray-600">Stock disponible:</span> <span className="font-bold text-green-600">{selectedDemande.stock_magasin_actuel} {selectedDemande.article?.unite_mesure}</span></p>
              </div>

              {modalType === 'approve' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Quantité accordée <span className="text-red-500">*</span></label>
                    <input
                      type="number" min="1" max={selectedDemande.quantite_demandee}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={quantiteAccorde}
                      onChange={e => setQuantiteAccorde(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                    <button
                      onClick={() => openConfirm({
                        type: 'success',
                        title: 'Approuver la demande',
                        message: `Confirmer l'approbation de ${quantiteAccorde} ${selectedDemande.article?.unite_mesure} de "${selectedDemande.article?.designation}" pour ${selectedDemande.user?.name} ?`,
                        confirmText: 'Oui, approuver',
                        onConfirm: handleApprouver,
                      })}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                    >
                      Approuver
                    </button>
                  </div>
                </>
              )}

              {modalType === 'refuse' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Motif du refus <span className="text-red-500">*</span></label>
                    <textarea
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                      rows="3" placeholder="Expliquez la raison du refus..."
                      value={commentaireRefus}
                      onChange={e => setCommentaireRefus(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                    <button
                      onClick={() => openConfirm({
                        type: 'danger',
                        title: 'Refuser la demande',
                        message: `Confirmer le refus de la demande de ${selectedDemande.user?.name} pour "${selectedDemande.article?.designation}" ?`,
                        confirmText: 'Oui, refuser',
                        onConfirm: handleRefuser,
                      })}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                    >
                      Refuser
                    </button>
                  </div>
                </>
              )}

              {modalType === 'livrer' && (
                <>
                  <p className="text-sm text-gray-500 bg-blue-50 rounded-xl p-3 border border-blue-100">
                    Confirmez-vous que <span className="font-semibold text-gray-700">{selectedDemande.user?.name}</span> a bien récupéré sa commande ?
                  </p>
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                    <button
                      onClick={() => openConfirm({
                        type: 'info',
                        title: 'Confirmer la livraison',
                        message: `Marquer la demande de "${selectedDemande.article?.designation}" comme livrée à ${selectedDemande.user?.name} ?`,
                        confirmText: 'Confirmer la livraison',
                        onConfirm: handleLivrer,
                      })}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
                    >
                      Confirmer
                    </button>
                  </div>
                </>
              )}
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

      {messageModalOpen && selectedDemandeMessages && (
        <MessageModal
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          demandeId={selectedDemandeMessages.id}
          demandeTitle={selectedDemandeMessages.article?.designation}
        />
      )}
    </div>
  );
}