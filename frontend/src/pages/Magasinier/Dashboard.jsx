// src/pages/Magasinier/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Package, Clock, CheckCircle, XCircle, Calendar, 
  TrendingUp, TrendingDown, AlertTriangle, Users,
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  ShoppingCart, FileText, Bell, Boxes
} from 'lucide-react';
import api from '../../lib/apis/axios';

// Composant Graphique à barres
function BarChart({ data, title, color = "#2563eb" }) {
  const maxValue = Math.max(...data.values, 1);
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
        <BarChart3 size={15} style={{ color }} />
        {title}
      </h4>
      <div className="space-y-3">
        {data.labels.map((label, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span className="font-medium text-gray-700">{label}</span>
              <span className="font-semibold" style={{ color }}>{data.values[idx]}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${(data.values[idx] / maxValue) * 100}%`, backgroundColor: color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant Graphique circulaire
function CustomPieChart({ data, title }) {
  const total = data.values.reduce((a, b) => a + b, 0);
  let currentAngle = 0;
  const colors = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
        <PieChart size={15} className="text-emerald-500" />
        {title}
      </h4>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
            {total === 0 ? (
              <circle cx="50" cy="50" r="40" fill="#f3f4f6" />
            ) : data.values.map((value, idx) => {
              if (value === 0) return null;
              const percentage = (value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              currentAngle += angle;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (currentAngle * Math.PI) / 180;
              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);
              const largeArc = angle > 180 ? 1 : 0;
              return (
                <path
                  key={idx}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[idx % colors.length]}
                  stroke="white"
                  strokeWidth="1.5"
                />
              );
            })}
            <circle cx="50" cy="50" r="26" fill="white" />
            <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="rotate-90" style={{ fontSize: '11px', fontWeight: 700, fill: '#1f2937', transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}>
              {total}
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {data.labels.map((label, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span className="text-xs text-gray-600">{label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-800">{data.values[idx]}</span>
                {total > 0 && (
                  <span className="text-[10px] text-gray-400">
                    {Math.round((data.values[idx] / total) * 100)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Carte statistique
function StatCard({ title, value, subValue, icon: Icon, accent = "#2563eb", trend, trendValue }) {
  const bgLight = accent + '12';
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bgLight }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{title}</p>
      {subValue && <p className="text-[11px] text-gray-400 mt-1">{subValue}</p>}
    </div>
  );
}

export default function MagasinierDashboard() {
  const [stats, setStats] = useState({
    // Demandes
    total_demandes: 0,
    demandes_en_attente: 0,
    demandes_approuvees: 0,
    demandes_livrees: 0,
    demandes_refusees: 0,
    // Stocks
    total_articles: 0,
    articles_disponibles: 0,
    articles_stock_bas: 0,
    articles_rupture: 0,
    // Mouvements
    mouvements_jour: 0,
    total_entrees_mois: 0,
    total_sorties_mois: 0,
    // Derniers mouvements
    derniers_mouvements: []
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const userString = localStorage.getItem('user');
    if (userString) {
      try { setUser(JSON.parse(userString)); } catch (e) {}
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Récupérer les demandes
      const demandesResponse = await api.get('/api/magasinier/demandes');
      let demandesData = [];
      if (demandesResponse.data?.data) {
        demandesData = Array.isArray(demandesResponse.data.data) 
          ? demandesResponse.data.data 
          : (demandesResponse.data.data.data || []);
      }

      // 2. Récupérer les stocks (via API admin ou magasinier)
      const stocksResponse = await api.get('/api/magasinier/stocks');
      let stocksData = [];
      if (stocksResponse.data?.data?.data) {
        stocksData = stocksResponse.data.data.data;
      } else if (stocksResponse.data?.data && Array.isArray(stocksResponse.data.data)) {
        stocksData = stocksResponse.data.data;
      }

      // 3. Récupérer les statistiques des mouvements
      const mouvementsStatsResponse = await api.get('/api/magasinier/mouvements/stats');
      let mouvementsStats = {};
      if (mouvementsStatsResponse.data?.data) {
        mouvementsStats = mouvementsStatsResponse.data.data;
      }

      // 4. Récupérer les derniers mouvements
      const mouvementsResponse = await api.get('/api/magasinier/mouvements');
      let mouvementsData = [];
      if (mouvementsResponse.data?.data?.data) {
        mouvementsData = mouvementsResponse.data.data.data;
      } else if (mouvementsResponse.data?.data && Array.isArray(mouvementsResponse.data.data)) {
        mouvementsData = mouvementsResponse.data.data;
      }

      // Calculer les stocks
      const articlesDisponibles = stocksData.filter(s => s.quantite_disponible > 5).length;
      const articlesStockBas = stocksData.filter(s => s.quantite_disponible > 0 && s.quantite_disponible <= 5).length;
      const articlesRupture = stocksData.filter(s => s.quantite_disponible === 0).length;

      // Calculer les entrées/sorties du mois
      const now = new Date();
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      const entreesMois = mouvementsData
        .filter(m => m.type === 'entree' && new Date(m.created_at) >= new Date(debutMois))
        .reduce((sum, m) => sum + m.quantite, 0);
      
      const sortiesMois = mouvementsData
        .filter(m => m.type === 'sortie' && new Date(m.created_at) >= new Date(debutMois))
        .reduce((sum, m) => sum + m.quantite, 0);

      setStats({
        total_demandes: demandesData.length,
        demandes_en_attente: demandesData.filter(d => d.statut === 'en_attente').length,
        demandes_approuvees: demandesData.filter(d => d.statut === 'approuvee').length,
        demandes_livrees: demandesData.filter(d => d.statut === 'livree').length,
        demandes_refusees: demandesData.filter(d => d.statut === 'refusee').length,
        total_articles: stocksData.length,
        articles_disponibles: articlesDisponibles,
        articles_stock_bas: articlesStockBas,
        articles_rupture: articlesRupture,
        mouvements_jour: mouvementsStats.mouvements_jour || 0,
        total_entrees_mois: entreesMois,
        total_sorties_mois: sortiesMois,
        derniers_mouvements: mouvementsData.slice(0, 5)
      });
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tauxTraitement = stats.total_demandes > 0
    ? Math.round(((stats.demandes_approuvees + stats.demandes_livrees) / stats.total_demandes) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg">
            <Activity size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Bonjour, {user?.name?.split(' ')[0] || 'Magasinier'} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestion des stocks et des demandes
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Demandes en attente"
          value={stats.demandes_en_attente}
          icon={Clock}
          accent="#f59e0b"
          trend={stats.demandes_en_attente > 0 ? 'up' : null}
          trendValue={`${stats.demandes_en_attente} à traiter`}
        />
        <StatCard
          title="Taux de traitement"
          value={`${tauxTraitement}%`}
          icon={CheckCircle}
          accent="#10b981"
          trend={tauxTraitement >= 50 ? 'up' : 'down'}
          trendValue={`${tauxTraitement}%`}
        />
        <StatCard
          title="Mouvements aujourd'hui"
          value={stats.mouvements_jour}
          icon={TrendingUp}
          accent="#3b82f6"
        />
        <StatCard
          title="Alertes stock"
          value={stats.articles_stock_bas + stats.articles_rupture}
          subValue={`${stats.articles_rupture} en rupture`}
          icon={AlertTriangle}
          accent="#ef4444"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <BarChart
          data={{
            labels: ['En attente', 'Approuvées', 'Livrées', 'Refusées'],
            values: [stats.demandes_en_attente, stats.demandes_approuvees, stats.demandes_livrees, stats.demandes_refusees]
          }}
          title="État des demandes"
          color="#3b82f6"
        />
        <CustomPieChart
          data={{
            labels: ['Disponible', 'Stock bas', 'Rupture'],
            values: [stats.articles_disponibles, stats.articles_stock_bas, stats.articles_rupture]
          }}
          title="État du stock"
        />
      </div>

      {/* Deuxième ligne de graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-500" />
            Mouvements du mois
          </h4>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                <TrendingUp size={24} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.total_entrees_mois}</p>
              <p className="text-xs text-gray-500">Entrées</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                <TrendingDown size={24} className="text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.total_sorties_mois}</p>
              <p className="text-xs text-gray-500">Sorties</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
            <Package size={15} className="text-emerald-500" />
            Résumé du stock
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Disponible</span>
                <span className="font-semibold text-green-600">{stats.articles_disponibles}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: `${stats.total_articles > 0 ? (stats.articles_disponibles / stats.total_articles) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Stock bas</span>
                <span className="font-semibold text-orange-600">{stats.articles_stock_bas}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-orange-500" style={{ width: `${stats.total_articles > 0 ? (stats.articles_stock_bas / stats.total_articles) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Rupture</span>
                <span className="font-semibold text-red-600">{stats.articles_rupture}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-red-500" style={{ width: `${stats.total_articles > 0 ? (stats.articles_rupture / stats.total_articles) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Derniers mouvements */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">Derniers mouvements</h2>
          </div>
          <button className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
            Voir tout →
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {stats.derniers_mouvements.length === 0 ? (
            <div className="p-10 text-center">
              <Package size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">Aucun mouvement récent</p>
            </div>
          ) : (
            stats.derniers_mouvements.map((mouvement, idx) => (
              <div key={idx} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mouvement.type === 'entree' ? 'bg-green-100' : mouvement.type === 'sortie' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    {mouvement.type === 'entree' && <TrendingUp size={14} className="text-green-600" />}
                    {mouvement.type === 'sortie' && <TrendingDown size={14} className="text-red-600" />}
                    {mouvement.type === 'ajustement' && <AlertTriangle size={14} className="text-yellow-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{mouvement.article?.designation || 'Article'}</p>
                    <p className="text-[11px] text-gray-400">{new Date(mouvement.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${mouvement.type === 'entree' ? 'text-green-600' : mouvement.type === 'sortie' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {mouvement.type === 'entree' ? '+' : '-'}{mouvement.quantite}
                  </span>
                  <p className="text-[10px] text-gray-400">{mouvement.user?.name}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}