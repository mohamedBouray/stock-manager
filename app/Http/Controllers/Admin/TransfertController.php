<?php
// app/Http/Controllers/Admin/TransfertController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\TransfertArticle;
use App\Models\Admin\Article;
use App\Models\Admin\Magasins;
use App\Models\Admin\Stock;
use App\Models\Admin\Mouvement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TransfertController extends Controller
{
    // 📋 Liste des transferts
    public function index()
    {
        try {
            $transferts = TransfertArticle::with(['articleSource', 'articleDest', 'user'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json($transferts);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    // 📝 Créer un transfert
    public function store(Request $request)
    {
        $request->validate([
            'article_id' => 'required|exists:articles,id',
            'magasin_source_id' => 'required|exists:magasins,id',
            'magasin_dest_id' => 'required|exists:magasins,id|different:magasin_source_id',
            'quantite' => 'required|integer|min:1',
            'motif' => 'nullable|string'
        ]);
        
        try {
            DB::beginTransaction();
            
            // Récupérer l'article
            $article = Article::findOrFail($request->article_id);
            
            // Vérifier le stock source
            $stockSource = Stock::where('article_id', $request->article_id)
                ->where('magasin_id', $request->magasin_source_id)
                ->first();
            
            if (!$stockSource || $stockSource->quantite_disponible < $request->quantite) {
                return response()->json(['message' => 'Stock source insuffisant'], 422);
            }
            
            // Retirer du stock source
            $ancienneQuantiteSource = $stockSource->quantite_disponible;
            $stockSource->decrement('quantite_disponible', $request->quantite);
            
            // Ajouter au stock destination
            $stockDest = Stock::firstOrCreate(
                [
                    'article_id' => $request->article_id,
                    'magasin_id' => $request->magasin_dest_id
                ],
                ['quantite_disponible' => 0, 'quantite_reservee' => 0]
            );
            $ancienneQuantiteDest = $stockDest->quantite_disponible;
            $stockDest->increment('quantite_disponible', $request->quantite);
            
            // Enregistrer le transfert
            $transfert = TransfertArticle::create([
                'article_source_id' => $request->article_id,
                'article_dest_id' => $request->article_id,
                'magasin_id' => $request->magasin_source_id,
                'quantite' => $request->quantite,
                'motif' => $request->motif,
                'user_id' => Auth::id()
            ]);
            
            // Enregistrer le mouvement (sortie du source)
            Mouvement::create([
                'article_id' => $request->article_id,
                'magasin_id' => $request->magasin_source_id,
                'type' => 'sortie',
                'quantite' => $request->quantite,
                'quantite_avant' => $ancienneQuantiteSource,
                'quantite_apres' => $stockSource->quantite_disponible,
                'motif' => 'Transfert vers magasin ' . $request->magasin_dest_id . ' - ' . ($request->motif ?? ''),
                'reference_type' => 'transfert',
                'user_id' => Auth::id()
            ]);
            
            // Enregistrer le mouvement (entrée dans destination)
            Mouvement::create([
                'article_id' => $request->article_id,
                'magasin_id' => $request->magasin_dest_id,
                'type' => 'entree',
                'quantite' => $request->quantite,
                'quantite_avant' => $ancienneQuantiteDest,
                'quantite_apres' => $stockDest->quantite_disponible,
                'motif' => 'Transfert depuis magasin ' . $request->magasin_source_id . ' - ' . ($request->motif ?? ''),
                'reference_type' => 'transfert',
                'user_id' => Auth::id()
            ]);
            
            DB::commit();
            
            return response()->json([
                'message' => 'Transfert effectué avec succès',
                'transfert' => $transfert
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    // 🔍 Voir un transfert spécifique
    public function show($id)
    {
        try {
            $transfert = TransfertArticle::with(['articleSource', 'articleDest', 'user'])
                ->findOrFail($id);
            
            return response()->json($transfert);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Transfert non trouvé'], 404);
        }
    }
}