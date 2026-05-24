<?php
// app/Http/Controllers/Admin/ExportController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Article;
use App\Models\Admin\Stock;
use App\Models\Admin\Mouvement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use App\Models\Admin\CommandeFournisseur;
use App\Models\Admin\Categories;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class ExportController extends Controller
{
    /**
     * 📤 Export articles vers Excel
     */
    public function exportArticles()
    {
        try {
            $articles = Article::with(['categorie.famille'])->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Titre
            $sheet->setTitle('Articles');
            
            // En-têtes
            $headers = ['ID', 'Code Barre', 'Désignation', 'Description', 'Catégorie', 'Famille', 'Unité', 'Stock', 'Seuil Alerte', 'Statut', 'Date création'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $sheet->getStyle($col . '1')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FF4F81BD');
                $sheet->getStyle($col . '1')->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color(\PhpOffice\PhpSpreadsheet\Style\Color::COLOR_WHITE));
                $col++;
            }
            
            // Données
            $row = 2;
            foreach ($articles as $article) {
                $sheet->setCellValue('A' . $row, $article->id);
                $sheet->setCellValue('B' . $row, $article->code_barre);
                $sheet->setCellValue('C' . $row, $article->designation);
                $sheet->setCellValue('D' . $row, $article->description ?? '');
                $sheet->setCellValue('E' . $row, $article->categorie->nom_categorie ?? '');
                $sheet->setCellValue('F' . $row, $article->categorie->famille->nom_famille ?? '');
                $sheet->setCellValue('G' . $row, $article->unite_mesure);
                $sheet->setCellValue('H' . $row, $article->quantite_stock ?? 0);
                $sheet->setCellValue('I' . $row, $article->seuil_alerte);
                $sheet->setCellValue('J' . $row, $article->statut);
                $sheet->setCellValue('K' . $row, $article->created_at->format('d/m/Y'));
                $row++;
            }
            
            // Auto-size columns
            foreach (range('A', 'K') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            $filename = 'articles_' . date('Y-m-d_H-i-s') . '.xlsx';
            $writer = new Xlsx($spreadsheet);
            
            // Retourner le fichier
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            $writer->save('php://output');
            exit;
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 📤 Export stocks vers Excel
     */
    public function exportStocks()
    {
        try {
            $stocks = Stock::with(['article', 'magasin'])->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Stocks');
            
            // En-têtes
            $headers = ['Article ID', 'Code Barre', 'Désignation', 'Magasin', 'Quantité Disponible', 'Quantité Réservée', 'Emplacement', 'Dernière mise à jour'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $col++;
            }
            
            // Données
            $row = 2;
            foreach ($stocks as $stock) {
                $sheet->setCellValue('A' . $row, $stock->article_id);
                $sheet->setCellValue('B' . $row, $stock->article->code_barre ?? '');
                $sheet->setCellValue('C' . $row, $stock->article->designation ?? '');
                $sheet->setCellValue('D' . $row, $stock->magasin->nom_magasin ?? '');
                $sheet->setCellValue('E' . $row, $stock->quantite_disponible);
                $sheet->setCellValue('F' . $row, $stock->quantite_reservee ?? 0);
                $sheet->setCellValue('G' . $row, $stock->emplacement_code ?? '');
                $sheet->setCellValue('H' . $row, $stock->updated_at->format('d/m/Y H:i'));
                $row++;
            }
            
            foreach (range('A', 'H') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            $filename = 'stocks_' . date('Y-m-d_H-i-s') . '.xlsx';
            $writer = new Xlsx($spreadsheet);
            
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            $writer->save('php://output');
            exit;
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 📤 Export mouvements vers Excel
     */
    public function exportMouvements(Request $request)
    {
        try {
            $query = Mouvement::with(['article', 'user', 'magasin']);
            
            if ($request->date_debut) {
                $query->whereDate('created_at', '>=', $request->date_debut);
            }
            if ($request->date_fin) {
                $query->whereDate('created_at', '<=', $request->date_fin);
            }
            
            $mouvements = $query->orderBy('created_at', 'desc')->limit(5000)->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Mouvements');
            
            $headers = ['ID', 'Type', 'Article', 'Quantité', 'Magasin', 'Stock Avant', 'Stock Après', 'Motif', 'Utilisateur', 'Date'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $col++;
            }
            
            $row = 2;
            foreach ($mouvements as $m) {
                $sheet->setCellValue('A' . $row, $m->id);
                $sheet->setCellValue('B' . $row, $m->type == 'entree' ? 'ENTRÉE' : ($m->type == 'sortie' ? 'SORTIE' : 'AJUSTEMENT'));
                $sheet->setCellValue('C' . $row, $m->article->designation ?? '');
                $sheet->setCellValue('D' . $row, $m->quantite);
                $sheet->setCellValue('E' . $row, $m->magasin->nom_magasin ?? '');
                $sheet->setCellValue('F' . $row, $m->quantite_avant ?? '');
                $sheet->setCellValue('G' . $row, $m->quantite_apres ?? '');
                $sheet->setCellValue('H' . $row, $m->motif ?? '');
                $sheet->setCellValue('I' . $row, $m->user->name ?? '');
                $sheet->setCellValue('J' . $row, $m->created_at->format('d/m/Y H:i'));
                $row++;
            }
            
            foreach (range('A', 'J') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            $filename = 'mouvements_' . date('Y-m-d_H-i-s') . '.xlsx';
            $writer = new Xlsx($spreadsheet);
            
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            $writer->save('php://output');
            exit;
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 📤 Export commandes fournisseurs vers Excel
     */
    public function exportCommandes()
    {
        try {
            $commandes = CommandeFournisseur::with(['lignes.article'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            $sheet->setTitle('Commandes');
            
            $headers = ['N° Commande', 'Fournisseur', 'Date', 'Statut', 'Total Articles', 'Date création'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '1', $header);
                $sheet->getStyle($col . '1')->getFont()->setBold(true);
                $col++;
            }
            
            $row = 2;
            foreach ($commandes as $c) {
                $sheet->setCellValue('A' . $row, $c->numero_commande);
                $sheet->setCellValue('B' . $row, $c->fournisseur);
                $sheet->setCellValue('C' . $row, $c->date_commande);
                $sheet->setCellValue('D' . $row, $c->statut);
                $sheet->setCellValue('E' . $row, $c->lignes->sum('quantite_commandee'));
                $sheet->setCellValue('F' . $row, $c->created_at->format('d/m/Y'));
                $row++;
            }
            
            foreach (range('A', 'F') as $col) {
                $sheet->getColumnDimension($col)->setAutoSize(true);
            }
            
            $filename = 'commandes_' . date('Y-m-d_H-i-s') . '.xlsx';
            $writer = new Xlsx($spreadsheet);
            
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            $writer->save('php://output');
            exit;
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 🔥 IMPORT ARTICLES (CSV, TXT, Excel)
     */
    public function importArticles(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt,xlsx|max:5120'
            ]);
            
            $file = $request->file('file');
            $extension = $file->getClientOriginalExtension();
            
            $importes = 0;
            $erreurs = [];
            $ligneNum = 0;
            
            if ($extension === 'xlsx') {
                // Import Excel
                $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getPathname());
                $worksheet = $spreadsheet->getActiveSheet();
                $rows = $worksheet->toArray();
                
                foreach ($rows as $index => $row) {
                    if ($index === 0) continue; // Skip header
                    $ligneNum = $index;
                    
                    $code_barre = trim($row[0] ?? '');
                    $designation = trim($row[1] ?? '');
                    $categorie_id = trim($row[2] ?? '');
                    $unite_mesure = trim($row[3] ?? 'Pièce');
                    $seuil_alerte = trim($row[4] ?? 5);
                    
                    if (empty($code_barre) && empty($designation)) continue;
                    if (empty($code_barre) || empty($designation) || empty($categorie_id)) {
                        $erreurs[] = "Ligne $ligneNum: Champs requis manquants";
                        continue;
                    }
                    
                    if (Article::where('code_barre', $code_barre)->exists()) {
                        $erreurs[] = "Ligne $ligneNum: Code barre $code_barre existe déjà";
                        continue;
                    }
                    
                    if (!Categories::find($categorie_id)) {
                        $erreurs[] = "Ligne $ligneNum: Catégorie ID $categorie_id n'existe pas";
                        continue;
                    }
                    
                    Article::create([
                        'code_barre' => $code_barre,
                        'designation' => $designation,
                        'categorie_id' => $categorie_id,
                        'unite_mesure' => $unite_mesure,
                        'seuil_alerte' => $seuil_alerte,
                        'quantite_stock' => 0,
                        'statut' => 'actif'
                    ]);
                    
                    $importes++;
                }
            } else {
                // Import CSV/TXT
                $handle = fopen($file->getPathname(), 'r');
                $headers = fgetcsv($handle, 0, ';');
                
                while (($data = fgetcsv($handle, 0, ';')) !== false) {
                    $ligneNum++;
                    
                    $code_barre = trim($data[0] ?? '');
                    $designation = trim($data[1] ?? '');
                    $categorie_id = trim($data[2] ?? '');
                    $unite_mesure = trim($data[3] ?? 'Pièce');
                    $seuil_alerte = trim($data[4] ?? 5);
                    
                    if (empty($code_barre) && empty($designation)) continue;
                    if (empty($code_barre) || empty($designation) || empty($categorie_id)) {
                        $erreurs[] = "Ligne $ligneNum: Champs requis manquants";
                        continue;
                    }
                    
                    if (Article::where('code_barre', $code_barre)->exists()) {
                        $erreurs[] = "Ligne $ligneNum: Code barre $code_barre existe déjà";
                        continue;
                    }
                    
                    if (!Categories::find($categorie_id)) {
                        $erreurs[] = "Ligne $ligneNum: Catégorie ID $categorie_id n'existe pas";
                        continue;
                    }
                    
                    Article::create([
                        'code_barre' => $code_barre,
                        'designation' => $designation,
                        'categorie_id' => $categorie_id,
                        'unite_mesure' => $unite_mesure,
                        'seuil_alerte' => $seuil_alerte,
                        'quantite_stock' => 0,
                        'statut' => 'actif'
                    ]);
                    
                    $importes++;
                }
                fclose($handle);
            }
            
            return response()->json([
                'success' => true,
                'message' => "$importes article(s) importé(s)",
                'importes' => $importes,
                'erreurs' => $erreurs
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage(),
                'erreurs' => []
            ], 500);
        }
    }
}