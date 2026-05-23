// src/pages/Admin/Rapports.jsx
import React, { useState } from 'react';
import { FileText, Download, Calendar, Printer, FileSpreadsheet, FileJson, AlertTriangle, CheckCircle, Clock, Filter, XCircle, RefreshCw } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function Rapports() {
    const [reportType, setReportType] = useState('mission');
    const [dateRange, setDateRange] = useState({
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: new Date().toISOString().split('T')[0]
    });
    const [articleId, setArticleId] = useState('');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);

    const reports = [
        { id: 'mission', name: 'Rapport de mission', icon: FileText, desc: 'Rapport complet de la mission (inventaire, statistiques)', color: 'bg-emerald-600' },
        { id: 'journalier', name: 'Mouvements journaliers', icon: Calendar, desc: 'Mouvements par article, magasin et responsable', color: 'bg-blue-600' },
        { id: 'approvisionnements', name: 'Approvisionnements', icon: FileSpreadsheet, desc: 'Commandes par période', color: 'bg-purple-600' },
        { id: 'sorties', name: 'Situation des sorties', icon: Printer, desc: 'Sorties selon critères', color: 'bg-orange-600' },
        { id: 'fiche_stock', name: 'Fiche de stock', icon: FileJson, desc: 'Fiche détaillée par article', color: 'bg-teal-600' },
        { id: 'alertes', name: 'Rapport Alertes', icon: AlertTriangle, desc: 'Liste des articles en alerte stock', color: 'bg-red-600' }
    ];

    const getReportUrl = () => {
        switch(reportType) {
            case 'mission': return '/api/admin/rapports/mission';
            case 'journalier': return `/api/admin/rapports/mouvements-journaliers?date=${dateRange.date_debut}`;
            case 'approvisionnements': return `/api/admin/rapports/approvisionnements?date_debut=${dateRange.date_debut}&date_fin=${dateRange.date_fin}`;
            case 'sorties': return `/api/admin/rapports/sorties?date_debut=${dateRange.date_debut}&date_fin=${dateRange.date_fin}`;
            case 'fiche_stock': return `/api/admin/rapports/fiche-stock/${articleId}?date_debut=${dateRange.date_debut}&date_fin=${dateRange.date_fin}`;
            case 'alertes': return '/api/admin/rapports/alertes';
            default: return '';
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setPreview(null);
        
        try {
            const url = getReportUrl();
            if (!url) throw new Error('URL non valide');
            if (reportType === 'fiche_stock' && !articleId) {
                alert('Veuillez saisir un ID d\'article');
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
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'Erreur lors de la génération');
            alert('Erreur: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const currentReport = reports.find(r => r.id === reportType);
    const needsDateRange = ['journalier', 'approvisionnements', 'sorties', 'fiche_stock'].includes(reportType);
    const needsArticle = reportType === 'fiche_stock';

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <FileText size={20} className="text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">📊 Rapports PDF</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Générez vos rapports de gestion au format PDF</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Liste des rapports */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Filter size={16} className="text-emerald-600" />
                            Types de rapports
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                        {reports.map((report) => {
                            const Icon = report.icon;
                            const isActive = reportType === report.id;
                            return (
                                <button
                                    key={report.id}
                                    onClick={() => setReportType(report.id)}
                                    className={`w-full flex items-center gap-3 p-4 text-left transition-all duration-200 ${
                                        isActive ? 'bg-emerald-50 border-l-4 border-emerald-600' : 'hover:bg-gray-50 border-l-4 border-transparent'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? report.color : 'bg-gray-100'}`}>
                                        <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${isActive ? 'text-emerald-700' : 'text-gray-700'}`}>{report.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{report.desc}</p>
                                    </div>
                                    {isActive && <CheckCircle size={14} className="text-emerald-600" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Zone de configuration */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${currentReport?.color || 'bg-emerald-600'}`}>
                                {currentReport && <currentReport.icon size={22} className="text-white" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">{currentReport?.name}</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{currentReport?.desc}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                                <XCircle size={20} className="text-red-500" />
                                <div><p className="text-sm font-medium text-red-700">Erreur</p><p className="text-xs text-red-600">{error}</p></div>
                                <button onClick={() => setError(null)} className="ml-auto text-red-500"><RefreshCw size={16} /></button>
                            </div>
                        )}

                        {preview && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2"><FileText size={14} /> Aperçu du document</p>
                                    <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600"><XCircle size={16} /></button>
                                </div>
                                <iframe src={preview} className="w-full h-64 rounded-lg border border-gray-200" title="Aperçu PDF" />
                            </div>
                        )}

                        {needsDateRange && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><Calendar size={14} className="text-emerald-600" /> Période</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="block text-xs text-gray-500 mb-1">Date début</label><input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition" value={dateRange.date_debut} onChange={(e) => setDateRange({ ...dateRange, date_debut: e.target.value })} /></div>
                                    <div><label className="block text-xs text-gray-500 mb-1">Date fin</label><input type="date" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition" value={dateRange.date_fin} onChange={(e) => setDateRange({ ...dateRange, date_fin: e.target.value })} /></div>
                                </div>
                            </div>
                        )}

                        {needsArticle && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2"><FileJson size={14} className="text-emerald-600" /> Article</label>
                                <input type="text" placeholder="ID de l'article ou Code barre" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition" value={articleId} onChange={(e) => setArticleId(e.target.value)} />
                                <p className="text-xs text-gray-400 mt-2">Entrez l'ID ou le code barre de l'article</p>
                            </div>
                        )}

                        <button onClick={handleGenerate} disabled={loading} className={`w-full py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : `bg-gradient-to-r ${currentReport?.color || 'from-emerald-600 to-emerald-700'} text-white hover:shadow-lg hover:-translate-y-0.5`}`}>
                            {loading ? <><div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" /> Génération en cours...</> : <><Download size={18} /> Générer le rapport PDF</>}
                        </button>

                        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock size={14} className="text-emerald-600" /> Informations</h4>
                            <ul className="text-xs text-gray-500 space-y-2">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Les rapports sont générés au format PDF</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Les fiches de stock incluent l'historique complet</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Le rapport de mission contient l'inventaire complet</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}