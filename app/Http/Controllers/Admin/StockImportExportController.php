<?php
// app/Http/Controllers/Admin/StockImportExportController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Article;
use App\Models\Admin\Categories;
use App\Models\Admin\Famille;
use App\Models\Admin\Magasins;
use App\Models\Admin\Fournisseur;
use App\Models\Admin\Mouvement;
use App\Models\Admin\Demande;
use App\Models\Admin\CommandeFournisseur;
use App\Models\Admin\LigneCommande;
use App\Models\Admin\Inventaire;
use App\Models\Admin\InventaireLigne;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class StockImportExportController extends Controller
{
    /**
     * ===========================================================
     * 📥 IMPORTS
     * ===========================================================
     */

    /**
     * 📥 IMPORT DES ARTICLES (avec catégorie par nom ou ID)
     */
    public function importArticles(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:xlsx,csv,txt|max:10240'
            ]);

            $file = $request->file('file');
            $importes = 0;
            $erreurs = [];
            $avertissements = [];

            // Récupérer toutes les catégories pour mapping
            $categories = Categories::with('famille')->get();
            $categoriesMap = [];
            foreach ($categories as $cat) {
                $categoriesMap[strtolower(trim($cat->nom_categorie))] = $cat;
                $categoriesMap[(string)$cat->id] = $cat;
            }

            // Récupérer les magasins
            $magasins = Magasins::all();
            $magasinsMap = [];
            foreach ($magasins as $mag) {
                $magasinsMap[strtolower(trim($mag->nom_magasin))] = $mag;
                $magasinsMap[(string)$mag->id] = $mag;
            }

            $rows = $this->readFileContent($file);
            if (empty($rows)) {
                throw new \Exception('Le fichier est vide');
            }

            // Détection de l'en-tête
            $headerRowIndex = $this->detectHeaderRow($rows);
            $headers = array_map('trim', $rows[$headerRowIndex]);
            $mapping = $this->mapColumns($headers);

            // Vérifier les colonnes obligatoires
            $required = ['code_barre', 'designation'];
            foreach ($required as $col) {
                if (!isset($mapping[$col])) {
                    throw new \Exception("Colonne '$col' non trouvée. Colonnes disponibles: " . implode(', ', $headers));
                }
            }

            for ($i = $headerRowIndex + 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                $ligneNum = $i + 1;

                $code_barre = trim($this->getValue($row, $mapping, 'code_barre'));
                $designation = trim($this->getValue($row, $mapping, 'designation'));
                $categorie_nom = trim($this->getValue($row, $mapping, 'categorie'));
                $description = trim($this->getValue($row, $mapping, 'description'));
                $unite_mesure = trim($this->getValue($row, $mapping, 'unite'));
                $seuil_alerte = trim($this->getValue($row, $mapping, 'seuil_alerte'));
                $stock_initial = trim($this->getValue($row, $mapping, 'stock'));
                $magasin_nom = trim($this->getValue($row, $mapping, 'magasin'));
                $prix_unitaire = trim($this->getValue($row, $mapping, 'prix'));
                $emplacement = trim($this->getValue($row, $mapping, 'emplacement'));

                if (empty($code_barre) && empty($designation)) continue;
                if (empty($code_barre)) { $erreurs[] = "Ligne $ligneNum: Code barre requis"; continue; }
                if (empty($designation)) { $erreurs[] = "Ligne $ligneNum: Désignation requise"; continue; }

                if (Article::where('code_barre', $code_barre)->exists()) {
                    $erreurs[] = "Ligne $ligneNum: Code barre '$code_barre' existe déjà";
                    continue;
                }

                // Trouver la catégorie
                $categorie = null;
                if (!empty($categorie_nom)) {
                    $key = strtolower($categorie_nom);
                    if (isset($categoriesMap[$key])) {
                        $categorie = $categoriesMap[$key];
                    } else {
                        foreach ($categoriesMap as $nom => $cat) {
                            if (strpos($key, strtolower($nom)) !== false || strpos(strtolower($nom), $key) !== false) {
                                $categorie = $cat;
                                $avertissements[] = "Ligne $ligneNum: Catégorie approximée: '$categorie_nom' → '{$cat->nom_categorie}'";
                                break;
                            }
                        }
                    }
                }

                if (!$categorie) {
                    $erreurs[] = "Ligne $ligneNum: Catégorie '$categorie_nom' non trouvée";
                    continue;
                }

                // Créer l'article
                $article = Article::create([
                    'code_barre' => $code_barre,
                    'designation' => $designation,
                    'description' => $description,
                    'categorie_id' => $categorie->id,
                    'unite_mesure' => !empty($unite_mesure) ? $unite_mesure : 'Pièce',
                    'seuil_alerte' => !empty($seuil_alerte) && is_numeric($seuil_alerte) ? (int)$seuil_alerte : 5,
                    'quantite_stock' => !empty($stock_initial) && is_numeric($stock_initial) ? (int)$stock_initial : 0,
                    'prix_unitaire' => !empty($prix_unitaire) && is_numeric($prix_unitaire) ? (float)$prix_unitaire : null,
                    'emplacement' => $emplacement,
                    'statut' => 'actif'
                ]);

                // Associer au magasin si spécifié
                if (!empty($magasin_nom) && isset($magasinsMap[strtolower($magasin_nom)])) {
                    $magasin = $magasinsMap[strtolower($magasin_nom)];
                    $article->magasins()->attach($magasin->id);
                }

                $importes++;
            }

            return response()->json([
                'success' => true,
                'message' => "$importes article(s) importé(s)",
                'importes' => $importes,
                'erreurs' => $erreurs,
                'avertissements' => $avertissements
            ]);

        } catch (\Exception $e) {
            Log::error('Import articles: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📥 IMPORT DES CATÉGORIES
     */
    public function importCategories(Request $request)
    {
        try {
            $request->validate(['file' => 'required|file|mimes:xlsx,csv,txt|max:5120']);
            
            $rows = $this->readFileContent($request->file('file'));
            $headerRowIndex = $this->detectHeaderRow($rows);
            $headers = array_map('trim', $rows[$headerRowIndex]);
            $mapping = $this->mapColumns($headers, 'categories');
            
            $famillesMap = [];
            $familles = Famille::all();
            foreach ($familles as $f) {
                $famillesMap[strtolower(trim($f->nom_famille))] = $f;
                $famillesMap[(string)$f->id] = $f;
            }
            
            $importes = 0;
            $erreurs = [];
            
            for ($i = $headerRowIndex + 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                $ligneNum = $i + 1;
                
                $nom_categorie = trim($this->getValue($row, $mapping, 'nom_categorie'));
                $famille_nom = trim($this->getValue($row, $mapping, 'famille'));
                
                if (empty($nom_categorie)) continue;
                
                if (Categories::where('nom_categorie', $nom_categorie)->exists()) {
                    $erreurs[] = "Ligne $ligneNum: Catégorie '$nom_categorie' existe déjà";
                    continue;
                }
                
                $famille = null;
                if (!empty($famille_nom) && isset($famillesMap[strtolower($famille_nom)])) {
                    $famille = $famillesMap[strtolower($famille_nom)];
                }
                
                if (!$famille) {
                    $famille = Famille::first();
                    if (!$famille) {
                        $famille = Famille::create(['nom_famille' => 'Défaut']);
                    }
                    $erreurs[] = "Ligne $ligneNum: Famille '$famille_nom' non trouvée, utilisation '{$famille->nom_famille}'";
                }
                
                Categories::create([
                    'nom_categorie' => $nom_categorie,
                    'famille_id' => $famille->id
                ]);
                $importes++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "$importes catégorie(s) importée(s)",
                'importes' => $importes,
                'erreurs' => $erreurs
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📥 IMPORT DES FAMILLES
     */
    public function importFamilles(Request $request)
    {
        try {
            $request->validate(['file' => 'required|file|mimes:xlsx,csv,txt|max:5120']);
            
            $rows = $this->readFileContent($request->file('file'));
            $headerRowIndex = $this->detectHeaderRow($rows);
            $headers = array_map('trim', $rows[$headerRowIndex]);
            $mapping = $this->mapColumns($headers, 'familles');
            
            $importes = 0;
            $erreurs = [];
            
            for ($i = $headerRowIndex + 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                $ligneNum = $i + 1;
                
                $nom_famille = trim($this->getValue($row, $mapping, 'nom_famille'));
                
                if (empty($nom_famille)) continue;
                
                if (Famille::where('nom_famille', $nom_famille)->exists()) {
                    $erreurs[] = "Ligne $ligneNum: Famille '$nom_famille' existe déjà";
                    continue;
                }
                
                Famille::create(['nom_famille' => $nom_famille]);
                $importes++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "$importes famille(s) importée(s)",
                'importes' => $importes,
                'erreurs' => $erreurs
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📥 IMPORT DES MAGASINS
     */
    public function importMagasins(Request $request)
    {
        try {
            $request->validate(['file' => 'required|file|mimes:xlsx,csv,txt|max:5120']);
            
            $rows = $this->readFileContent($request->file('file'));
            $headerRowIndex = $this->detectHeaderRow($rows);
            $headers = array_map('trim', $rows[$headerRowIndex]);
            $mapping = $this->mapColumns($headers, 'magasins');
            
            $importes = 0;
            $erreurs = [];
            
            for ($i = $headerRowIndex + 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                $ligneNum = $i + 1;
                
                $nom_magasin = trim($this->getValue($row, $mapping, 'nom_magasin'));
                $localisation = trim($this->getValue($row, $mapping, 'localisation'));
                
                if (empty($nom_magasin)) continue;
                
                if (Magasins::where('nom_magasin', $nom_magasin)->exists()) {
                    $erreurs[] = "Ligne $ligneNum: Magasin '$nom_magasin' existe déjà";
                    continue;
                }
                
                Magasins::create([
                    'nom_magasin' => $nom_magasin,
                    'localisation' => $localisation
                ]);
                $importes++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "$importes magasin(s) importé(s)",
                'importes' => $importes,
                'erreurs' => $erreurs
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📥 IMPORT DES UTILISATEURS
     */
    public function importUtilisateurs(Request $request)
    {
        try {
            $request->validate(['file' => 'required|file|mimes:xlsx,csv,txt|max:5120']);
            
            $rows = $this->readFileContent($request->file('file'));
            $headerRowIndex = $this->detectHeaderRow($rows);
            $headers = array_map('trim', $rows[$headerRowIndex]);
            $mapping = $this->mapColumns($headers, 'utilisateurs');
            
            $magasins = Magasins::all();
            $magasinsMap = [];
            foreach ($magasins as $m) {
                $magasinsMap[strtolower(trim($m->nom_magasin))] = $m->id;
            }
            
            $importes = 0;
            $erreurs = [];
            
            for ($i = $headerRowIndex + 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                $ligneNum = $i + 1;
                
                $name = trim($this->getValue($row, $mapping, 'name'));
                $email = trim($this->getValue($row, $mapping, 'email'));
                $role = trim($this->getValue($row, $mapping, 'role'));
                $magasin_nom = trim($this->getValue($row, $mapping, 'magasin'));
                $phone = trim($this->getValue($row, $mapping, 'phone'));
                $job_title = trim($this->getValue($row, $mapping, 'job_title'));
                
                if (empty($name) && empty($email)) continue;
                if (empty($name)) { $erreurs[] = "Ligne $ligneNum: Nom requis"; continue; }
                if (empty($email)) { $erreurs[] = "Ligne $ligneNum: Email requis"; continue; }
                
                if (User::where('email', $email)->exists()) {
                    $erreurs[] = "Ligne $ligneNum: Email '$email' existe déjà";
                    continue;
                }
                
                $roleValide = in_array($role, ['admin', 'magasinier', 'demandeur', 'user']) ? $role : 'demandeur';
                $magasinId = isset($magasinsMap[strtolower($magasin_nom)]) ? $magasinsMap[strtolower($magasin_nom)] : null;
                
                User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make('password123'),
                    'role' => $roleValide,
                    'phone' => $phone,
                    'job_title' => $job_title,
                    'magasin_id' => $magasinId,
                    'status' => true,
                    'force_password_change' => true
                ]);
                $importes++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "$importes utilisateur(s) importé(s) (Mot de passe par défaut: password123)",
                'importes' => $importes,
                'erreurs' => $erreurs
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📥 IMPORT DES MOUVEMENTS HISTORIQUES
     */
    public function importMouvements(Request $request)
    {
        try {
            $request->validate(['file' => 'required|file|mimes:xlsx,csv,txt|max:10240']);
            
            $rows = $this->readFileContent($request->file('file'));
            $headerRowIndex = $this->detectHeaderRow($rows);
            $headers = array_map('trim', $rows[$headerRowIndex]);
            $mapping = $this->mapColumns($headers, 'mouvements');
            
            $importes = 0;
            $erreurs = [];
            
            for ($i = $headerRowIndex + 1; $i < count($rows); $i++) {
                $row = $rows[$i];
                $ligneNum = $i + 1;
                
                $code_barre = trim($this->getValue($row, $mapping, 'code_barre'));
                $type = trim($this->getValue($row, $mapping, 'type'));
                $quantite = trim($this->getValue($row, $mapping, 'quantite'));
                $motif = trim($this->getValue($row, $mapping, 'motif'));
                $date_mouvement = trim($this->getValue($row, $mapping, 'date'));
                
                if (empty($code_barre)) continue;
                
                $article = Article::where('code_barre', $code_barre)->first();
                if (!$article) {
                    $erreurs[] = "Ligne $ligneNum: Article avec code '$code_barre' non trouvé";
                    continue;
                }
                
                $typeValide = in_array($type, ['entree', 'sortie', 'ajustement']) ? $type : 'entree';
                $quantiteValide = is_numeric($quantite) ? (int)$quantite : 0;
                if ($quantiteValide <= 0) continue;
                
                $quantite_avant = $article->quantite_stock;
                $quantite_apres = $typeValide == 'entree' ? $quantite_avant + $quantiteValide : $quantite_avant - $quantiteValide;
                
                Mouvement::create([
                    'article_id' => $article->id,
                    'type' => $typeValide,
                    'quantite' => $quantiteValide,
                    'quantite_avant' => $quantite_avant,
                    'quantite_apres' => $quantite_apres,
                    'motif' => $motif ?: 'Import historique',
                    'user_id' => auth()->id(),
                    'created_at' => !empty($date_mouvement) ? date('Y-m-d H:i:s', strtotime($date_mouvement)) : now()
                ]);
                
                $article->update(['quantite_stock' => $quantite_apres]);
                $importes++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "$importes mouvement(s) importé(s)",
                'importes' => $importes,
                'erreurs' => $erreurs
            ]);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * ===========================================================
     * 📤 EXPORTS
     * ===========================================================
     */

    /**
     * 📤 EXPORT DES ARTICLES
     */
    public function exportArticles()
    {
        try {
            $articles = Article::with(['categorie.famille', 'magasins'])->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Articles');
            
            // En-têtes complets
            $headers = [
                'ID', 'Code Barre', 'Désignation', 'Description', 'Catégorie', 'Famille', 
                'Unité', 'Stock', 'Seuil Alerte', 'Seuil Critique', 'Statut', 'Prix Unitaire',
                'Emplacement', 'Magasins', 'Marque', 'Modèle', 'Prix Achat', 'Fournisseur Principal',
                'Date Création'
            ];
            
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
                $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
                $col++;
            }
            
            $row = 2;
            foreach ($articles as $article) {
                $magasinsListe = $article->magasins->pluck('nom_magasin')->implode(', ');
                
                $sheet->setCellValue('A' . $row, $article->id);
                $sheet->setCellValue('B' . $row, $article->code_barre);
                $sheet->setCellValue('C' . $row, $article->designation);
                $sheet->setCellValue('D' . $row, $article->description ?? '');
                $sheet->setCellValue('E' . $row, $article->categorie->nom_categorie ?? '');
                $sheet->setCellValue('F' . $row, $article->categorie->famille->nom_famille ?? '');
                $sheet->setCellValue('G' . $row, $article->unite_mesure);
                $sheet->setCellValue('H' . $row, $article->quantite_stock);
                $sheet->setCellValue('I' . $row, $article->seuil_alerte);
                $sheet->setCellValue('J' . $row, $article->seuil_critique ?? 2);
                $sheet->setCellValue('K' . $row, $article->statut);
                $sheet->setCellValue('L' . $row, $article->prix_unitaire);
                $sheet->setCellValue('M' . $row, $article->emplacement ?? '');
                $sheet->setCellValue('N' . $row, $magasinsListe);
                $sheet->setCellValue('O' . $row, $article->marque ?? '');
                $sheet->setCellValue('P' . $row, $article->modele ?? '');
                $sheet->setCellValue('Q' . $row, $article->prix_achat ?? '');
                $sheet->setCellValue('R' . $row, $article->fournisseur_principal ?? '');
                $sheet->setCellValue('S' . $row, $article->created_at->format('d/m/Y'));
                $row++;
            }
            
            foreach (range('A', 'S') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            return $this->downloadExcel($spreadsheet, 'articles_' . date('Y-m-d_H-i-s') . '.xlsx');
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📤 EXPORT DES ARTICLES EN ALERTE (stock < seuil)
     */
    public function exportArticlesAlerte()
    {
        try {
            $articles = Article::whereRaw('quantite_stock <= seuil_alerte')
                ->with(['categorie.famille'])
                ->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Alertes Stock');
            
            $headers = ['Code Barre', 'Désignation', 'Catégorie', 'Stock Actuel', 'Seuil Alerte', 'Unité', 'Statut'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFFF0000');
                $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
                $col++;
            }
            
            $row = 2;
            foreach ($articles as $article) {
                $sheet->setCellValue('A' . $row, $article->code_barre);
                $sheet->setCellValue('B' . $row, $article->designation);
                $sheet->setCellValue('C' . $row, $article->categorie->nom_categorie ?? '');
                $sheet->setCellValue('D' . $row, $article->quantite_stock);
                $sheet->setCellValue('E' . $row, $article->seuil_alerte);
                $sheet->setCellValue('F' . $row, $article->unite_mesure);
                $sheet->setCellValue('G' . $row, $article->statut);
                $row++;
            }
            
            foreach (range('A', 'G') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            return $this->downloadExcel($spreadsheet, 'alertes_stock_' . date('Y-m-d') . '.xlsx');
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📤 EXPORT DES MOUVEMENTS
     */
    public function exportMouvements(Request $request)
    {
        try {
            $query = Mouvement::with(['article', 'user']);
            
            if ($request->filled('date_debut')) {
                $query->whereDate('created_at', '>=', $request->date_debut);
            }
            if ($request->filled('date_fin')) {
                $query->whereDate('created_at', '<=', $request->date_fin);
            }
            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }
            if ($request->filled('article_id')) {
                $query->where('article_id', $request->article_id);
            }
            
            $mouvements = $query->orderBy('created_at', 'desc')->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Mouvements');
            
            $headers = ['Date', 'Article', 'Code Barre', 'Type', 'Quantité', 'Quantité Avant', 'Quantité Après', 'Motif', 'Utilisateur', 'Référence'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
                $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
                $col++;
            }
            
            $row = 2;
            foreach ($mouvements as $mvt) {
                $sheet->setCellValue('A' . $row, $mvt->created_at->format('d/m/Y H:i'));
                $sheet->setCellValue('B' . $row, $mvt->article->designation ?? 'N/A');
                $sheet->setCellValue('C' . $row, $mvt->article->code_barre ?? '');
                $sheet->setCellValue('D' . $row, $mvt->type);
                $sheet->setCellValue('E' . $row, $mvt->quantite);
                $sheet->setCellValue('F' . $row, $mvt->quantite_avant);
                $sheet->setCellValue('G' . $row, $mvt->quantite_apres);
                $sheet->setCellValue('H' . $row, $mvt->motif ?? '');
                $sheet->setCellValue('I' . $row, $mvt->user->name ?? '');
                $sheet->setCellValue('J' . $row, $mvt->reference ?? '');
                $row++;
            }
            
            foreach (range('A', 'J') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            return $this->downloadExcel($spreadsheet, 'mouvements_' . date('Y-m-d') . '.xlsx');
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📤 EXPORT DES DEMANDES INTERNES
     */
    public function exportDemandes(Request $request)
    {
        try {
            $query = Demande::with(['user', 'article']);
            
            if ($request->filled('statut')) {
                $query->where('statut', $request->statut);
            }
            if ($request->filled('date_debut')) {
                $query->whereDate('created_at', '>=', $request->date_debut);
            }
            
            $demandes = $query->orderBy('created_at', 'desc')->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Demandes');
            
            $headers = ['ID', 'Date', 'Demandeur', 'Article', 'Quantité Demandée', 'Quantité Accordée', 'Statut', 'Motif', 'Date Traitement', 'Traité Par'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
                $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
                $col++;
            }
            
            $row = 2;
            foreach ($demandes as $demande) {
                $sheet->setCellValue('A' . $row, $demande->id);
                $sheet->setCellValue('B' . $row, $demande->created_at->format('d/m/Y H:i'));
                $sheet->setCellValue('C' . $row, $demande->user->name ?? '');
                $sheet->setCellValue('D' . $row, $demande->article->designation ?? '');
                $sheet->setCellValue('E' . $row, $demande->quantite_demandee);
                $sheet->setCellValue('F' . $row, $demande->quantite_accorde ?? '');
                $sheet->setCellValue('G' . $row, $demande->statut);
                $sheet->setCellValue('H' . $row, $demande->motif ?? '');
                $sheet->setCellValue('I' . $row, $demande->date_traitement ? date('d/m/Y H:i', strtotime($demande->date_traitement)) : '');
                $sheet->setCellValue('J' . $row, $demande->traitePar->name ?? '');
                $row++;
            }
            
            foreach (range('A', 'J') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            return $this->downloadExcel($spreadsheet, 'demandes_' . date('Y-m-d') . '.xlsx');
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📤 EXPORT DES COMMANDES FOURNISSEURS
     */
    public function exportCommandes(Request $request)
    {
        try {
            $commandes = CommandeFournisseur::with(['lignes.article'])->orderBy('created_at', 'desc')->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Commandes Fournisseurs');
            
            $headers = ['N° Commande', 'Date', 'Fournisseur', 'Statut', 'Archivée', 'Article', 'Quantité Commandée', 'Quantité Livrée', 'Date Création'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
                $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
                $col++;
            }
            
            $row = 2;
            foreach ($commandes as $commande) {
                if ($commande->lignes->count() > 0) {
                    foreach ($commande->lignes as $ligne) {
                        $sheet->setCellValue('A' . $row, $commande->numero_commande);
                        $sheet->setCellValue('B' . $row, $commande->date_commande);
                        $sheet->setCellValue('C' . $row, $commande->fournisseur);
                        $sheet->setCellValue('D' . $row, $commande->statut);
                        $sheet->setCellValue('E' . $row, $commande->is_archived ? 'Oui' : 'Non');
                        $sheet->setCellValue('F' . $row, $ligne->article->designation ?? '');
                        $sheet->setCellValue('G' . $row, $ligne->quantite_commandee);
                        $sheet->setCellValue('H' . $row, $ligne->quantite_livree);
                        $sheet->setCellValue('I' . $row, $commande->created_at->format('d/m/Y'));
                        $row++;
                    }
                } else {
                    $sheet->setCellValue('A' . $row, $commande->numero_commande);
                    $sheet->setCellValue('B' . $row, $commande->date_commande);
                    $sheet->setCellValue('C' . $row, $commande->fournisseur);
                    $sheet->setCellValue('D' . $row, $commande->statut);
                    $sheet->setCellValue('E' . $row, $commande->is_archived ? 'Oui' : 'Non');
                    $sheet->setCellValue('F' . $row, '');
                    $sheet->setCellValue('G' . $row, '');
                    $sheet->setCellValue('H' . $row, '');
                    $sheet->setCellValue('I' . $row, $commande->created_at->format('d/m/Y'));
                    $row++;
                }
            }
            
            foreach (range('A', 'I') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            return $this->downloadExcel($spreadsheet, 'commandes_fournisseurs_' . date('Y-m-d') . '.xlsx');
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📤 EXPORT DES INVENTAIRES
     */
    public function exportInventaires(Request $request)
    {
        try {
            $inventaires = Inventaire::with(['magasin', 'responsable', 'lignes.article'])->orderBy('created_at', 'desc')->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Inventaires');
            
            $headers = ['N° Inventaire', 'Magasin', 'Date Début', 'Date Fin', 'Statut', 'Responsable', 'Article', 'Quantité Théorique', 'Quantité Réelle', 'Écart', 'Corrigé'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
                $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
                $col++;
            }
            
            $row = 2;
            foreach ($inventaires as $inventaire) {
                if ($inventaire->lignes->count() > 0) {
                    foreach ($inventaire->lignes as $ligne) {
                        $sheet->setCellValue('A' . $row, $inventaire->numero_inventaire);
                        $sheet->setCellValue('B' . $row, $inventaire->magasin->nom_magasin ?? '');
                        $sheet->setCellValue('C' . $row, $inventaire->date_debut);
                        $sheet->setCellValue('D' . $row, $inventaire->date_fin ?? '');
                        $sheet->setCellValue('E' . $row, $inventaire->statut);
                        $sheet->setCellValue('F' . $row, $inventaire->responsable->name ?? '');
                        $sheet->setCellValue('G' . $row, $ligne->article->designation ?? '');
                        $sheet->setCellValue('H' . $row, $ligne->quantite_theorique);
                        $sheet->setCellValue('I' . $row, $ligne->quantite_reelle);
                        $sheet->setCellValue('J' . $row, $ligne->ecart);
                        $sheet->setCellValue('K' . $row, $ligne->est_corrige ? 'Oui' : 'Non');
                        $row++;
                    }
                }
            }
            
            foreach (range('A', 'K') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            return $this->downloadExcel($spreadsheet, 'inventaires_' . date('Y-m-d') . '.xlsx');
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📤 EXPORT DES RAPPORTS DE CONSOMMATION (périodique)
     */
    public function exportRapportConsommation(Request $request)
    {
        try {
            $request->validate([
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after_or_equal:date_debut'
            ]);
            
            $mouvements = Mouvement::where('type', 'sortie')
                ->whereBetween('created_at', [$request->date_debut, $request->date_fin . ' 23:59:59'])
                ->with(['article', 'article.categorie', 'user'])
                ->get();
            
            // Agrégation par article
            $consommation = [];
            foreach ($mouvements as $mvt) {
                $articleId = $mvt->article_id;
                if (!isset($consommation[$articleId])) {
                    $consommation[$articleId] = [
                        'article' => $mvt->article,
                        'quantite_totale' => 0,
                        'nombre_mouvements' => 0,
                        'premiere_sortie' => $mvt->created_at,
                        'derniere_sortie' => $mvt->created_at
                    ];
                }
                $consommation[$articleId]['quantite_totale'] += $mvt->quantite;
                $consommation[$articleId]['nombre_mouvements']++;
                if ($mvt->created_at < $consommation[$articleId]['premiere_sortie']) {
                    $consommation[$articleId]['premiere_sortie'] = $mvt->created_at;
                }
                if ($mvt->created_at > $consommation[$articleId]['derniere_sortie']) {
                    $consommation[$articleId]['derniere_sortie'] = $mvt->created_at;
                }
            }
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Consommation');
            
            $headers = ['Code Barre', 'Désignation', 'Catégorie', 'Unité', 'Quantité Consommée', 'Nb Sorties', 'Stock Actuel', 'Première Sortie', 'Dernière Sortie'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
                $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
                $col++;
            }
            
            $row = 2;
            foreach ($consommation as $data) {
                $article = $data['article'];
                $sheet->setCellValue('A' . $row, $article->code_barre);
                $sheet->setCellValue('B' . $row, $article->designation);
                $sheet->setCellValue('C' . $row, $article->categorie->nom_categorie ?? '');
                $sheet->setCellValue('D' . $row, $article->unite_mesure);
                $sheet->setCellValue('E' . $row, $data['quantite_totale']);
                $sheet->setCellValue('F' . $row, $data['nombre_mouvements']);
                $sheet->setCellValue('G' . $row, $article->quantite_stock);
                $sheet->setCellValue('H' . $row, $data['premiere_sortie']->format('d/m/Y'));
                $sheet->setCellValue('I' . $row, $data['derniere_sortie']->format('d/m/Y'));
                $row++;
            }
            
            // Ligne de synthèse
            $sheet->setCellValue('A' . $row, 'TOTAL');
            $sheet->setCellValue('E' . $row, array_sum(array_column($consommation, 'quantite_totale')));
            $sheet->getStyle('A' . $row . ':I' . $row)->getFont()->setBold(true);
            
            foreach (range('A', 'I') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            return $this->downloadExcel($spreadsheet, 'rapport_consommation_' . $request->date_debut . '_' . $request->date_fin . '.xlsx');
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * 📤 TEMPLATE D'IMPORT (vide)
     */
    public function downloadTemplate(Request $request)
    {
        $type = $request->get('type', 'articles');
        
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        $templates = [
            'articles' => [
                'title' => 'Template Import Articles',
                'headers' => ['Code Barre', 'Désignation', 'Catégorie', 'Description', 'Unité', 'Seuil Alerte', 'Stock Initial', 'Magasin', 'Prix Unitaire', 'Emplacement']
            ],
            'categories' => [
                'title' => 'Template Import Catégories',
                'headers' => ['Nom Catégorie', 'Famille']
            ],
            'familles' => [
                'title' => 'Template Import Familles',
                'headers' => ['Nom Famille']
            ],
            'magasins' => [
                'title' => 'Template Import Magasins',
                'headers' => ['Nom Magasin', 'Localisation']
            ],
            'utilisateurs' => [
                'title' => 'Template Import Utilisateurs',
                'headers' => ['Nom', 'Email', 'Rôle (admin/magasinier/demandeur)', 'Magasin', 'Téléphone', 'Fonction']
            ],
            'mouvements' => [
                'title' => 'Template Import Mouvements',
                'headers' => ['Code Barre', 'Type (entree/sortie)', 'Quantité', 'Motif', 'Date (YYYY-MM-DD)']
            ]
        ];
        
        $template = $templates[$type] ?? $templates['articles'];
        $sheet->setTitle($template['title']);
        
        $col = 'A';
        foreach ($template['headers'] as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
            $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
            $col++;
        }
        
        // Ligne d'exemple
        if ($type == 'articles') {
            $sheet->setCellValue('A2', '611123456789');
            $sheet->setCellValue('B2', 'Article exemple');
            $sheet->setCellValue('C2', 'Informatique');
            $sheet->setCellValue('D2', 'Description optionnelle');
            $sheet->setCellValue('E2', 'Pièce');
            $sheet->setCellValue('F2', '5');
            $sheet->setCellValue('G2', '0');
            $sheet->setCellValue('H2', 'Magasin Principal');
            $sheet->setCellValue('I2', '100.00');
            $sheet->setCellValue('J2', 'A-01');
        }
        
        foreach (range('A', chr(64 + count($template['headers']))) as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        
        return $this->downloadExcel($spreadsheet, 'template_import_' . $type . '.xlsx');
    }

    // ===========================================================
    // 🔧 MÉTHODES PRIVÉES
    // ===========================================================

    private function readFileContent($file)
    {
        $extension = $file->getClientOriginalExtension();
        $rows = [];
        
        if ($extension === 'xlsx') {
            $spreadsheet = IOFactory::load($file->getPathname());
            $rows = $spreadsheet->getActiveSheet()->toArray();
        } else {
            $content = file_get_contents($file->getPathname());
            $delimiter = $this->detectDelimiter($content);
            $handle = fopen($file->getPathname(), 'r');
            while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
                $rows[] = $data;
            }
            fclose($handle);
        }
        
        return $rows;
    }

    private function detectHeaderRow(array $rows): int
    {
        $keywords = ['code', 'barre', 'designation', 'nom', 'categorie', 'email', 'magasin', 'quantite'];
        
        for ($i = 0; $i < min(15, count($rows)); $i++) {
            if (empty($rows[$i])) continue;
            
            $rowText = implode(' ', array_map('strtolower', $rows[$i]));
            $matchCount = 0;
            foreach ($keywords as $keyword) {
                if (strpos($rowText, $keyword) !== false) $matchCount++;
            }
            if ($matchCount >= 2) return $i;
        }
        return 0;
    }

    private function mapColumns(array $headers, string $context = 'articles'): array
    {
        $mapping = [];
        
        $fieldMap = [
            'code_barre' => ['code barre', 'codebarre', 'code-barre', 'code', 'barcode', 'ean', 'reference'],
            'designation' => ['designation', 'désignation', 'nom', 'libellé', 'libelle', 'article', 'produit'],
            'categorie' => ['categorie', 'catégorie', 'category', 'cat', 'type'],
            'description' => ['description', 'desc', 'details', 'note'],
            'unite' => ['unité', 'unite', 'unit', 'mesure', 'uom'],
            'seuil_alerte' => ['seuil', 'seuil alerte', 'alerte', 'threshold', 'min'],
            'stock' => ['stock', 'quantite', 'quantité', 'qte', 'quantite initiale'],
            'magasin' => ['magasin', 'depot', 'dépôt', 'store', 'warehouse'],
            'prix' => ['prix', 'price', 'prix unitaire', 'cout', 'coût'],
            'emplacement' => ['emplacement', 'location', 'rack', 'etagere', 'étagère'],
            'marque' => ['marque', 'brand', 'marque'],
            'modele' => ['modele', 'modèle', 'model'],
            'email' => ['email', 'courriel', 'mail'],
            'role' => ['role', 'rôle', 'fonction', 'type utilisateur'],
            'phone' => ['telephone', 'téléphone', 'phone', 'tel'],
            'type' => ['type', 'nature', 'operation', 'opération'],
            'quantite' => ['quantite', 'quantité', 'qte', 'nombre'],
            'motif' => ['motif', 'raison', 'cause', 'commentaire'],
            'date' => ['date', 'date mouvement', 'date mvt', 'jour'],
            'nom_famille' => ['nom famille', 'famille', 'famille nom'],
            'nom_categorie' => ['nom categorie', 'categorie', 'catégorie nom'],
            'famille' => ['famille', 'famille_id', 'famille id'],
            'nom_magasin' => ['nom magasin', 'magasin nom', 'magasin'],
            'localisation' => ['localisation', 'adresse', 'lieu', 'location'],
            'name' => ['nom', 'name', 'fullname', 'utilisateur'],
            'job_title' => ['fonction', 'poste', 'job', 'titre'],
        ];
        
        foreach ($headers as $index => $header) {
            $headerLower = strtolower(trim($header));
            foreach ($fieldMap as $field => $keywords) {
                foreach ($keywords as $keyword) {
                    if (strpos($headerLower, $keyword) !== false) {
                        $mapping[$field] = $index;
                        break 2;
                    }
                }
            }
        }
        
        return $mapping;
    }

    private function getValue(array $row, array $mapping, string $field): string
    {
        if (isset($mapping[$field]) && isset($row[$mapping[$field]])) {
            $value = $row[$mapping[$field]];
            if (is_object($value) && method_exists($value, 'format')) {
                return $value->format('Y-m-d');
            }
            return (string)$value;
        }
        return '';
    }

    private function detectDelimiter(string $content): string
    {
        $delimiters = [',', ';', "\t", '|'];
        $bestDelimiter = ',';
        $bestCount = 0;
        
        $firstLine = strtok($content, "\n");
        foreach ($delimiters as $delimiter) {
            $count = substr_count($firstLine, $delimiter);
            if ($count > $bestCount) {
                $bestCount = $count;
                $bestDelimiter = $delimiter;
            }
        }
        return $bestDelimiter;
    }

    // ===========================================================
// 🔧 MÉTHODES PRIVÉES
// ===========================================================

private function downloadExcel(Spreadsheet $spreadsheet, string $filename)
{
    // Nettoyer tous les buffers existants
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Créer un fichier temporaire
    $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
    $writer = new Xlsx($spreadsheet);
    $writer->save($tempFile);
    
    // Lire le contenu du fichier temporaire
    $content = file_get_contents($tempFile);
    
    // Supprimer le fichier temporaire
    unlink($tempFile);
    
    // Retourner la réponse
    return response($content, 200, [
        'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        'Content-Length' => strlen($content),
        'Cache-Control' => 'no-cache, must-revalidate',
        'Pragma' => 'public',
        'Expires' => '0',
        'Access-Control-Allow-Origin' => '*'
    ]);
}

public function exportFamilles()
{
    try {
        $familles = Famille::with('categories')->get();
        
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Familles');
        
        $headers = ['ID', 'Nom Famille', 'Nombre de Catégories', 'Date Création'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
            $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
            $col++;
        }
        
        $row = 2;
        foreach ($familles as $famille) {
            $sheet->setCellValue('A' . $row, $famille->id);
            $sheet->setCellValue('B' . $row, $famille->nom_famille);
            $sheet->setCellValue('C' . $row, $famille->categories->count());
            $sheet->setCellValue('D' . $row, $famille->created_at->format('d/m/Y'));
            $row++;
        }
        
        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        
        return $this->downloadExcel($spreadsheet, 'familles_' . date('Y-m-d') . '.xlsx');
        
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

public function exportCategories()
{
    try {
        $categories = Categories::with('famille')->get();
        
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Catégories');
        
        $headers = ['ID', 'Nom Catégorie', 'Famille', 'Date Création'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
            $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
            $col++;
        }
        
        $row = 2;
        foreach ($categories as $categorie) {
            $sheet->setCellValue('A' . $row, $categorie->id);
            $sheet->setCellValue('B' . $row, $categorie->nom_categorie);
            $sheet->setCellValue('C' . $row, $categorie->famille->nom_famille ?? '');
            $sheet->setCellValue('D' . $row, $categorie->created_at->format('d/m/Y'));
            $row++;
        }
        
        foreach (range('A', 'D') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
        
        return $this->downloadExcel($spreadsheet, 'categories_' . date('Y-m-d') . '.xlsx');
        
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}
}