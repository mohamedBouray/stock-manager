<?php
// app/Http/Controllers/Admin/InventaireController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Inventaire;
use App\Models\Admin\Magasins;
use App\Models\Admin\InventaireLigne;
use App\Models\Admin\Stock;
use App\Models\Admin\Mouvement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Helpers\NotificationHelper;
class InventaireController extends Controller
{
    // 📋 Liste des inventaires
    public function index()
    {
        try {
            $inventaires = Inventaire::with(['magasin', 'responsable'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json($inventaires);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    // 📝 Créer un inventaire
    public function store(Request $request)
    {
        $request->validate([
            'magasin_id' => 'required|exists:magasins,id',
            'date_debut' => 'required|date',
            'commentaire' => 'nullable|string'
        ]);
        
        try {
            $numero = 'INV-' . date('Ymd') . '-' . rand(1000, 9999);
            
            $inventaire = Inventaire::create([
                'numero_inventaire' => $numero,
                'magasin_id' => $request->magasin_id,
                'date_debut' => $request->date_debut,
                'statut' => 'planifie',
                'responsable_id' => Auth::id(),
                'commentaire' => $request->commentaire
            ]);
            
            // 🔥 CORRECTION: Prendre le stock réel du magasin
            $stocks = Stock::with('article')
                ->where('magasin_id', $request->magasin_id)
                ->get();
            
            foreach ($stocks as $stock) {
                // 🔥 Utiliser quantite_disponible actuelle comme stock théorique
                $quantiteTheorique = $stock->quantite_disponible;
                
                InventaireLigne::create([
                    'inventaire_id' => $inventaire->id,
                    'article_id' => $stock->article_id,
                    'quantite_theorique' => $quantiteTheorique,
                    'quantite_reelle' => $quantiteTheorique, // Au début = stock théorique
                    'ecart' => 0,
                    'est_corrige' => false
                ]);
            }
            
            return response()->json($inventaire->load('magasin'), 201);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    // 🔍 Voir un inventaire
    public function show($id)
    {
        try {
            $inventaire = Inventaire::with(['magasin', 'responsable', 'lignes.article'])
                ->findOrFail($id);
            
            return response()->json($inventaire);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Inventaire non trouvé'], 404);
        }
    }
    
    // 🚀 Démarrer un inventaire
    public function start($id)
    {
        try {
            $inventaire = Inventaire::findOrFail($id);
            
            if ($inventaire->statut !== 'planifie') {
                return response()->json(['message' => 'Cet inventaire ne peut pas être démarré'], 422);
            }
            
            $inventaire->update([
                'statut' => 'en_cours',
                'date_debut' => now()
            ]);
            
            return response()->json(['message' => 'Inventaire démarré', 'inventaire' => $inventaire]);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    //  Finaliser un inventaire
    public function finalize($id)
    {
        try {
            DB::beginTransaction();
            
            $inventaire = Inventaire::with(['lignes.article'])->findOrFail($id);
            
            if ($inventaire->statut !== 'en_cours') {
                return response()->json(['message' => 'Seul un inventaire en cours peut être finalisé'], 422);
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
             NotificationHelper::sendToMagasiniers(
                'inventaire_finalise',
                'Inventaire finalisé',
                "L'inventaire du magasin a été finalisé par " . Auth::user()->name,
                ['inventaire_id' => $inventaire->id]
            );
            return response()->json(['message' => 'Inventaire finalisé avec succès', 'inventaire' => $inventaire]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    
    // ✏️ Sauvegarder une ligne d'inventaire
    public function saveLigne(Request $request, $id)
    {
        $request->validate([
            'lignes' => 'required|array',
            'lignes.*.article_id' => 'required|exists:articles,id',
            'lignes.*.quantite_reelle' => 'required|integer|min:0'
        ]);
        
        try {
            $inventaire = Inventaire::findOrFail($id);
            
            if ($inventaire->statut !== 'en_cours') {
                return response()->json(['message' => 'L\'inventaire doit être en cours'], 422);
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
            
            return response()->json(['message' => 'Lignes sauvegardées']);
            
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
    // app/Http/Controllers/Admin/InventaireController.php


}