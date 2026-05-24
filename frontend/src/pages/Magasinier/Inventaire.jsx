import React, { useState, useEffect } from 'react';
import { ClipboardList, Save, CheckCircle, X, AlertTriangle } from 'lucide-react';
import api from '../../lib/apis/axios';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

export default function MagasinierInventaire() {
  const [inventaireActuel, setInventaireActuel] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quantitesSaisies, setQuantitesSaisies] = useState({});

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', confirmText: 'Confirmer', onConfirm: () => {},
  });
  const openConfirm = (cfg) => setConfirmModal({ ...confirmModal, isOpen: true, ...cfg });
  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => { fetchInventaireActuel(); }, []);

  const fetchInventaireActuel = async () => {
    try {
      const response = await api.get('/api/magasinier/inventaire/actuel');
      setInventaireActuel(response.data);
      if (response.data?.lignes) {
        const initialQuantites = {};
        response.data.lignes.forEach(ligne => {
          // 🔥 CORRECTION: Stocker l'article AVEC ses données
          initialQuantites[ligne.article_id] = ligne.quantite_reelle || ligne.quantite_theorique;
        });
        setQuantitesSaisies(initialQuantites);
        // 🔥 CORRECTION: Garder la ligne complète pour avoir quantite_theorique
        setArticles(response.data.lignes);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
};

  const handleQuantiteChange = (articleId, value) => {
    setQuantitesSaisies({ ...quantitesSaisies, [articleId]: parseInt(value) || 0 });
  };

  const handleSave = async () => {
    if (!inventaireActuel?.id) { alert('Aucun inventaire en cours.'); return; }
    setSaving(true);
    try {
      const lignes = Object.entries(quantitesSaisies).map(([articleId, quantite]) => ({
        article_id: articleId, quantite_reelle: quantite,
      }));
      await api.post(`/api/magasinier/inventaire/${inventaireActuel.id}/save`, { lignes });
      fetchInventaireActuel();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleFinaliser = () => {
    if (!inventaireActuel?.id) { alert('Aucun inventaire en cours'); return; }
    openConfirm({
      type: 'warning',
      title: 'Finaliser l\'inventaire',
      message: 'Les écarts seront définitivement appliqués au stock. Cette action est irréversible.',
      confirmText: 'Oui, finaliser',
      onConfirm: async () => {
        try {
          await api.post(`/api/magasinier/inventaire/${inventaireActuel.id}/finaliser`);
          fetchInventaireActuel();
        } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
      },
    });
  };

  // Calcul stats
  const ecarts = articles.map(ligne => {
      const theorique = ligne.quantite_theorique || 0; 
      const reelle = quantitesSaisies[ligne.article_id] || 0;
      return reelle - theorique;
  });
  const nbEcarts = ecarts.filter(e => e !== 0).length;
  const nbPositifs = ecarts.filter(e => e > 0).length;
  const nbNegatifs = ecarts.filter(e => e < 0).length;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!inventaireActuel) return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-14 text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <ClipboardList size={28} className="text-gray-400" />
        </div>
        <p className="text-base font-semibold text-gray-700 mb-1">Aucun inventaire en cours</p>
        <p className="text-sm text-gray-400">Attendez qu'un administrateur crée un inventaire</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <span>Magasinier</span><span className="mx-1">›</span>
            <span className="text-gray-600 font-medium">Inventaire physique</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Inventaire physique</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-mono font-semibold text-blue-600">{inventaireActuel.numero_inventaire}</span>
            <span className="mx-2 text-gray-300">·</span>
            {inventaireActuel.magasin?.nom_magasin}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-60"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save size={15} />
            }
            Sauvegarder
          </button>
          <button
            onClick={handleFinaliser}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <CheckCircle size={15} /> Finaliser
          </button>
        </div>
      </div>

      {/* Stats écarts */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Articles avec écart', value: nbEcarts, accent: '#f59e0b', bg: '#fffbeb' },
          { label: 'Excédents (+)', value: nbPositifs, accent: '#10b981', bg: '#f0fdf4' },
          { label: 'Manquants (−)', value: nbNegatifs, accent: '#ef4444', bg: '#fef2f2' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-2xl font-bold" style={{ color: s.accent }}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{articles.length} articles à inventorier</p>
          {nbEcarts > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <AlertTriangle size={12} /> {nbEcarts} écart{nbEcarts > 1 ? 's' : ''} détecté{nbEcarts > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Article', 'Code barre', 'Stock théorique', 'Stock réel (saisi)', 'Écart'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articles.map(ligne => {
                const article = ligne.article;
                const quantiteTheorique = ligne.quantite_theorique || 0; // 🔥 DIRECTEMENT DE LA LIGNE
                const quantiteReelle = quantitesSaisies[article.id] || 0;
                const ecart = quantiteReelle - quantiteTheorique;
                const hasEcart = ecart !== 0;

                return (
                  <tr key={article.id} className={`transition-colors ${hasEcart ? ecart > 0 ? 'bg-green-50/40 hover:bg-green-50/60' : 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-blue-50/20'}`}>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{article.designation}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{article.code_barre}</td>
                    <td className="px-4 py-3.5 text-sm font-bold text-gray-700 text-center">{quantiteTheorique}</td>
                    <td className="px-4 py-3.5">
                      <input
                        type="number" min="0"
                        className={`w-24 px-3 py-2 border rounded-xl text-sm text-center font-semibold focus:outline-none focus:ring-2 transition ${hasEcart ? ecart > 0 ? 'border-green-300 focus:ring-green-400 text-green-700 bg-green-50' : 'border-red-300 focus:ring-red-400 text-red-600 bg-red-50' : 'border-gray-200 focus:ring-blue-400 text-gray-700'}`}
                        value={quantiteReelle}
                        onChange={e => handleQuantiteChange(article.id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {hasEcart ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${ecart > 0 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                          {ecart > 0 ? `+${ecart}` : ecart}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                );
            })}
            </tbody>
          </table>
        </div>
      </div>

      <ActionConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        cancelText="Annuler"
      />
    </div>
  );
}