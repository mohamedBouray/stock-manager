import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Download, ChevronDown, ChevronRight, ShoppingCart, History, X } from 'lucide-react';
import api from '../../lib/apis/axios';
import { genererPDF } from '../../lib/utils/pdfUtils';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

function StatusBadge({ statut }) {
  const s = statut?.toLowerCase() || '';
  if (s.includes('livree_totalement') || s.includes('livree totalement'))
    return <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200">Livrée totalement</span>;
  if (s.includes('partiellement'))
    return <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">Partiellement livrée</span>;
  return <span className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200">En cours</span>;
}

export default function CommandeMinistereFinal() {
  const [activeTab, setActiveTab] = useState('historique');
  const [structureDonnees, setStructureDonnees] = useState([]);
  const [familleSelectionnee, setFamilleSelectionnee] = useState('');
  const [categorieSelectionnee, setCategorieSelectionnee] = useState('');
  const [articleSelectionne, setArticleSelectionne] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [panierCommande, setPanierCommande] = useState([]);
  const [numeroCommande, setNumeroCommande] = useState(`BC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [historiqueCommandes, setHistoriqueCommandes] = useState([]);
  const [commandeDeployee, setCommandeDeployee] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, type: 'success', title: '', message: '', confirmText: 'Confirmer', onConfirm: () => {},
  });
  const openConfirm = (cfg) => setConfirmModal({ ...confirmModal, isOpen: true, ...cfg });
  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  useEffect(() => { chargerCatalogue(); chargerHistorique(); }, []);

  const chargerCatalogue = async () => {
    try {
      const response = await api.get('/api/admin/catalogue-structure');
      if (response.data?.catalogue) setStructureDonnees(response.data.catalogue);
    } catch (error) { console.error(error); }
  };

  const chargerHistorique = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/commandes');
      setHistoriqueCommandes(response.data || []);
    } catch (error) { console.error(error); }
    finally { setIsLoading(false); }
  };

  const familleActuelle = Array.isArray(structureDonnees) ? structureDonnees.find(f => f.id === parseInt(familleSelectionnee)) : null;
  const categoriesDisponibles = familleActuelle?.categories || [];
  const categorieActuelle = Array.isArray(categoriesDisponibles) ? categoriesDisponibles.find(c => c.id === parseInt(categorieSelectionnee)) : null;
  const articlesDisponibles = categorieActuelle?.articles || [];

  const ajouterAuPanier = (e) => {
    e.preventDefault();
    if (!articleSelectionne) return;
    const articleInfos = articlesDisponibles.find(a => a.id === parseInt(articleSelectionne));
    if (!articleInfos) return;
    if (panierCommande.some(l => l.article_id === articleInfos.id)) {
      alert('Cet article est déjà dans le panier');
      return;
    }
    setPanierCommande([...panierCommande, {
      id_ligne: Date.now(),
      article_id: articleInfos.id,
      designation: articleInfos.designation,
      unite: articleInfos.unite_mesure || articleInfos.unite || 'Pièce',
      quantite,
      code_barre: articleInfos.code_barre,
    }]);
    setArticleSelectionne('');
    setQuantite(1);
  };

  const supprimerLigne = (id) => setPanierCommande(panierCommande.filter(l => l.id_ligne !== id));

  const handleValiderCommande = () => {
    if (panierCommande.length === 0) { alert('Le panier est vide'); return; }
    openConfirm({
      type: 'success',
      title: 'Valider la commande',
      message: `Confirmer la commande ${numeroCommande} avec ${panierCommande.length} article(s) ?`,
      confirmText: 'Oui, valider',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const payload = {
            numero_commande: numeroCommande,
            date_commande: new Date().toISOString().split('T')[0],
            fournisseur: 'Ministère du Tourisme',
            lignes: JSON.stringify(panierCommande.map(l => ({ article_id: l.article_id, quantite: l.quantite }))),
          };
          await api.post('/api/admin/commandes', payload);
          genererPDF('BON DE COMMANDE', numeroCommande, payload.date_commande, panierCommande, 'BC');
          setPanierCommande([]);
          setNumeroCommande(`BC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
          chargerHistorique();
          setActiveTab('historique');
        } catch { alert('Erreur lors de l\'envoi'); }
        finally { setIsLoading(false); }
      },
    });
  };

  const handleTelechargerPDFCommande = (cmd) => {
    const lignesFormatees = cmd.lignes?.map(l => ({
      code_barre: l.article?.code_barre || l.code_barre || 'N/A',
      designation: l.article?.designation || l.designation,
      unite: l.article?.unite_mesure || l.unite || 'Pièce',
      quantite: l.quantite,
    })) || [];
    genererPDF('BON DE COMMANDE', cmd.numero_commande, cmd.date_commande, lignesFormatees, 'BC');
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50';
  const labelCls = 'block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50 ">

      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <span>Admin</span><span className="mx-1">›</span>
          <span className="text-gray-600 font-medium">Commandes fournisseurs</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Commandes fournisseurs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Émettez des bons de commande au Ministère</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('nouvelle')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'nouvelle' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <ShoppingCart size={13} /> Nouvelle commande
          {panierCommande.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'nouvelle' ? 'bg-blue-500' : 'bg-gray-100 text-gray-600'}`}>{panierCommande.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${activeTab === 'historique' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          <History size={13} /> Historique
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'historique' ? 'bg-blue-500' : 'bg-gray-100 text-gray-600'}`}>{historiqueCommandes.length}</span>
        </button>
      </div>

      {/* ── Nouvelle commande ── */}
      {activeTab === 'nouvelle' && (
        <div className="space-y-5">
          {/* N° commande */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Numéro de commande</p>
              <p className="text-lg font-mono font-bold text-blue-600 mt-0.5">{numeroCommande}</p>
            </div>
            <span className="text-xs text-gray-400">{new Date().toLocaleDateString('fr-FR')}</span>
          </div>

          {/* Sélection article */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Ajouter un article</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className={labelCls}>Famille</label>
                <select
                  value={familleSelectionnee}
                  onChange={e => { setFamilleSelectionnee(e.target.value); setCategorieSelectionnee(''); setArticleSelectionne(''); }}
                  className={inputCls}
                >
                  <option value="">— Choisir —</option>
                  {Array.isArray(structureDonnees) && structureDonnees.map(f => <option key={f.id} value={f.id}>{f.nom_famille}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Catégorie</label>
                <select
                  value={categorieSelectionnee}
                  onChange={e => { setCategorieSelectionnee(e.target.value); setArticleSelectionne(''); }}
                  disabled={!familleSelectionnee}
                  className={inputCls}
                >
                  <option value="">— Choisir —</option>
                  {categoriesDisponibles.map(c => <option key={c.id} value={c.id}>{c.nom_categorie}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Article</label>
                <select
                  value={articleSelectionne}
                  onChange={e => setArticleSelectionne(e.target.value)}
                  disabled={!categorieSelectionnee}
                  className={inputCls}
                >
                  <option value="">— Choisir —</option>
                  {articlesDisponibles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Quantité</label>
                <div className="flex gap-2">
                  <input
                    type="number" min="1"
                    value={quantite}
                    onChange={e => setQuantite(parseInt(e.target.value) || 1)}
                    disabled={!articleSelectionne}
                    className="w-20 px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <button
                    onClick={ajouterAuPanier}
                    disabled={!articleSelectionne}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm disabled:opacity-50"
                  >
                    <Plus size={13} /> Ajouter
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panier */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ShoppingCart size={15} className="text-blue-500" /> Panier
              </h3>
              <span className="text-xs text-gray-400">{panierCommande.length} article{panierCommande.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Code barre', 'Désignation', 'Unité', 'Quantité', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {panierCommande.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <ShoppingCart size={20} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-400">Le panier est vide</p>
                      </td>
                    </tr>
                  ) : panierCommande.map(l => (
                    <tr key={l.id_ligne} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-500">{l.code_barre || '—'}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{l.designation} <span className="text-xs font-normal text-gray-400">({l.unite})</span></td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">{l.unite}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-gray-800">{l.quantite}</td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => supprimerLigne(l.id_ligne)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {panierCommande.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleValiderCommande}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-60"
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShoppingCart size={14} />}
                  Valider la commande
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Historique ── */}
      {activeTab === 'historique' && (
        <div className="space-y-3">
          {isLoading && historiqueCommandes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : historiqueCommandes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <History size={22} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">Aucune commande trouvée</p>
            </div>
          ) : historiqueCommandes.map(cmd => (
            <div key={cmd.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header commande */}
              <div
                className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setCommandeDeployee(commandeDeployee === cmd.id ? null : cmd.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 font-mono">{cmd.numero_commande}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(cmd.created_at || cmd.date_commande).toLocaleDateString('fr-FR')} · {cmd.lignes?.length || 0} article{(cmd.lignes?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge statut={cmd.statut} />
                  <button
                    onClick={e => { e.stopPropagation(); handleTelechargerPDFCommande(cmd); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    <Download size={11} /> PDF
                  </button>
                  {commandeDeployee === cmd.id
                    ? <ChevronDown size={15} className="text-gray-400" />
                    : <ChevronRight size={15} className="text-gray-400" />}
                </div>
              </div>

              {/* Détails livraisons */}
              {commandeDeployee === cmd.id && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-4">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Bons de réception</p>
                  {cmd.bons_receptions?.length > 0 ? (
                    <div className="space-y-2">
                      {cmd.bons_receptions.map(br => (
                        <div key={br.id} className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                          <div>
                            <span className="text-sm font-bold text-green-800 font-mono">{br.numero_bon}</span>
                            <span className="text-xs text-gray-500 ml-3">Reçu le {new Date(br.date_reception).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <button
                            onClick={() => {
                              const lignesBR = br.lignes?.map(l => ({
                                code_barre: l.article?.code_barre || '—',
                                designation: l.article?.designation || 'Article',
                                unite: l.article?.unite_mesure || 'Pièce',
                                quantite_recue: l.quantite_recue || l.quantite,
                              })) || [];
                              genererPDF('BON DE RECEPTION', br.numero_bon, br.date_reception, lignesBR, 'BR');
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-semibold transition"
                          >
                            <Download size={11} /> BR
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Aucune réception enregistrée pour cette commande.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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