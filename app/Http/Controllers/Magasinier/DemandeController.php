<?php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Demande;
use App\Models\Admin\Article;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Helpers\NotificationHelper;
use App\Models\Admin\Mouvement; 

class DemandeController extends Controller
{
    // Liste des demandes (toutes)
   // app/Http/Controllers/Magasinier/DemandeController.php
public function index(Request $request)
{
    try {
        $query = Demande::with(['user', 'article']);
        
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
        
        // 🔥 AJOUT : Pour chaque demande, ajouter le stock disponible dans le magasin du magasinier
        $magasinId = auth()->user()->magasin_id;
        
        if ($magasinId) {
            foreach ($demandes as $demande) {
                $stock = \App\Models\Admin\Stock::where('article_id', $demande->article_id)
                    ->where('magasin_id', $magasinId)
                    ->first();
                
                // 🔥 IMPORTANT: Utiliser stock_magasin_actuel (même nom que l'accesseur)
                $demande->stock_magasin_actuel = $stock ? $stock->quantite_disponible : 0;
            }
        }
        
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
            
            // VÉRIFICATION DU STOCK AVANT APPROBATION
            if (auth()->user()->magasin_id) {
                $stock = \App\Models\Admin\Stock::where('article_id', $demande->article_id)
                    ->where('magasin_id', auth()->user()->magasin_id)
                    ->first();
                
                if (!$stock) {
                    return response()->json([
                        'success' => false,
                        'message' => '❌ Cet article n\'existe pas dans votre magasin.',
                        'stock_disponible' => 0
                    ], 422);
                }
                
                if ($stock->quantite_disponible < $request->quantite_accorde) {
                    return response()->json([
                        'success' => false,
                        'message' => "❌ Stock insuffisant. Disponible: {$stock->quantite_disponible} {$demande->article->unite_mesure}",
                        'stock_disponible' => $stock->quantite_disponible
                    ], 422);
                }
            }
            
            // Mettre à jour la demande
            $demande->update([
                'quantite_accorde' => $request->quantite_accorde,
                'statut' => 'approuvee',
                'date_traitement' => now(),
                'traite_par' => Auth::id()
            ]);
            
            // Notifications
            NotificationHelper::send(
                $demande->user_id,
                'demande_approuvee',
                '✅ Demande approuvée',
                "Votre demande pour {$demande->article->designation} a été approuvée. Quantité: {$request->quantite_accorde}",
                ['demande_id' => $demande->id]
            );
            
            NotificationHelper::sendToAdmins(
                'demande_traitee',
                '📋 Demande traitée',
                "Une demande a été approuvée par " . Auth::user()->name,
                ['demande_id' => $demande->id]
            );
            
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
            

            NotificationHelper::send(
                $demande->user_id,
                'demande_refusee',
                'Demande refusée',
                "Votre demande pour {$demande->article->designation} a été refusée. Motif: {$request->commentaire}",
                ['demande_id' => $demande->id]
            );
            
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
            
            $magasinId = auth()->user()->magasin_id;
            
            if ($magasinId) {
                $stock = \App\Models\Admin\Stock::where('article_id', $demande->article_id)
                    ->where('magasin_id', $magasinId)
                    ->first();
                
                if ($stock) {
                    // 🔥 Récupérer la quantité avant modification
                    $quantiteAvant = $stock->quantite_disponible;
                    $quantiteApres = $quantiteAvant - $demande->quantite_accorde;
                    
                    // 🔥 ENREGISTRER LE MOUVEMENT
                    Mouvement::create([
                        'article_id' => $demande->article_id,
                        'magasin_id' => $magasinId,
                        'type' => 'sortie',
                        'quantite' => $demande->quantite_accorde,
                        'quantite_avant' => $quantiteAvant,
                        'quantite_apres' => $quantiteApres,
                        'motif' => "Demande livrée #{$demande->id} - " . ($demande->motif ?? 'Sans motif'),
                        'reference' => "DEM-{$demande->id}",
                        'reference_type' => 'demande',
                        'user_id' => Auth::id()
                    ]);
                    
                    // DIMINUER LE STOCK DU MAGASIN
                    $stock->decrement('quantite_disponible', $demande->quantite_accorde);
                    
                    //  Mettre à jour le stock global de l'article
                    $article = Article::find($demande->article_id);
                    $totalStock = \App\Models\Admin\Stock::where('article_id', $demande->article_id)->sum('quantite_disponible');
                    $article->quantite_stock = $totalStock;
                    $article->save();
                }
            }
            
            $demande->update([
                'statut' => 'livree',
                'date_traitement' => now(),
                'traite_par' => Auth::id()
            ]);
            
            NotificationHelper::send(
                $demande->user_id,
                'demande_livree',
                ' Demande livrée',
                "Votre demande pour {$demande->article->designation} a été livrée",
                ['demande_id' => $demande->id]
            );
            
            NotificationHelper::sendToAdmins(
                'demande_livree',
                ' Demande livrée',
                "Une demande a été livrée par " . Auth::user()->name,
                ['demande_id' => $demande->id]
            );
            
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