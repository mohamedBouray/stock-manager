// src/pages/Admin/Rapports.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Printer, FileSpreadsheet, FileJson, AlertTriangle, CheckCircle, Clock, Filter, Package } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

export default function Rapports() {
    const [reportType, setReportType] = useState('mission');
    const [dateRange, setDateRange] = useState({
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: new Date().toISOString().split('T')[0]
    });
    const [selectedArticleId, setSelectedArticleId] = useState('');
    const [articlesList, setArticlesList] = useState([]);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [actionModal, setActionModal] = useState({ 
        isOpen: false, 
        type: 'success', 
        title: '', 
        message: '', 
        confirmText: 'OK', 
        onConfirm: null 
    });

    const openConfirmModal = (type, title, message, confirmText, onConfirm) => {
        setActionModal({ 
            isOpen: true, 
            type, 
            title, 
            message, 
            confirmText, 
            onConfirm: () => { 
                if (onConfirm) onConfirm(); 
                setActionModal(prev => ({ ...prev, isOpen: false })); 
            } 
        });
    };

    const reports = [
        { id: 'mission', name: 'Rapport de mission', icon: FileText, desc: 'Rapport complet de la mission', color: 'bg-blue-600' },
        { id: 'journalier', name: 'Mouvements journaliers', icon: Calendar, desc: 'Mouvements par article et magasin', color: 'bg-blue-600' },
        { id: 'approvisionnements', name: 'Approvisionnements', icon: FileSpreadsheet, desc: 'Commandes par période', color: 'bg-blue-600' },
        { id: 'sorties', name: 'Situation des sorties', icon: Printer, desc: 'Sorties selon critères', color: 'bg-blue-600' },
        { id: 'fiche_stock_globale', name: 'Fiche de stock globale', icon: FileJson, desc: 'Stock complet de tous les articles', color: 'bg-blue-600' },
        { id: 'fiche_stock', name: 'Fiche de stock par article', icon: FileJson, desc: 'Fiche détaillée par article', color: 'bg-blue-600' },
        { id: 'alertes', name: 'Rapport Alertes', icon: AlertTriangle, desc: 'Articles en alerte stock', color: 'bg-blue-600' }
    ];

    const getReportUrl = () => {
        switch(reportType) {
            case 'mission': 
                return '/api/admin/rapports/mission';
            case 'journalier': 
                return `/api/admin/rapports/mouvements-journaliers?date=${dateRange.date_debut}`;
            case 'approvisionnements': 
                return `/api/admin/rapports/approvisionnements?date_debut=${dateRange.date_debut}&date_fin=${dateRange.date_fin}`;
            case 'sorties': 
                return `/api/admin/rapports/sorties?date_debut=${dateRange.date_debut}&date_fin=${dateRange.date_fin}`;
            case 'fiche_stock_globale': 
                return `/api/admin/rapports/fiche-stock-globale?date_debut=${dateRange.date_debut}&date_fin=${dateRange.date_fin}`;
            case 'fiche_stock': 
                return `/api/admin/rapports/fiche-stock/${selectedArticleId}?date_debut=${dateRange.date_debut}&date_fin=${dateRange.date_fin}`;
            case 'alertes': 
                return '/api/admin/rapports/alertes';
            default: 
                return '';
        }
    };

    const fetchArticles = async () => {
        setLoadingArticles(true);
        try {
            const response = await api.get('/api/user/stock/articles');
            let data = [];
            if (response.data?.data?.data) data = response.data.data.data;
            else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
            setArticlesList(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingArticles(false);
        }
    };

    useEffect(() => {
        if (reportType === 'fiche_stock' && articlesList.length === 0) {
            fetchArticles();
        }
    }, [reportType]);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setPreview(null);
        
        try {
            const url = getReportUrl();
            if (!url) throw new Error('URL non valide');
            
            if (reportType === 'fiche_stock' && !selectedArticleId) {
                openConfirmModal('warning', 'Attention', 'Veuillez sélectionner un article', 'OK', null);
                setLoading(false);
                return;
            }

            const response = await api.get(url, { responseType: 'blob' });
            if (response.data.size === 0) throw new Error('Le fichier généré est vide');
            
            const filename = `${reportType}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url_blob = window.URL.createObjectURL(blob);
            
            setPreview(url_blob);
            
            const link = document.createElement('a');
            link.href = url_blob;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            setTimeout(() => window.URL.revokeObjectURL(url_blob), 100);
            openConfirmModal('success', 'Succès', 'Rapport généré avec succès', 'OK', null);
        } catch (error) {
            setError(error.response?.data?.message || error.message);
            openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur lors de la génération', 'OK', null);
        } finally {
            setLoading(false);
        }
    };

    const currentReport = reports.find(r => r.id === reportType);
    const needsDateRange = ['journalier', 'approvisionnements', 'sorties', 'fiche_stock', 'fiche_stock_globale'].includes(reportType);
    const needsArticle = reportType === 'fiche_stock';
    const isGlobalStock = reportType === 'fiche_stock_globale';

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Rapports PDF</h1>
                <p className="text-sm text-gray-500 mt-0.5">Générez vos rapports de gestion au format PDF</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liste des rapports */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Filter size={16} /> Types de rapports
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {reports.map((report) => {
                            const Icon = report.icon;
                            const isActive = reportType === report.id;
                            return (
                                <button
                                    key={report.id}
                                    onClick={() => {
                                        setReportType(report.id);
                                        if (report.id !== 'fiche_stock') {
                                            setSelectedArticleId('');
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 p-4 text-left transition ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? report.color : 'bg-gray-100'}`}>
                                        <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>{report.name}</p>
                                        <p className="text-xs text-gray-400">{report.desc}</p>
                                    </div>
                                    {isActive && <CheckCircle size={14} className="text-blue-600" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Zone de configuration */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                {currentReport && <currentReport.icon size={20} className="text-white" />}
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">{currentReport?.name}</h2>
                                <p className="text-xs text-gray-500">{currentReport?.desc}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-5">
                        {needsDateRange && (
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Calendar size={14} className="text-blue-600" /> Période
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Date début</label>
                                        <input 
                                            type="date" 
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" 
                                            value={dateRange.date_debut} 
                                            onChange={(e) => setDateRange({ ...dateRange, date_debut: e.target.value })} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Date fin</label>
                                        <input 
                                            type="date" 
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" 
                                            value={dateRange.date_fin} 
                                            onChange={(e) => setDateRange({ ...dateRange, date_fin: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                {isGlobalStock && (
                                    <p className="text-xs text-blue-600 mt-2">
                                        📌 La fiche de stock globale affiche tous les articles avec leurs stocks actuels
                                    </p>
                                )}
                            </div>
                        )}

                        {needsArticle && (
                            <div className="mb-5">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                    <Package size={14} className="text-blue-600" /> Article
                                </label>
                                <select
                                    value={selectedArticleId}
                                    onChange={(e) => setSelectedArticleId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                                    disabled={loadingArticles}
                                >
                                    <option value="">-- Sélectionner un article --</option>
                                    {articlesList.map(article => (
                                        <option key={article.id} value={article.id}>
                                            {article.designation} - {article.code_barre} (Stock: {article.quantite_stock})
                                        </option>
                                    ))}
                                </select>
                                {loadingArticles && (
                                    <p className="text-xs text-gray-400 mt-1">Chargement des articles...</p>
                                )}
                            </div>
                        )}

                        <button 
                            onClick={handleGenerate} 
                            disabled={loading} 
                            className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> Génération...</>
                            ) : (
                                <><Download size={16} /> Générer le rapport PDF</>
                            )}
                        </button>

                        <div className="mt-5 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                                <Clock size={12} /> Informations
                            </h4>
                            <ul className="text-xs text-gray-500 space-y-1">
                                <li>• Les rapports sont générés au format PDF</li>
                                <li>• La fiche de stock globale affiche tous les articles</li>
                                <li>• La fiche de stock par article inclut l'historique complet</li>
                                <li>• Le rapport de mission contient l'inventaire complet</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <ActionConfirmModal
                isOpen={actionModal.isOpen}
                onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={actionModal.onConfirm}
                title={actionModal.title}
                message={actionModal.message}
                type={actionModal.type}
                confirmText={actionModal.confirmText}
                cancelText="Annuler"
            />
        </div>
    );
}