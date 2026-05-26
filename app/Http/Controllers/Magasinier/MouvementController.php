<?php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Article;
use App\Models\Admin\Mouvement;
use App\Models\Admin\Stock; // 🔥 AJOUTER
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
            
            // Filtrer par magasin du magasinier
            if (auth()->user()->magasin_id) {
                $query->where('magasin_id', auth()->user()->magasin_id);
            }
            
            // Filtrer par article
            if ($request->article_id) {
                $query->where('article_id', $request->article_id);
            }
            
            // 🔥 CORRECTION: Filtrer par type (accepter 'all')
            if ($request->type && $request->type !== 'all' && in_array($request->type, ['entree', 'sortie', 'ajustement'])) {
                $query->where('type', $request->type);
            }
            
            // Filtrer par magasin
            if ($request->magasin_id && !auth()->user()->magasin_id) {
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
            $queryEntrees = Mouvement::where('type', 'entree');
            $querySorties = Mouvement::where('type', 'sortie');
            $queryAjustements = Mouvement::where('type', 'ajustement');
            $queryMouvementsJour = Mouvement::whereDate('created_at', today());
            $queryDerniers = Mouvement::with(['article', 'user'])->orderBy('created_at', 'desc');
            
            if (auth()->user()->magasin_id) {
                $queryEntrees->where('magasin_id', auth()->user()->magasin_id);
                $querySorties->where('magasin_id', auth()->user()->magasin_id);
                $queryAjustements->where('magasin_id', auth()->user()->magasin_id);
                $queryMouvementsJour->where('magasin_id', auth()->user()->magasin_id);
                $queryDerniers->where('magasin_id', auth()->user()->magasin_id);
            }
            
            $stats = [
                'total_entrees' => $queryEntrees->sum('quantite'),
                'total_sorties' => $querySorties->sum('quantite'),
                'total_ajustements' => $queryAjustements->sum('quantite'),
                'mouvements_jour' => $queryMouvementsJour->count(),
                'derniers_mouvements' => $queryDerniers->limit(10)->get()->map(function($m) {
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
     * Enregistrer une entrée de stock (CORRIGÉ)
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
            
            // 🔥 Utiliser Stock du magasin au lieu de Article global
            $stock = Stock::where('article_id', $request->article_id)
                ->where('magasin_id', $request->magasin_id)
                ->first();
            
            if (!$stock) {
                $stock = Stock::create([
                    'article_id' => $request->article_id,
                    'magasin_id' => $request->magasin_id,
                    'quantite_disponible' => 0,
                    'quantite_reservee' => 0
                ]);
            }
            
            $quantiteAvant = $stock->quantite_disponible;
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
            
            // Mettre à jour le stock du magasin
            $stock->quantite_disponible = $quantiteApres;
            $stock->save();
            
            // 🔥 Mettre à jour le stock global de l'article (optionnel)
            $article = Article::find($request->article_id);
            $totalStock = Stock::where('article_id', $request->article_id)->sum('quantite_disponible');
            $article->quantite_stock = $totalStock;
            $article->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Entrée enregistrée avec succès',
                'data' => $mouvement->load(['article', 'user', 'magasin'])
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Enregistrer une sortie de stock (CORRIGÉ)
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
            
            // 🔥 Utiliser Stock du magasin
            $stock = Stock::where('article_id', $request->article_id)
                ->where('magasin_id', $request->magasin_id)
                ->first();
            
            if (!$stock) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet article n\'existe pas dans ce magasin'
                ], 422);
            }
            
            // Vérifier le stock du magasin
            if ($stock->quantite_disponible < $request->quantite) {
                return response()->json([
                    'success' => false,
                    'message' => "Stock insuffisant dans ce magasin. Stock actuel: {$stock->quantite_disponible}"
                ], 422);
            }
            
            $quantiteAvant = $stock->quantite_disponible;
            $quantiteApres = $quantiteAvant - $request->quantite;
            
            // Créer le mouvement
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
            
            // Mettre à jour le stock du magasin
            $stock->quantite_disponible = $quantiteApres;
            $stock->save();
            
            // 🔥 Mettre à jour le stock global
            $article = Article::find($request->article_id);
            $totalStock = Stock::where('article_id', $request->article_id)->sum('quantite_disponible');
            $article->quantite_stock = $totalStock;
            $article->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Sortie enregistrée avec succès',
                'data' => $mouvement->load(['article', 'user', 'magasin'])
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Ajustement manuel du stock (CORRIGÉ)
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
            
            // 🔥 Utiliser Stock du magasin
            $stock = Stock::where('article_id', $request->article_id)
                ->where('magasin_id', $request->magasin_id)
                ->first();
            
            if (!$stock) {
                $stock = Stock::create([
                    'article_id' => $request->article_id,
                    'magasin_id' => $request->magasin_id,
                    'quantite_disponible' => 0,
                    'quantite_reservee' => 0
                ]);
            }
            
            $quantiteAvant = $stock->quantite_disponible;
            $quantiteApres = $request->nouvelle_quantite;
            $difference = abs($quantiteApres - $quantiteAvant);
            
            // Créer le mouvement
            $mouvement = Mouvement::create([
                'article_id' => $request->article_id,
                'magasin_id' => $request->magasin_id,
                'type' => 'ajustement',
                'quantite' => $difference,
                'quantite_avant' => $quantiteAvant,
                'quantite_apres' => $quantiteApres,
                'motif' => $request->motif,
                'reference_type' => 'ajustement',
                'user_id' => Auth::id()
            ]);
            
            // Mettre à jour le stock du magasin
            $stock->quantite_disponible = $quantiteApres;
            $stock->save();
            
            // 🔥 Mettre à jour le stock global
            $article = Article::find($request->article_id);
            $totalStock = Stock::where('article_id', $request->article_id)->sum('quantite_disponible');
            $article->quantite_stock = $totalStock;
            $article->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Ajustement effectué avec succès',
                'data' => $mouvement->load(['article', 'user', 'magasin'])
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