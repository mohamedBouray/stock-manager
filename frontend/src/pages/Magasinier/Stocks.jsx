import React, { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, CheckCircle, X } from 'lucide-react';
import api from '../../lib/apis/axios';

function StockBadge({ quantite, seuil }) {
  if (quantite <= 0) return (
    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200">
      <X size={10} /> Rupture
    </span>
  );
  if (quantite <= (seuil || 0)) return (
    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle size={10} /> Alerte
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200">
      <CheckCircle size={10} /> OK
    </span>
  );
}

export default function MagasinierStocks() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { fetchStocks(); }, []);

  const fetchStocks = async () => {
    try {
      const response = await api.get('/api/admin/stocks');
      setStocks(response.data.stocks?.data || response.data.stocks || []);
    } catch { setStocks([]); }
    finally { setLoading(false); }
  };

  const filteredStocks = stocks.filter(s => {
    const matchSearch = search === '' ||
      s.article?.designation?.toLowerCase().includes(search.toLowerCase()) ||
      s.article?.code_barre?.includes(search);
    if (!matchSearch) return false;
    if (statusFilter === 'alerte') return s.quantite_disponible <= (s.article?.seuil_alerte || 0) && s.quantite_disponible > 0;
    if (statusFilter === 'rupture') return s.quantite_disponible <= 0;
    if (statusFilter === 'ok') return s.quantite_disponible > (s.article?.seuil_alerte || 0);
    return true;
  });

  const counts = {
    all: stocks.length,
    ok: stocks.filter(s => s.quantite_disponible > (s.article?.seuil_alerte || 0)).length,
    alerte: stocks.filter(s => s.quantite_disponible <= (s.article?.seuil_alerte || 0) && s.quantite_disponible > 0).length,
    rupture: stocks.filter(s => s.quantite_disponible <= 0).length,
  };

  const statsCards = [
    { key: 'all',     label: 'Total articles', count: counts.all,     accent: '#2563eb', bg: '#eff6ff' },
    { key: 'ok',      label: 'En stock (OK)',   count: counts.ok,      accent: '#10b981', bg: '#f0fdf4' },
    { key: 'alerte',  label: 'En alerte',       count: counts.alerte,  accent: '#f59e0b', bg: '#fffbeb' },
    { key: 'rupture', label: 'En rupture',      count: counts.rupture, accent: '#ef4444', bg: '#fef2f2' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>Magasinier</span><span className="mx-1">›</span>
          <span className="text-gray-600 font-medium">Consultation des stocks</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Consultation des stocks</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visualisez les niveaux de stock par magasin</p>
      </div>

      {/* Stats cards cliquables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key)}
            className={`text-left p-4 rounded-2xl border transition-all ${statusFilter === s.key ? 'ring-2 shadow-md' : 'bg-white border-gray-200 hover:shadow-sm'}`}
            style={statusFilter === s.key ? { backgroundColor: s.bg, borderColor: s.accent, ringColor: s.accent } : {}}
          >
            <p className="text-2xl font-bold" style={{ color: statusFilter === s.key ? s.accent : '#1f2937' }}>{s.count}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Rechercher par article ou code..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {(search || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); }}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-100 transition bg-white"
          >
            <X size={13} /> Réinitialiser
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400">{filteredStocks.length} résultat{filteredStocks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Article', 'Code', 'Magasin', 'Quantité', 'Seuil alerte', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Package size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Aucun stock trouvé</p>
                  </td>
                </tr>
              ) : filteredStocks.map(stock => {
                const isAlerte = stock.quantite_disponible <= (stock.article?.seuil_alerte || 0);
                return (
                  <tr key={stock.id} className={`transition-colors ${isAlerte && stock.quantite_disponible > 0 ? 'hover:bg-amber-50/30' : stock.quantite_disponible <= 0 ? 'hover:bg-red-50/20' : 'hover:bg-blue-50/20'}`}>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-gray-800">{stock.article?.designation}</p>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{stock.article?.code_barre}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{stock.magasin?.nom_magasin}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-bold ${stock.quantite_disponible <= 0 ? 'text-red-600' : isAlerte ? 'text-amber-600' : 'text-green-600'}`}>
                        {stock.quantite_disponible}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">{stock.article?.unite_mesure}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{stock.article?.seuil_alerte ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <StockBadge quantite={stock.quantite_disponible} seuil={stock.article?.seuil_alerte} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}