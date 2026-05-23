import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Générateur de PDF partagé pour les Bons de Commande (BC) et Bons de Réception (BR)
 * Avec intégration dynamique du Header et Footer officiels (Ministère)
 */
export const genererPDF = (titre_document, numero, date_doc, lignes, type = 'BC') => {
  // 1. Préparer les images d'abord pour éviter les problèmes d'asynchronisme
  const imgHeader = new Image();
  imgHeader.src = '/image/header_ministere.png'; // Match s-smit dyal l-fichier f public/image

  const imgFooter = new Image();
  imgFooter.src = '/image/footer_ministere.png'; // Match s-smit dyal l-fichier f public/image

  // Compteur pour s'assurer que les deux images sont chargées avant de générer
  let imagesChargees = 0;
  const verifierEtGenerer = () => {
    imagesChargees++;
    if (imagesChargees === 2) {
      executerGenerationPDF(titre_document, numero, date_doc, lignes, type, imgHeader, imgFooter);
    }
  };

  imgHeader.onload = verifierEtGenerer;
  imgFooter.onload = verifierEtGenerer;

  // Fallback au cas où une image ne se charge pas (bloquée ou introuvable)
  imgHeader.onerror = () => { console.warn("Header image introuvable"); verifierEtGenerer(); };
  imgFooter.onerror = () => { console.warn("Footer image introuvable"); verifierEtGenerer(); };
};

/**
 * Fonction interne qui exécute le rendu jsPDF une fois les assets prêts
 */
const executerGenerationPDF = (titre_document, numero, date_doc, lignes, type, imgHeader, imgFooter) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;   // Standard ~210mm
    const pageHeight = doc.internal.pageSize.height; // Standard ~297mm
    
    // --- 1. HEADER IMAGE ---
    // Largeur totale de la page (de 10 à pageWidth - 10) -> ~190mm de large
    // On garde un ratio propre (hauteur autour de 30mm max pour ne pas étouffer le document)
    if (imgHeader.complete && imgHeader.naturalWidth > 0) {
      doc.addImage(imgHeader, 'JPEG', 10, 10, pageWidth - 20, 28);
    }

    // --- 2. DONNÉES DE LA COMMANDE (INFOS DROITE / GAUCHE) ---
    // On descend à Y = 46 pour ne pas chevaucher l'image du ministère
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(`DATE : ${new Date(date_doc).toLocaleDateString('fr-FR')}`, 150, 46);
    doc.text(`N° DOC : ${numero}`, 150, 52);
    doc.text(`TYPE : ${type === 'BC' ? 'Commande' : 'Réception'}`, 150, 58);

    // Ligne verte de séparation sous les métadonnées
    doc.setDrawColor(0, 98, 51);
    doc.setLineWidth(0.8);
    doc.line(14, 63, pageWidth - 14, 63);

    // --- 3. TITRE DU DOCUMENT ---
    doc.setFontSize(16);
    doc.setTextColor(0, 98, 51); 
    doc.setFont("helvetica", "bold");
    doc.text(titre_document, pageWidth / 2, 73, { align: 'center' });
    
    // --- 4. DETAILS DESTINATAIRE / PROVENANCE ---
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Provenance / Fournisseur : ", 14, 85);
    doc.setFont("helvetica", "normal");
    doc.text("Ministère du Tourisme", 62, 85);

    doc.setFont("helvetica", "bold");
    doc.text("Établissement Destinataire : ", 14, 91);
    doc.setFont("helvetica", "normal");
    doc.text("ISTAHT Tanger", 64, 91);

    // --- 5. TABLEAU DES ARTICLES ---
    const qtyColumnName = type === 'BC' ? "Qté Commandée" : "Qté Reçue";
    const tableColumn = ["Code Barre", "Désignation", "Unité", qtyColumnName];
    
    const tableRows = lignes.map(l => {
      const codeBarre = l.code_barre || l.article?.code_barre || 'N/A';
      const designation = l.designation || l.article?.designation || 'Inconnu';
      const unite = l.unite || l.article?.unite_mesure || l.article?.unite || 'Pièce';
      
      let qte = 0;
      if (type === 'BC') {
        qte = l.quantite_commandee ?? l.quantite ?? l.quantite_demandee ?? 0;
      } else {
        qte = l.quantite_recue ?? l.nouvelle_quantite ?? l.quantite ?? 0;
      }

      return [codeBarre, designation, unite, qte];
    });

    autoTable(doc, {
      startY: 100, // On commence à 100 pour laisser respirer l'entête
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 98, 51], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 4 },
      margin: { bottom: 35 }, // Marge en bas pour ne pas écrire sur le footer image
      didDrawPage: (data) => {
        // --- 6. FOOTER IMAGE (S'affiche sur chaque page automatiquement) ---
        if (imgFooter.complete && imgFooter.naturalWidth > 0) {
          // On place le footer à 25mm du bas de la page
          doc.addImage(imgFooter, 'PNG', 10, pageHeight - 26, pageWidth - 20, 18);
        }
      }
    });

    // Sauvegarde du document
    doc.save(`${type}_${numero}.pdf`);
  } catch (err) {
    console.error("Fatal PDF Generation Error: ", err);
    alert("❌ Une erreur est survenue lors de la génération du PDF.");
  }
};