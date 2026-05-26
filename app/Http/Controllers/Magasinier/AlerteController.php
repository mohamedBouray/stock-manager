<?php
// app/Http/Controllers/Magasinier/AlerteController.php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\Stock;
use App\Models\Admin\Article;
use App\Models\Admin\Magasins;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AlerteController extends Controller
{
    /**
     * Liste des alertes stock pour le magasinier
     */

    public function index()
    {
        try {
            $query = Stock::with(['article', 'magasin'])
                ->whereHas('article', function($q) {
                    $q->whereColumn('stocks.quantite_disponible', '<=', 'articles.seuil_alerte');
                });
            
            if (auth()->user()->magasin_id) {
                $query->where('magasin_id', auth()->user()->magasin_id);
            }
            
            $alertes = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $alertes  // ← Retourner un tableau, pas un objet
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => [],  // ← Retourner un tableau vide en cas d'erreur
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Statistiques des alertes
     */
 public function stats()
    {
        try {
            $query = Stock::with(['article', 'magasin'])
                ->whereHas('article', function($q) {
                    $q->whereColumn('stocks.quantite_disponible', '<=', 'articles.seuil_alerte');
                });
            
            if (auth()->user()->magasin_id) {
                $query->where('magasin_id', auth()->user()->magasin_id);
            }
            
            $alertes = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $alertes->count(),
                    'ruptures' => $alertes->where('quantite_disponible', 0)->count(),
                    'stock_bas' => $alertes->where('quantite_disponible', '>', 0)->count()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage(),
                'data' => [
                    'total' => 0,
                    'ruptures' => 0,
                    'stock_bas' => 0
                ]
            ], 500);
        }
    }
}