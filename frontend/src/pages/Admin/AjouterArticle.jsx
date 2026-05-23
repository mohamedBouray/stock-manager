import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axios';

export default function AjouterArticle() {
  const [catalogue, setCatalogue] = useState([]);
  const [magasins, setMagasins] = useState([]); // لتهيئة قائمة المخازن من الباكند
  const [isLoading, setIsLoading] = useState(true);

  const [familleSelectionnee, setFamilleSelectionnee] = useState('');
  const [categorieSelectionnee, setCategorieSelectionnee] = useState('');
  const [magasinsSelectionnes, setMagasinsSelectionnes] = useState([]); // Array ديال الـ IDs دالمخازن لي تختارو

  const [showMiniFamille, setShowMiniFamille] = useState(false);
  const [showMiniCategorie, setShowMiniCategorie] = useState(false);
  const [showMiniMagasin, setShowMiniMagasin] = useState(false); // إظهار/إخفاء فورم المخزن الجديد

  const [nouvelleFamille, setNouvelleFamille] = useState('');
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [nouveauMagasin, setNouveauMagasin] = useState({ nom: '', localisation: '' }); // بيانات المخزن الجديد
  
  const [isMiniSubmitting, setIsMiniSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // الاستفادة من التعديل الجديد فـ الباكند
      setCatalogue(response.data.catalogue || []);
      setMagasins(response.data.magasins || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
      alert("❌ خطأ في جلب البيانات من السيرفر.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFamille = async (e) => {
    e.preventDefault();
    if (!nouvelleFamille.trim()) return;
    setIsMiniSubmitting(true);
    try {
      await api.post('/api/admin/familles', { nom_famille: nouvelleFamille });
      alert("🎉 تم إضافة العائلة بنجاح !");
      setNouvelleFamille('');
      setShowMiniFamille(false);
      await chargerDonnees();
    } catch (error) {
      alert(error.response?.data?.message || "❌ فشل إضافة العائلة.");
    } finally {
      setIsMiniSubmitting(false);
    }
  };

  const handleAddCategorie = async (e) => {
    e.preventDefault();
    if (!nouvelleCategorie.trim() || !familleSelectionnee) {
      alert("المرجو اختيار العائلة أولاً !");
      return;
    }
    setIsMiniSubmitting(true);
    try {
      await api.post('/api/admin/categories', {
        nom_categorie: nouvelleCategorie,
        famille_id: familleSelectionnee
      });
      alert("🎉 تم إضافة الصنف بنجاح !");
      setNouvelleCategorie('');
      setShowMiniCategorie(false);
      await chargerDonnees();
    } catch (error) {
      alert(error.response?.data?.message || "❌ فشل إضافة الصنف.");
    } finally {
      setIsMiniSubmitting(false);
    }
  };

  // 🛠️ 3. إضافة مخزن جديد
  const handleAddMagasin = async (e) => {
    e.preventDefault();
    if (!nouveauMagasin.nom.trim()) {
      alert("المرجو إدخال اسم المخزن !");
      return;
    }
    setIsMiniSubmitting(true);
    try {
      await api.post('/api/admin/magasins', {
        nom_magasin: nouveauMagasin.nom,
        localisation: nouveauMagasin.localisation
      });
      alert("🎉 تم إضافة المخزن بنجاح !");
      setNouveauMagasin({ nom: '', localisation: '' });
      setShowMiniMagasin(false);
      await chargerDonnees(); // تحديث اللائحة تلقائياً
    } catch (error) {
      alert(error.response?.data?.message || "❌ فشل إضافة المخزن.");
    } finally {
      setIsMiniSubmitting(false);
    }
  };

  // إدارة اختيار المخازن (Checkboxes)
  const handleMagasinCheckboxChange = (magasinId) => {
    if (magasinsSelectionnes.includes(magasinId)) {
      setMagasinsSelectionnes(magasinsSelectionnes.filter(id => id !== magasinId));
    } else {
      setMagasinsSelectionnes([...magasinsSelectionnes, magasinId]);
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
      alert("المرجو اختيار الصنف أولاً !");
      return;
    }
    if (magasinsSelectionnes.length === 0) {
      alert("المرجو اختيار مخزن واحد على الأقل لهذا المنتج !");
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
      
      // صيفط مصفوفة الـ IDs ديال المخازن على شكل Stringified JSON حيت هذا FormData
      formData.append('magasins_ids', JSON.stringify(magasinsSelectionnes));
      
      if (articleData.image_file) {
        formData.append('image', articleData.image_file);
      }

      await api.post('/api/admin/articles', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Accept': 'application/json' }
      });

      alert("🎉 تم تسجيل المادة الجديدة وتحديد مخازنها بنجاح !");
      
      setArticleData({
        code_barre: '', designation: '', description: '',
        unite_mesure: 'Pièce', seuil_alerte: 5, statut: 'actif', image_file: null
      });
      setMagasinsSelectionnes([]);
      if (document.getElementById('image_input')) document.getElementById('image_input').value = "";

    } catch (error) {
      console.error(error);
      if (error.response?.data?.errors) {
        const errs = Object.values(error.response.data.errors).flat().join('\n');
        alert(`❌ خطأ في البيانات:\n${errs}`);
      } else {
        alert("❌ فشل التسجيل، تأكد من البيانات المدخلة.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const familleActuelle = catalogue.find(f => f.id === parseInt(familleSelectionnee));
  const categoriesDisponibles = familleActuelle ? familleActuelle.categories : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex justify-center items-center font-sans">
      <div className="w-full max-w-2xl bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="bg-emerald-950 p-4 text-white">
          <h2 className="text-sm font-bold uppercase tracking-wider">⚙️ Paramétrage du Stock Pro</h2>
          <p className="text-[11px] text-emerald-300">Gérer l'arborescence, les magasins et ajouter un nouvel article</p>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-bold">
            ⏳ جاري تحميل البيانات من السيرفر...
          </div>
        ) : (
          <div className="p-6 space-y-4 text-xs">
            
            {/* SECTION 1: CLASSIFICATION */}
            <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
              <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">1. Classification & Emplacement</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Selector Famille */}
                <div>
                  <label className="flex justify-between items-center text-slate-600 font-semibold mb-1">
                    <span>Famille <span className="text-red-500">*</span></span>
                    <button 
                      type="button" 
                      onClick={() => setShowMiniFamille(!showMiniFamille)}
                      className="text-[10px] bg-emerald-800 text-white px-1.5 py-0.5 rounded hover:bg-emerald-700 transition"
                    >
                      {showMiniFamille ? 'Annuler' : '+ Nouvelle'}
                    </button>
                  </label>
                  
                  {showMiniFamille && (
                    <div className="flex gap-1 mb-2 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                      <input 
                        type="text" value={nouvelleFamille} onChange={(e) => setNouvelleFamille(e.target.value)}
                        placeholder="Nom famille..." className="w-full border p-1 rounded outline-none"
                      />
                      <button 
                        type="button" onClick={handleAddFamille} disabled={isMiniSubmitting}
                        className="bg-emerald-950 text-white px-2 rounded font-bold"
                      >
                        {isMiniSubmitting ? '...' : 'OK'}
                      </button>
                    </div>
                  )}

                  <select 
                    value={familleSelectionnee} 
                    onChange={(e) => { setFamilleSelectionnee(e.target.value); setCategorieSelectionnee(''); }}
                    className="w-full bg-white border border-slate-300 rounded p-2 focus:border-emerald-800 outline-none"
                    required
                  >
                    <option value="">-- Choisir une famille --</option>
                    {catalogue.map(f => <option key={f.id} value={f.id}>{f.nom_famille}</option>)}
                  </select>
                </div>

                {/* Selector Catégorie */}
                <div>
                  <label className="flex justify-between items-center text-slate-600 font-semibold mb-1">
                    <span>Catégorie <span className="text-red-500">*</span></span>
                    <button 
                      type="button" 
                      disabled={!familleSelectionnee}
                      onClick={() => setShowMiniCategorie(!showMiniCategorie)}
                      className="text-[10px] bg-emerald-800 text-white px-1.5 py-0.5 rounded hover:bg-emerald-700 transition disabled:opacity-40"
                    >
                      {showMiniCategorie ? 'Annuler' : '+ Nouvelle'}
                    </button>
                  </label>

                  {showMiniCategorie && familleSelectionnee && (
                    <div className="flex gap-1 mb-2 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                      <input 
                        type="text" value={nouvelleCategorie} onChange={(e) => setNouvelleCategorie(e.target.value)}
                        placeholder="Nom catégorie..." className="w-full border p-1 rounded outline-none"
                      />
                      <button 
                        type="button" onClick={handleAddCategorie} disabled={isMiniSubmitting}
                        className="bg-emerald-950 text-white px-2 rounded font-bold"
                      >
                        {isMiniSubmitting ? '...' : 'OK'}
                      </button>
                    </div>
                  )}

                  <select 
                    value={categorieSelectionnee} 
                    onChange={(e) => setCategorieSelectionnee(e.target.value)}
                    disabled={!familleSelectionnee}
                    className="w-full bg-white border border-slate-300 rounded p-2 focus:border-emerald-800 outline-none disabled:opacity-50"
                    required
                  >
                    <option value="">-- Choisir une catégorie --</option>
                    {categoriesDisponibles.map(c => (
                      <option key={c.id} value={c.id}>{c.nom_categorie}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 1 BIS: MANAGSINS (المخازن) */}
            <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3">
              <div className="flex justify-between items-center border-b pb-1">
                <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">2. Affectation Aux Magasins</h3>
                <button 
                  type="button" 
                  onClick={() => setShowMiniMagasin(!showMiniMagasin)}
                  className="text-[10px] bg-emerald-800 text-white px-2 py-0.5 rounded hover:bg-emerald-700 transition"
                >
                  {showMiniMagasin ? 'Annuler' : '+ Nouveau Magasin'}
                </button>
              </div>

              {/* Mini Form Magasin Inline */}
              {showMiniMagasin && (
                <div className="bg-emerald-50 p-3 rounded border border-emerald-200 space-y-2 mb-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={nouveauMagasin.nom} 
                      onChange={(e) => setNouveauMagasin({...nouveauMagasin, nom: e.target.value})}
                      placeholder="Nom du magasin (e.g., Dépôt Principal)..." 
                      className="border p-2 rounded bg-white outline-none"
                    />
                    <input 
                      type="text" 
                      value={nouveauMagasin.localisation} 
                      onChange={(e) => setNouveauMagasin({...nouveauMagasin, localisation: e.target.value})}
                      placeholder="Localisation (Optionnel)..." 
                      className="border p-2 rounded bg-white outline-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="button" onClick={handleAddMagasin} disabled={isMiniSubmitting}
                      className="bg-emerald-950 text-white px-4 py-1 rounded font-bold"
                    >
                      {isMiniSubmitting ? 'En cours...' : 'Ajouter Magasin'}
                    </button>
                  </div>
                </div>
              )}

              {/* Checkboxes List للمخازن المتوفرة */}
              {magasins.length === 0 ? (
                <p className="text-slate-400 italic">⚠️ لا توجد مخازن مسجلة حالياً، قم بإضافة مخزن أولاً.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {magasins.map(m => (
                    <label key={m.id} className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded cursor-pointer select-none hover:bg-slate-100 transition">
                      <input 
                        type="checkbox"
                        checked={magasinsSelectionnes.includes(m.id)}
                        onChange={() => handleMagasinCheckboxChange(m.id)}
                        className="w-3.5 h-3.5 accent-emerald-800"
                      />
                      <span className="text-slate-700 font-medium truncate">
                        {m.nom_magasin} {m.localisation ? `(${m.localisation})` : ''}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* FORMULAIRE PRINCIPAL DE L'ARTICLE */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider border-b pb-1">3. Informations de l'article</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Désignation (Nom) <span className="text-red-500">*</span></label>
                    <input 
                      type="text" name="designation" value={articleData.designation} onChange={handleChange}
                      placeholder="e.g., Beurre de table 5kg" required
                      className="w-full border border-slate-300 rounded p-2 focus:border-emerald-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Code Barre <span className="text-red-500">*</span></label>
                    <div className="flex gap-1">
                      <input 
                        type="text" name="code_barre" value={articleData.code_barre} onChange={handleChange}
                        placeholder="Scannez ou entrez le code" required
                        className="w-full border border-slate-300 rounded p-2 font-mono font-bold focus:border-emerald-800 outline-none"
                      />
                      <button 
                        type="button" onClick={genererCodeBarre}
                        className="bg-slate-200 hover:bg-slate-300 font-bold px-2.5 rounded text-slate-700 shadow-sm"
                      >
                        Générer ⚙️
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Unité de mesure</label>
                    <select 
                      name="unite_mesure" value={articleData.unite_mesure} onChange={handleChange}
                      className="w-full bg-white border border-slate-300 rounded p-2"
                    >
                      <option value="Pièce">Pièce</option>
                      <option value="Kg">Kg</option>
                      <option value="Litre">Litre</option>
                      <option value="Boite">Boite</option>
                      <option value="Paquet">Paquet</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Seuil d'alerte (Min)</label>
                    <input 
                      type="number" name="seuil_alerte" value={articleData.seuil_alerte} onChange={handleChange} min="0"
                      className="w-full border border-slate-300 rounded p-2 text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Statut Initial</label>
                    <select 
                      name="statut" value={articleData.statut} onChange={handleChange}
                      className="w-full bg-white border border-slate-300 rounded p-2"
                    >
                      <option value="actif">🟢 Actif (Disponible)</option>
                      <option value="inactif">🔴 Inactif</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Description / Spécifications</label>
                  <textarea 
                    name="description" value={articleData.description} onChange={handleChange} rows="2"
                    placeholder="Caractéristiques techniques, marque, etc. (Optionnel)"
                    className="w-full border border-slate-300 rounded p-2 focus:border-emerald-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Image de l'article</label>
                  <input 
                    type="file" id="image_input" accept="image/*" onChange={handleImageChange}
                    className="w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-950 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full md:w-auto bg-emerald-950 hover:bg-emerald-900 text-white font-bold px-6 py-2.5 rounded shadow disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Enregistrement en cours... ⏳" : "💾 Enregistrer l'article complet"}
                </button>
              </div>
            </form>

          </div>
        )}
      </div>
    </div>
  );
}