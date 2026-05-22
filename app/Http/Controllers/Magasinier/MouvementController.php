<?php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Article;
use App\Models\Admin\Mouvement;
use App\Models\Admin\Magasins;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MouvementController extends Controller
{
    /**
     * Liste des mouvements de stock
     */
    public function index(Request $request)
    {
        try {
            $query = Mouvement::with(['article', 'user', 'magasin']);
            
            // Filtrer par article
            if ($request->article_id) {
                $query->where('article_id', $request->article_id);
            }
            
            // Filtrer par type
            if ($request->type && in_array($request->type, ['entree', 'sortie', 'ajustement'])) {
                $query->where('type', $request->type);
            }
            
            // Filtrer par magasin
            if ($request->magasin_id) {
                $query->where('magasin_id', $request->magasin_id);
            }
            
            $mouvements = $query->orderBy('created_at', 'desc')->paginate(50);
            
            return response()->json([
                'success' => true,
                'data' => $mouvements
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Statistiques des mouvements
     */
    public function stats()
    {
        try {
            $stats = [
                'total_entrees' => Mouvement::where('type', 'entree')->sum('quantite'),
                'total_sorties' => Mouvement::where('type', 'sortie')->sum('quantite'),
                'total_ajustements' => Mouvement::where('type', 'ajustement')->sum('quantite'),
                'mouvements_jour' => Mouvement::whereDate('created_at', today())->count(),
                'derniers_mouvements' => Mouvement::with(['article', 'user'])
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(function($m) {
                        return [
                            'id' => $m->id,
                            'type' => $m->type,
                            'quantite' => $m->quantite,
                            'article' => $m->article ? ['designation' => $m->article->designation] : null,
                            'user' => $m->user ? ['name' => $m->user->name] : null,
                            'created_at' => $m->created_at
                        ];
                    })
            ];
            
            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Enregistrer une entrée de stock
     */
    public function entree(Request $request)
    {
        try {
            $request->validate([
                'article_id' => 'required|exists:articles,id',
                'magasin_id' => 'required|exists:magasins,id',
                'quantite' => 'required|integer|min:1',
                'motif' => 'nullable|string|max:500',
                'reference' => 'nullable|string|max:100'
            ]);
            
            $article = Article::findOrFail($request->article_id);
            $quantiteAvant = $article->quantite_stock;
            $quantiteApres = $quantiteAvant + $request->quantite;
            
            // Créer le mouvement
            $mouvement = Mouvement::create([
                'article_id' => $request->article_id,
                'magasin_id' => $request->magasin_id,
                'type' => 'entree',
                'quantite' => $request->quantite,
                'quantite_avant' => $quantiteAvant,
                'quantite_apres' => $quantiteApres,
                'motif' => $request->motif,
                'reference' => $request->reference,
                'reference_type' => 'manuelle',
                'user_id' => Auth::id()
            ]);
            
            // Mettre à jour le stock
            $article->quantite_stock = $quantiteApres;
            $article->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Entrée enregistrée avec succès',
                'data' => $mouvement->load(['article', 'user'])
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Enregistrer une sortie de stock
     */
    public function sortie(Request $request)
    {
        try {
            $request->validate([
                'article_id' => 'required|exists:articles,id',
                'magasin_id' => 'required|exists:magasins,id',
                'quantite' => 'required|integer|min:1',
                'motif' => 'nullable|string|max:500',
                'reference' => 'nullable|string|max:100'
            ]);
            
            $article = Article::findOrFail($request->article_id);
            
            // Vérifier le stock
            if ($article->quantite_stock < $request->quantite) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock insuffisant. Stock actuel: ' . $article->quantite_stock
                ], 422);
            }
            
            $quantiteAvant = $article->quantite_stock;
            $quantiteApres = $quantiteAvant - $request->quantite;
            
            $mouvement = Mouvement::create([
                'article_id' => $request->article_id,
                'magasin_id' => $request->magasin_id,
                'type' => 'sortie',
                'quantite' => $request->quantite,
                'quantite_avant' => $quantiteAvant,
                'quantite_apres' => $quantiteApres,
                'motif' => $request->motif,
                'reference' => $request->reference,
                'reference_type' => 'manuelle',
                'user_id' => Auth::id()
            ]);
            
            $article->quantite_stock = $quantiteApres;
            $article->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Sortie enregistrée avec succès',
                'data' => $mouvement->load(['article', 'user'])
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Ajustement manuel du stock
     */
    public function ajustement(Request $request)
    {
        try {
            $request->validate([
                'article_id' => 'required|exists:articles,id',
                'magasin_id' => 'required|exists:magasins,id',
                'nouvelle_quantite' => 'required|integer|min:0',
                'motif' => 'required|string|max:500'
            ]);
            
            $article = Article::findOrFail($request->article_id);
            $quantiteAvant = $article->quantite_stock;
            $quantiteApres = $request->nouvelle_quantite;
            $difference = $quantiteApres - $quantiteAvant;
            
            $mouvement = Mouvement::create([
                'article_id' => $request->article_id,
                'magasin_id' => $request->magasin_id,
                'type' => 'ajustement',
                'quantite' => abs($difference),
                'quantite_avant' => $quantiteAvant,
                'quantite_apres' => $quantiteApres,
                'motif' => $request->motif,
                'reference_type' => 'ajustement',
                'user_id' => Auth::id()
            ]);
            
            $article->quantite_stock = $quantiteApres;
            $article->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Ajustement effectué avec succès',
                'data' => $mouvement->load(['article', 'user'])
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Détail d'un mouvement spécifique
     */
    public function show($id)
    {
        try {
            $mouvement = Mouvement::with(['article', 'user', 'magasin'])
                ->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $mouvement
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 404);
        }
    }
}