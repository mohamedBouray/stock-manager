<?php
// app/Http/Controllers/Magasinier/ScanController.php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Article;
use App\Models\Admin\Stock;
use App\Models\Admin\Mouvement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ScanController extends Controller
{
    /**
     * Scanner un code-barres et retourner l'article
     */
    public function scanner(Request $request)
    {
        $request->validate([
            'code_barre' => 'required|string'
        ]);
        
        $article = Article::where('code_barre', $request->code_barre)->first();
        
        if (!$article) {
            return response()->json(['message' => 'Article non trouvé'], 404);
        }
        
        // Récupérer les stocks du magasin du magasinier
        $query = Stock::with('magasin')->where('article_id', $article->id);
        
        // Si le magasinier est assigné à un magasin, ne voir que celui-ci
        if (auth()->user()->magasin_id) {
            $query->where('magasin_id', auth()->user()->magasin_id);
        }
        
        $stocks = $query->get();
        
        return response()->json([
            'article' => $article,
            'stocks' => $stocks
        ]);
    }
    
    /**
     * Entrée rapide par scan
     */
    public function entreeRapide(Request $request)
    {
        $request->validate([
            'code_barre' => 'required|string',
            'magasin_id' => 'required|exists:magasins,id',
            'quantite' => 'required|integer|min:1'
        ]);
        
        // Vérifier que le magasinier a le droit sur ce magasin
        if (auth()->user()->magasin_id && auth()->user()->magasin_id != $request->magasin_id) {
            return response()->json(['message' => 'Vous n\'avez pas accès à ce magasin'], 403);
        }
        
        $article = Article::where('code_barre', $request->code_barre)->firstOrFail();
        
        $stock = Stock::firstOrCreate(
            [
                'article_id' => $article->id,
                'magasin_id' => $request->magasin_id
            ],
            ['quantite_disponible' => 0, 'quantite_reservee' => 0]
        );
        
        $ancienneQuantite = $stock->quantite_disponible;
        $stock->increment('quantite_disponible', $request->quantite);
        
        Mouvement::create([
            'article_id' => $article->id,
            'magasin_id' => $request->magasin_id,
            'type' => 'entree',
            'quantite' => $request->quantite,
            'quantite_avant' => $ancienneQuantite,
            'quantite_apres' => $stock->quantite_disponible,
            'motif' => 'Entrée par scan code-barres',
            'reference_type' => 'scan',
            'user_id' => Auth::id()
        ]);
        
        return response()->json([
            'message' => 'Entrée enregistrée avec succès',
            'article' => $article,
            'nouveau_stock' => $stock->quantite_disponible
        ]);
    }
    
    /**
     * Sortie rapide par scan
     */
    public function sortieRapide(Request $request)
    {
        $request->validate([
            'code_barre' => 'required|string',
            'magasin_id' => 'required|exists:magasins,id',
            'quantite' => 'required|integer|min:1'
        ]);
        
        // Vérifier que le magasinier a le droit sur ce magasin
        if (auth()->user()->magasin_id && auth()->user()->magasin_id != $request->magasin_id) {
            return response()->json(['message' => 'Vous n\'avez pas accès à ce magasin'], 403);
        }
        
        $article = Article::where('code_barre', $request->code_barre)->firstOrFail();
        
        $stock = Stock::where('article_id', $article->id)
            ->where('magasin_id', $request->magasin_id)
            ->firstOrFail();
            
        if ($stock->quantite_disponible < $request->quantite) {
            return response()->json(['message' => 'Stock insuffisant'], 422);
        }
        
        $ancienneQuantite = $stock->quantite_disponible;
        $stock->decrement('quantite_disponible', $request->quantite);
        
        Mouvement::create([
            'article_id' => $article->id,
            'magasin_id' => $request->magasin_id,
            'type' => 'sortie',
            'quantite' => $request->quantite,
            'quantite_avant' => $ancienneQuantite,
            'quantite_apres' => $stock->quantite_disponible,
            'motif' => 'Sortie par scan code-barres',
            'reference_type' => 'scan',
            'user_id' => Auth::id()
        ]);
        
        return response()->json([
            'message' => 'Sortie enregistrée avec succès',
            'article' => $article,
            'nouveau_stock' => $stock->quantite_disponible
        ]);
    }
}