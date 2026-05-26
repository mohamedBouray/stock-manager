<?php
// app/Http/Controllers/Admin/RapportController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Stock;
use App\Models\Admin\Article;
use App\Models\Admin\Mouvement;
use App\Models\Admin\CommandeFournisseur;
use App\Models\Admin\Demande;
use App\Models\Admin\Magasins;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class RapportController extends Controller
{
    // 📊 1. RAPPORT DE MISSION
     public function mission()
    {
        try {
            $data = [
                'date_rapport' => now(),
                'institut' => 'ISTAHT Tanger',
                'statistiques' => [
                    'total_articles' => Article::count(),
                    'total_magasins' => Magasins::count(),
                    'total_commandes' => CommandeFournisseur::count(),
                    'total_mouvements' => Mouvement::count(),
                    'total_demandes' => Demande::count(),
                ],
                'alertes' => Stock::with('article')->get()->filter(function($stock) {
                    return $stock->article && $stock->quantite_disponible <= $stock->article->seuil_alerte;
                })->values()
            ];
            
            $pdf = Pdf::loadView('pdf.rapport-mission', $data);
            return $pdf->download('rapport_mission_' . date('Y-m-d') . '.pdf');
            
        } catch (\Exception $e) {
            // Retourner l'erreur en JSON pour debug
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }
    
    // 📈 2. MOUVEMENTS JOURNALIERS
    public function mouvementsJournaliers(Request $request)
    {
        try {
            Log::info('Génération des mouvements journaliers pour le: ' . $request->date);
            
            $request->validate(['date' => 'required|date']);
            
            $mouvements = Mouvement::with(['article', 'magasin', 'user'])
                ->whereDate('created_at', $request->date)
                ->orderBy('created_at', 'desc')
                ->get();
            
            $data = [
                'date' => $request->date,
                'mouvements' => $mouvements,
                'total_entrees' => $mouvements->where('type', 'entree')->sum('quantite'),
                'total_sorties' => $mouvements->where('type', 'sortie')->sum('quantite'),
            ];
            
            $pdf = Pdf::loadView('pdf.mouvements-journaliers', $data);
            return $pdf->download('mouvements_' . $request->date . '.pdf');
            
        } catch (\Exception $e) {
            Log::error('Erreur mouvements journaliers: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    // 📦 3. APPROVISIONNEMENTS
    public function approvisionnements(Request $request)
    {
        try {
            Log::info('Génération des approvisionnements');
            
            $request->validate([
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after_or_equal:date_debut'
            ]);
            
            $commandes = CommandeFournisseur::with(['lignes.article'])
                ->whereBetween('date_commande', [$request->date_debut, $request->date_fin])
                ->get();
            
            $data = [
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
                'commandes' => $commandes,
                'total_commandes' => $commandes->count(),
            ];
            
            $pdf = Pdf::loadView('pdf.approvisionnements', $data);
            return $pdf->download('approvisionnements_' . $request->date_debut . '_' . $request->date_fin . '.pdf');
            
        } catch (\Exception $e) {
            Log::error('Erreur approvisionnements: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    // 📤 4. SITUATION DES SORTIES
    public function sorties(Request $request)
    {
        try {
            Log::info('Génération de la situation des sorties');
            
            $request->validate([
                'date_debut' => 'required|date',
                'date_fin' => 'required|date|after_or_equal:date_debut'
            ]);
            
            $sorties = Mouvement::with(['article', 'user'])
                ->where('type', 'sortie')
                ->whereBetween('created_at', [$request->date_debut, $request->date_fin])
                ->get();
            
            $data = [
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
                'sorties' => $sorties,
                'total_sorties' => $sorties->sum('quantite'),
            ];
            
            $pdf = Pdf::loadView('pdf.sorties', $data);
            return $pdf->download('sorties_' . $request->date_debut . '_' . $request->date_fin . '.pdf');
            
        } catch (\Exception $e) {
            Log::error('Erreur sorties: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    // 📑 5. FICHE DE STOCK
    public function ficheStock($article_id, Request $request)
    {
        try {
            Log::info('Génération de la fiche de stock pour article: ' . $article_id);
            
            $article = Article::findOrFail($article_id);
            
            $query = Mouvement::where('article_id', $article_id);
            
            if ($request->date_debut) {
                $query->whereDate('created_at', '>=', $request->date_debut);
            }
            if ($request->date_fin) {
                $query->whereDate('created_at', '<=', $request->date_fin);
            }
            
            $mouvements = $query->orderBy('created_at', 'asc')->get();
            $stockActuel = Stock::where('article_id', $article_id)->sum('quantite_disponible');
            
            $data = [
                'article' => $article,
                'mouvements' => $mouvements,
                'stock_actuel' => $stockActuel,
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
            ];
            
            $pdf = Pdf::loadView('pdf.fiche-stock', $data);
            return $pdf->download('fiche_stock_' . $article->code_barre . '.pdf');
            
        } catch (\Exception $e) {
            Log::error('Erreur fiche stock: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    // ⚠️ 6. RAPPORT ALERTES
    public function alertesPdf()
    {
        try {
            Log::info('Génération du rapport alertes');
            
            $alertes = Stock::with(['article', 'magasin'])
                ->whereHas('article', function($query) {
                    $query->whereColumn('stocks.quantite_disponible', '<=', 'articles.seuil_alerte');
                })
                ->get();
            
            $data = [
                'date' => now(),
                'alertes' => $alertes,
                'total_alertes' => $alertes->count(),
                'ruptures' => $alertes->where('quantite_disponible', 0)->count(),
            ];
            
            $pdf = Pdf::loadView('pdf.alertes', $data);
            return $pdf->download('alertes_stock_' . date('Y-m-d') . '.pdf');
            
        } catch (\Exception $e) {
            Log::error('Erreur rapport alertes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
public function ficheStockGlobale(Request $request)
{
    try {
        Log::info('Génération de la fiche de stock globale');
        
        $query = Mouvement::with(['article', 'magasin', 'user']);
        
        if ($request->date_debut) {
            $query->whereDate('created_at', '>=', $request->date_debut);
        }
        if ($request->date_fin) {
            $query->whereDate('created_at', '<=', $request->date_fin);
        }
        
        $mouvements = $query->orderBy('created_at', 'desc')->get();
        
        // Grouper les mouvements par article
        $articles = Article::with(['stocks.magasin'])->get();
        $articlesData = [];
        
        foreach ($articles as $article) {
            $articleMouvements = $mouvements->filter(function($m) use ($article) {
                return $m->article_id == $article->id;
            });
            
            $articlesData[] = [
                'article' => $article,
                'mouvements' => $articleMouvements,
                'stock_actuel' => $article->quantite_stock,
                'total_entrees' => $articleMouvements->where('type', 'entree')->sum('quantite'),
                'total_sorties' => $articleMouvements->where('type', 'sortie')->sum('quantite')
            ];
        }
        
        $data = [
            'date_rapport' => now(),
            'institut' => 'ISTAHT Tanger',
            'date_debut' => $request->date_debut,
            'date_fin' => $request->date_fin,
            'articles' => $articlesData,
            'total_articles' => $articles->count(),
            'total_stock' => $articles->sum('quantite_stock')
        ];
        
        $pdf = Pdf::loadView('pdf.fiche-stock-globale', $data);
        return $pdf->download('fiche_stock_globale_' . date('Y-m-d') . '.pdf');
        
    } catch (\Exception $e) {
        Log::error('Erreur fiche stock globale: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'error' => $e->getMessage(),
            'line' => $e->getLine()
        ], 500);
    }
}

}