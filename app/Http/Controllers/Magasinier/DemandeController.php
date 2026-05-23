<?php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Demande;
use App\Models\Admin\Article;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DemandeController extends Controller
{
    // Liste des demandes (toutes)
    public function index(Request $request)
{
    try {
        $query = Demande::with(['user', 'article']);
        
        // 🔥 SI LE MAGASINIER EST ASSIGNÉ À UN MAGASIN
        if (auth()->user()->magasin_id) {
            $query->whereHas('article', function($q) {
                $q->whereHas('stocks', function($sq) {
                    $sq->where('magasin_id', auth()->user()->magasin_id);
                });
            });
        }
        
        if ($request->statut && in_array($request->statut, ['en_attente', 'approuvee', 'refusee', 'livree'])) {
            $query->where('statut', $request->statut);
        }
        
        $demandes = $query->orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $demandes
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}
    
    // Approuver une demande
    public function approuver(Request $request, $id)
    {
        try {
            $request->validate([
                'quantite_accorde' => 'required|integer|min:1'
            ]);
            
            $demande = Demande::findOrFail($id);
            
            if ($demande->statut !== 'en_attente') {
                return response()->json([
                    'message' => 'Cette demande ne peut plus être modifiée'
                ], 422);
            }
            
            $demande->update([
                'quantite_accorde' => $request->quantite_accorde,
                'statut' => 'approuvee',
                'date_traitement' => now(),
                'traite_par' => Auth::id()
            ]);
            
            Notification::create([
                'user_id' => $demande->user_id,
                'type' => 'demande_approuvee',
                'title' => 'Demande approuvée',
                'message' => 'Votre demande pour ' . $demande->article->designation . ' a été approuvée. Quantité accordée: ' . $request->quantite_accorde,
                'data' => ['demande_id' => $demande->id, 'statut' => 'approuvee']
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Demande approuvée avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    // Refuser une demande
    public function refuser(Request $request, $id)
    {
        try {
            $request->validate([
                'commentaire' => 'required|string|max:500'
            ]);
            
            $demande = Demande::findOrFail($id);
            
            if ($demande->statut !== 'en_attente') {
                return response()->json([
                    'message' => 'Cette demande ne peut plus être modifiée'
                ], 422);
            }
            
            $demande->update([
                'statut' => 'refusee',
                'commentaire_refus' => $request->commentaire,
                'date_traitement' => now(),
                'traite_par' => Auth::id()
            ]);
            

            Notification::create([
                'user_id' => $demande->user_id,
                'type' => 'demande_refusee',
                'title' => 'Demande refusée',
                'message' => 'Votre demande pour ' . $demande->article->designation . ' a été refusée. Motif: ' . $request->commentaire,
                'data' => ['demande_id' => $demande->id, 'statut' => 'refusee']
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Demande refusée'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    // Marquer comme livrée
    public function livrer($id)
    {
        try {
            $demande = Demande::findOrFail($id);
            
            if ($demande->statut !== 'approuvee') {
                return response()->json([
                    'message' => 'Seules les demandes approuvées peuvent être livrées'
                ], 422);
            }
            
            // Diminuer le stock
            $article = Article::find($demande->article_id);
            $article->decrement('quantite_stock', $demande->quantite_accorde);
            
            $demande->update([
                'statut' => 'livree',
                'date_traitement' => now(),
                'traite_par' => Auth::id()
            ]);
            
            Notification::create([
                'user_id' => $demande->user_id,
                'type' => 'demande_livree',
                'title' => 'Demande livrée',
                'message' => 'Votre demande pour ' . $demande->article->designation . ' a été livrée. Vous pouvez télécharger le bon de livraison.',
                'data' => ['demande_id' => $demande->id, 'statut' => 'livree']
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Demande marquée comme livrée'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}