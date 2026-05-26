// src/pages/Admin/AjouterArticle.jsx
import React, { useState, useEffect } from 'react';
import { Package, XCircle, Plus, RefreshCw, Save, CheckCircle, Download, Upload, FileSpreadsheet, FolderTree, Layers } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

export default function AjouterArticle() {
  const [catalogue, setCatalogue] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  
  // 🔥 Type d'import/export (articles, familles, categories)
  const [importType, setImportType] = useState('articles');
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const [familleSelectionnee, setFamilleSelectionnee] = useState('');
  const [categorieSelectionnee, setCategorieSelectionnee] = useState('');
  const [magasinsSelectionnes, setMagasinsSelectionnes] = useState([]);

  const [showMiniFamille, setShowMiniFamille] = useState(false);
  const [showMiniCategorie, setShowMiniCategorie] = useState(false);
  const [showMiniMagasin, setShowMiniMagasin] = useState(false);

  const [nouvelleFamille, setNouvelleFamille] = useState('');
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [nouveauMagasin, setNouveauMagasin] = useState({ nom: '', localisation: '' });
  
  const [isMiniSubmitting, setIsMiniSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 ActionConfirmModal state
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

  const [articleData, setArticleData] = useState({
    code_barre: '',
    designation: '',
    description: '',
    unite_mesure: 'Pièce',
    seuil_alerte: 5,
    statut: 'actif',
    image_file: null
  });

  useEffect(() => {
    chargerDonnees();
  }, []);

  const chargerDonnees = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/catalogue-structure');
      setCatalogue(response.data.catalogue || []);
      setMagasins(response.data.magasins || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
      openConfirmModal('danger', 'Erreur', '❌ Erreur lors du chargement des données', 'OK', null);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // 🔥 TELECHARGER TEMPLATE
  // ============================================================
  const handleDownloadTemplate = async (type) => {
    setExportLoading(true);
    try {
      const response = await api.get(`/api/admin/template?type=${type}`, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_import_${type}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      openConfirmModal('success', 'Succès', `Template ${type} téléchargé avec succès`, 'OK', null);
    } catch (error) {
      openConfirmModal('danger', 'Erreur', 'Erreur lors du téléchargement du template', 'OK', null);
    } finally {
      setExportLoading(false);
      setShowTemplateMenu(false);
    }
  };

  // ============================================================
  // 🔥 EXPORT ARTICLES
  // ============================================================
  const handleExportArticles = async () => {
    setExportLoading(true);
    try {
      const response = await api.get('/api/admin/export/articles', { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `articles_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      openConfirmModal('success', 'Succès', 'Export des articles réussi', 'OK', null);
    } catch (error) {
      openConfirmModal('danger', 'Erreur', 'Erreur lors de l\'export des articles', 'OK', null);
    } finally {
      setExportLoading(false);
    }
  };

  // ============================================================
  // 🔥 EXPORT FAMILLES
  // ============================================================
  const handleExportFamilles = async () => {
    setExportLoading(true);
    try {
      const response = await api.get('/api/admin/export/familles', { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `familles_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      openConfirmModal('success', 'Succès', 'Export des familles réussi', 'OK', null);
    } catch (error) {
      openConfirmModal('danger', 'Erreur', 'Erreur lors de l\'export des familles', 'OK', null);
    } finally {
      setExportLoading(false);
    }
  };

  // ============================================================
  // 🔥 EXPORT CATEGORIES
  // ============================================================
  const handleExportCategories = async () => {
    setExportLoading(true);
    try {
      const response = await api.get('/api/admin/export/categories', { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `categories_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      openConfirmModal('success', 'Succès', 'Export des catégories réussi', 'OK', null);
    } catch (error) {
      openConfirmModal('danger', 'Erreur', 'Erreur lors de l\'export des catégories', 'OK', null);
    } finally {
      setExportLoading(false);
    }
  };

  // ============================================================
  // 🔥 IMPORT GENERIQUE
  // ============================================================
  const handleImport = async () => {
    if (!importFile) {
      openConfirmModal('warning', 'Attention', 'Veuillez sélectionner un fichier', 'OK', null);
      return;
    }
    
    setImportLoading(true);
    setImportResult(null);
    
    const formData = new FormData();
    formData.append('file', importFile);
    
    // Routes selon le type
    const routes = {
      articles: '/api/admin/import/articles',
      familles: '/api/admin/import/familles',
      categories: '/api/admin/import/categories'
    };
    
    try {
      const response = await api.post(routes[importType], formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setImportResult({
        success: true,
        message: response.data.message || 'Import réussi',
        count: response.data.importes || 0,
        errors: response.data.erreurs || [],
        warnings: response.data.avertissements || []
      });
      
      setImportFile(null);
      document.getElementById('import_file').value = '';
      openConfirmModal('success', 'Succès', `${response.data.importes || 0} élément(s) importé(s)`, () => {
        chargerDonnees();
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: error.response?.data?.message || 'Erreur lors de l\'import',
        errors: error.response?.data?.erreurs || []
      });
      openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur lors de l\'import', 'OK', null);
    } finally {
      setImportLoading(false);
    }
  };

  // ============================================================
  // 🔥 GESTION FAMILLE / CATEGORIE / MAGASIN
  // ============================================================
  const handleAddFamille = async (e) => {
    e.preventDefault();
    if (!nouvelleFamille.trim()) return;
    setIsMiniSubmitting(true);
    try {
      await api.post('/api/admin/familles', { nom_famille: nouvelleFamille });
      openConfirmModal('success', 'Succès', 'Famille ajoutée avec succès', 'OK', null);
      setNouvelleFamille('');
      setShowMiniFamille(false);
      await chargerDonnees();
    } catch (error) {
      openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur lors de l\'ajout', 'OK', null);
    } finally {
      setIsMiniSubmitting(false);
    }
  };

  const handleAddCategorie = async (e) => {
    e.preventDefault();
    if (!nouvelleCategorie.trim() || !familleSelectionnee) {
      openConfirmModal('warning', 'Attention', 'Veuillez sélectionner une famille d\'abord', 'OK', null);
      return;
    }
    setIsMiniSubmitting(true);
    try {
      await api.post('/api/admin/categories', {
        nom_categorie: nouvelleCategorie,
        famille_id: familleSelectionnee
      });
      openConfirmModal('success', 'Succès', 'Catégorie ajoutée avec succès', 'OK', null);
      setNouvelleCategorie('');
      setShowMiniCategorie(false);
      await chargerDonnees();
    } catch (error) {
      openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur lors de l\'ajout', 'OK', null);
    } finally {
      setIsMiniSubmitting(false);
    }
  };

  const handleAddMagasin = async (e) => {
    e.preventDefault();
    if (!nouveauMagasin.nom.trim()) {
      openConfirmModal('warning', 'Attention', 'Veuillez entrer un nom de magasin', 'OK', null);
      return;
    }
    setIsMiniSubmitting(true);
    try {
      await api.post('/api/admin/magasins', {
        nom_magasin: nouveauMagasin.nom,
        localisation: nouveauMagasin.localisation
      });
      openConfirmModal('success', 'Succès', 'Magasin ajouté avec succès', 'OK', null);
      setNouveauMagasin({ nom: '', localisation: '' });
      setShowMiniMagasin(false);
      await chargerDonnees();
    } catch (error) {
      openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur lors de l\'ajout', 'OK', null);
    } finally {
      setIsMiniSubmitting(false);
    }
  };

  const handleMagasinCheckboxChange = (magasinId) => {
    if (magasinsSelectionnes.includes(magasins.find(m => m.id === magasinId))) {
      setMagasinsSelectionnes(magasinsSelectionnes.filter(m => m.id !== magasinId));
    } else {
      const magasin = magasins.find(m => m.id === magasinId);
      setMagasinsSelectionnes([...magasinsSelectionnes, magasin]);
    }
  };

  const genererCodeBarre = () => {
    const prefixe = "611";
    const random = Math.floor(100000000 + Math.random() * 900000000);
    setArticleData({ ...articleData, code_barre: `${prefixe}${random}` });
  };

  const handleChange = (e) => {
    setArticleData({ ...articleData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArticleData({ ...articleData, image_file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!categorieSelectionnee) {
      openConfirmModal('warning', 'Attention', 'Veuillez sélectionner une catégorie', 'OK', null);
      return;
    }
    if (magasinsSelectionnes.length === 0) {
      openConfirmModal('warning', 'Attention', 'Veuillez sélectionner au moins un magasin', 'OK', null);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('categorie_id', categorieSelectionnee);
      formData.append('code_barre', articleData.code_barre);
      formData.append('designation', articleData.designation);
      formData.append('description', articleData.description);
      formData.append('unite_mesure', articleData.unite_mesure);
      formData.append('seuil_alerte', articleData.seuil_alerte);
      formData.append('statut', articleData.statut);
      formData.append('magasins_ids', JSON.stringify(magasinsSelectionnes.map(m => m.id)));
      
      if (articleData.image_file) {
        formData.append('image', articleData.image_file);
      }

      await api.post('/api/admin/articles', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
      });

      openConfirmModal('success', 'Succès', 'Article ajouté avec succès', 'OK', () => {
        setArticleData({
          code_barre: '', designation: '', description: '',
          unite_mesure: 'Pièce', seuil_alerte: 5, statut: 'actif', image_file: null
        });
        setMagasinsSelectionnes([]);
        setFamilleSelectionnee('');
        setCategorieSelectionnee('');
        if (document.getElementById('image_input')) document.getElementById('image_input').value = "";
      });

    } catch (error) {
      console.error(error);
      if (error.response?.data?.errors) {
        const errs = Object.values(error.response.data.errors).flat().join('\n');
        openConfirmModal('danger', 'Erreur', errs, 'OK', null);
      } else {
        openConfirmModal('danger', 'Erreur', 'Erreur lors de l\'enregistrement', 'OK', null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const familleActuelle = catalogue.find(f => f.id === parseInt(familleSelectionnee));
  const categoriesDisponibles = familleActuelle ? familleActuelle.categories : [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Labels pour l'affichage
  const importLabels = {
    articles: { label: 'Articles', icon: <Package size={16} /> },
    familles: { label: 'Familles', icon: <FolderTree size={16} /> },
    categories: { label: 'Catégories', icon: <Layers size={16} /> }
  };

  return (
    <div>
      {/* En-tête avec boutons Import/Export */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Ajouter un article
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Ajoutez un nouvel article au catalogue
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Menu Templates */}
          <div className="relative">
            <button
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              <FileSpreadsheet size={16} /> Templates
            </button>
            {showTemplateMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => handleDownloadTemplate('articles')}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  <Package size={14} /> Template Articles
                </button>
                <button
                  onClick={() => handleDownloadTemplate('familles')}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  <FolderTree size={14} /> Template Familles
                </button>
                <button
                  onClick={() => handleDownloadTemplate('categories')}
                  className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  <Layers size={14} /> Template Catégories
                </button>
              </div>
            )}
          </div>

          {/* Exports */}
          <button
            onClick={handleExportArticles}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <Download size={16} /> {exportLoading ? 'Export...' : 'Exporter Articles'}
          </button>

          <button
            onClick={handleExportFamilles}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <Download size={16} /> Exporter Familles
          </button>

          <button
            onClick={handleExportCategories}
            disabled={exportLoading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
          >
            <Download size={16} /> Exporter Catégories
          </button>

          {/* Sélecteur type d'import */}
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="articles">📦 Importer Articles</option>
            <option value="familles">📁 Importer Familles</option>
            <option value="categories">📚 Importer Catégories</option>
          </select>

          {/* Bouton choisir fichier */}
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm cursor-pointer">
            <Upload size={16} /> Choisir fichier
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="hidden"
              id="import_file"
            />
          </label>

          {/* Bouton importer */}
          {importFile && (
            <button
              onClick={handleImport}
              disabled={importLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
            >
              <Upload size={16} /> {importLoading ? 'Import...' : `Importer ${importLabels[importType]?.label || importType}`}
            </button>
          )}
        </div>
      </div>

      {/* Résultat d'import */}
      {importResult && (
        <div className={`mb-6 p-4 rounded-xl ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            {importResult.success ? <CheckCircle size={18} className="text-green-600" /> : <XCircle size={18} className="text-red-600" />}
            <span className={`text-sm font-medium ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>{importResult.message}</span>
          </div>
          {importResult.count > 0 && (
            <p className="text-xs text-green-600">✅ {importResult.count} élément(s) importé(s)</p>
          )}
          {importResult.warnings && importResult.warnings.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-yellow-600 font-medium">⚠️ Avertissements:</p>
              <ul className="text-xs text-yellow-500 mt-1 list-disc list-inside max-h-32 overflow-y-auto">
                {importResult.warnings.slice(0, 3).map((err, i) => <li key={i}>{err}</li>)}
                {importResult.warnings.length > 3 && <li>... et {importResult.warnings.length - 3} autres</li>}
              </ul>
            </div>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          {/* Section 1: Classification */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              Classification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Famille */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Famille <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select 
                    value={familleSelectionnee} 
                    onChange={(e) => { setFamilleSelectionnee(e.target.value); setCategorieSelectionnee(''); }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="">-- Sélectionner une famille --</option>
                    {catalogue.map(f => <option key={f.id} value={f.id}>{f.nom_famille}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowMiniFamille(!showMiniFamille)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition flex items-center gap-1"
                  >
                    <Plus size={14} /> Nouvelle
                  </button>
                </div>
                {showMiniFamille && (
                  <div className="mt-2 flex gap-2">
                    <input 
                      type="text" 
                      value={nouvelleFamille} 
                      onChange={(e) => setNouvelleFamille(e.target.value)}
                      placeholder="Nom de la famille"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddFamille} 
                      disabled={isMiniSubmitting}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isMiniSubmitting ? '...' : 'Ajouter'}
                    </button>
                  </div>
                )}
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <select 
                    value={categorieSelectionnee} 
                    onChange={(e) => setCategorieSelectionnee(e.target.value)}
                    disabled={!familleSelectionnee}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none disabled:opacity-50"
                  >
                    <option value="">-- Sélectionner une catégorie --</option>
                    {categoriesDisponibles.map(c => (
                      <option key={c.id} value={c.id}>{c.nom_categorie}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowMiniCategorie(!showMiniCategorie)}
                    disabled={!familleSelectionnee}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus size={14} /> Nouvelle
                  </button>
                </div>
                {showMiniCategorie && familleSelectionnee && (
                  <div className="mt-2 flex gap-2">
                    <input 
                      type="text" 
                      value={nouvelleCategorie} 
                      onChange={(e) => setNouvelleCategorie(e.target.value)}
                      placeholder="Nom de la catégorie"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddCategorie} 
                      disabled={isMiniSubmitting}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isMiniSubmitting ? '...' : 'Ajouter'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Magasins */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                Affectation aux magasins
              </h3>
              <button
                type="button"
                onClick={() => setShowMiniMagasin(!showMiniMagasin)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={12} /> Nouveau magasin
              </button>
            </div>

            {showMiniMagasin && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <input 
                    type="text" 
                    value={nouveauMagasin.nom} 
                    onChange={(e) => setNouveauMagasin({...nouveauMagasin, nom: e.target.value})}
                    placeholder="Nom du magasin"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                  <input 
                    type="text" 
                    value={nouveauMagasin.localisation} 
                    onChange={(e) => setNouveauMagasin({...nouveauMagasin, localisation: e.target.value})}
                    placeholder="Localisation (optionnel)"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={handleAddMagasin} 
                    disabled={isMiniSubmitting}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isMiniSubmitting ? 'Ajout...' : 'Ajouter le magasin'}
                  </button>
                </div>
              </div>
            )}

            {magasins.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun magasin disponible</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {magasins.map(m => (
                  <label key={m.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input 
                      type="checkbox"
                      checked={magasinsSelectionnes.includes(m)}
                      onChange={() => handleMagasinCheckboxChange(m.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {m.nom_magasin} {m.localisation ? `(${m.localisation})` : ''}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Informations article */}
          <form onSubmit={handleSubmit}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              Informations de l'article
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Désignation <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="designation" 
                  value={articleData.designation} 
                  onChange={handleChange}
                  placeholder="Nom de l'article"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Code barre <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    name="code_barre" 
                    value={articleData.code_barre} 
                    onChange={handleChange}
                    placeholder="Code barre"
                    required
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={genererCodeBarre}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition"
                  >
                    Générer
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Unité de mesure
                </label>
                <select 
                  name="unite_mesure" 
                  value={articleData.unite_mesure} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="Pièce">Pièce</option>
                  <option value="Kg">Kilogramme</option>
                  <option value="Litre">Litre</option>
                  <option value="Boite">Boîte</option>
                  <option value="Paquet">Paquet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Seuil d'alerte
                </label>
                <input 
                  type="number" 
                  name="seuil_alerte" 
                  value={articleData.seuil_alerte} 
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Statut
                </label>
                <select 
                  name="statut" 
                  value={articleData.statut} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Description
              </label>
              <textarea 
                name="description" 
                value={articleData.description} 
                onChange={handleChange}
                rows="3"
                placeholder="Description de l'article (optionnel)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Image
              </label>
              <input 
                type="file" 
                id="image_input" 
                accept="image/*" 
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
              >
                <Save size={16} /> {isSubmitting ? 'Enregistrement...' : 'Enregistrer l\'article'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ActionConfirmModal */}
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