// src/pages/User/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function Dashboard() {
    const [stats, setStats] = useState({
        total_demandes: 0,
        demandes_en_attente: 0,
        demandes_approuvees: 0,
        demandes_refusees: 0,
        demandes_livrees: 0,
        dernieres_demandes: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/api/user/demandes');
            console.log("Dashboard response:", response.data);
            
            // ✅ CORRECTION: Extraire correctement le tableau des demandes
            let demandesData = [];
            if (response.data?.data?.data) {
                // Structure paginée: { success: true, data: { data: [...] } }
                demandesData = response.data.data.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                // Structure simple: { success: true, data: [...] }
                demandesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                demandesData = response.data;
            }
            
            setStats({
                total_demandes: demandesData.length,
                demandes_en_attente: demandesData.filter(d => d.statut === 'en_attente').length,
                demandes_approuvees: demandesData.filter(d => d.statut === 'approuvee').length,
                demandes_refusees: demandesData.filter(d => d.statut === 'refusee').length,
                demandes_livrees: demandesData.filter(d => d.statut === 'livree').length,
                dernieres_demandes: demandesData.slice(0, 5)
            });
        } catch (error) {
            console.error(error);
            setStats({
                total_demandes: 0,
                demandes_en_attente: 0,
                demandes_approuvees: 0,
                demandes_refusees: 0,
                demandes_livrees: 0,
                dernieres_demandes: []
            });
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        { label: 'Total demandes', value: stats.total_demandes, icon: Package, color: 'bg-blue-500' },
        { label: 'En attente', value: stats.demandes_en_attente, icon: Clock, color: 'bg-yellow-500' },
        { label: 'Approuvées', value: stats.demandes_approuvees, icon: CheckCircle, color: 'bg-green-500' },
        { label: 'Refusées', value: stats.demandes_refusees, icon: XCircle, color: 'bg-red-500' },
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* En-tête */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Tableau de bord</h1>
                <p className="text-sm text-gray-500 mt-1">Bienvenue dans votre espace demandeur</p>
            </div>

            {/* Cartes statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

            {/* Dernières demandes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">📋 Dernières demandes</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {stats.dernieres_demandes.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">Aucune demande pour le moment</div>
                    ) : (
                        stats.dernieres_demandes.map((demande) => (
                            <div key={demande.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-800">{demande.article?.designation || 'Article'}</p>
                                    <p className="text-sm text-gray-500 mt-1">Quantité: {demande.quantite_demandee}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        demande.statut === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                                        demande.statut === 'approuvee' ? 'bg-green-100 text-green-800' :
                                        demande.statut === 'refusee' ? 'bg-red-100 text-red-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {demande.statut === 'en_attente' ? 'En attente' :
                                         demande.statut === 'approuvee' ? 'Approuvée' :
                                         demande.statut === 'refusee' ? 'Refusée' : 'Livrée'}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(demande.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}