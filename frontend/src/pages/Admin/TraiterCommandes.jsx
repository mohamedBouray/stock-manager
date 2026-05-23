// src/pages/Admin/TraiterCommandes.jsx
import React, { useState, useEffect } from 'react';
import api from "../../lib/apis/axios";
import { genererPDF } from '../../lib/utils/pdfUtils';

export default function TraiterCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [lignesSaisie, setLignesSaisie] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🔥 NOUVEAU : État pour les magasins
  const [magasins, setMagasins] = useState([]);
  const [selectedMagasinId, setSelectedMagasinId] = useState('');

  useEffect(() => {
    chargerCommandes();
    fetchMagasins(); // 🔥 CHARGER LES MAGASINS
  }, []);

  const chargerCommandes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/commandes/en-attente');
      setCommandes(response.data);
      setCommandeSelectionnee(null);
    } catch (error) {
      console.error(error);
      alert("❌ خطأ في جلب الطلبات.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 NOUVELLE FONCTION : Récupérer les magasins
  const fetchMagasins = async () => {
    try {
      const response = await api.get('/api/admin/catalogue-structure');
      setMagasins(response.data.magasins || []);
      if (response.data.magasins?.length > 0) {
        setSelectedMagasinId(response.data.magasins[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectionnerCommande = (cmd) => {
    setCommandeSelectionnee(cmd);
    
    const lignesInitiales = cmd.lignes.map(l => {
      const qteDemandee = l.quantite_commandee;
      const qteDejaLivree = l.quantite_livree || 0;
      const reste = Math.max(0, qteDemandee - qteDejaLivree);

      return {
        id: l.id,
        designation: l.article?.designation || 'Article inconnu',
        code_barre: l.article?.code_barre || 'N/A',
        unite: l.article?.unite_mesure || 'Unité',
        quantite_commandee: qteDemandee,
        quantite_livree_avant: qteDejaLivree,
        reste_a_livrer: reste,
        nouvelle_quantite: reste 
      };
    });
    
    setLignesSaisie(lignesInitiales);
  };

  const handleNouvelleQuantiteChange = (index, val) => {
    const qte = parseInt(val) || 0;
    const updated = [...lignesSaisie];
    updated[index].nouvelle_quantite = Math.min(Math.max(0, qte), updated[index].reste_a_livrer);
    setLignesSaisie(updated);
  };

  const handleValiderReception = async () => {
    const totalSaisi = lignesSaisie.reduce((sum, ligne) => sum + ligne.nouvelle_quantite, 0);
    
    if (totalSaisi === 0) {
      alert("⚠️ المرجو إدخال كمية مستلمة واحدة على الأقل.");
      return;
    }

    // 🔥 VÉRIFIER QUE LE MAGASIN EST SÉLECTIONNÉ
    if (!selectedMagasinId) {
      alert("⚠️ المرجو اختيار المخزن المستلم.");
      return;
    }

    if (!window.confirm(`Confirmer l'envoi de ${totalSaisi} articles vers ${magasins.find(m => m.id == selectedMagasinId)?.nom_magasin} ?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        lignes: lignesSaisie.map(l => ({
          id: l.id,
          nouvelle_quantite: l.nouvelle_quantite
        })),
        magasin_id: selectedMagasinId // 🔥 AJOUTER LE MAGASIN
      };

      await api.post(`/api/admin/commandes/${commandeSelectionnee.id}/traiter`, payload);
      alert("🎉 تم تسجيل الإرسال بنجاح !");
      
      genererPDF(
        'BON DE RECEPTION', 
        `BR-EXP-${Math.floor(1000 + Math.random() * 9000)}`, 
        new Date().toISOString(), 
        lignesSaisie.filter(l => l.nouvelle_quantite > 0), 
        'BR'
      );

      chargerCommandes(); 
    } catch (error) {
      console.error(error);
      alert("❌ فشل معالجة الاستلام.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeStyle = (statut) => {
    if (statut === 'partiellement_livree') return "bg-orange-100 text-orange-800 border-orange-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans grid grid-cols-1 lg:grid-cols-3 gap-6 text-sm">
      
      {/* Liste des commandes */}
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg shadow-sm h-fit overflow-hidden">
        <div className="p-4 bg-slate-800 text-white font-bold uppercase tracking-wider flex justify-between items-center">
          <span>📦 Commandes Reçues</span>
          <span className="bg-slate-600 px-2 py-1 rounded text-xs">{commandes.length}</span>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 font-bold animate-pulse">جاري التحميل...</div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {commandes.map(cmd => (
              <div 
                key={cmd.id} 
                onClick={() => handleSelectionnerCommande(cmd)}
                className={`p-4 cursor-pointer transition flex flex-col gap-2 ${
                  commandeSelectionnee?.id === cmd.id 
                    ? 'bg-blue-50 border-l-4 border-blue-600' 
                    : 'hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-800">{cmd.numero_commande}</p>
                    <p className="text-xs text-slate-500 mt-1">{cmd.fournisseur}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getBadgeStyle(cmd.statut)}`}>
                    {cmd.statut === 'partiellement_livree' ? '⏳ Incomplète' : '🆕 Nouvelle'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>📅 {cmd.date_commande}</span>
                  <span>{cmd.lignes?.length || 0} Lignes</span>
                </div>
              </div>
            ))}
            {commandes.length === 0 && (
              <div className="p-8 text-center text-slate-400 italic">Aucune commande en attente.</div>
            )}
          </div>
        )}
      </div>

      {/* Zone de traitement */}
      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg shadow-sm h-fit flex flex-col">
        <div className="p-4 bg-white border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider rounded-t-lg flex justify-between items-center">
          <span>🔍 Traitement de Livraison</span>
          {commandeSelectionnee && (
            <button 
              onClick={() => genererPDF('BON DE COMMANDE', commandeSelectionnee.numero_commande, commandeSelectionnee.date_commande, commandeSelectionnee.lignes, 'BC')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-bold flex items-center gap-1 border border-slate-300"
            >
              📄 Télécharger le BC Reçu
            </button>
          )}
        </div>

        {commandeSelectionnee ? (
          <div className="p-6 flex flex-col gap-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex justify-between items-center text-slate-700">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bon de Commande</p>
                <p className="font-mono font-bold text-lg text-blue-700">{commandeSelectionnee.numero_commande}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Demandeur</p>
                <p className="font-bold">ISTAHT Tanger</p>
              </div>
            </div>

            {/* 🔥 NOUVEAU : SELECTION DU MAGASIN DE DESTINATION */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                🏪 Magasin de destination *
              </label>
              <select
                value={selectedMagasinId}
                onChange={(e) => setSelectedMagasinId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                required
              >
                {magasins.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nom_magasin} {m.localisation ? `- ${m.localisation}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                📌 Les articles seront directement ajoutés au stock de ce magasin
              </p>
            </div>

            <div>
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Saisie des quantités à expédier
              </h3>
              
              <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <th className="p-3">Désignation</th>
                      <th className="p-3 text-center border-l border-slate-200">Demandé</th>
                      <th className="p-3 text-center text-emerald-600 border-l border-slate-200">Déjà Expédié</th>
                      <th className="p-3 text-center text-orange-600 border-l border-slate-200">Reste</th>
                      <th className="p-3 text-center bg-blue-50 border-l border-blue-100">Qté du jour</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {lignesSaisie.map((ligne, index) => (
                      <tr key={ligne.id} className={ligne.reste_a_livrer === 0 ? 'bg-slate-50 opacity-60' : 'hover:bg-blue-50/30'}>
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{ligne.designation}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Code: {ligne.code_barre}</p>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-600 border-l border-slate-100 bg-slate-50/50">
                          {ligne.quantite_commandee} <span className="text-[10px] font-normal text-slate-400">{ligne.unite}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600 border-l border-slate-100">
                          {ligne.quantite_livree_avant}
                        </td>
                        <td className="p-3 text-center font-bold text-orange-500 border-l border-slate-100">
                          {ligne.reste_a_livrer}
                        </td>
                        <td className="p-3 text-center border-l border-blue-100 bg-blue-50/30">
                          {ligne.reste_a_livrer > 0 ? (
                            <input 
                              type="number" 
                              min="0"
                              max={ligne.reste_a_livrer}
                              value={ligne.nouvelle_quantite}
                              disabled={isSubmitting}
                              onChange={(e) => handleNouvelleQuantiteChange(index, e.target.value)}
                              className="w-20 border border-blue-300 rounded p-1.5 text-center font-bold text-blue-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-inner"
                            />
                          ) : (
                            <span className="text-emerald-500 text-xs font-bold">✓ Terminé</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 mt-2">
              <button 
                type="button"
                disabled={isSubmitting || lignesSaisie.every(l => l.reste_a_livrer === 0)}
                onClick={handleValiderReception}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? '⏳ Envoi...' : '📥 Expédier et Générer le BR'}
              </button>
            </div>

            {/* Historique des BR générés */}
            {commandeSelectionnee.bons_receptions && commandeSelectionnee.bons_receptions.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bons d'expédition générés</h4>
                <div className="space-y-2">
                  {commandeSelectionnee.bons_receptions.map(br => (
                    <div key={br.id} className="flex justify-between items-center p-2.5 bg-slate-50 border rounded text-xs">
                      <span className="font-mono font-bold text-slate-700">N° {br.numero_bon} (le {new Date(br.date_reception).toLocaleDateString()})</span>
                      <button 
                        onClick={() => genererPDF('BON DE RECEPTION', br.numero_bon, br.date_reception, br.lignes, 'BR')}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-1 rounded font-bold"
                      >
                        📥 Télécharger BR
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <p className="text-lg">Sélectionnez une commande pour la traiter</p>
          </div>
        )}
      </div>
    </div>
  );
}