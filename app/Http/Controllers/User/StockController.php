<?php
// app/Http/Controllers/User/StockController.php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Admin\Article;
use App\Models\Admin\Stock;
use App\Models\Admin\Categories;
use App\Models\Admin\Famille;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    // Liste des articles avec leurs quantités totales (tous magasins confondus)
    public function index(Request $request)
    {
        // 🔥 REQUÊTE : Grouper par article pour éviter les doublons
        $query = Stock::select(
                'stocks.article_id',
                DB::raw('SUM(stocks.quantite_disponible) as quantite_totale')
            )
            ->with(['article.categorie.famille'])
            ->groupBy('stocks.article_id')
            ->whereHas('article', function($q) {
                $q->where('statut', 'actif');
            });
        
        // Recherche par mot-clé
        if ($request->search) {
            $query->whereHas('article', function($q) use ($request) {
                $q->where('designation', 'like', "%{$request->search}%")
                  ->orWhere('code_barre', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }
        
        // Filtrer par famille
        if ($request->famille_id) {
            $query->whereHas('article.categorie', function($q) use ($request) {
                $q->where('famille_id', $request->famille_id);
            });
        }
        
        // Filtrer par disponibilité
        if ($request->disponible === 'true') {
            $query->having('quantite_totale', '>', 0);
        }
        
        $stocks = $query->paginate(20);
        
        // Transformer les données
        $articles = $stocks->map(function($stock) {
            $article = $stock->article;
            $article->quantite_stock = $stock->quantite_totale;
            return $article;
        });
        
        return response()->json([
            'success' => true,
            'data' => $articles
        ]);
    }
    
    // Voir un article spécifique
    public function show($id)
    {
        $article = Article::with(['categorie', 'categorie.famille'])
            ->findOrFail($id);
        
        // 🔥 Quantité totale depuis tous les magasins
        $totalStock = Stock::where('article_id', $id)->sum('quantite_disponible');
        $article->quantite_stock = $totalStock;
        
        return response()->json([
            'success' => true,
            'data' => $article
        ]);
    }
    
    // Liste des familles (pour filtres)
    public function familles()
    {
        $familles = Famille::with('categories')->get();
        
        return response()->json([
            'success' => true,
            'data' => $familles
        ]);
    }
    
    // Liste des catégories (pour filtres)
    public function categories(Request $request)
    {
        $query = Categories::with('famille');
        
        if ($request->famille_id) {
            $query->where('famille_id', $request->famille_id);
        }
        
        $categories = $query->get();
        
        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }
    
    // Statistiques du stock
    public function stats()
    {
        $totalArticles = Article::where('statut', 'actif')->count();
        
        // Articles avec stock total > 0
        $articlesEnStock = Stock::select('article_id')
            ->groupBy('article_id')
            ->havingRaw('SUM(quantite_disponible) > 0')
            ->count();
        
        // Articles en stock bas (total <= seuil_alerte)
        $articlesStockBas = Stock::join('articles', 'stocks.article_id', '=', 'articles.id')
            ->groupBy('stocks.article_id', 'articles.seuil_alerte')
            ->havingRaw('SUM(stocks.quantite_disponible) <= articles.seuil_alerte')
            ->count();
        
        // Articles en rupture (total = 0)
        $articlesRupture = Stock::select('article_id')
            ->groupBy('article_id')
            ->havingRaw('SUM(quantite_disponible) = 0')
            ->count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total_articles' => $totalArticles,
                'articles_en_stock' => $articlesEnStock,
                'articles_stock_bas' => $articlesStockBas,
                'articles_rupture' => $articlesRupture
            ]
        ]);
    }
}