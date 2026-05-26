// src/pages/Admin/EntreeSortie.jsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Scan, CheckCircle, AlertCircle, Search, X } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

function TypeBadge({ type }) {
  const map = {
    entree:      { label: 'Entrée',     cls: 'bg-green-50 text-green-700 border border-green-200' },
    sortie:      { label: 'Sortie',     cls: 'bg-red-50 text-red-600 border border-red-200' },
    ajustement:  { label: 'Ajustement', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  };
  const cfg = map[type] || { label: type, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

export default function EntreeSortie() {
  const [mouvements, setMouvements] = useState([]);
  const [articles, setArticles] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('entree');
  const [formData, setFormData] = useState({ article_id: '', magasin_id: '', quantite: '', motif: '', reference: '' });
  const [scanMode, setScanMode] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [scannedArticle, setScannedArticle] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  const [actionModal, setActionModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', confirmText: 'OK', onConfirm: null
  });

  const openConfirmModal = (type, title, message, confirmText, onConfirm) => {
    setActionModal({
      isOpen: true, type, title, message, confirmText,
      onConfirm: () => { if (onConfirm) onConfirm(); setActionModal(prev => ({ ...prev, isOpen: false })); }
    });
  };

  useEffect(() => { 
    fetchMouvements(); 
    fetchArticles(); 
    fetchMagasins(); 
    fetchStats(); 
  }, [filter]);

  const fetchArticles = async () => {
    try {
      const response = await api.get('/api/user/stock/articles');
      let data = [];
      if (response.data?.data?.data) data = response.data.data.data;
      else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
      setArticles(data);
    } catch { setArticles([]); }
  };

  const fetchMagasins = async () => {
    try {
      const response = await api.get('/api/admin/catalogue-structure');
      setMagasins(response.data.magasins || []);
    } catch { setMagasins([]); }
  };

  const fetchMouvements = async () => {
    try {
      let url = '/api/admin/mouvements/recent';
      const response = await api.get(url);
      let data = response.data || [];
      setMouvements(data);
    } catch (error) {
      console.error(error);
      setMouvements([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/mouvements/stats');
      setStats(response.data || {});
    } catch (error) {
      console.error('Stats error:', error);
      setStats({});
    }
  };

  const handleScan = async () => {
    if (!scanCode) return;
    setScanLoading(true); setScanResult(null);
    try {
      const response = await api.post('/api/admin/scan', { code_barre: scanCode });
      setScannedArticle(response.data.article);
      setScanResult({ success: true, message: `Article trouvé : ${response.data.article.designation}` });
    } catch (error) {
      setScannedArticle(null);
      setScanResult({ success: false, message: error.response?.data?.message || 'Article non trouvé' });
    } finally { setScanLoading(false); }
  };

  const handleScanSubmit = async () => {
    if (!scannedArticle) return;
    if (!formData.magasin_id) { openConfirmModal('warning', 'Attention', 'Veuillez sélectionner un magasin', 'OK', null); return; }
    setScanLoading(true);
    try {
      const endpoint = modalType === 'entree' ? '/api/admin/entree-rapide' : '/api/admin/sortie-rapide';
      await api.post(endpoint, {
        code_barre: scannedArticle.code_barre,
        magasin_id: formData.magasin_id,
        quantite: formData.quantite || 1,
      });
      setScanResult({ success: true, message: `${modalType === 'entree' ? 'Entrée' : 'Sortie'} enregistrée` });
      setScanCode(''); setScannedArticle(null);
      setFormData({ ...formData, quantite: '', motif: '', magasin_id: '' });
      fetchMouvements(); fetchStats();
      openConfirmModal('success', 'Succès', `L'${modalType === 'entree' ? 'entrée' : 'sortie'} a été enregistrée`, 'OK', null);
    } catch (error) {
      setScanResult({ success: false, message: error.response?.data?.message || 'Erreur' });
    } finally { setScanLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      const article = articles.find(a => a.id == formData.article_id);
      if (modalType === 'entree') {
        endpoint = '/api/admin/entree-rapide';
        await api.post(endpoint, { code_barre: article?.code_barre, magasin_id: formData.magasin_id, quantite: formData.quantite });
      } else if (modalType === 'sortie') {
        endpoint = '/api/admin/sortie-rapide';
        await api.post(endpoint, { code_barre: article?.code_barre, magasin_id: formData.magasin_id, quantite: formData.quantite });
      }
      setShowModal(false);
      setFormData({ article_id: '', magasin_id: '', quantite: '', motif: '', reference: '' });
      fetchMouvements(); fetchStats();
      openConfirmModal('success', 'Succès', `${modalType === 'entree' ? 'Entrée' : 'Sortie'} enregistrée`, 'OK', null);
    } catch (error) { 
      openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur', 'OK', null);
    }
  };

  const openModal = (type) => {
    setModalType(type); setScanMode(false); setScanCode('');
    setScannedArticle(null); setScanResult(null);
    setFormData({ article_id: '', magasin_id: magasins[0]?.id || '', quantite: '', motif: '', reference: '' });
    setShowModal(true);
  };

  const openScanMode = (type) => {
    setModalType(type); setScanMode(true); setScanCode('');
    setScannedArticle(null); setScanResult(null);
    setFormData({ ...formData, magasin_id: magasins[0]?.id || '', quantite: 1, motif: '' });
    setShowModal(true);
  };

  const filteredMouvements = mouvements.filter(m =>
    search === '' || m.article?.designation?.toLowerCase().includes(search.toLowerCase())
  );

  const statsCards = [
    { label: 'Total entrées', value: stats.total_entrees || 0, accent: '#10b981' },
    { label: 'Total sorties', value: stats.total_sorties || 0, accent: '#ef4444' },
    { label: 'Mouvements aujourd\'hui', value: stats.mouvements_jour || 0, accent: '#2563eb' },
    { label: 'Ajustements', value: stats.total_ajustements || 0, accent: '#8b5cf6' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Entrée / Sortie de stock</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les entrées et sorties d'articles</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openScanMode('entree')} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition shadow-sm">
            <Scan size={13} /> Scan Entrée
          </button>
          <button onClick={() => openScanMode('sortie')} className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition shadow-sm">
            <Scan size={13} /> Scan Sortie
          </button>
          <button onClick={() => openModal('entree')} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition shadow-sm">
            <TrendingUp size={13} /> Entrée
          </button>
          <button onClick={() => openModal('sortie')} className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition shadow-sm">
            <TrendingDown size={13} /> Sortie
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>Tous</button>
          <button onClick={() => setFilter('entree')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${filter === 'entree' ? 'bg-green-600 text-white' : 'bg-white text-gray-600'}`}>Entrées</button>
          <button onClick={() => setFilter('sortie')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${filter === 'sortie' ? 'bg-red-500 text-white' : 'bg-white text-gray-600'}`}>Sorties</button>
        </div>
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white w-52 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500">Article</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500">Type</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-gray-500">Quantité</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500">Motif</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500">Par</th>
              </tr>
            </thead>
            <tbody>
              {filteredMouvements.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-14 text-center text-gray-400">Aucun mouvement</td></tr>
              ) : (
                filteredMouvements.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{m.article?.designation}</td>
                    <td className="px-4 py-3"><TypeBadge type={m.type} /></td>
                    <td className="px-4 py-3 text-center font-bold">{m.quantite}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{m.motif || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.user?.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal (similaire à MouvementsStock) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                {scanMode ? (modalType === 'entree' ? 'Scan Entrée' : 'Scan Sortie') : (modalType === 'entree' ? 'Nouvelle entrée' : 'Nouvelle sortie')}
              </h2>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="p-6">
              {scanMode ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <Scan size={14} className="text-blue-600 inline mr-2" />
                    <span className="text-xs text-blue-700">Scannez un code-barres</span>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={scanCode} onChange={e => setScanCode(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleScan()} className="flex-1 px-3 py-2.5 border rounded-xl text-sm" placeholder="Code-barres" autoFocus />
                    <button onClick={handleScan} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm">Scanner</button>
                  </div>
                  {scannedArticle && (
                    <div className="p-3 bg-green-50 rounded-xl">
                      <p className="text-sm font-bold">{scannedArticle.designation}</p>
                      <p className="text-xs text-gray-500">{scannedArticle.code_barre}</p>
                    </div>
                  )}
                  <select value={formData.magasin_id} onChange={e => setFormData({ ...formData, magasin_id: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm">
                    {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                  </select>
                  <input type="number" min="1" value={formData.quantite} onChange={e => setFormData({ ...formData, quantite: e.target.value })} className="w-full p-2.5 border rounded-xl text-sm" placeholder="Quantité" />
                  <div className="flex gap-3">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl">Annuler</button>
                    <button onClick={handleScanSubmit} disabled={!scannedArticle} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl">Enregistrer</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <select className="w-full p-2.5 border rounded-xl" value={formData.article_id} onChange={e => setFormData({ ...formData, article_id: e.target.value })} required>
                    <option value="">Sélectionner un article</option>
                    {articles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
                  </select>
                  <select className="w-full p-2.5 border rounded-xl" value={formData.magasin_id} onChange={e => setFormData({ ...formData, magasin_id: e.target.value })} required>
                    <option value="">Sélectionner un magasin</option>
                    {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                  </select>
                  <input type="number" min="1" className="w-full p-2.5 border rounded-xl" value={formData.quantite} onChange={e => setFormData({ ...formData, quantite: e.target.value })} required placeholder="Quantité" />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border rounded-xl">Annuler</button>
                    <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl">Enregistrer</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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