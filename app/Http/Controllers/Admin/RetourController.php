<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\RetourMagasin;
use App\Models\Admin\Demande;
use App\Models\Admin\Stock;
use App\Models\Admin\Mouvement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RetourController extends Controller
{
    // 📋 Liste des retours
    public function index()
    {
        $retours = RetourMagasin::with(['demande', 'article', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($retours);
    }
    
    // 🔄 Enregistrer un retour
    public function store(Request $request)
    {
        $request->validate([
            'demande_id' => 'required|exists:demandes,id',
            'article_id' => 'required|exists:articles,id',
            'quantite' => 'required|integer|min:1',
            'motif' => 'required|string|max:500'
        ]);
        
        $demande = Demande::findOrFail($request->demande_id);
        
        // Vérifier que la demande est livrée
        if ($demande->statut !== 'livree') {
            return response()->json(['message' => 'Seules les demandes livrées peuvent être retournées'], 422);
        }
        
        // Créer le retour
        $retour = RetourMagasin::create([
            'demande_id' => $request->demande_id,
            'article_id' => $request->article_id,
            'quantite' => $request->quantite,
            'motif' => $request->motif,
            'statut' => 'en_attente',
            'user_id' => Auth::id()
        ]);
        
        return response()->json($retour, 201);
    }
    
    // ✅ Approuver un retour et remettre en stock
    public function approuver($id)
    {
        $retour = RetourMagasin::findOrFail($id);
        
        if ($retour->statut !== 'en_attente') {
            return response()->json(['message' => 'Retour déjà traité'], 422);
        }
        
        // Récupérer le stock
        $demande = Demande::findOrFail($retour->demande_id);
        
        $stock = Stock::firstOrCreate(
            [
                'article_id' => $retour->article_id,
                'magasin_id' => 1 // Magasin principal
            ],
            ['quantite_disponible' => 0, 'quantite_reservee' => 0]
        );
        
        $ancienneQuantite = $stock->quantite_disponible;
        $stock->increment('quantite_disponible', $retour->quantite);
        $demande->increment('quantite_retournee', $retour->quantite);
        
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
        
        $retour->update([
            'statut' => 'approuve',
            'date_traitement' => now()
        ]);
        
        return response()->json(['message' => 'Retour approuvé et stock mis à jour']);
    }
    
    // ❌ Refuser un retour
    public function refuser($id, Request $request)
    {
        $request->validate([
            'motif_refus' => 'required|string|max:500'
        ]);
        
        $retour = RetourMagasin::findOrFail($id);
        
        $retour->update([
            'statut' => 'refuse',
            'motif_refus' => $request->motif_refus,
            'date_traitement' => now()
        ]);
        
        return response()->json(['message' => 'Retour refusé']);
    }
}