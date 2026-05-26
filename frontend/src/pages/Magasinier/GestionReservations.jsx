import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Search, X } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

function StatusBadge({ statut }) {
  const map = {
    en_attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    confirmee:  { label: 'Confirmée',  cls: 'bg-green-50 text-green-700 border border-green-200' },
    annulee:    { label: 'Annulée',    cls: 'bg-red-50 text-red-600 border border-red-200' },
    expiree:    { label: 'Expirée',    cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
  };
  const cfg = map[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

export default function GestionReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, type: 'danger', title: '', message: '', confirmText: 'Confirmer', onConfirm: () => {},
  });
  const openConfirm = (cfg) => setConfirmModal({ ...confirmModal, isOpen: true, ...cfg });
  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => { fetchReservations(); }, [filter]);

  const fetchReservations = async () => {
    try {
      const params = filter !== 'all' ? { statut: filter } : {};
      const response = await api.get('/api/magasinier/reservations', { params });
      setReservations(response.data.data || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleConfirmer = (id, reservation) => {
    openConfirm({
      type: 'success',
      title: 'Confirmer la réservation',
      message: `Confirmer la réservation de "${reservation.article?.designation}" pour ${reservation.user?.name} ?`,
      confirmText: 'Oui, confirmer',
      onConfirm: async () => {
        try {
          await api.post(`/api/magasinier/reservations/${id}/confirmer`);
          fetchReservations();
        } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
      },
    });
  };

  const handleAnnuler = (id, reservation) => {
    openConfirm({
      type: 'danger',
      title: 'Annuler la réservation',
      message: `Annuler la réservation de "${reservation.article?.designation}" pour ${reservation.user?.name} ?`,
      confirmText: 'Oui, annuler',
      onConfirm: async () => {
        try {
          await api.post(`/api/magasinier/reservations/${id}/annuler`);
          fetchReservations();
        } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
      },
    });
  };

  const filteredReservations = reservations.filter(r =>
    search === '' ||
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.article?.designation?.toLowerCase().includes(search.toLowerCase())
  );

  const filterButtons = [
    { key: 'all',        label: 'Toutes',      count: reservations.length },
    { key: 'en_attente', label: 'En attente',  count: reservations.filter(r => r.statut === 'en_attente').length },
    { key: 'confirmee',  label: 'Confirmées',  count: reservations.filter(r => r.statut === 'confirmee').length },
  ];

  const stats = [
    { label: 'Total',       value: reservations.length,                                           accent: '#2563eb', bg: '#eff6ff' },
    { label: 'En attente',  value: reservations.filter(r => r.statut === 'en_attente').length,    accent: '#f59e0b', bg: '#fffbeb' },
    { label: 'Confirmées',  value: reservations.filter(r => r.statut === 'confirmee').length,     accent: '#10b981', bg: '#f0fdf4' },
    { label: 'Annulées',    value: reservations.filter(r => r.statut === 'annulee').length,       accent: '#ef4444', bg: '#fef2f2' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3">

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>Magasinier</span><span className="mx-1">›</span>
          <span className="text-gray-600 font-medium">Gestion des réservations</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Gestion des réservations</h1>
        <p className="text-sm text-gray-500 mt-0.5">Confirmez ou annulez les réservations des utilisateurs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
            type="text" placeholder="Rechercher par utilisateur ou article..."
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
                {['Utilisateur', 'Article', 'Quantité', 'Période', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Calendar size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Aucune réservation trouvée</p>
                  </td>
                </tr>
              ) : filteredReservations.map(r => (
                <tr key={r.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-gray-800">{r.user?.name}</p>
                    <p className="text-[11px] text-gray-400">{r.user?.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-700">{r.article?.designation}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-700">
                    {r.quantite} <span className="font-normal text-gray-400">{r.article?.unite_mesure}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Calendar size={11} className="text-gray-400" />
                      {new Date(r.date_debut).toLocaleDateString('fr-FR')} → {new Date(r.date_fin).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge statut={r.statut} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1">
                      {r.statut === 'en_attente' && (
                        <>
                          <button
                            onClick={() => handleConfirmer(r.id, r)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <CheckCircle size={12} /> Confirmer
                          </button>
                          <button
                            onClick={() => handleAnnuler(r.id, r)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <XCircle size={12} /> Annuler
                          </button>
                        </>
                      )}
                      {r.statut === 'confirmee' && (
                        <button
                          onClick={() => handleAnnuler(r.id, r)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition"
                        >
                          <XCircle size={12} /> Annuler
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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