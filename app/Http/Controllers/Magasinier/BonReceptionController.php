<?php
// app/Http/Controllers/Magasinier/BonReceptionController.php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\BonReception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BonReceptionController extends Controller
{
    /**
     * Liste des bons de réception pour le magasinier
     */
    public function index(Request $request)
    {
        try {
            // Version encore plus simple pour debug
            $bons = BonReception::all();
            
            return response()->json([
                'success' => true,
                'data' => $bons,
                'count' => $bons->count()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    /**
     * Voir un bon de réception spécifique
     */
    public function show($id)
    {
        try {
            $bon = BonReception::with(['commandeFournisseur', 'lignes.article'])
                ->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $bon
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bon de réception non trouvé'
            ], 404);
        }
    }
}