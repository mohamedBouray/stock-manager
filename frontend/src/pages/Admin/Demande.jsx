import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axios';
import { genererPDF } from '../../lib/utils/pdfUtils';

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

  useEffect(() => {
    chargerCatalogue();
    chargerHistorique();
  }, []);

  const chargerCatalogue = async () => {
    try {
      const response = await api.get('/api/admin/catalogue-structure');
      if (response.data && response.data.catalogue) {
        setStructureDonnees(response.data.catalogue);
      }
    } catch (error) {
      console.error("Erreur catalogue:", error);
    }
  };

  const chargerHistorique = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/commandes'); 
      setHistoriqueCommandes(response.data || []);
    } catch (error) {
      console.error("Erreur historique:", error);
    } finally {
      setIsLoading(false);
    }
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

    // T'assurer beli l'article machi deja f l-panier
    if (panierCommande.some(l => l.article_id === articleInfos.id)) {
      alert("هذا المقال موجود بالفعل في السلة !");
      return;
    }

    const nouvelleLigne = {
      id_ligne: Date.now(),
      article_id: articleInfos.id,
      designation: articleInfos.designation,
      unite: articleInfos.unite_mesure || articleInfos.unite || 'Pièce',
      quantite: quantite,
      code_barre: articleInfos.code_barre,
    };

    setPanierCommande([...panierCommande, nouvelleLigne]);
    setArticleSelectionne('');
    setQuantite(1);
  };

  const supprimerLigne = (id) => setPanierCommande(panierCommande.filter(l => l.id_ligne !== id));

  const handleValiderCommande = async () => {
    if (panierCommande.length === 0) return alert("اللائحة فارغة!");
    
    setIsLoading(true);
    try {
      const payload = {
        numero_commande: numeroCommande,
        date_commande: new Date().toISOString().split('T')[0],
        fournisseur: "Ministère du Tourisme",
        lignes: JSON.stringify(panierCommande.map(l => ({
          article_id: l.article_id,
          quantite: l.quantite
        })))
      };

      await api.post('/api/admin/commandes', payload);
      alert(`🎉 تم إرسال الطلب بنجاح!`);
      
      genererPDF('BON DE COMMANDE', numeroCommande, payload.date_commande, panierCommande, 'BC');

      setPanierCommande([]);
      setNumeroCommande(`BC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      chargerHistorique(); 
      setActiveTab('historique'); 
    } catch (error) {
      alert("❌ خطأ في الإرسال.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStyle = (statut) => {
    const s = statut?.toLowerCase() || '';
    if (s.includes('livree_totalement') || s.includes('livree totalement')) {
      return 'bg-emerald-100 text-emerald-800';
    }
    if (s.includes('partiellement_livree') || s.includes('partiellement livree')) {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const formatStatusText = (statut) => {
    return statut ? statut.replace('_', ' ').toUpperCase() : 'EN COURS';
  };

  const handleTelechargerPDFCommande = (cmd) => {
    // Mapping hna bach dima l-keys ikono sghar u kikhdmo m3a utils dyal l-pdf flawlessly
    const lignesFormatees = cmd.lignes?.map(l => ({
      code_barre: l.article?.code_barre || l.code_barre || 'N/A',
      designation: l.article?.designation || l.designation,
      unite: l.article?.unite_mesure || l.unite || 'Pièce',
      quantite: l.quantite
    })) || [];

    genererPDF('BON DE COMMANDE', cmd.numero_commande, cmd.date_commande, lignesFormatees, 'BC');
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans flex flex-col items-center">
      {/* Navigation Tabs */}
      <div className="w-full max-w-5xl mb-6 flex bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200">
        <button 
          onClick={() => setActiveTab('nouvelle')}
          className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider transition ${activeTab === 'nouvelle' ? 'bg-emerald-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          ➕ Nouvelle Commande
        </button>
        <button 
          onClick={() => setActiveTab('historique')}
          className={`flex-1 py-3 font-bold text-sm uppercase tracking-wider transition ${activeTab === 'historique' ? 'bg-emerald-950 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          📜 Historique & Bons de Réception
        </button>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        {activeTab === 'nouvelle' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <h2 className="text-lg font-bold text-slate-800">Émettre une commande au Ministère</h2>
              <span className="bg-emerald-100 text-emerald-900 font-mono font-bold px-3 py-1 rounded">{numeroCommande}</span>
            </div>

            {/* Selection Form */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Famille</label>
                <select value={familleSelectionnee} onChange={(e) => { setFamilleSelectionnee(e.target.value); setCategorieSelectionnee(''); setArticleSelectionne(''); }} className="w-full bg-white border border-slate-300 rounded p-2 text-sm outline-none focus:border-emerald-700">
                  <option value="">-- Choisir --</option>
                  {Array.isArray(structureDonnees) && structureDonnees.map(f => <option key={f.id} value={f.id}>{f.nom_famille}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Catégorie</label>
                <select value={categorieSelectionnee} onChange={(e) => { setCategorieSelectionnee(e.target.value); setArticleSelectionne(''); }} disabled={!familleSelectionnee} className="w-full bg-white border border-slate-300 rounded p-2 text-sm outline-none focus:border-emerald-700">
                  <option value="">-- Choisir --</option>
                  {categoriesDisponibles.map(c => <option key={c.id} value={c.id}>{c.nom_categorie}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Article Existant</label>
                <select value={articleSelectionne} onChange={(e) => setArticleSelectionne(e.target.value)} disabled={!categorieSelectionnee} className="w-full bg-white border border-slate-300 rounded p-2 text-sm outline-none focus:border-emerald-700 font-bold text-emerald-900">
                  <option value="">-- Choisir Article --</option>
                  {articlesDisponibles.map(a => <option key={a.id} value={a.id}>{a.designation}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Qté</label>
                <div className="flex gap-2">
                  <input type="number" min="1" value={quantite} onChange={(e) => setQuantite(parseInt(e.target.value) || 1)} disabled={!articleSelectionne} className="w-20 border border-slate-300 rounded p-2 text-center text-sm font-bold" />
                  <button onClick={ajouterAuPanier} disabled={!articleSelectionne} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-sm disabled:opacity-50">Ajouter</button>
                </div>
              </div>
            </div>

            {/* Panier Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse mt-4 text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase text-xs">
                    <th className="p-3 border-b">Code Barre</th>
                    <th className="p-3 border-b">Désignation</th>
                    <th className="p-3 border-b text-center">Quantité</th>
                    <th className="p-3 border-b text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {panierCommande.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-slate-400 italic">السلة فارغة حالياً. قم بإضافة مقالات من الأعلى.</td>
                    </tr>
                  ) : (
                    panierCommande.map(l => (
                      <tr key={l.id_ligne} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-mono text-slate-500">{l.code_barre || '---'}</td>
                        <td className="p-3 font-bold text-slate-800">{l.designation} <span className="text-xs text-slate-400 font-normal">({l.unite})</span></td>
                        <td className="p-3 text-center font-bold">{l.quantite}</td>
                        <td className="p-3 text-right"><button onClick={() => supprimerLigne(l.id_ligne)} className="text-red-500 hover:underline text-xs font-bold">Supprimer</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={handleValiderCommande} disabled={panierCommande.length === 0 || isLoading} className="bg-emerald-950 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-emerald-900 transition disabled:opacity-50">
                {isLoading ? 'Envoi...' : '✅ Valider la Commande'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'historique' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-4">Historique des Commandes et Réceptions</h2>
            
            {isLoading && historiqueCommandes.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-6">Chargement de l'historique...</p>
            ) : historiqueCommandes.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-6 italic">Aucune commande trouvée.</p>
            ) : (
              historiqueCommandes.map(cmd => (
                <div key={cmd.id} className="border border-slate-200 rounded-lg overflow-hidden mb-4 shadow-sm">
                  <div 
                    className="bg-slate-50 p-4 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition"
                    onClick={() => setCommandeDeployee(commandeDeployee === cmd.id ? null : cmd.id)}
                  >
                    <div>
                      <h3 className="font-bold text-emerald-900 text-base">{cmd.numero_commande}</h3>
                      <p className="text-xs text-slate-500 mt-1">📅 Créée le: {new Date(cmd.created_at || cmd.date_commande).toLocaleDateString()} | 📦 Lignes: {cmd.lignes?.length || 0}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${getStatusStyle(cmd.statut)}`}>
                        {formatStatusText(cmd.statut)}
                      </span>
                      
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleTelechargerPDFCommande(cmd);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                      >
                        📄 PDF Commande
                      </button>
                      
                      <span className="text-slate-400">{commandeDeployee === cmd.id ? '▼' : '▶'}</span>
                    </div>
                  </div>

                  {commandeDeployee === cmd.id && (
                    <div className="p-4 bg-white border-t border-slate-200">
                      <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Historique des Livraisons (Bons de Réception)</h4>
                      
                      {cmd.bons_receptions && cmd.bons_receptions.length > 0 ? (
                        <div className="space-y-3">
                          {cmd.bons_receptions.map(br => (
                            <div key={br.id} className="flex justify-between items-center p-3 bg-emerald-50/50 border border-emerald-100 rounded">
                              <div>
                                <span className="font-bold text-emerald-800 mr-3">N° {br.numero_bon}</span>
                                <span className="text-xs text-slate-500">Reçu le : {new Date(br.date_reception).toLocaleDateString()}</span>
                              </div>
                              <button 
                                onClick={() => {
                                  const lignesBRFormatees = br.lignes?.map(l => ({
                                    code_barre: l.article?.code_barre || '---',
                                    designation: l.article?.designation || 'Article inconnu',
                                    unite: l.article?.unite_mesure || 'Pièce',
                                    quantite_recue: l.quantite_recue || l.quantite
                                  })) || [];
                                  genererPDF('BON DE RECEPTION', br.numero_bon, br.date_reception, lignesBRFormatees, 'BR');
                                }}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1 rounded text-xs font-bold shadow-sm"
                              >
                                📥 Télécharger BR
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Aucune réception enregistrée pour cette commande pour le moment.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}