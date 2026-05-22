<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Admin\Article;
use App\Models\Admin\Categories;
use App\Models\Admin\Famille;
use Illuminate\Http\Request;

class StockController extends Controller
{

    
    // Liste des articles avec filtres
    public function index(Request $request)
    {
        $query = Article::with(['categorie', 'categorie.famille'])
            ->where('statut', 'actif');
        
        // Recherche par mot-clé
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('designation', 'like', "%{$request->search}%")
                  ->orWhere('code_barre', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }
        
        // Filtrer par catégorie
        if ($request->categorie_id) {
            $query->where('categorie_id', $request->categorie_id);
        }
        
        // Filtrer par famille
        if ($request->famille_id) {
            $query->whereHas('categorie', function($q) use ($request) {
                $q->where('famille_id', $request->famille_id);
            });
        }
        
        // Filtrer par disponibilité
        if ($request->disponible === 'true') {
            $query->where('quantite_stock', '>', 0);
        }
        
        $articles = $query->orderBy('designation')->paginate(20);
        
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
        $articlesEnStock = Article::where('quantite_stock', '>', 0)->count();
        $articlesStockBas = Article::where('quantite_stock', '<=', 'seuil_alerte')->count();
        $articlesRupture = Article::where('quantite_stock', 0)->count();
        
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