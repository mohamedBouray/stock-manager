import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, Archive, FileText, MessageCircle, Undo2, Package, CheckCircle } from 'lucide-react';
import api from '../../lib/apis/axios';
import MessageModal from '../../lib/components/MessageModal';
import ActionConfirmModal from '../../lib/components/ActionConfirmModal';

function StatusBadge({ statut }) {
  const map = {
    en_attente: { label: ' En attente', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    approuvee: { label: ' Approuvée', cls: 'bg-green-50 text-green-700 border border-green-200' },
    refusee: { label: ' Refusée', cls: 'bg-red-50 text-red-600 border border-red-200' },
    livree: { label: ' Livrée', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  };
  const cfg = map[statut] || { label: statut, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${cfg.cls}`}>{cfg.label}</span>;
}

export default function Demandes() {
  const [demandes, setDemandes] = useState([]);
  const [articles, setArticles] = useState([]);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDemande, setEditingDemande] = useState(null);
  const [formData, setFormData] = useState({ article_id: '', quantite_demandee: '', motif: '' });
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [showRetourModal, setShowRetourModal] = useState(false);
  const [selectedDemandeForRetour, setSelectedDemandeForRetour] = useState(null);
  const [retourData, setRetourData] = useState({ quantite: 1, motif: '', maxRetour: 0 });
  const [retourLoading, setRetourLoading] = useState(false);
    const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    confirmText: 'Confirmer',
    onConfirm: null
    });
  useEffect(() => { fetchDemandes(); fetchArticles(); fetchArchives(); }, []);
    const openConfirmModal = (type, title, message, confirmText, onConfirm) => {
    setActionModal({
        isOpen: true,
        type,
        title,
        message,
        confirmText,
        onConfirm: () => {
        onConfirm();
        setActionModal(prev => ({ ...prev, isOpen: false }));
        }
    });
    };
    
  const fetchDemandes = async () => {
    try {
      const response = await api.get('/api/user/demandes');
      let data = [];
      if (response.data?.data?.data) data = response.data.data.data;
      else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
      else if (Array.isArray(response.data)) data = response.data;
      setDemandes(data.filter(d => d.is_archived !== 1));
    } catch { setDemandes([]); } finally { setLoading(false); }
  };

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

  const fetchArchives = async () => {
    try {
      const response = await api.get('/api/user/demandes/archives/list');
      let data = [];
      if (response.data?.data?.data) data = response.data.data.data;
      else if (response.data?.data && Array.isArray(response.data.data)) data = response.data.data;
      else if (Array.isArray(response.data)) data = response.data;
      setArchives(data.filter(d => d.is_archived === 1));
    } catch { setArchives([]); }
  };

const handleArchive = async (id) => {
  try {
    await api.post(`/api/user/demandes/${id}/archive`);
    await fetchDemandes(); await fetchArchives();
  } catch { alert('Erreur lors de l\'archivage'); }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDemande) await api.put(`/api/user/demandes/${editingDemande.id}`, formData);
      else await api.post('/api/user/demandes', formData);
      setShowModal(false); setEditingDemande(null);
      setFormData({ article_id: '', quantite_demandee: '', motif: '' });
      await fetchDemandes();
    } catch (error) { alert(error.response?.data?.message || 'Erreur'); }
  };

    const handleDelete = async (id) => {
    try { 
        await api.delete(`/api/user/demandes/${id}`); 
        await fetchDemandes(); 
    } catch { 
        alert('Erreur lors de l\'annulation'); 
    }
    };

  const handleExportPDF = async (id) => {
    try {
      const response = await api.get(`/api/user/demandes/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `demande_${id}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Erreur lors du téléchargement'); }
  };

  const handleBonLivraison = async (id) => {
    try {
      const response = await api.get(`/api/user/demandes/${id}/bon-livraison`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `bon_livraison_${id}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('Erreur lors du téléchargement'); }
  };

  const openRetourModal = (demande) => {
    const quantiteRecue = demande.quantite_accorde || demande.quantite_demandee;
    const quantiteRetournee = demande.quantite_retournee || 0;
    const maxRetour = quantiteRecue - quantiteRetournee;
    if (maxRetour <= 0) { alert('Vous avez déjà retourné tous les articles'); return; }
    setSelectedDemandeForRetour(demande);
    setRetourData({ quantite: maxRetour, motif: '', maxRetour });
    setShowRetourModal(true);
  };

  const handleRetour = async () => {
    if (!retourData.motif.trim()) { alert('Veuillez saisir un motif de retour'); return; }
    if (retourData.quantite <= 0 || retourData.quantite > retourData.maxRetour) {
      alert(`La quantité doit être entre 1 et ${retourData.maxRetour}`); return;
    }
    setRetourLoading(true);
    try {
      await api.post('/api/user/retours', {
        demande_id: selectedDemandeForRetour.id,
        article_id: selectedDemandeForRetour.article_id,
        quantite: retourData.quantite,
        motif: retourData.motif
      });
      setShowRetourModal(false); setSelectedDemandeForRetour(null);
      setRetourData({ quantite: 1, motif: '', maxRetour: 0 });
      await fetchDemandes();
    } catch (error) { alert(error.response?.data?.message || 'Erreur lors du retour'); }
    finally { setRetourLoading(false); }
  };

  const filteredDemandes = demandes.filter(d => {
    if (filter !== 'all' && d.statut !== filter) return false;
    if (search && !d.article?.designation?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filterButtons = [
    { key: 'all', label: 'Toutes', count: demandes.length },
    { key: 'en_attente', label: 'En attente', count: demandes.filter(d => d.statut === 'en_attente').length },
    { key: 'approuvee', label: 'Approuvées', count: demandes.filter(d => d.statut === 'approuvee').length },
    { key: 'refusee', label: 'Refusées', count: demandes.filter(d => d.statut === 'refusee').length },
    { key: 'livree', label: 'Livrées', count: demandes.filter(d => d.statut === 'livree').length },
  ];

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3">

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <span>Espace personnel</span><span className="mx-1">›</span>
            <span className="text-gray-600 font-medium">Mes demandes</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Mes demandes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos demandes d'articles</p>
        </div>
        <button
          onClick={() => { setEditingDemande(null); setFormData({ article_id: '', quantite_demandee: '', motif: '' }); setShowModal(true); }}
          className="cursor-pointer flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex-shrink-0"
        >
          <Plus size={16} /> Nouvelle demande
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-5 bg-white border border-gray-200 rounded-xl p-1 w-fit shadow-sm">
        <button
          onClick={() => { setActiveTab('active'); fetchDemandes(); }}
          className={`cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'active' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Demandes actives <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{demandes.length}</span>
        </button>
        <button
          onClick={() => { setActiveTab('archives'); fetchArchives(); }}
          className={` cursor-pointer px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'archives' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Archives <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'archives' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{archives.length}</span>
        </button>
      </div>

      {activeTab === 'active' ? (
        <>
          {/* Filtres + recherche */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="flex gap-1 flex-wrap">
              {filterButtons.map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  className={`cursor-pointer px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${filter === btn.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  {btn.label}
                  {btn.count > 0 && <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${filter === btn.key ? 'bg-blue-500' : 'bg-gray-100 text-gray-500'}`}>{btn.count}</span>}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" placeholder="Rechercher un article..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-white w-52 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tableau */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Article', 'Demandée', 'Reçue', 'Retournée', 'Net', 'Date', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDemandes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-14 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <Package size={22} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Aucune demande trouvée</p>
                      </td>
                    </tr>
                  ) : filteredDemandes.map(demande => {
                    const quantiteRecue = demande.quantite_accorde || demande.quantite_demandee;
                    const quantiteRetournee = demande.quantite_retournee || 0;
                    const quantiteNet = quantiteRecue - quantiteRetournee;
                    const peutRetourner = demande.statut === 'livree' && quantiteNet > 0;
                    const unite = demande.article?.unite_mesure || 'pcs';

                    return (
                      <tr key={demande.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-gray-800">{demande.article?.designation || '-'}</p>
                          {demande.motif && <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[160px]">{demande.motif}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{demande.quantite_demandee} {unite}</td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-blue-600 whitespace-nowrap">{quantiteRecue} {unite}</td>
                        <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                          {quantiteRetournee > 0
                            ? <span className="font-semibold text-amber-600">{quantiteRetournee} {unite}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold whitespace-nowrap">
                          <span className={quantiteNet > 0 ? 'text-green-600' : 'text-gray-400'}>{quantiteNet} {unite}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge statut={demande.statut} /></td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            {demande.statut === 'en_attente' && (
                              <>
                                <button onClick={() => { setEditingDemande(demande); setFormData({ article_id: demande.article_id, quantite_demandee: demande.quantite_demandee, motif: demande.motif || '' }); setShowModal(true); }} className=" cursor-pointer p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Modifier"><Edit size={13} /></button>
                               <button 
                                    onClick={() => openConfirmModal(
                                        'danger',
                                        'Annuler la demande',
                                        'Êtes-vous sûr de vouloir annuler cette demande ? Cette action est irréversible.',
                                        'Suppremer',
                                        () => handleDelete(demande.id)
                                    )} 
                                    className=" cursor-pointer p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition" 
                                    title="Suppremer"
                                    >
                                    <Trash2 size={13} />
                                    </button>
                              </>
                            )}
                            <button onClick={() => handleExportPDF(demande.id)} className="cursor-pointer p-1.5 text-violet-500 hover:bg-violet-50 rounded-lg transition" title="PDF"><FileText size={13} /></button>
                            <button onClick={() => { setSelectedDemande(demande); setMessageModalOpen(true); }} className="cursor-pointer p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="Message"><MessageCircle size={13} /></button>
                            {['approuvee', 'refusee', 'livree'].includes(demande.statut) && (
                              <button 
                                onClick={() => openConfirmModal(
                                    'info',
                                    'Archiver la demande',
                                    'Cette demande sera déplacée dans vos archives. Vous pourrez toujours la consulter.',
                                    'Archiver',
                                    () => handleArchive(demande.id)
                                )} 
                                className="cursor-pointer p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition" 
                                title="Archiver"
                                >
                                <Archive size={13} />
                                </button>
                            )}
                            {demande.statut === 'livree' && (
                              <>
                                <button onClick={() => handleBonLivraison(demande.id)} className="cursor-pointer px-2 py-1 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition border border-green-200">BL</button>
                                {peutRetourner && (
                                  <button onClick={() => openRetourModal(demande)} className="cursor-pointer p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition" title="Retourner"><Undo2 size={13} /></button>
                                )}
                                {quantiteRetournee > 0 && <CheckCircle size={13} className="text-orange-500" />}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Archives */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Article', 'Demandée', 'Reçue', 'Retournée', 'Net', 'Date', 'Statut', 'Archivée le'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {archives.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-14 text-center text-sm text-gray-500">Aucune archive</td></tr>
                ) : archives.map(demande => {
                  const quantiteRecue = demande.quantite_accorde || demande.quantite_demandee;
                  const quantiteRetournee = demande.quantite_retournee || 0;
                  const quantiteNet = quantiteRecue - quantiteRetournee;
                  const unite = demande.article?.unite_mesure || 'pcs';
                  return (
                    <tr key={demande.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-semibold text-gray-700">{demande.article?.designation || '-'}</p>
                        {demande.motif && <p className="text-[11px] text-gray-400 mt-0.5">{demande.motif}</p>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{demande.quantite_demandee} {unite}</td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-blue-600">{quantiteRecue} {unite}</td>
                      <td className="px-4 py-3.5 text-sm text-amber-600">{quantiteRetournee > 0 ? `${quantiteRetournee} ${unite}` : <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-green-600">{quantiteNet} {unite}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">{new Date(demande.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3.5"><StatusBadge statut={demande.statut} /></td>
                      <td className="px-4 py-3.5 text-xs text-gray-500">{demande.archived_at ? new Date(demande.archived_at).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nouvelle/Modifier demande */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">{editingDemande ? 'Modifier la demande' : 'Nouvelle demande'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Article <span className="text-red-500">*</span></label>
                <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.article_id} onChange={e => setFormData({ ...formData, article_id: e.target.value })} required>
                  <option value="">Sélectionner un article</option>
                  {articles.map(a => <option key={a.id} value={a.id}>{a.designation} — Stock: {a.quantite_stock}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Quantité <span className="text-red-500">*</span></label>
                <input type="number" min="1" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={formData.quantite_demandee} onChange={e => setFormData({ ...formData, quantite_demandee: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Motif <span className="text-gray-400 font-normal normal-case">(optionnel)</span></label>
                <textarea className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" rows="3" value={formData.motif} onChange={e => setFormData({ ...formData, motif: e.target.value })} placeholder="Raison de votre demande..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm">Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Retour */}
      {showRetourModal && selectedDemandeForRetour && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Undo2 size={18} className="text-orange-500" /> Retourner au magasin
              </h2>
              <button onClick={() => setShowRetourModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-1.5 text-sm">
                <p><span className="font-semibold text-gray-700">Article:</span> <span className="text-gray-600">{selectedDemandeForRetour.article?.designation}</span></p>
                <p><span className="font-semibold text-gray-700">Quantité reçue:</span> <span className="text-blue-600 font-semibold">{selectedDemandeForRetour.quantite_accorde || selectedDemandeForRetour.quantite_demandee} {selectedDemandeForRetour.article?.unite_mesure || 'pcs'}</span></p>
                <p><span className="font-semibold text-gray-700">Déjà retourné:</span> <span className="text-amber-600 font-semibold">{selectedDemandeForRetour.quantite_retournee || 0} {selectedDemandeForRetour.article?.unite_mesure || 'pcs'}</span></p>
                <p><span className="font-semibold text-gray-700">Net chez vous:</span> <span className="text-green-600 font-semibold">{(selectedDemandeForRetour.quantite_accorde || selectedDemandeForRetour.quantite_demandee) - (selectedDemandeForRetour.quantite_retournee || 0)} {selectedDemandeForRetour.article?.unite_mesure || 'pcs'}</span></p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Quantité à retourner <span className="text-red-500">*</span></label>
                <input type="number" min="1" max={retourData.maxRetour} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" value={retourData.quantite} onChange={e => setRetourData({ ...retourData, quantite: parseInt(e.target.value) || 1 })} />
                <p className="text-[11px] text-gray-400 mt-1">Maximum: {retourData.maxRetour} unités</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Motif du retour <span className="text-red-500">*</span></label>
                <textarea className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent" rows="3" placeholder="Ex: Produit défectueux, Erreur de commande..." value={retourData.motif} onChange={e => setRetourData({ ...retourData, motif: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowRetourModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                <button onClick={handleRetour} disabled={retourLoading} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {retourLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Undo2 size={14} /> Envoyer</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MessageModal isOpen={messageModalOpen} onClose={() => setMessageModalOpen(false)} demandeId={selectedDemande?.id} demandeTitle={selectedDemande?.article?.designation} />
        <ActionConfirmModal
            isOpen={actionModal.isOpen}
            onClose={() => setActionModal(prev => ({ ...prev, isOpen: false }))}
            onConfirm={actionModal.onConfirm}
            title={actionModal.title}
            message={actionModal.message}
            type={actionModal.type}
            confirmText={actionModal.confirmText}
            />
    </div>
  );
}