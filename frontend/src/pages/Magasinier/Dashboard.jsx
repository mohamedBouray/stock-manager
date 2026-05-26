import React, { useState, useEffect } from 'react';
import {
  Package, Clock, CheckCircle, TrendingUp, TrendingDown,
  AlertTriangle, BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../../lib/apis/axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const TOOLTIP = {
  backgroundColor: '#1e293b',
  titleFont: { size: 12, weight: '600' },
  bodyFont: { size: 11 },
  padding: 10,
  cornerRadius: 8,
};

const BAR_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: TOOLTIP },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
    y: { grid: { color: '#f1f5f9', borderDash: [4, 4] }, ticks: { font: { size: 11 }, color: '#94a3b8' }, beginAtZero: true },
  },
};

const DONUT_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    tooltip: TOOLTIP,
    legend: {
      display: true,
      position: 'right',
      labels: { boxWidth: 10, boxHeight: 10, borderRadius: 3, padding: 14, font: { size: 11 }, color: '#475569' },
    },
  },
  cutout: '68%',
};

function StatCard({ title, value, subValue, icon: Icon, accent = '#2563eb', trend, trendValue }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + '18' }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{title}</p>
      {subValue && <p className="text-[11px] text-gray-400 mt-1">{subValue}</p>}
    </div>
  );
}

export default function MagasinierDashboard() {
  const [stats, setStats] = useState({
    total_demandes: 0, demandes_en_attente: 0, demandes_approuvees: 0,
    demandes_livrees: 0, demandes_refusees: 0,
    total_articles: 0, articles_disponibles: 0, articles_stock_bas: 0, articles_rupture: 0,
    mouvements_jour: 0, total_entrees_mois: 0, total_sorties_mois: 0, derniers_mouvements: [],
  });
  const [mouvementsHebdo, setMouvementsHebdo] = useState({ entrees: Array(7).fill(0), sorties: Array(7).fill(0) });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const u = localStorage.getItem('user');
    if (u) { try { setUser(JSON.parse(u)); } catch (e) {} }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const demandesRes = await api.get('/api/magasinier/demandes');
      let demandesData = [];
      if (demandesRes.data?.data) {
        demandesData = Array.isArray(demandesRes.data.data) ? demandesRes.data.data : (demandesRes.data.data.data || []);
      }

      const stocksRes = await api.get('/api/magasinier/stocks');
      let stocksData = [];
      if (stocksRes.data?.data?.data) stocksData = stocksRes.data.data.data;
      else if (stocksRes.data?.data && Array.isArray(stocksRes.data.data)) stocksData = stocksRes.data.data;

      const mouvStatsRes = await api.get('/api/magasinier/mouvements/stats');
      const mouvementsStats = mouvStatsRes.data?.data || {};

      const mouvRes = await api.get('/api/magasinier/mouvements');
      let mouvData = [];
      if (mouvRes.data?.data?.data) mouvData = mouvRes.data.data.data;
      else if (mouvRes.data?.data && Array.isArray(mouvRes.data.data)) mouvData = mouvRes.data.data;

      // 🔥 Calcul correct des stocks (comme dans UserDashboard)
      const seuilAlerte = 5;
      let disponibles = 0;
      let stockBas = 0;
      let rupture = 0;

      stocksData.forEach(s => {
        const stock = s.quantite_disponible || 0;
        const seuil = s.article?.seuil_alerte || seuilAlerte;
        
        if (stock === 0) {
          rupture++;
        } else if (stock <= seuil) {
          stockBas++;
        } else {
          disponibles++;
        }
      });

      // Hebdo
      const last7 = [...Array(7)].map((_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const entreesH = last7.map(day => mouvData.filter(m => m.type === 'entree' && m.created_at?.startsWith(day)).reduce((s, m) => s + m.quantite, 0));
      const sortiesH = last7.map(day => mouvData.filter(m => m.type === 'sortie' && m.created_at?.startsWith(day)).reduce((s, m) => s + m.quantite, 0));
      setMouvementsHebdo({ entrees: entreesH, sorties: sortiesH });

      const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const entreesMois = mouvData.filter(m => m.type === 'entree' && new Date(m.created_at) >= new Date(debutMois)).reduce((s, m) => s + m.quantite, 0);
      const sortiesMois = mouvData.filter(m => m.type === 'sortie' && new Date(m.created_at) >= new Date(debutMois)).reduce((s, m) => s + m.quantite, 0);

      setStats({
        total_demandes: demandesData.length,
        demandes_en_attente: demandesData.filter(d => d.statut === 'en_attente').length,
        demandes_approuvees: demandesData.filter(d => d.statut === 'approuvee').length,
        demandes_livrees: demandesData.filter(d => d.statut === 'livree').length,
        demandes_refusees: demandesData.filter(d => d.statut === 'refusee').length,
        total_articles: stocksData.length,
        articles_disponibles: disponibles,
        articles_stock_bas: stockBas,
        articles_rupture: rupture,
        mouvements_jour: mouvementsStats.mouvements_jour || 0,
        total_entrees_mois: entreesMois,
        total_sorties_mois: sortiesMois,
        derniers_mouvements: mouvData.slice(0, 5),
      });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tauxTraitement = stats.total_demandes > 0
    ? Math.round(((stats.demandes_approuvees + stats.demandes_livrees) / stats.total_demandes) * 100)
    : 0;

  const last7Labels = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  });

  const mouvementsChartData = {
    labels: last7Labels,
    datasets: [
      { label: 'Entrées', data: mouvementsHebdo.entrees, backgroundColor: '#10b981', borderColor: '#10b981', borderWidth: 2, borderRadius: 6, borderSkipped: false },
      { label: 'Sorties', data: mouvementsHebdo.sorties, backgroundColor: '#ef4444', borderColor: '#ef4444', borderWidth: 2, borderRadius: 6, borderSkipped: false },
    ],
  };

  const demandesChartData = {
    labels: ['En attente', 'Approuvées', 'Livrées', 'Refusées'],
    datasets: [{
      data: [stats.demandes_en_attente, stats.demandes_approuvees, stats.demandes_livrees, stats.demandes_refusees],
      backgroundColor: ['#f59e0b', '#2563eb', '#10b981', '#ef4444'],
      borderWidth: 0,
    }],
  };

  const stockChartData = {
    labels: ['Disponible', 'Stock bas', 'Rupture'],
    datasets: [{
      data: [stats.articles_disponibles, stats.articles_stock_bas, stats.articles_rupture],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0,
    }],
  };

  const hasStockData = (stats.articles_disponibles > 0 || stats.articles_stock_bas > 0 || stats.articles_rupture > 0);

  return (
    <div className="min-h-screen bg-gray-50 ">

      {/* En-tête */}
      <div className="mb-7">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>Magasinier</span><span className="mx-1">›</span>
          <span className="text-gray-600 font-medium">Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Bonjour, {user?.name?.split(' ')[0] || 'Magasinier'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestion des stocks et des demandes</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Demandes en attente" value={stats.demandes_en_attente} icon={Clock} accent="#f59e0b" trend="up" trendValue="à traiter" />
        <StatCard title="Taux de traitement" value={`${tauxTraitement}%`} icon={CheckCircle} accent="#10b981" trend={tauxTraitement >= 50 ? 'up' : 'down'} trendValue={`${tauxTraitement}%`} />
        <StatCard title="Mouvements auj." value={stats.mouvements_jour} icon={TrendingUp} accent="#2563eb" />
        <StatCard title="Alertes stock" value={stats.articles_stock_bas + stats.articles_rupture} subValue={`${stats.articles_rupture} en rupture`} icon={AlertTriangle} accent="#ef4444" />
      </div>

      {/* Graphiques ligne 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 size={14} className="text-blue-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-600">Mouvements — 7 derniers jours</h4>
          </div>
          <div style={{ height: 200 }}>
            <Bar data={mouvementsChartData} options={BAR_OPTS} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <PieChart size={14} className="text-purple-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-600">État des demandes</h4>
          </div>
          <div style={{ height: 200 }}>
            <Doughnut data={demandesChartData} options={DONUT_OPTS} />
          </div>
        </div>
      </div>

      {/* Graphiques ligne 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <Package size={14} className="text-green-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-600">État du stock</h4>
          </div>
          <div style={{ height: 200 }}>
            {hasStockData ? (
              <Doughnut data={stockChartData} options={DONUT_OPTS} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Package size={48} className="text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">Aucune donnée de stock</p>
                <p className="text-xs text-gray-400 mt-1">Importez des articles pour voir les stats</p>
              </div>
            )}
          </div>
        </div>

        {/* Mouvements mois */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-600">Mouvements du mois</h4>
          </div>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-3 border border-green-100">
                <TrendingUp size={22} className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.total_entrees_mois}</p>
              <p className="text-xs font-semibold text-gray-500 mt-1">Entrées</p>
            </div>
            <div className="w-px h-16 bg-gray-100" />
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3 border border-red-100">
                <TrendingDown size={22} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.total_sorties_mois}</p>
              <p className="text-xs font-semibold text-gray-500 mt-1">Sorties</p>
            </div>
          </div>
        </div>
      </div>

      {/* Derniers mouvements */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
            <Activity size={13} className="text-blue-600" />
          </div>
          <h2 className="text-sm font-semibold text-gray-700">Derniers mouvements</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.derniers_mouvements.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">Aucun mouvement récent</div>
          ) : stats.derniers_mouvements.map((m, idx) => (
            <div key={idx} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.type === 'entree' ? 'bg-green-50' : m.type === 'sortie' ? 'bg-red-50' : 'bg-amber-50'}`}>
                  {m.type === 'entree' && <TrendingUp size={14} className="text-green-600" />}
                  {m.type === 'sortie' && <TrendingDown size={14} className="text-red-500" />}
                  {m.type === 'ajustement' && <AlertTriangle size={14} className="text-amber-500" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{m.article?.designation || 'Article'}</p>
                  <p className="text-[11px] text-gray-400">{new Date(m.created_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${m.type === 'entree' ? 'text-green-600' : 'text-red-500'}`}>
                  {m.type === 'entree' ? '+' : '-'}{m.quantite}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.user?.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}