import React, { useState, useEffect } from 'react';
import { Package, Clock, FileText, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../../lib/apis/axios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
    y: { grid: { color: '#f1f5f9', borderDash: [4, 4] }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
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

function StatCard({ title, value, subValue, icon: Icon, accent = '#2563eb' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: accent + '18' }}>
        <Icon size={18} style={{ color: accent }} />
      </div>
      <p className="text-2xl font-bold text-gray-800 tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{title}</p>
      {subValue && <p className="text-[11px] text-gray-400 mt-1">{subValue}</p>}
    </div>
  );
}

function StatusBadge({ statut }) {
  const map = {
    en_attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    approuvee:  { label: 'Approuvée',  cls: 'bg-green-50 text-green-700 border border-green-200' },
    refusee:    { label: 'Refusée',    cls: 'bg-red-50 text-red-600 border border-red-200' },
    livree:     { label: 'Livrée',     cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    confirmee:  { label: 'Confirmée',  cls: 'bg-green-50 text-green-700 border border-green-200' },
    annulee:    { label: 'Annulée',    cls: 'bg-red-50 text-red-600 border border-red-200' },
  };
  const cfg = map[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

export default function UserDashboard() {
  const [stats, setStats] = useState({
    total_demandes: 0, demandes_en_attente: 0, demandes_approuvees: 0,
    demandes_refusees: 0, demandes_livrees: 0, dernieres_demandes: [],
    total_reservations: 0, reservations_en_attente: 0, reservations_confirmees: 0,
    dernieres_reservations: [], articles_disponibles: 0, total_articles: 0,
    articles_stock_bas: 0, articles_rupture: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const userString = localStorage.getItem('user');
    if (userString) { try { setUser(JSON.parse(userString)); } catch (e) {} }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const demandesResponse = await api.get('/api/user/demandes');
      let demandesData = [];
      if (demandesResponse.data?.data?.data) demandesData = demandesResponse.data.data.data;
      else if (demandesResponse.data?.data && Array.isArray(demandesResponse.data.data)) demandesData = demandesResponse.data.data;
      else if (Array.isArray(demandesResponse.data)) demandesData = demandesResponse.data;

      const reservationsResponse = await api.get('/api/user/reservations');
      let reservationsData = [];
      if (reservationsResponse.data?.data) {
        reservationsData = Array.isArray(reservationsResponse.data.data)
          ? reservationsResponse.data.data
          : (reservationsResponse.data.data.data || []);
      }
      const stockStatsResponse = await api.get('/api/user/stock/stats');
      let stockStats = {};
      if (stockStatsResponse.data?.data) stockStats = stockStatsResponse.data.data;

      const articlesResponse = await api.get('/api/user/stock/articles');
      let articlesData = [];
      if (articlesResponse.data?.data?.data) articlesData = articlesResponse.data.data.data;
      else if (articlesResponse.data?.data && Array.isArray(articlesResponse.data.data)) articlesData = articlesResponse.data.data;
      else if (Array.isArray(articlesResponse.data)) articlesData = articlesResponse.data;

      const seuilAlerte = 10; 

      let disponibles = 0;
      let stockBas = 0;
      let rupture = 0;

      articlesData.forEach(article => {
        const stock = article.quantite_stock || 0;
        const seuil = article.seuil_alerte || 10;
        
        if (stock === 0) {
          rupture++;
        } else if (stock <= seuil) {
          stockBas++;
        } else {
          disponibles++;
        }
      });

      setStats({
        total_demandes: demandesData.length,
        demandes_en_attente: demandesData.filter(d => d.statut === 'en_attente').length,
        demandes_approuvees: demandesData.filter(d => d.statut === 'approuvee').length,
        demandes_refusees: demandesData.filter(d => d.statut === 'refusee').length,
        demandes_livrees: demandesData.filter(d => d.statut === 'livree').length,
        dernieres_demandes: demandesData.slice(0, 5),
        total_reservations: reservationsData.length,
        reservations_en_attente: reservationsData.filter(r => r.statut === 'en_attente').length,
        reservations_confirmees: reservationsData.filter(r => r.statut === 'confirmee').length,
        dernieres_reservations: reservationsData.slice(0, 5),
        articles_disponibles: disponibles,
        total_articles: articlesData.length,
        articles_stock_bas: stockBas,
        articles_rupture: rupture,
      });
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tauxApprobation = stats.total_demandes > 0
    ? Math.round(((stats.demandes_approuvees + stats.demandes_livrees) / stats.total_demandes) * 100)
    : 0;

  const demandesChartData = {
    labels: ['En attente', 'Approuvées', 'Refusées', 'Livrées'],
    datasets: [{
      label: 'Demandes',
      data: [stats.demandes_en_attente, stats.demandes_approuvees, stats.demandes_refusees, stats.demandes_livrees],
      backgroundColor: ['#f59e0b22', '#2563eb22', '#ef444422', '#10b98122'],
      borderColor: ['#f59e0b', '#2563eb', '#ef4444', '#10b981'],
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* En-tête */}
      <div className="mb-7">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>Espace personnel</span><span className="mx-1">›</span>
          <span className="text-gray-600 font-medium">Dashboard</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Bonjour, {user?.name?.split(' ')[0] || 'Demandeur'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Voici un aperçu de votre activité</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title="Total demandes"    value={stats.total_demandes}                                          icon={FileText}   accent="#2563eb" />
        <StatCard title="Demandes actives"  value={stats.demandes_en_attente + stats.demandes_approuvees}         icon={Clock}      accent="#f59e0b" subValue={`${stats.demandes_en_attente} en attente`} />
        <StatCard title="Taux d'approbation" value={`${tauxApprobation}%`}                                        icon={TrendingUp} accent="#10b981" />
        <StatCard title="Réservations"      value={stats.total_reservations}                                      icon={Calendar}   accent="#8b5cf6" subValue={`${stats.reservations_en_attente} en attente`} />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <BarChart3 size={14} className="text-blue-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-600">État des demandes</h4>
          </div>
          <div style={{ height: 200 }}>
            <Bar data={demandesChartData} options={BAR_OPTS} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
              <Package size={14} className="text-green-600" />
            </div>
            <h4 className="text-sm font-semibold text-gray-600">Disponibilité du stock</h4>
          </div>
          <div style={{ height: 200 }}>
            <Doughnut data={stockChartData} options={DONUT_OPTS} />
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Dernières demandes */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText size={13} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Dernières demandes</h3>
            </div>
            <button className="text-xs text-blue-600 hover:underline font-medium">Voir tout →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.dernieres_demandes.length === 0 ? (
              <div className="p-10 text-center">
                <Package size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucune demande</p>
              </div>
            ) : stats.dernieres_demandes.map(demande => (
              <div key={demande.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Package size={13} className="text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{demande.article?.designation || 'Article'}</p>
                    <p className="text-[11px] text-gray-400">Qté: {demande.quantite_demandee} · {new Date(demande.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <StatusBadge statut={demande.statut} />
              </div>
            ))}
          </div>
        </div>

        {/* Dernières réservations */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar size={13} className="text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Dernières réservations</h3>
            </div>
            <button className="text-xs text-blue-600 hover:underline font-medium">Voir tout →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.dernieres_reservations.length === 0 ? (
              <div className="p-10 text-center">
                <Calendar size={36} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucune réservation</p>
              </div>
            ) : stats.dernieres_reservations.map(res => (
              <div key={res.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Calendar size={13} className="text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{res.article?.designation || 'Article'}</p>
                    <p className="text-[11px] text-gray-400">
                      Qté: {res.quantite} · {new Date(res.date_debut).toLocaleDateString('fr-FR')} → {new Date(res.date_fin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <StatusBadge statut={res.statut} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}