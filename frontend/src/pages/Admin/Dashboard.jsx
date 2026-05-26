import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, Users, ShoppingCart, BarChart3, PieChart, Activity } from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../../lib/apis/axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement);

const CHART_OPTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { size: 12, weight: '600' },
      bodyFont: { size: 11 },
      padding: 10,
      cornerRadius: 8,
    },
  },
};

const BAR_OPTS = {
  ...CHART_OPTS,
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
    y: { grid: { color: '#f1f5f9', borderDash: [4, 4] }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
  },
};

const DONUT_OPTS = {
  ...CHART_OPTS,
  plugins: {
    ...CHART_OPTS.plugins,
    legend: {
      display: true,
      position: 'right',
      labels: { boxWidth: 10, boxHeight: 10, borderRadius: 3, padding: 14, font: { size: 11 }, color: '#475569' },
    },
  },
  cutout: '68%',
};

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + '18' }}>
          <Icon size={18} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-800 tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_articles: 0, total_commandes: 0, stocks_alertes: 0,
    mouvements_semaine: 0, commandes_en_attente: 0, utilisateurs_actifs: 0,
  });
  const [mouvementsData, setMouvementsData] = useState([]);
  const [stockParCategorie, setStockParCategorie] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Récupérer les stats système
      const sysStats = await api.get('/api/admin/system/stats');
      setStats({
        total_articles: sysStats.data.total_articles || 0,
        total_commandes: sysStats.data.total_commandes || 0,
        stocks_alertes: sysStats.data.stocks_alertes || 0,
        mouvements_semaine: sysStats.data.mouvements_semaine || 0,
        commandes_en_attente: sysStats.data.commandes_en_attente || 0,
        utilisateurs_actifs: sysStats.data.active_users || 0,
      });
      setRecentActivities(sysStats.data.recent_activities || []);

      // 2. Récupérer les mouvements
      const mouvements = await api.get('/api/admin/mouvements/recent');
      setMouvementsData(mouvements.data || []);

      // 3. 🔥 Utiliser l'API /api/admin/stocks qui existe déjà
      const stocksResponse = await api.get('/api/admin/stocks?per_page=1000');
      const stocksData = stocksResponse.data.stocks?.data || stocksResponse.data.stocks || [];
      
      // 4. 🔥 Calculer le stock par catégorie
      const categorieMap = new Map();
      stocksData.forEach(stock => {
        const catName = stock.article?.categorie?.nom_categorie || 'Sans catégorie';
        const stockQte = stock.quantite_disponible || 0;
        categorieMap.set(catName, (categorieMap.get(catName) || 0) + stockQte);
      });
      
      setStockParCategorie(Array.from(categorieMap.entries()).map(([name, qte]) => ({ name, qte })));
      
    } catch (error) { 
      console.error('Erreur chargement dashboard:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }).reverse();

  const entreesParJour = last7Days.map(day =>
    mouvementsData.filter(m => m.type === 'entree' && new Date(m.created_at).toLocaleDateString('fr-FR') === day).reduce((s, m) => s + m.quantite, 0)
  );
  const sortiesParJour = last7Days.map(day =>
    mouvementsData.filter(m => m.type === 'sortie' && new Date(m.created_at).toLocaleDateString('fr-FR') === day).reduce((s, m) => s + m.quantite, 0)
  );

  const mouvementsChartData = {
    labels: last7Days,
    datasets: [
      { label: 'Entrées', data: entreesParJour, backgroundColor: '#10b98133', borderColor: '#10b981', borderWidth: 2, borderRadius: 6, borderSkipped: false },
      { label: 'Sorties', data: sortiesParJour, backgroundColor: '#ef444433', borderColor: '#ef4444', borderWidth: 2, borderRadius: 6, borderSkipped: false },
    ],
  };

  const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

  const stockChartData = {
    labels: stockParCategorie.map(c => c.name),
    datasets: [{
      data: stockParCategorie.map(c => c.qte),
      backgroundColor: PALETTE.slice(0, stockParCategorie.length),
      borderWidth: 0,
    }],
  };

  const commandesChartData = {
    labels: ['En attente', 'Partielle', 'Livrée'],
    datasets: [{
      data: [
        stats.commandes_en_attente || 0,
        Math.floor(stats.total_commandes * 0.2) || 0,
        stats.total_commandes - (stats.commandes_en_attente || 0),
      ],
      backgroundColor: ['#f59e0b', '#2563eb', '#10b981'],
      borderWidth: 0,
    }],
  };

  const statsCards = [
    { label: 'Articles en stock',       value: stats.total_articles,         icon: Package,      accent: '#2563eb' },
    { label: 'Commandes en attente',    value: stats.commandes_en_attente,   icon: ShoppingCart, accent: '#f59e0b' },
    { label: 'Alertes stock bas',       value: stats.stocks_alertes,         icon: AlertTriangle,accent: '#ef4444' },
    { label: 'Mouvements semaine',      value: stats.mouvements_semaine,     icon: TrendingUp,   accent: '#10b981' },
    { label: 'Utilisateurs actifs',     value: stats.utilisateurs_actifs,    icon: Users,        accent: '#8b5cf6' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>Admin</span><span className="mx-1">›</span>
          <span className="text-gray-600 font-medium">Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard Administrateur</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble du système de gestion des stocks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {statsCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Graphiques ligne 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 size={14} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Mouvements — 7 derniers jours</h3>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Entrées</span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Sorties</span>
          </div>
          <div style={{ height: 200 }}>
            <Bar data={mouvementsChartData} options={BAR_OPTS} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <PieChart size={14} className="text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Stock par catégorie</h3>
          </div>
          {stockParCategorie.length > 0 ? (
            <div style={{ height: 200 }}>
              <Doughnut data={stockChartData} options={DONUT_OPTS} />
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              Aucune donnée. Importez des articles avec des catégories.
            </div>
          )}
        </div>
      </div>

      {/* Graphiques ligne 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <ShoppingCart size={14} className="text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Statut des commandes</h3>
          </div>
          <div style={{ height: 200 }}>
            <Doughnut data={commandesChartData} options={DONUT_OPTS} />
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <Activity size={14} className="text-purple-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Activités récentes</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">Aucune activité récente</div>
            ) : recentActivities.map((activity, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users size={12} className="text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-700 truncate">{activity.details}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{new Date(activity.created_at).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}