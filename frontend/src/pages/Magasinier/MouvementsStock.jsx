import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, TrendingDown, Settings, X, Download, Scan, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/apis/axios';

function TypeBadge({ type }) {
  const map = {
    entree:      { label: '📥 Entrée',     cls: 'bg-green-50 text-green-700 border border-green-200' },
    sortie:      { label: '📤 Sortie',     cls: 'bg-red-50 text-red-600 border border-red-200' },
    ajustement:  { label: '⚙️ Ajustement', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  };
  const cfg = map[type] || { label: type, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

export default function MouvementsStock() {
  const [mouvements, setMouvements] = useState([]);
  const [articles, setArticles] = useState([]);
  const [magasins, setMagasins] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('entree');
  const [formData, setFormData] = useState({ article_id: '', magasin_id: '', quantite: '', motif: '', reference: '', nouvelle_quantite: '' });
  const [scanMode, setScanMode] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [scannedArticle, setScannedArticle] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);

  useEffect(() => { fetchMouvements(); fetchArticles(); fetchMagasins(); fetchStats(); }, [filter]);

  const fetchArticles = async () => {
    try {
      const response = await api.get('/api/user/stock/articles');
      let data = [];
      if (response.data?.data?.data) data = response.data.data.data;
      else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
      else if (Array.isArray(response.data)) data = response.data;
      setArticles(data);
    } catch { setArticles([]); }
  };

  const fetchMagasins = async () => {
    try {
      const response = await api.get('/api/magasinier/magasins');
      let data = [];
      if (response.data?.data) data = Array.isArray(response.data.data) ? response.data.data : [];
      else if (Array.isArray(response.data)) data = response.data;
      setMagasins(data);
    } catch { setMagasins([]); }
  };

    // MouvementsStock.jsx - Ligne 98-110
    const fetchMouvements = async () => {
        try {
            // 🔥 CORRECTION: Envoyer 'all' explicitement au backend
            let url = '/api/magasinier/mouvements';
            if (filter !== 'all') {
                url += `?type=${filter}`;
            }
            
            const response = await api.get(url);
            let data = [];
            
            if (response.data?.data?.data) data = response.data.data.data;
            else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
            else if (Array.isArray(response.data)) data = response.data;
            
            console.log('Mouvements récupérés:', data); // Debug
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
      const response = await api.get('/api/magasinier/mouvements/stats');
      setStats(response.data?.data || response.data || {});
    } catch { setStats({}); }
  };

  const handleScan = async () => {
    if (!scanCode) return;
    setScanLoading(true); setScanResult(null);
    try {
      const response = await api.post('/api/magasinier/scan', { code_barre: scanCode });
      setScannedArticle(response.data.article);
      setScanResult({ success: true, message: `Article trouvé : ${response.data.article.designation}` });
    } catch (error) {
      setScannedArticle(null);
      setScanResult({ success: false, message: error.response?.data?.message || 'Article non trouvé' });
    } finally { setScanLoading(false); }
  };

  const handleScanSubmit = async () => {
    if (!scannedArticle) return;
    if (!formData.magasin_id) { alert('Veuillez sélectionner un magasin'); return; }
    setScanLoading(true);
    try {
      const endpoint = modalType === 'entree' ? '/api/magasinier/mouvements/entree' : '/api/magasinier/mouvements/sortie';
      await api.post(endpoint, {
        article_id: scannedArticle.id,
        magasin_id: formData.magasin_id,
        quantite: formData.quantite || 1,
        motif: formData.motif || `${modalType === 'entree' ? 'Entrée' : 'Sortie'} via scan`,
      });
      setScanResult({ success: true, message: `${modalType === 'entree' ? 'Entrée' : 'Sortie'} enregistrée avec succès` });
      setScanCode(''); setScannedArticle(null);
      setFormData({ ...formData, quantite: '', motif: '', magasin_id: '' });
      fetchMouvements(); fetchStats();
    } catch (error) {
      setScanResult({ success: false, message: error.response?.data?.message || 'Erreur' });
    } finally { setScanLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '';
      let data = {};
      if (modalType === 'entree') {
        endpoint = '/api/magasinier/scan/entree-rapide';
        data = { article_id: formData.article_id, magasin_id: formData.magasin_id, quantite: formData.quantite, motif: formData.motif, reference: formData.reference };
      } else if (modalType === 'sortie') {
        endpoint = '/api/magasinier/scan/sortie-rapide';
        data = { article_id: formData.article_id, magasin_id: formData.magasin_id, quantite: formData.quantite, motif: formData.motif, reference: formData.reference };
      } else if (modalType === 'ajustement') {
        endpoint = '/api/magasinier/mouvements/ajustement';
        data = { article_id: formData.article_id, magasin_id: formData.magasin_id, nouvelle_quantite: formData.nouvelle_quantite, motif: formData.motif };
      }
      await api.post(endpoint, data);
      setShowModal(false);
      setFormData({ article_id: '', magasin_id: '', quantite: '', motif: '', reference: '', nouvelle_quantite: '' });
      fetchMouvements(); fetchStats();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
  };

  const openModal = (type) => {
    setModalType(type); setScanMode(false); setScanCode('');
    setScannedArticle(null); setScanResult(null);
    setFormData({ article_id: '', magasin_id: magasins[0]?.id || '', quantite: '', motif: '', reference: '', nouvelle_quantite: '' });
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
    { label: 'Total entrées',         value: stats.total_entrees    || 0, accent: '#10b981', bg: '#f0fdf4' },
    { label: 'Total sorties',         value: stats.total_sorties    || 0, accent: '#ef4444', bg: '#fef2f2' },
    { label: 'Mouvements aujourd\'hui', value: stats.mouvements_jour  || 0, accent: '#2563eb', bg: '#eff6ff' },
    { label: 'Ajustements',           value: stats.total_ajustements || 0, accent: '#8b5cf6', bg: '#f5f3ff' },
  ];

  const filterButtons = [
    { key: 'all',        label: 'Tous' },
    { key: 'entree',     label: 'Entrées' },
    { key: 'sortie',     label: 'Sorties' },
    { key: 'ajustement', label: 'Ajustements' },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 ">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <span>Magasinier</span><span className="mx-1">›</span>
            <span className="text-gray-600 font-medium">Mouvements de stock</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Mouvements de stock</h1>
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
          <button onClick={() => openModal('ajustement')} className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold transition shadow-sm">
            <Settings size={13} /> Ajustement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statsCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
            <div className="mt-2 h-1 rounded-full bg-gray-100">
              <div className="h-1 rounded-full" style={{ backgroundColor: s.accent, width: '100%', opacity: 0.5 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex gap-1">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${filter === btn.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Rechercher par article..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white w-52 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
            <Download size={13} /> Exporter
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Article', 'Type', 'Quantité', 'Stock avant', 'Stock après', 'Motif', 'Date', 'Par'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMouvements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-14 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Aucun mouvement trouvé</p>
                  </td>
                </tr>
              ) : filteredMouvements.map(m => (
                <tr key={m.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{m.article?.designation}</td>
                  <td className="px-4 py-3.5"><TypeBadge type={m.type} /></td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-800">{m.quantite}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{m.quantite_avant ?? '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">{m.quantite_apres ?? '—'}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[140px]">
                    <p className="truncate">{m.motif || '—'}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{m.user?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal unifié */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                {scanMode && <Scan size={16} className="text-blue-500" />}
                {modalType === 'entree'     && <TrendingUp size={16} className="text-green-500" />}
                {modalType === 'sortie'     && <TrendingDown size={16} className="text-red-500" />}
                {modalType === 'ajustement' && <Settings size={16} className="text-amber-500" />}
                {modalType === 'entree' && (scanMode ? 'Scan Entrée' : 'Nouvelle entrée')}
                {modalType === 'sortie' && (scanMode ? 'Scan Sortie' : 'Nouvelle sortie')}
                {modalType === 'ajustement' && 'Ajustement de stock'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>

            <div className="p-6">
              {scanMode ? (
                <div className="space-y-4">
                  {/* Info scan */}
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-center gap-2">
                    <Scan size={14} className="text-blue-600 flex-shrink-0" />
                    <p className="text-xs text-blue-700">Scannez un code-barres ou saisissez-le manuellement</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Code-barres</label>
                    <div className="flex gap-2">
                      <input
                        type="text" value={scanCode}
                        onChange={e => setScanCode(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleScan()}
                        className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Scannez ou saisissez le code"
                        autoFocus
                      />
                      <button
                        onClick={handleScan} disabled={scanLoading}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                      >
                        {scanLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Scanner'}
                      </button>
                    </div>
                  </div>

                  {scannedArticle && (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-xs font-bold text-green-700 mb-1 flex items-center gap-1"><CheckCircle size={12} /> Article trouvé</p>
                      <p className="text-sm font-bold text-gray-800">{scannedArticle.designation}</p>
                      <p className="text-[11px] text-gray-500 font-mono">{scannedArticle.code_barre}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Magasin <span className="text-red-500">*</span></label>
                    <select value={formData.magasin_id} onChange={e => setFormData({ ...formData, magasin_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                      <option value="">Sélectionner un magasin</option>
                      {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Quantité</label>
                    <input type="number" min="1" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.quantite} onChange={e => setFormData({ ...formData, quantite: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Motif <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
                    <textarea className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="Raison du mouvement..." value={formData.motif} onChange={e => setFormData({ ...formData, motif: e.target.value })} />
                  </div>

                  {scanResult && (
                    <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${scanResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      {scanResult.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                      {scanResult.message}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                    <button onClick={handleScanSubmit} disabled={scanLoading || !scannedArticle} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                      {scanLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Article <span className="text-red-500">*</span></label>
                    <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.article_id} onChange={e => setFormData({ ...formData, article_id: e.target.value })} required>
                      <option value="">Sélectionner un article</option>
                      {articles.map(a => <option key={a.id} value={a.id}>{a.designation} — Stock: {a.quantite_stock}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Magasin <span className="text-red-500">*</span></label>
                    <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.magasin_id} onChange={e => setFormData({ ...formData, magasin_id: e.target.value })} required>
                      <option value="">Sélectionner un magasin</option>
                      {magasins.map(m => <option key={m.id} value={m.id}>{m.nom_magasin}</option>)}
                    </select>
                  </div>
                  {modalType !== 'ajustement' ? (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Quantité <span className="text-red-500">*</span></label>
                      <input type="number" min="1" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.quantite} onChange={e => setFormData({ ...formData, quantite: e.target.value })} required />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Nouvelle quantité <span className="text-red-500">*</span></label>
                      <input type="number" min="0" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.nouvelle_quantite} onChange={e => setFormData({ ...formData, nouvelle_quantite: e.target.value })} required />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                      Motif {modalType === 'ajustement' && <span className="text-red-500">*</span>}
                      {modalType !== 'ajustement' && <span className="text-gray-400 font-normal normal-case">(optionnel)</span>}
                    </label>
                    <textarea className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" rows="2" placeholder="Raison du mouvement..." value={formData.motif} onChange={e => setFormData({ ...formData, motif: e.target.value })} required={modalType === 'ajustement'} />
                  </div>
                  {modalType !== 'ajustement' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Référence <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
                      <input type="text" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="N° commande, N° demande..." value={formData.reference} onChange={e => setFormData({ ...formData, reference: e.target.value })} />
                    </div>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                    <button type="submit" className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold transition shadow-sm ${modalType === 'entree' ? 'bg-green-600 hover:bg-green-700' : modalType === 'sortie' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}