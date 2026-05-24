// src/pages/Admin/ExportImport.jsx
import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle, XCircle, RefreshCw, Database, Package, Boxes } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

export default function ExportImport() {
    const [loading, setLoading] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [exportType, setExportType] = useState('articles');
    const [actionModal, setActionModal] = useState({ isOpen: false, type: 'success', title: '', message: '', confirmText: 'OK', onConfirm: null });

    const openConfirmModal = (type, title, message, confirmText, onConfirm) => {
        setActionModal({ isOpen: true, type, title, message, confirmText, onConfirm: () => { if (onConfirm) onConfirm(); setActionModal(prev => ({ ...prev, isOpen: false })); } });
    };

    const exportTypes = [
        { id: 'articles', name: 'Export des articles (Excel)', icon: FileSpreadsheet, desc: 'Export Excel de tous les articles', color: 'bg-blue-600' },
        { id: 'stocks', name: 'Export des stocks (Excel)', icon: FileSpreadsheet, desc: 'Export Excel des stocks par magasin', color: 'bg-blue-600' },
        { id: 'mouvements', name: 'Export des mouvements (Excel)', icon: FileSpreadsheet, desc: 'Export Excel des mouvements', color: 'bg-blue-600' },
        { id: 'commandes', name: 'Export des commandes (Excel)', icon: FileSpreadsheet, desc: 'Export Excel des commandes fournisseurs', color: 'bg-blue-600' }
    ];

    const handleExport = async () => {
        setLoading(true);
        try {
            let url = '';
            let filename = '';
            
            switch(exportType) {
                case 'articles':
                    url = '/api/admin/export/articles';
                    filename = `articles_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
                    break;
                case 'stocks':
                    url = '/api/admin/export/stocks';
                    filename = `stocks_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
                    break;
                case 'mouvements':
                    url = '/api/admin/export/mouvements';
                    filename = `mouvements_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
                    break;
                case 'commandes':
                    url = '/api/admin/export/commandes';
                    filename = `commandes_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
                    break;
                default: return;
            }
            
            const response = await api.get(url, { responseType: 'blob' });
            if (response.data.size === 0) throw new Error('Le fichier exporté est vide');
            
            const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url_blob = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url_blob;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url_blob), 100);
            
            openConfirmModal('success', 'Succès', `Export ${exportType} réussi`, 'OK', null);
        } catch (error) {
            openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur lors de l\'export', 'OK', null);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            openConfirmModal('warning', 'Attention', 'Veuillez sélectionner un fichier CSV/Excel', 'OK', null);
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
            openConfirmModal('success', 'Succès', `${response.data.importes || 0} article(s) importé(s)`, 'OK', null);
        } catch (error) {
            setImportResult({
                success: false,
                message: error.response?.data?.message || 'Erreur lors de l\'import',
                errors: error.response?.data?.erreurs || []
            });
            openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur lors de l\'import', 'OK', null);
        } finally {
            setLoading(false);
        }
    };

    const currentExport = exportTypes.find(e => e.id === exportType);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Import / Export</h1>
                <p className="text-sm text-gray-500 mt-0.5">Importez et exportez vos données au format CSV/Excel</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section Export */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Download size={16} className="text-blue-600" /> Export de données
                        </h2>
                    </div>
                    
                    <div className="p-5">
                        <div className="space-y-2 mb-5">
                            {exportTypes.map((type) => {
                                const Icon = type.icon;
                                const isActive = exportType === type.id;
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => setExportType(type.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${isActive ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}>
                                            <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>{type.name}</p>
                                            <p className="text-xs text-gray-400">{type.desc}</p>
                                        </div>
                                        {isActive && <CheckCircle size={14} className="text-blue-600" />}
                                    </button>
                                );
                            })}
                        </div>
                        
                        <button onClick={handleExport} disabled={loading} className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                            {loading ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> Export...</> : <><Download size={16} /> Exporter en Excel</>}
                        </button>
                        
                        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700">Fichier Excel (.xlsx) - Compatible Microsoft Excel</p>
                        </div>
                    </div>
                </div>

                {/* Section Import */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Upload size={16} className="text-blue-600" /> Import de données
                        </h2>
                    </div>
                    
                    <div className="p-5">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fichier CSV/Excel</label>
                            <input
                                id="import_file"
                                type="file"
                                accept=".csv,.xlsx,.xls,.txt"
                                onChange={(e) => setImportFile(e.target.files[0])}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                            <p className="text-xs text-gray-400 mt-1">Formats supportés: CSV, TXT, Excel (.xlsx, .xls)</p>
                        </div>
                        
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-xs text-yellow-700 flex items-center gap-2">
                                <AlertCircle size={14} />
                                Format CSV attendu: code_barre;designation;categorie_id;unite_mesure;seuil_alerte
                            </p>
                        </div>
                        
                        <button onClick={handleImport} disabled={loading || !importFile} className={`w-full py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${loading || !importFile ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                            {loading ? <><div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" /> Import...</> : <><Upload size={16} /> Importer le fichier</>}
                        </button>
                        
                        {/* Résultat d'import */}
                        {importResult && (
                            <div className={`mt-4 p-3 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {importResult.success ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-red-600" />}
                                    <span className={`text-sm font-medium ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>{importResult.message}</span>
                                </div>
                                {importResult.count > 0 && (
                                    <p className="text-xs text-green-600">✅ {importResult.count} article(s) importé(s)</p>
                                )}
                                {importResult.errors && importResult.errors.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-xs text-red-600 font-medium">⚠️ Erreurs:</p>
                                        <ul className="text-xs text-red-500 mt-1 list-disc list-inside max-h-32 overflow-y-auto">
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
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText size={16} className="text-blue-600" /> Template CSV
                    </h3>
                </div>
                <div className="p-4 overflow-x-auto">
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg font-mono">
{`code_barre;designation;categorie_id;unite_mesure;seuil_alerte
611123456789;Beurre doux 250g;1;Pièce;10
611987654321;Farine T55 1kg;2;Kg;5
611456789123;Sucre en poudre 1kg;3;Kg;8`}
                    </pre>
                    <p className="text-xs text-gray-500 mt-3">
                        📌 <strong>Colonnes obligatoires:</strong> code_barre, designation, categorie_id
                    </p>
                    <p className="text-xs text-gray-500">
                        📌 <strong>Séparateur:</strong> point-virgule (;)
                    </p>
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