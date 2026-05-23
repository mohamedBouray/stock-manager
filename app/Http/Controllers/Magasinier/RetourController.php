<?php
// app/Http/Controllers/Magasinier/RetourController.php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\RetourMagasin;
use App\Models\Admin\Demande;
use App\Models\Admin\Stock;
use App\Models\Admin\Mouvement;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RetourController extends Controller
{
    // Liste des retours pour le magasinier
    public function index()
    {
        try {
            $retours = RetourMagasin::with(['demande', 'article', 'user'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $retours
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // Approuver un retour et remettre en stock
    public function approuver($id)
    {
        try {
            $retour = RetourMagasin::findOrFail($id);
            
            if ($retour->statut !== 'en_attente') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce retour a déjà été traité'
                ], 422);
            }
            
            $demande = Demande::findOrFail($retour->demande_id);
            
            // Récupérer ou créer le stock
            $stock = Stock::firstOrCreate(
                ['article_id' => $retour->article_id, 'magasin_id' => 1],
                ['quantite_disponible' => 0, 'quantite_reservee' => 0]
            );
            
            $ancienneQuantite = $stock->quantite_disponible;
            $stock->increment('quantite_disponible', $retour->quantite);
            
            // Enregistrer le mouvement
            Mouvement::create([
                'article_id' => $retour->article_id,
                'magasin_id' => 1,
                'type' => 'entree',
                'quantite' => $retour->quantite,
                'quantite_avant' => $ancienneQuantite,
                'quantite_apres' => $stock->quantite_disponible,
                'motif' => 'Retour de stock - Demande N°' . $demande->id,
                'reference_type' => 'retour',
                'user_id' => Auth::id()
            ]);
            
            // Mettre à jour la quantité retournée dans la demande
            $demande->increment('quantite_retournee', $retour->quantite);
            
            $retour->update([
                'statut' => 'approuve',
                'date_traitement' => now()
            ]);
            
            Notification::create([
                'user_id' => $retour->user_id,
                'type' => 'retour_approuve',
                'title' => 'Retour approuvé',
                'message' => 'Votre demande de retour pour ' . $retour->article->designation . ' a été approuvée. ' . $retour->quantite . ' unité(s) ont été créditées.',
                'data' => ['retour_id' => $retour->id, 'statut' => 'approuve']
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Retour approuvé et stock mis à jour'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // ❌ Refuser un retour
    public function refuser($id, Request $request)
    {
        try {
            $request->validate([
                'motif_refus' => 'required|string|max:500'
            ]);
            
            $retour = RetourMagasin::findOrFail($id);
            
            if ($retour->statut !== 'en_attente') {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce retour a déjà été traité'
                ], 422);
            }
            
            $retour->update([
                'statut' => 'refuse',
                'motif_refus' => $request->motif_refus,
                'date_traitement' => now()
            ]);
            

            Notification::create([
                'user_id' => $retour->user_id,
                'type' => 'retour_refuse',
                'title' => 'Retour refusé',
                'message' => 'Votre demande de retour pour ' . $retour->article->designation . ' a été refusée. Motif: ' . $request->motif_refus,
                'data' => ['retour_id' => $retour->id, 'statut' => 'refuse']
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Retour refusé'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // 🔍 Voir un retour spécifique
    public function show($id)
    {
        try {
            $retour = RetourMagasin::with(['demande', 'article', 'user'])
                ->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $retour
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Retour non trouvé'
            ], 404);
        }
    }
}