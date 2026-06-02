// src/pages/Admin/Dashboard.jsx - Version optimisée
import React, { useState, useEffect } from 'react';
import { 
  Package, TrendingUp, AlertTriangle, Users, ShoppingCart, 
  BarChart3, PieChart, Activity, Truck, CheckCircle, 
  Clock, XCircle, ArrowUp, ArrowDown, RefreshCw 
} from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title, 
  PointElement, LineElement, Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../../lib/apis/axios';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale, LinearScale, 
  BarElement, Title, PointElement, LineElement, Filler
);

// ✅ DONNÉES PAR DÉFAUT (affichées immédiatement)
const DEFAULT_STATS = {
  total_articles: 0,
  total_commandes: 0,
  stocks_alertes: 0,
  mouvements_semaine: 0,
  commandes_en_attente: 0,
  utilisateurs_actifs: 0,
  demandes_mois: 0,
  valeur_stock_total: 0
};

const DEFAULT_MOUVEMENTS = [];
const DEFAULT_ACTIVITIES = [];

const StatCard = ({ label, value, icon: Icon, accent, change, changeType }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all duration-300 group">
    <div className="flex items-start justify-between mb-3">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" 
           style={{ backgroundColor: accent + '15' }}>
        <Icon size={20} style={{ color: accent }} />
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${changeType === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
          {changeType === 'up' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-800 tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">{label}</p>
  </div>
);

const ActivityItem = ({ activity }) => {
  const getIcon = () => {
    if (activity.action?.includes('login')) return <Users size={12} />;
    if (activity.action?.includes('demande')) return <Package size={12} />;
    if (activity.action?.includes('stock')) return <TrendingUp size={12} />;
    return <Activity size={12} />;
  };
  
  const getBgColor = () => {
    if (activity.action?.includes('login')) return 'bg-blue-50 text-blue-600';
    if (activity.action?.includes('demande')) return 'bg-amber-50 text-amber-600';
    if (activity.action?.includes('stock')) return 'bg-emerald-50 text-emerald-600';
    return 'bg-gray-50 text-gray-600';
  };

  return (
    <div className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${getBgColor()}`}>
        {getIcon()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-700">{activity.details || activity.action}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {new Date(activity.created_at).toLocaleString('fr-FR', { 
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  // ✅ État avec valeurs par défaut (pas de loading initial)
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [mouvementsData, setMouvementsData] = useState(DEFAULT_MOUVEMENTS);
  const [stockParCategorie, setStockParCategorie] = useState([]);
  const [recentActivities, setRecentActivities] = useState(DEFAULT_ACTIVITIES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('week');
  const [dataLoaded, setDataLoaded] = useState(false);

  // ✅ Chargement des données avec cache localStorage
  const fetchDashboardData = async (isRefresh = false) => {
    if (!isRefresh && dataLoaded) return;
    
    try {
      // 1. D'abord, essayer de charger depuis localStorage (instantané)
      const cachedStats = localStorage.getItem('dashboard_stats');
      const cachedMouvements = localStorage.getItem('dashboard_mouvements');
      const cachedActivities = localStorage.getItem('dashboard_activities');
      
      if (cachedStats && !isRefresh) {
        setStats(JSON.parse(cachedStats));
        setMouvementsData(JSON.parse(cachedMouvements || '[]'));
        setRecentActivities(JSON.parse(cachedActivities || '[]'));
        setLoading(false);
      }
      
      // 2. Puis charger depuis l'API en background
      const [sysStats, mouvements] = await Promise.all([
        api.get('/api/admin/system/stats'),
        api.get('/api/admin/mouvements/recent')
      ]);
      
      // Mettre à jour les states
      setStats({
        total_articles: sysStats.data.total_articles || 0,
        total_commandes: sysStats.data.total_commandes || 0,
        stocks_alertes: sysStats.data.stocks_alertes || 0,
        mouvements_semaine: sysStats.data.mouvements_semaine || 0,
        commandes_en_attente: sysStats.data.commandes_en_attente || 0,
        utilisateurs_actifs: sysStats.data.active_users || 0,
        demandes_mois: sysStats.data.demandes_mois || 0,
        valeur_stock_total: sysStats.data.valeur_stock_total || 0,
      });
      
      setMouvementsData(mouvements.data || []);
      setRecentActivities(sysStats.data.recent_activities || []);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('dashboard_stats', JSON.stringify(sysStats.data));
      localStorage.setItem('dashboard_mouvements', JSON.stringify(mouvements.data || []));
      localStorage.setItem('dashboard_activities', JSON.stringify(sysStats.data.recent_activities || []));
      
      // Récupérer stock par catégorie
      const stocksResponse = await api.get('/api/admin/stocks?per_page=1000');
      const stocksData = stocksResponse.data.stocks?.data || stocksResponse.data.stocks || [];
      
      const categorieMap = new Map();
      stocksData.forEach(stock => {
        const catName = stock.article?.categorie?.nom_categorie || 'Sans catégorie';
        const stockQte = stock.quantite_disponible || 0;
        categorieMap.set(catName, (categorieMap.get(catName) || 0) + stockQte);
      });
      
      setStockParCategorie(Array.from(categorieMap.entries()).map(([name, qte]) => ({ name, qte })));
      setDataLoaded(true);
      
    } catch (error) { 
      console.error('Erreur chargement dashboard:', error);
    } finally { 
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData(true);
  };

  // ... (le reste des fonctions getLastDaysLabels, getMouvementsByPeriod, etc. restent identiques)

  const getLastDaysLabels = () => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 12;
    if (period === 'year') {
      return ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    }
    return [...Array(days)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    });
  };

  const getMouvementsByPeriod = () => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 12;
    if (period === 'year') {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const entriesByMonth = new Array(12).fill(0);
      const exitsByMonth = new Array(12).fill(0);
      mouvementsData.forEach(m => {
        const month = new Date(m.created_at).getMonth();
        if (m.type === 'entree') entriesByMonth[month] += m.quantite;
        if (m.type === 'sortie') exitsByMonth[month] += m.quantite;
      });
      return { labels: months, entries: entriesByMonth, exits: exitsByMonth };
    }
    
    const labels = getLastDaysLabels();
    const entries = new Array(days).fill(0);
    const exits = new Array(days).fill(0);
    
    mouvementsData.forEach(m => {
      const mDate = new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const idx = labels.indexOf(mDate);
      if (idx !== -1) {
        if (m.type === 'entree') entries[idx] += m.quantite;
        if (m.type === 'sortie') exits[idx] += m.quantite;
      }
    });
    return { labels, entries, exits };
  };

  const { labels, entries, exits } = getMouvementsByPeriod();

  const mouvementsChartData = {
    labels,
    datasets: [
      { 
        label: 'Entrées', 
        data: entries, 
        backgroundColor: '#10b98120', 
        borderColor: '#10b981', 
        borderWidth: 2, 
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: '#10b98140'
      },
      { 
        label: 'Sorties', 
        data: exits, 
        backgroundColor: '#ef444420', 
        borderColor: '#ef4444', 
        borderWidth: 2, 
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: '#ef444440'
      },
    ],
  };

  const BAR_OPTS = {
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
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw} unités`
        }
      },
    },
    scales: {
      x: { 
        grid: { display: false }, 
        ticks: { font: { size: 10 }, color: '#94a3b8', maxRotation: 45, minRotation: 45 }
      },
      y: { 
        grid: { color: '#f1f5f9', borderDash: [4, 4] }, 
        ticks: { font: { size: 11 }, color: '#94a3b8', stepSize: 1 }
      },
    },
  };

  const DONUT_OPTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: { 
          boxWidth: 10, 
          boxHeight: 10, 
          borderRadius: 3, 
          padding: 14, 
          font: { size: 11 }, 
          color: '#475569',
          usePointStyle: true,
          pointStyle: 'circle'
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw} unités`
        }
      }
    },
    cutout: '68%',
  };

  const PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b', '#ef4444', '#84cc16', '#f97316'];

  const stockChartData = {
    labels: stockParCategorie.map(c => c.name.length > 15 ? c.name.slice(0, 12) + '...' : c.name),
    datasets: [{
      data: stockParCategorie.map(c => c.qte),
      backgroundColor: PALETTE.slice(0, stockParCategorie.length),
      borderWidth: 0,
      hoverOffset: 10,
    }],
  };

  const commandesChartData = {
    labels: ['En attente', 'Partiellement livrée', 'Livrée totalement'],
    datasets: [{
      data: [
        stats.commandes_en_attente || 0,
        Math.floor((stats.total_commandes - (stats.commandes_en_attente || 0)) * 0.3) || 0,
        (stats.total_commandes - (stats.commandes_en_attente || 0)) || 0,
      ],
      backgroundColor: ['#f59e0b', '#2563eb', '#10b981'],
      borderWidth: 0,
      hoverOffset: 10,
    }],
  };

  const statsCards = [
    { label: 'Articles en stock', value: stats.total_articles, icon: Package, accent: '#2563eb', change: 8, changeType: 'up' },
    { label: 'Commandes en attente', value: stats.commandes_en_attente, icon: ShoppingCart, accent: '#f59e0b', change: 12, changeType: 'down' },
    { label: 'Alertes stock bas', value: stats.stocks_alertes, icon: AlertTriangle, accent: '#ef4444', change: 5, changeType: 'up' },
    { label: 'Mouvements (7j)', value: stats.mouvements_semaine, icon: TrendingUp, accent: '#10b981', change: 15, changeType: 'up' },
    { label: 'Utilisateurs actifs', value: stats.utilisateurs_actifs, icon: Users, accent: '#8b5cf6', change: 3, changeType: 'up' },
    { label: 'Valeur stock', value: stats.valeur_stock_total.toLocaleString() + ' DH', icon: Package, accent: '#06b6d4' },
  ];

  // ✅ Plus de spinner de chargement ! On affiche directement les données
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header avec refresh */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <span>Administration</span><span className="mx-1">›</span>
            <span className="text-gray-600 font-medium">Tableau de bord</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Dashboard Administrateur</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d'ensemble complète du système de gestion des stocks</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['week', 'month', 'year'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards - toujours visibles même pendant le refresh */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {statsCards.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <BarChart3 size={16} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Mouvements de stock</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Entrées
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Sorties
              </span>
            </div>
          </div>
          <div style={{ height: 280 }}>
            <Bar data={mouvementsChartData} options={BAR_OPTS} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <PieChart size={16} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Répartition du stock par catégorie</h3>
          </div>
          {stockParCategorie.length > 0 ? (
            <div style={{ height: 280 }}>
              <Doughnut data={stockChartData} options={DONUT_OPTS} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">
              Aucune donnée disponible
            </div>
          )}
        </div>
      </div>

      {/* Deuxième ligne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Truck size={16} className="text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Statut des commandes</h3>
          </div>
          <div style={{ height: 240 }}>
            <Doughnut data={commandesChartData} options={DONUT_OPTS} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center pt-3 border-t border-gray-100">
            <div>
              <p className="text-lg font-bold text-amber-600">{stats.commandes_en_attente || 0}</p>
              <p className="text-[10px] text-gray-500">En attente</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{Math.floor((stats.total_commandes - (stats.commandes_en_attente || 0)) * 0.3) || 0}</p>
              <p className="text-[10px] text-gray-500">Partielle</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-600">{stats.total_commandes - (stats.commandes_en_attente || 0) || 0}</p>
              <p className="text-[10px] text-gray-500">Livrée</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Activity size={16} className="text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Demandes du mois</h3>
            </div>
            <span className="text-2xl font-bold text-gray-800">{stats.demandes_mois}</span>
          </div>
          <div className="space-y-3">
            {recentActivities.slice(0, 4).map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  {activity.statut === 'approuvee' && <CheckCircle size={14} className="text-emerald-500" />}
                  {activity.statut === 'refusee' && <XCircle size={14} className="text-red-500" />}
                  {(!activity.statut || activity.statut === 'en_attente') && <Clock size={14} className="text-amber-500" />}
                  <span className="text-sm text-gray-600">{activity.details?.slice(0, 30)}...</span>
                </div>
                <span className="text-[10px] text-gray-400">{new Date(activity.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Activity size={16} className="text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700">Activités récentes</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">Aucune activité récente</div>
            ) : recentActivities.slice(0, 6).map((activity, i) => (
              <ActivityItem key={i} activity={activity} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}