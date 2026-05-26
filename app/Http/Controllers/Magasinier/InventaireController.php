<?php
// app/Http/Controllers/Magasinier/InventaireController.php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Inventaire;
use App\Models\Admin\InventaireLigne;
use App\Models\Admin\Stock;
use App\Models\Admin\Mouvement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventaireController extends Controller
{
    /**
     * Récupérer l'inventaire actuel (en cours) pour le magasinier
     */
    public function actuel()
    {
        try {
            $query = Inventaire::with(['magasin', 'lignes.article'])
                ->where('statut', 'en_cours');
            
            if (auth()->user()->magasin_id) {
                $query->where('magasin_id', auth()->user()->magasin_id);
            }
            
            $inventaire = $query->first();
            
            // 🔥 AJOUTE CE LOG POUR DEBUG
            \Log::info('Inventaire actuel:', ['inventaire' => $inventaire]);
            
            if (!$inventaire) {
                return response()->json(null, 200);
            }
            
            return response()->json($inventaire);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Sauvegarder les quantités saisies par le magasinier
     */
    public function save(Request $request, $id)
    {
        try {
            $request->validate([
                'lignes' => 'required|array',
                'lignes.*.article_id' => 'required|exists:articles,id',
                'lignes.*.quantite_reelle' => 'required|integer|min:0'
            ]);
            
            $inventaire = Inventaire::findOrFail($id);
            
            // Vérifier que l'inventaire est en cours
            if ($inventaire->statut !== 'en_cours') {
                return response()->json([
                    'message' => 'Cet inventaire n\'est pas en cours'
                ], 422);
            }
            
            // Vérifier que le magasinier a accès à ce magasin
            if (auth()->user()->magasin_id && $inventaire->magasin_id != auth()->user()->magasin_id) {
                return response()->json([
                    'message' => 'Vous n\'avez pas accès à cet inventaire'
                ], 403);
            }
            
            foreach ($request->lignes as $ligneData) {
                $ligne = InventaireLigne::where('inventaire_id', $id)
                    ->where('article_id', $ligneData['article_id'])
                    ->first();
                
                if ($ligne) {
                    $ecart = $ligneData['quantite_reelle'] - $ligne->quantite_theorique;
                    $ligne->update([
                        'quantite_reelle' => $ligneData['quantite_reelle'],
                        'ecart' => $ecart
                    ]);
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Inventaire sauvegardé'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Finaliser l'inventaire et appliquer les corrections
     */
    public function finaliser($id)
    {
        try {
            DB::beginTransaction();
            
            $inventaire = Inventaire::with(['lignes.article'])->findOrFail($id);
            
            // Vérifier que l'inventaire est en cours
            if ($inventaire->statut !== 'en_cours') {
                return response()->json([
                    'message' => 'Cet inventaire n\'est pas en cours'
                ], 422);
            }
            
            // Vérifier que le magasinier a accès à ce magasin
            if (auth()->user()->magasin_id && $inventaire->magasin_id != auth()->user()->magasin_id) {
                return response()->json([
                    'message' => 'Vous n\'avez pas accès à cet inventaire'
                ], 403);
            }
            
            // Appliquer les corrections de stock
            foreach ($inventaire->lignes as $ligne) {
                if ($ligne->ecart != 0 && !$ligne->est_corrige) {
                    // Mettre à jour le stock
                    $stock = Stock::where('article_id', $ligne->article_id)
                        ->where('magasin_id', $inventaire->magasin_id)
                        ->first();
                    
                    if ($stock) {
                        $ancienneQuantite = $stock->quantite_disponible;
                        $stock->update(['quantite_disponible' => $ligne->quantite_reelle]);
                        
                        // Enregistrer le mouvement
                        Mouvement::create([
                            'article_id' => $ligne->article_id,
                            'magasin_id' => $inventaire->magasin_id,
                            'type' => 'ajustement',
                            'quantite' => abs($ligne->ecart),
                            'quantite_avant' => $ancienneQuantite,
                            'quantite_apres' => $ligne->quantite_reelle,
                            'motif' => 'Correction inventaire N°' . $inventaire->numero_inventaire,
                            'reference_type' => 'inventaire',
                            'user_id' => Auth::id()
                        ]);
                        
                        $ligne->update(['est_corrige' => true]);
                    }
                }
            }
            
            $inventaire->update([
                'statut' => 'finalise',
                'date_fin' => now()
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Inventaire finalisé avec succès'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
}