// src/pages/Admin/ExportImport.jsx
import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, XCircle, RefreshCw, Database, Package, Boxes } from 'lucide-react';
import api from '../../lib/apis/axios';

export default function ExportImport() {
    const [loading, setLoading] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [exportType, setExportType] = useState('articles');

    const exportTypes = [
        { id: 'articles', name: 'Export des articles', icon: Package, desc: 'Export CSV de tous les articles', color: 'bg-blue-600' },
        { id: 'stocks', name: 'Export des stocks', icon: Boxes, desc: 'Export CSV des stocks par magasin', color: 'bg-emerald-600' },
        { id: 'mouvements', name: 'Export des mouvements', icon: Database, desc: 'Export CSV des mouvements de stock', color: 'bg-purple-600' }
    ];

    const handleExport = async () => {
        setLoading(true);
        try {
            let url = '';
            let filename = '';
            
            switch(exportType) {
                case 'articles':
                    url = '/api/admin/export/articles';
                    filename = `articles_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
                    break;
                case 'stocks':
                    url = '/api/admin/export/stocks-csv';
                    filename = `stocks_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
                    break;
                case 'mouvements':
                    url = '/api/admin/export/mouvements';
                    filename = `mouvements_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
                    break;
                default: return;
            }
            
            const response = await api.get(url, { responseType: 'blob' });
            if (response.data.size === 0) throw new Error('Le fichier exporté est vide');
            
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url_blob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url_blob;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url_blob), 100);
            
            alert(`✅ Export ${exportType} réussi !`);
        } catch (error) {
            console.error(error);
            alert('❌ Erreur lors de l\'export: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            alert('Veuillez sélectionner un fichier CSV');
            return;
        }
        
        setLoading(true);
        setImportResult(null);
        
        const formData = new FormData();
        formData.append('file', importFile);
        
        try {
            const response = await api.post('/api/admin/import/articles', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setImportResult({
                success: true,
                message: response.data.message || 'Import réussi',
                count: response.data.importes || 0,
                errors: response.data.erreurs || []
            });
            
            setImportFile(null);
            document.getElementById('import_file').value = '';
        } catch (error) {
            setImportResult({
                success: false,
                message: error.response?.data?.message || 'Erreur lors de l\'import',
                errors: error.response?.data?.erreurs || []
            });
        } finally {
            setLoading(false);
        }
    };

    const currentExport = exportTypes.find(e => e.id === exportType);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* En-tête */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Database size={20} className="text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">📦 Import / Export</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Importez et exportez vos données au format CSV/Excel</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section Export */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2">
                            <Download size={18} className="text-emerald-600" />
                            <h2 className="text-lg font-semibold text-gray-800">Export de données</h2>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Exportez vos données au format CSV</p>
                    </div>
                    
                    <div className="p-5">
                        <div className="space-y-3 mb-6">
                            {exportTypes.map((type) => {
                                const Icon = type.icon;
                                const isActive = exportType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setExportType(type.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                                            isActive ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? type.color : 'bg-gray-200'}`}>
                                            <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className={`text-sm font-medium ${isActive ? 'text-emerald-700' : 'text-gray-700'}`}>{type.name}</p>
                                            <p className="text-xs text-gray-400">{type.desc}</p>
                                        </div>
                                        {isActive && <CheckCircle size={16} className="text-emerald-600" />}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : `bg-gradient-to-r ${currentExport?.color || 'from-emerald-600 to-emerald-700'} text-white hover:shadow-lg hover:-translate-y-0.5`
                            }`}
                        >
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" /> Export en cours...</>
                            ) : (
                                <><Download size={18} /> Exporter en CSV</>
                            )}
                        </button>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700 flex items-center gap-2">
                                <FileText size={14} />
                                Les fichiers CSV sont compatibles avec Microsoft Excel et Google Sheets
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section Import */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2">
                            <Upload size={18} className="text-emerald-600" />
                            <h2 className="text-lg font-semibold text-gray-800">Import de données</h2>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Importez des articles depuis un fichier CSV</p>
                    </div>
                    
                    <div className="p-5">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fichier CSV</label>
                            <input
                                id="import_file"
                                type="file"
                                accept=".csv,.txt"
                                onChange={(e) => setImportFile(e.target.files[0])}
                                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                            />
                            <p className="text-xs text-gray-400 mt-2">Format accepté: CSV, encodage UTF-8</p>
                        </div>
                        
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-xs text-yellow-700 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Format attendu: code_barre;designation;categorie_id;unite_mesure;seuil_alerte
                            </p>
                        </div>
                        
                        <button
                            onClick={handleImport}
                            disabled={loading || !importFile}
                            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                                loading || !importFile ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:shadow-lg hover:-translate-y-0.5'
                            }`}
                        >
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin" /> Import en cours...</>
                            ) : (
                                <><Upload size={18} /> Importer le fichier</>
                            )}
                        </button>
                        
                        {/* Résultat d'import */}
                        {importResult && (
                            <div className={`mt-4 p-4 rounded-xl ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {importResult.success ? <CheckCircle size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-600" />}
                                    <span className={`text-sm font-medium ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>{importResult.message}</span>
                                </div>
                                {importResult.count && <p className="text-xs text-green-600 mt-1">✅ {importResult.count} article(s) importé(s)</p>}
                                {importResult.errors && importResult.errors.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs text-red-600 font-medium">Erreurs:</p>
                                        <ul className="text-xs text-red-500 mt-1 list-disc list-inside">
                                            {importResult.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                                            {importResult.errors.length > 5 && <li>... et {importResult.errors.length - 5} autres</li>}
                                        </ul>
                                    </div>
                                )}
                                <button onClick={() => setImportResult(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                                    <RefreshCw size={12} /> Effacer
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Template CSV */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                        <FileText size={16} className="text-emerald-600" />
                        Template CSV pour l'import
                    </h3>
                </div>
                <div className="p-4 overflow-x-auto">
                    <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto font-mono">
{`code_barre;designation;categorie_id;unite_mesure;seuil_alerte
611123456789;Beurre doux 250g;1;Pièce;10
611987654321;Farine T55 1kg;2;Kg;5
611456789123;Sucre en poudre 1kg;3;Kg;8`}
                    </pre>
                    <p className="text-xs text-gray-500 mt-3">
                        📌 <strong>Colonnes obligatoires:</strong> code_barre, designation, categorie_id<br />
                        📌 <strong>Colonnes optionnelles:</strong> unite_mesure (défaut: Pièce), seuil_alerte (défaut: 5)
                    </p>
                </div>
            </div>
        </div>
    );
}