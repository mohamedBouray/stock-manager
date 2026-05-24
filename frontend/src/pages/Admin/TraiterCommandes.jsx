import React, { useState, useEffect } from 'react';
import { Package, Building2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import api from "../../lib/apis/axios";
import { genererPDF } from '../../lib/utils/pdfUtils';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

export default function TraiterCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [lignesSaisie, setLignesSaisie] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [magasins, setMagasins] = useState([]);
  const [selectedMagasinId, setSelectedMagasinId] = useState('');

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

  useEffect(() => {
    chargerCommandes();
    fetchMagasins();
  }, []);

  const chargerCommandes = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/admin/commandes/en-attente');
      setCommandes(response.data);
      setCommandeSelectionnee(null);
    } catch (error) {
      console.error(error);
      openConfirmModal('danger', 'Erreur', 'Erreur lors du chargement des commandes', 'OK', null);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleValiderReception = () => {
    const totalSaisi = lignesSaisie.reduce((sum, ligne) => sum + ligne.nouvelle_quantite, 0);
    
    if (totalSaisi === 0) {
      openConfirmModal('warning', 'Attention', 'Veuillez saisir une quantité à recevoir', 'OK', null);
      return;
    }

    if (!selectedMagasinId) {
      openConfirmModal('warning', 'Attention', 'Veuillez sélectionner un magasin de destination', 'OK', null);
      return;
    }

    const magasinNom = magasins.find(m => m.id == selectedMagasinId)?.nom_magasin;
    
    openConfirmModal(
      'warning',
      'Confirmation',
      `Confirmer la réception de ${totalSaisi} article(s) vers ${magasinNom} ?`,
      'Oui, confirmer',
      async () => {
        setIsSubmitting(true);
        try {
          const payload = {
            lignes: lignesSaisie.map(l => ({
              id: l.id,
              nouvelle_quantite: l.nouvelle_quantite
            })),
            magasin_id: selectedMagasinId
          };

          await api.post(`/api/admin/commandes/${commandeSelectionnee.id}/traiter`, payload);
          
          genererPDF(
            'BON DE RECEPTION', 
            `BR-EXP-${Math.floor(1000 + Math.random() * 9000)}`, 
            new Date().toISOString(), 
            lignesSaisie.filter(l => l.nouvelle_quantite > 0), 
            'BR'
          );

          openConfirmModal('success', 'Succès', 'Réception enregistrée avec succès', 'OK', () => {
            chargerCommandes();
          });
        } catch (error) {
          console.error(error);
          openConfirmModal('danger', 'Erreur', error.response?.data?.message || 'Erreur lors du traitement', 'OK', null);
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const getBadgeStyle = (statut) => {
    if (statut === 'partiellement_livree') return "bg-amber-100 text-amber-800";
    return "bg-blue-100 text-blue-800";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Traiter les réceptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérez les réceptions des commandes fournisseurs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des commandes */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-fit">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package size={16} /> Commandes en attente ({commandes.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {commandes.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Aucune commande en attente
              </div>
            ) : (
              commandes.map(cmd => (
                <div 
                  key={cmd.id} 
                  onClick={() => handleSelectionnerCommande(cmd)}
                  className={`p-4 cursor-pointer transition ${
                    commandeSelectionnee?.id === cmd.id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-600' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{cmd.numero_commande}</p>
                      <p className="text-xs text-gray-500 mt-1">{cmd.fournisseur}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getBadgeStyle(cmd.statut)}`}>
                      {cmd.statut === 'partiellement_livree' ? 'Partielle' : 'Nouvelle'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>📅 {cmd.date_commande}</span>
                    <span>{cmd.lignes?.length || 0} article(s)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Zone de traitement */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {commandeSelectionnee ? (
            <div>
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText size={16} /> Traitement de la commande
                </h2>
                <button 
                  onClick={() => genererPDF('BON DE COMMANDE', commandeSelectionnee.numero_commande, commandeSelectionnee.date_commande, commandeSelectionnee.lignes, 'BC')}
                  className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  Télécharger BC
                </button>
              </div>

              <div className="p-5">
                {/* Infos commande */}
                <div className="bg-gray-50 rounded-lg p-4 mb-5">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-xs text-gray-500">N° Commande</p>
                      <p className="font-mono font-bold text-blue-600">{commandeSelectionnee.numero_commande}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm text-gray-700">{commandeSelectionnee.date_commande}</p>
                    </div>
                  </div>
                </div>

                {/* Sélection magasin */}
                <div className="bg-blue-50 rounded-lg p-4 mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Building2 size={16} /> Magasin de destination *
                  </label>
                  <select
                    value={selectedMagasinId}
                    onChange={(e) => setSelectedMagasinId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    {magasins.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nom_magasin} {m.localisation ? `- ${m.localisation}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Les articles seront ajoutés au stock de ce magasin
                  </p>
                </div>

                {/* Tableau des lignes */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-500">
                        <th className="px-3 py-2 text-left">Article</th>
                        <th className="px-3 py-2 text-center">Commandé</th>
                        <th className="px-3 py-2 text-center">Déjà reçu</th>
                        <th className="px-3 py-2 text-center">Reste</th>
                        <th className="px-3 py-2 text-center">À recevoir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lignesSaisie.map((ligne, index) => (
                        <tr key={ligne.id} className="text-sm">
                          <td className="px-3 py-3">
                            <p className="font-medium text-gray-800">{ligne.designation}</p>
                            <p className="text-[10px] text-gray-400">{ligne.code_barre}</p>
                          </td>
                          <td className="px-3 py-3 text-center">{ligne.quantite_commandee}</td>
                          <td className="px-3 py-3 text-center text-green-600">{ligne.quantite_livree_avant}</td>
                          <td className="px-3 py-3 text-center text-amber-600">{ligne.reste_a_livrer}</td>
                          <td className="px-3 py-3 text-center">
                            {ligne.reste_a_livrer > 0 ? (
                              <input 
                                type="number" 
                                min="0"
                                max={ligne.reste_a_livrer}
                                value={ligne.nouvelle_quantite}
                                disabled={isSubmitting}
                                onChange={(e) => handleNouvelleQuantiteChange(index, e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                              />
                            ) : (
                              <span className="text-green-600 text-xs">Complété</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bouton validation */}
                <div className="flex justify-end pt-5 border-t border-gray-100 mt-5">
                  <button 
                    type="button"
                    disabled={isSubmitting || lignesSaisie.every(l => l.reste_a_livrer === 0)}
                    onClick={handleValiderReception}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle size={16} /> {isSubmitting ? 'Traitement...' : 'Valider la réception'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
              <Package size={48} className="mb-3 opacity-50" />
              <p className="text-sm">Sélectionnez une commande pour la traiter</p>
            </div>
          )}
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