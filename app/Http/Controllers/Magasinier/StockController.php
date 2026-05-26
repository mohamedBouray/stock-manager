<?php
// app/Http/Controllers/Magasinier/StockController.php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StockController extends Controller
{
    /**
     * Liste des stocks pour le magasinier
     */
    public function index(Request $request)
    {
        try {
            $query = Stock::with(['article', 'magasin']);
            
            // 🔥 SI LE MAGASINIER EST ASSIGNÉ À UN MAGASIN SPÉCIFIQUE
            if (auth()->user()->magasin_id) {
                $query->where('magasin_id', auth()->user()->magasin_id);
            }
            
            // Filtre par recherche
            if ($request->search) {
                $query->whereHas('article', function($q) use ($request) {
                    $q->where('designation', 'like', "%{$request->search}%")
                      ->orWhere('code_barre', 'like', "%{$request->search}%");
                });
            }
            
            $stocks = $query->orderBy('created_at', 'desc')->paginate(50);
            
            return response()->json([
                'success' => true,
                'data' => $stocks
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Voir un stock spécifique
     */
    public function show($id)
    {
        try {
            $stock = Stock::with(['article', 'magasin'])->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $stock
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Stock non trouvé'
            ], 404);
        }
    }
}