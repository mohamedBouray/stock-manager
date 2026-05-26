
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, CheckCircle, Filter, Bell, TrendingUp, Building2, Search, X } from 'lucide-react';
import api from '../../lib/apis/axios';

function AlertBadge({ quantite }) {
  if (quantite === 0) return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200">
      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Rupture
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Stock bas
    </span>
  );
}

export default function AdminAlertes() {
  const [alertes, setAlertes] = useState([]);
  const [stats, setStats] = useState({ total: 0, ruptures: 0, stock_bas: 0, par_magasin: [] });
  const [loading, setLoading] = useState(true);
  const [filterMagasin, setFilterMagasin] = useState('');
  const [search, setSearch] = useState('');
  const [magasins, setMagasins] = useState([]);

  useEffect(() => { 
    fetchAlertes(); 
    fetchStats(); 
    fetchMagasins(); 
  }, [filterMagasin]);

  const fetchAlertes = async () => {
    setLoading(true);
    try {
      const params = filterMagasin ? { magasin_id: filterMagasin } : {};
      const response = await api.get('/api/admin/alertes', { params });
      setAlertes(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Erreur fetchAlertes:', error);
      setAlertes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/alertes/stats');
      setStats(response.data?.data || { total: 0, ruptures: 0, stock_bas: 0, par_magasin: [] });
    } catch (error) {
      console.error('Erreur fetchStats:', error);
      setStats({ total: 0, ruptures: 0, stock_bas: 0, par_magasin: [] });
    }
  };

  const fetchMagasins = async () => {
    try {
      const response = await api.get('/api/magasinier/magasins');
      setMagasins(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('Erreur fetchMagasins:', error);
      setMagasins([]);
    }
  };

  const filteredAlertes = alertes.filter(a =>
    search === '' ||
    a.article?.designation?.toLowerCase().includes(search.toLowerCase()) ||
    a.article?.code_barre?.toLowerCase().includes(search.toLowerCase())
  );

  const statsCards = [
    { label: 'Total alertes', value: stats.total, accent: '#ef4444', icon: AlertTriangle },
    { label: 'Stock bas', value: stats.stock_bas, accent: '#f59e0b', icon: Bell },
    { label: 'Rupture', value: stats.ruptures, accent: '#dc2626', icon: Package },
    { label: 'Taux d\'alerte', value: stats.total > 0 ? `${Math.round((stats.total / (alertes.length || 1)) * 100)}%` : '0%', accent: '#2563eb', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div >
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Alertes stock</h1>
        <p className="text-sm text-gray-500 mt-0.5">Surveillance des niveaux de stock — tous magasins</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.accent + '15' }}>
                <s.icon size={18} style={{ color: s.accent }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Répartition par magasin */}
      {stats.par_magasin?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Building2 size={15} className="text-gray-400" /> Répartition par magasin
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.par_magasin.map(mag => (
              <div key={mag.magasin_id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-700 mb-2 truncate">{mag.magasin_nom}</p>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Alertes: <span className="font-semibold text-gray-700">{mag.total}</span></span>
                  <span className="text-red-500 font-semibold">Rupture: {mag.ruptures}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${stats.total > 0 ? (mag.total / stats.total) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
          <Filter size={14} className="text-gray-400" />
          <select
            value={filterMagasin}
            onChange={e => setFilterMagasin(e.target.value)}
            className="text-sm text-gray-600 bg-transparent focus:outline-none"
          >
            <option value="">Tous les magasins</option>
            {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
          </select>
        </div>
        {filterMagasin && (
          <button onClick={() => setFilterMagasin('')} className="text-xs text-red-500 hover:underline">
            Effacer
          </button>
        )}
        <div className="flex-1 max-w-xs relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Rechercher article ou code barre..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magasin</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock actuel</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Seuil alerte</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAlertes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={22} className="text-green-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-600">Aucune alerte</p>
                    <p className="text-xs text-gray-400 mt-1">Tous les stocks sont dans les normes</p>
                  </td>
                </tr>
              ) : (
                filteredAlertes.map(alerte => (
                  <tr key={alerte.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800">{alerte.article?.designation || 'Article'}</p>
                      <p className="text-[10px] font-mono text-gray-400 mt-0.5">{alerte.article?.code_barre}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        {alerte.magasin?.nom_magasin}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${alerte.quantite_disponible === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {alerte.quantite_disponible}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500">{alerte.article?.seuil_alerte || '-'}</td>
                    <td className="px-4 py-3 text-center"><AlertBadge quantite={alerte.quantite_disponible} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}