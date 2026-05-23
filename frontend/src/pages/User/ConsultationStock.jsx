import React, { useState, useEffect } from 'react';
import { Search, Package, AlertTriangle, CheckCircle, XCircle, Eye, X } from 'lucide-react';
import api from '../../lib/apis/axios';

function StockBadge({ quantite }) {
  if (quantite <= 0) return (
    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-red-50 text-red-600 border border-red-200">
      <XCircle size={11} /> Rupture
    </span>
  );
  if (quantite <= 5) return (
    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
      <AlertTriangle size={11} /> Stock bas
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200">
      <CheckCircle size={11} /> Disponible
    </span>
  );
}

function ArticleCard({ article, onView }) {
  const q = article.quantite_stock;
  const isRupture = q <= 0;
  const isBas = q > 0 && q <= 5;
  const barColor = isRupture ? '#ef4444' : isBas ? '#f59e0b' : '#10b981';
  const maxStock = Math.max(article.seuil_alerte * 3, q, 20);
  const barWidth = Math.min((q / maxStock) * 100, 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="h-1 w-full" style={{ backgroundColor: barColor }} />
      <div className="p-5">
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-sm leading-tight truncate">{article.designation}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{article.code_barre}</p>
          </div>
          <StockBadge quantite={q} />
        </div>

        {article.description && (
          <p className="text-[11px] text-gray-400 mb-3 line-clamp-2">{article.description}</p>
        )}

        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <div className="flex justify-between items-baseline mb-1.5">
            <span className="text-xs text-gray-500">Stock actuel</span>
            <span className="text-lg font-bold text-gray-800">
              {q} <span className="text-xs font-medium text-gray-500">{article.unite_mesure}</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${barWidth}%`, backgroundColor: barColor }} />
          </div>
          {article.seuil_alerte && (
            <p className="text-[10px] text-gray-400 mt-1">Seuil d'alerte: {article.seuil_alerte} {article.unite_mesure}</p>
          )}
        </div>

        {article.famille && (
          <p className="text-[11px] text-gray-400 mb-3">
            Famille: <span className="font-medium text-gray-600">{article.famille?.nom_famille || article.categorie?.nom_categorie || '—'}</span>
          </p>
        )}

        <button
          onClick={() => onView(article)}
          className=" cursor-pointer w-full py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 group-hover:border-blue-300"
        >
          <Eye size={13} /> Voir les détails
        </button>
      </div>
    </div>
  );
}

export default function ConsultationStock() {
  const [articles, setArticles] = useState([]);
  const [familles, setFamilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFamille, setSelectedFamille] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => { fetchArticles(); fetchFamilles(); }, [search, selectedFamille]);

  const fetchArticles = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedFamille) params.famille_id = selectedFamille;
      const response = await api.get('/api/user/stock/articles', { params });
      let data = [];
      if (response.data?.data?.data) data = response.data.data.data;
      else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
      else if (Array.isArray(response.data)) data = response.data;
      setArticles(data);
    } catch { setArticles([]); } finally { setLoading(false); }
  };

  const fetchFamilles = async () => {
    try {
      const response = await api.get('/api/user/stock/familles');
      let data = [];
      if (response.data?.data) data = Array.isArray(response.data.data) ? response.data.data : [];
      setFamilles(data);
    } catch { setFamilles([]); }
  };

  const filteredArticles = articles.filter(a => {
    if (stockFilter === 'disponible') return a.quantite_stock > 5;
    if (stockFilter === 'bas') return a.quantite_stock > 0 && a.quantite_stock <= 5;
    if (stockFilter === 'rupture') return a.quantite_stock <= 0;
    return true;
  });

  const counts = {
    all: articles.length,
    disponible: articles.filter(a => a.quantite_stock > 5).length,
    bas: articles.filter(a => a.quantite_stock > 0 && a.quantite_stock <= 5).length,
    rupture: articles.filter(a => a.quantite_stock <= 0).length,
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3">

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>Espace personnel</span><span className="mx-1">›</span>
          <span className="text-gray-600 font-medium">Consultation stock</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Consultation du stock</h1>
        <p className="text-sm text-gray-500 mt-0.5">Consultez la disponibilité des articles</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { key: 'all', label: 'Total articles', count: counts.all, color: '#2563eb', bg: '#eff6ff' },
          { key: 'disponible', label: 'Disponibles', count: counts.disponible, color: '#10b981', bg: '#f0fdf4' },
          { key: 'bas', label: 'Stock bas', count: counts.bas, color: '#f59e0b', bg: '#fffbeb' },
          { key: 'rupture', label: 'En rupture', count: counts.rupture, color: '#ef4444', bg: '#fef2f2' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setStockFilter(item.key)}
            className={`cursor-pointer text-left p-4 rounded-2xl border transition-all ${stockFilter === item.key ? 'shadow-md ring-2' : 'bg-white border-gray-200 hover:shadow-sm'}`}
            style={stockFilter === item.key ? { backgroundColor: item.bg, borderColor: item.color, ringColor: item.color } : {}}
          >
            <p className="text-2xl font-bold" style={{ color: stockFilter === item.key ? item.color : '#1f2937' }}>{item.count}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Rechercher un article..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedFamille} onChange={e => setSelectedFamille(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
        >
          <option value="">Toutes les familles</option>
          {familles.map(f => <option key={f.id} value={f.id}>{f.nom_famille}</option>)}
        </select>
        {(search || selectedFamille || stockFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setSelectedFamille(''); setStockFilter('all'); }}
            className="cursor-pointer flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-100 transition bg-white"
          >
            <X size={13} /> Réinitialiser
          </button>
        )}
        <div className="ml-auto flex items-center text-xs text-gray-400">
          {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grille articles */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Package size={26} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-600">Aucun article trouvé</p>
          <p className="text-xs text-gray-400 mt-1">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredArticles.map(article => (
            <ArticleCard key={article.id} article={article} onView={a => { setSelectedArticle(a); setShowModal(true); }} />
          ))}
        </div>
      )}

      {/* Modal détails */}
      {showModal && selectedArticle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden">
            <div className="h-1 w-full" style={{ backgroundColor: selectedArticle.quantite_stock <= 0 ? '#ef4444' : selectedArticle.quantite_stock <= 5 ? '#f59e0b' : '#10b981' }} />
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800 truncate pr-4">{selectedArticle.designation}</h2>
              <button onClick={() => setShowModal(false)} className=" cursor-pointer p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"><X size={18} /></button>
            </div>
            <div className="p-6">
              {selectedArticle.image_url && (
                <img src={selectedArticle.image_url} alt={selectedArticle.designation} className="w-full h-36 object-contain mb-5 rounded-xl bg-gray-50 border border-gray-100" />
              )}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Stock actuel</p>
                  <p className="text-xl font-bold text-gray-800">{selectedArticle.quantite_stock} <span className="text-sm font-medium text-gray-500">{selectedArticle.unite_mesure}</span></p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Seuil d'alerte</p>
                  <p className="text-xl font-bold text-gray-800">{selectedArticle.seuil_alerte || '—'} <span className="text-sm font-medium text-gray-500">{selectedArticle.unite_mesure}</span></p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Code barre', value: selectedArticle.code_barre },
                  { label: 'Catégorie', value: selectedArticle.categorie?.nom_categorie || '—' },
                  { label: 'Emplacement', value: selectedArticle.emplacement || 'Non défini' },
                  { label: 'Description', value: selectedArticle.description || '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-start gap-3 py-1.5 border-b border-gray-50">
                    <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{row.label}</span>
                    <span className="text-xs text-gray-700 text-right">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <StockBadge quantite={selectedArticle.quantite_stock} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}