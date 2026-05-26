<?php
// app/Http/Controllers/User/RetourController.php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Admin\RetourMagasin;
use App\Models\Admin\Demande;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RetourController extends Controller
{
    // 📋 Liste des retours du demandeur
    public function index()
    {
        $retours = RetourMagasin::with(['demande', 'article'])
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $retours
        ]);
    }
    
    // 🔄 Créer une demande de retour
    public function store(Request $request)
    {
        $request->validate([
            'demande_id' => 'required|exists:demandes,id',
            'article_id' => 'required|exists:articles,id',
            'quantite' => 'required|integer|min:1',
            'motif' => 'required|string|max:500'
        ]);
        
        // Vérifier que la demande appartient à l'utilisateur
        $demande = Demande::where('id', $request->demande_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();
        
        // Vérifier que la demande est livrée
        if ($demande->statut !== 'livree') {
            return response()->json([
                'message' => 'Seules les demandes livrées peuvent être retournées'
            ], 422);
        }
        
        // Vérifier que la quantité ne dépasse pas la quantité reçue
        $quantiteRecue = $demande->quantite_accorde ?? $demande->quantite_demandee;
        if ($request->quantite > $quantiteRecue) {
            return response()->json([
                'message' => 'La quantité retournée ne peut pas dépasser la quantité reçue'
            ], 422);
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
        
        return response()->json([
            'success' => true,
            'message' => 'Demande de retour envoyée avec succès',
            'data' => $retour
        ], 201);
    }
    
    // 🔍 Voir un retour spécifique
    public function show($id)
    {
        $retour = RetourMagasin::with(['demande', 'article'])
            ->where('user_id', Auth::id())
            ->where('id', $id)
            ->firstOrFail();
            
        return response()->json([
            'success' => true,
            'data' => $retour
        ]);
    }
}