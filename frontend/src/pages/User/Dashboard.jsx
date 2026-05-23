import React, { useState, useEffect } from 'react';
import {
  Package, Clock, CheckCircle, XCircle, Calendar,
  TrendingUp, FileText, TrendingDown, AlertCircle,
  BarChart3, PieChart, Activity, Users, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import api from '../../lib/apis/axios';

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
                style={{ width: `${(data.values[idx] / maxValue) * 100}%`, backgroundColor: color, opacity: 0.85 + (idx * 0.05) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomPieChart({ data, title }) {
  const total = data.values.reduce((a, b) => a + b, 0);
  let currentAngle = 0;
  const colors = ["#2563eb", "#f59e0b", "#ef4444", "#10b981", "#8b5cf6"];

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
      <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
        <PieChart size={15} className="text-blue-600" />
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
            <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="rotate-90" style={{ fontSize: '11px', fontWeight: 700, fill: '#1e3a5f', transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}>
              {total}
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          {data.labels.map((label, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
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

function StatCard({ title, value, subValue, icon: Icon, accent = "#2563eb", trend, trendValue }) {
  const bgLight = accent + '12';
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bgLight }}
        >
          <Icon size={18} style={{ color: accent }} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-1 tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">{title}</p>
      {subValue && <p className="text-[11px] text-gray-400 mt-1">{subValue}</p>}
    </div>
  );
}

function StatusBadge({ statut }) {
  const map = {
    en_attente: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    approuvee: { label: 'Approuvée', cls: 'bg-green-50 text-green-700 border border-green-200' },
    refusee: { label: 'Refusée', cls: 'bg-red-50 text-red-600 border border-red-200' },
    livree: { label: 'Livrée', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    confirmee: { label: 'Confirmée', cls: 'bg-green-50 text-green-700 border border-green-200' },
    annulee: { label: 'Annulée', cls: 'bg-red-50 text-red-600 border border-red-200' },
  };
  const cfg = map[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_demandes: 0, demandes_en_attente: 0, demandes_approuvees: 0,
    demandes_refusees: 0, demandes_livrees: 0, dernieres_demandes: [],
    total_reservations: 0, reservations_en_attente: 0, reservations_confirmees: 0,
    dernieres_reservations: [], articles_disponibles: 0, total_articles: 0,
    articles_stock_bas: 0, articles_rupture: 0
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
        articles_disponibles: stockStats.articles_en_stock || 0,
        total_articles: articlesData.length,
        articles_stock_bas: stockStats.articles_stock_bas || 0,
        articles_rupture: stockStats.articles_rupture || 0
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
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const demandesActives = stats.demandes_en_attente + stats.demandes_approuvees;
  const tauxApprobation = stats.total_demandes > 0
    ? Math.round(((stats.demandes_approuvees + stats.demandes_livrees) / stats.total_demandes) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-3">

      {/* Header de page */}
      <div className="mb-7">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <span>Espace personnel</span>
          <span className="mx-1">›</span>
          <span className="text-gray-600 font-medium">Tableau de bord</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Bonjour, {user?.name?.split(' ')[0] || 'Demandeur'} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Voici un aperçu de votre activité</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total demandes"
          value={stats.total_demandes}
          icon={FileText}
          accent="#2563eb"
          trend="up"
          trendValue="ce mois"
        />
        <StatCard
          title="Demandes actives"
          value={demandesActives}
          subValue={`${stats.demandes_en_attente} en attente · ${stats.demandes_approuvees} approuvées`}
          icon={Clock}
          accent="#f59e0b"
        />
        <StatCard
          title="Taux d'approbation"
          value={`${tauxApprobation}%`}
          icon={TrendingUp}
          accent="#10b981"
          trend={tauxApprobation >= 50 ? 'up' : 'down'}
          trendValue={`${tauxApprobation}%`}
        />
        <StatCard
          title="Réservations"
          value={stats.total_reservations}
          subValue={`${stats.reservations_en_attente} en attente · ${stats.reservations_confirmees} confirmées`}
          icon={Calendar}
          accent="#8b5cf6"
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <BarChart
          data={{
            labels: ['En attente', 'Approuvées', 'Refusées', 'Livrées'],
            values: [stats.demandes_en_attente, stats.demandes_approuvees, stats.demandes_refusees, stats.demandes_livrees]
          }}
          title="État des demandes"
          color="#2563eb"
        />
        <CustomPieChart
          data={{
            labels: ['Disponible', 'Stock bas', 'Rupture'],
            values: [stats.articles_disponibles, stats.articles_stock_bas, stats.articles_rupture]
          }}
          title="Disponibilité du stock"
        />
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Dernières Demandes */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText size={14} className="text-blue-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Dernières demandes</h2>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Voir tout →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.dernieres_demandes.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Package size={22} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Aucune demande</p>
                <button className="mt-2 text-xs text-blue-600 hover:underline">
                  + Créer ma première demande
                </button>
              </div>
            ) : (
              stats.dernieres_demandes.map((demande) => (
                <div key={demande.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Package size={14} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{demande.article?.designation || 'Article'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">Qté: {demande.quantite_demandee}</span>
                        <span className="text-[11px] text-gray-300">•</span>
                        <span className="text-[11px] text-gray-400">{new Date(demande.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge statut={demande.statut} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dernières Réservations */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                <Calendar size={14} className="text-purple-600" />
              </div>
              <h2 className="text-sm font-semibold text-gray-700">Dernières réservations</h2>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline">
              Voir tout →
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.dernieres_reservations.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Calendar size={22} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Aucune réservation</p>
                <button className="mt-2 text-xs text-blue-600 hover:underline">
                  + Réserver un article
                </button>
              </div>
            ) : (
              stats.dernieres_reservations.map((reservation) => (
                <div key={reservation.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Calendar size={14} className="text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{reservation.article?.designation || 'Article'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">Qté: {reservation.quantite}</span>
                        <span className="text-[11px] text-gray-300">•</span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(reservation.date_debut).toLocaleDateString('fr-FR')} → {new Date(reservation.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge statut={reservation.statut} />
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}