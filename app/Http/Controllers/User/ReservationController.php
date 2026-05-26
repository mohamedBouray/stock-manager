<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Admin\Reservation;
use App\Models\Admin\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReservationController extends Controller
{

    
    // Liste des réservations de l'utilisateur
    public function index(Request $request)
    {
        $query = Reservation::with(['article', 'article.categorie'])
            ->where('user_id', Auth::id());
        
        // Filtrer par statut
        if ($request->statut && in_array($request->statut, ['en_attente', 'confirmee', 'annulee', 'expiree'])) {
            $query->where('statut', $request->statut);
        }
        
        $reservations = $query->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json([
            'success' => true,
            'data' => $reservations
        ]);
    }
    
    // Créer une réservation
    public function store(Request $request)
    {
        $request->validate([
            'article_id' => 'required|exists:articles,id',
            'quantite' => 'required|integer|min:1',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'motif' => 'nullable|string|max:500',
        ]);
        
        $article = Article::find($request->article_id);
        
        // 🔥 IMPORTANT: Vérifier le stock TOTAL (tous magasins)
        // L'utilisateur peut prendre de n'importe quel magasin
        $totalStock = \App\Models\Admin\Stock::where('article_id', $request->article_id)->sum('quantite_disponible');
        
        if ($totalStock < $request->quantite) {
            return response()->json([
                'success' => false,
                'message' => "Stock insuffisant. Stock total disponible: {$totalStock} {$article->unite_mesure}"
            ], 422);
        }
        if (auth()->user()->magasin_id) {
                $stockMagasin = \App\Models\Admin\Stock::where('article_id', $request->article_id)
                    ->where('magasin_id', auth()->user()->magasin_id)
                    ->first();
                
                if (!$stockMagasin || $stockMagasin->quantite_disponible < $request->quantite) {
                    $disponible = $stockMagasin ? $stockMagasin->quantite_disponible : 0;
                    return response()->json([
                        'success' => false,
                        'message' => "Stock insuffisant dans votre magasin. Disponible: {$disponible} {$article->unite_mesure}"
                    ], 422);
                }
            }
        
        // Logique de réservation...
        $reservation = Reservation::create([
            'user_id' => Auth::id(),
            'article_id' => $request->article_id,
            'quantite' => $request->quantite,
            'date_debut' => $request->date_debut,
            'date_fin' => $request->date_fin,
            'motif' => $request->motif,
            'statut' => 'en_attente',
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Réservation créée avec succès',
            'data' => $reservation->load('article')
        ], 201);
    }
    
    // Annuler une réservation
    public function destroy($id)
    {
        $reservation = Reservation::where('user_id', Auth::id())
            ->where('id', $id)
            ->whereIn('statut', ['en_attente', 'confirmee'])
            ->firstOrFail();
        
        $reservation->update(['statut' => 'annulee']);
        
        return response()->json([
            'success' => true,
            'message' => 'Réservation annulée avec succès'
        ]);
    }
}