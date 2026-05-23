import React, { useState, useEffect } from 'react';
import { Plus, Calendar, X } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

function StatusBadge({ statut }) {
  const map = {
    en_attente: { label: '⏳ En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    confirmee: { label: '✅ Confirmée', cls: 'bg-green-50 text-green-700 border border-green-200' },
    annulee: { label: '❌ Annulée', cls: 'bg-red-50 text-red-600 border border-red-200' },
    expiree: { label: '📅 Expirée', cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
  };
  const cfg = map[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

function ReservationCard({ res, onCancel, onOpenConfirmModal }) {
  const canCancel = res.statut === 'en_attente' || res.statut === 'confirmee';
  const accentMap = { en_attente: '#f59e0b', confirmee: '#10b981', annulee: '#ef4444', expiree: '#9ca3af' };
  const accent = accentMap[res.statut] || '#9ca3af';
  

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="font-bold text-gray-800 text-sm truncate">{res.article?.designation || 'Article'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Quantité: <span className="font-semibold text-gray-700">{res.quantite}</span></p>
          </div>
          <StatusBadge statut={res.statut} />
        </div>
        <div className="bg-gray-50 rounded-xl p-3 mb-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar size={12} />
              <span>Début</span>
            </div>
            <span className="font-semibold text-gray-700">{new Date(res.date_debut).toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar size={12} />
              <span>Fin</span>
            </div>
            <span className="font-semibold text-gray-700">{new Date(res.date_fin).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
        {res.motif && <p className="text-[11px] text-gray-400 mb-3 line-clamp-2">Motif: {res.motif}</p>}
         {canCancel && (
          <button
            onClick={() => onOpenConfirmModal( 
              'danger',
              'Annuler la réservation',
              'Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible.',
              'Annuler la réservation ',
              () => onCancel(res.id)
            )}
            className="cursor-pointer w-full py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            Annuler la réservation
          </button>
        )}
      </div>
    </div>
  );
}

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ article_id: '', quantite: '', date_debut: '', date_fin: '', motif: '' });
  const [activeTab, setActiveTab] = useState('active');
  const [submitting, setSubmitting] = useState(false);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: 'danger',
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


  useEffect(() => { fetchReservations(); fetchArticles(); }, []);
  useEffect(() => { if (activeTab === 'historique') fetchHistorique(); }, [activeTab]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/reservations');
      let data = [];
      if (response.data?.data?.data) data = response.data.data.data;
      else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
      else if (Array.isArray(response.data)) data = response.data;
      else if (response.data?.data && typeof response.data.data === 'object') data = Object.values(response.data.data);
      setReservations(data);
    } catch { setReservations([]); } finally { setLoading(false); }
  };

  const fetchHistorique = async () => {
    try {
      const response = await api.get('/api/user/reservations/historique');
      let data = [];
      if (response.data?.data?.data) data = response.data.data.data;
      else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
      else if (Array.isArray(response.data)) data = response.data;
      else if (response.data?.data && typeof response.data.data === 'object') data = Object.values(response.data.data);
      setHistorique(data);
    } catch { setHistorique([]); }
  };

  const fetchArticles = async () => {
    try {
      const response = await api.get('/api/user/stock/articles');
      let data = [];
      if (response.data?.data?.data) data = response.data.data.data;
      else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
      else if (Array.isArray(response.data)) data = response.data;
      setArticles(data);
    } catch { setArticles([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/api/user/reservations', formData);
      setShowModal(false);
      setFormData({ article_id: '', quantite: '', date_debut: '', date_fin: '', motif: '' });
      fetchReservations();
    } catch (error) { alert(error.response?.data?.message || 'Erreur lors de la réservation'); }
    finally { setSubmitting(false); }
  };

const handleCancel = async (id) => {
  try {
    await api.delete(`/api/user/reservations/${id}`);
    fetchReservations();
    if (activeTab === 'historique') fetchHistorique();
  } catch { alert('Erreur lors de l\'annulation'); }
};

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <span>Espace personnel</span><span className="mx-1">›</span>
            <span className="text-gray-600 font-medium">Réservations</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Mes réservations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Réservez vos articles à l'avance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={16} /> Nouvelle réservation
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('active')}
          className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'active' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Actives <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{reservations.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'historique' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Historique <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'historique' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{historique.length}</span>
        </button>
      </div>

      {activeTab === 'active' ? (
        reservations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Calendar size={26} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Aucune réservation active</p>
            <p className="text-xs text-gray-400 mb-4">Réservez un article pour qu'il vous soit réservé à l'avance</p>
            <button onClick={() => setShowModal(true)} className="cursor-pointer inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
              <Plus size={14} /> Créer une réservation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reservations.map(res => <ReservationCard key={res.id} res={res} onCancel={handleCancel} onOpenConfirmModal={openConfirmModal}/>)}
          </div>
        )
      ) : (
        historique.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-14 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Calendar size={26} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Aucun historique</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Article', 'Quantité', 'Période', 'Statut', 'Date réservation'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historique.map(res => (
                    <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">{res.article?.designation || 'Article'}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{res.quantite}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(res.date_debut).toLocaleDateString('fr-FR')} → {new Date(res.date_fin).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3.5"><StatusBadge statut={res.statut} /></td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">{new Date(res.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modal nouvelle réservation */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">Nouvelle réservation</h2>
              <button onClick={() => setShowModal(false)} className="cursor-pointer p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Article <span className="text-red-500">*</span></label>
                <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.article_id} onChange={e => setFormData({ ...formData, article_id: e.target.value })} required>
                  <option value="">Sélectionner un article</option>
                  {articles.map(a => <option key={a.id} value={a.id}>{a.designation} — Stock: {a.quantite_stock}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Quantité <span className="text-red-500">*</span></label>
                <input type="number" min="1" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.quantite} onChange={e => setFormData({ ...formData, quantite: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Date début <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.date_debut} onChange={e => setFormData({ ...formData, date_debut: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Date fin <span className="text-red-500">*</span></label>
                  <input type="date" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.date_fin} onChange={e => setFormData({ ...formData, date_fin: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Motif <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
                <textarea className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="2" value={formData.motif} onChange={e => setFormData({ ...formData, motif: e.target.value })} placeholder="Raison de la réservation..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="cursor-pointer flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? <div className=" cursor-pointer w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Réserver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ActionConfirmModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={actionModal.onConfirm}
        title={actionModal.title}
        message={actionModal.message}
        type={actionModal.type}
        confirmText={actionModal.confirmText}
        />
    </div>
  );
}