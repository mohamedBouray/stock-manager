// src/pages/Admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, TrendingUp, TrendingDown, AlertTriangle, Users, ShoppingCart, Calendar } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        total_articles: 0,
        total_commandes: 0,
        stocks_alertes: 0,
        mouvements_semaine: 0,
        commandes_en_attente: 0,
        utilisateurs_actifs: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Statistiques système
            const sysStats = await api.get('/api/admin/system/stats');
            setStats({
                total_articles: sysStats.data.total_articles || 0,
                total_commandes: sysStats.data.total_commandes || 0,
                stocks_alertes: sysStats.data.stocks_alertes || 0,
                mouvements_semaine: sysStats.data.mouvements_semaine || 0,
                commandes_en_attente: sysStats.data.commandes_en_attente || 0,
                utilisateurs_actifs: sysStats.data.active_users || 0
            });
            setRecentActivities(sysStats.data.recent_activities || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        { label: 'Articles en stock', value: stats.total_articles, icon: Package, color: 'bg-blue-500' },
        { label: 'Commandes en attente', value: stats.commandes_en_attente, icon: ShoppingCart, color: 'bg-orange-500' },
        { label: 'Alertes stock bas', value: stats.stocks_alertes, icon: AlertTriangle, color: 'bg-red-500' },
        { label: 'Mouvements semaine', value: stats.mouvements_semaine, icon: TrendingUp, color: 'bg-green-500' },
        { label: 'Utilisateurs actifs', value: stats.utilisateurs_actifs, icon: Users, color: 'bg-purple-500' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="w-10 h-10 border-3 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">🏠 Dashboard Administrateur</h1>
                <p className="text-sm text-gray-500 mt-1">Vue d'ensemble du système de gestion des stocks</p>
            </div>

            {/* Cartes statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                                </div>
                                <div className={`${stat.color} p-3 rounded-xl`}>
                                    <Icon size={20} className="text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Graphiques rapides */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Stock par catégorie */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">📊 Stock par catégorie</h3>
                    <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                        <p className="text-gray-400">Graphique à implémenter avec Chart.js</p>
                    </div>
                </div>

                {/* Mouvements 30 jours */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">📈 Mouvements (30 jours)</h3>
                    <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                        <p className="text-gray-400">Graphique à implémenter avec Chart.js</p>
                    </div>
                </div>
            </div>

            {/* Activités récentes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">🔄 Activités récentes</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentActivities.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">Aucune activité récente</div>
                    ) : (
                        recentActivities.map((activity, index) => (
                            <div key={index} className="px-6 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Users size={14} className="text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800">{activity.details}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}