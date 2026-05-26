<?php
// app/Http/Controllers/Admin/AlertesController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Stock;
use App\Models\Admin\Magasins;
use Illuminate\Http\Request;

class AlertesController extends Controller
{
    /**
     * Liste des alertes stock pour l'admin (tous magasins)
     */
    public function index(Request $request)
    {
        try {
            $query = Stock::with(['article', 'magasin'])
                ->whereHas('article', function($q) {
                    $q->whereColumn('stocks.quantite_disponible', '<=', 'articles.seuil_alerte');
                });
            
            // Filtrer par magasin
            if ($request->magasin_id) {
                $query->where('magasin_id', $request->magasin_id);
            }
            
            $alertes = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $alertes
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Statistiques des alertes (tous magasins)
     */
    public function stats()
    {
        try {
            $alertes = Stock::with(['article', 'magasin'])
                ->whereHas('article', function($q) {
                    $q->whereColumn('stocks.quantite_disponible', '<=', 'articles.seuil_alerte');
                })
                ->get();
            
            // Statistiques par magasin
            $parMagasin = [];
            foreach ($alertes as $alerte) {
                $magasinId = $alerte->magasin_id;
                $magasinNom = $alerte->magasin->nom_magasin ?? 'Inconnu';
                
                if (!isset($parMagasin[$magasinId])) {
                    $parMagasin[$magasinId] = [
                        'magasin_id' => $magasinId,
                        'magasin_nom' => $magasinNom,
                        'total' => 0,
                        'ruptures' => 0,
                        'stock_bas' => 0
                    ];
                }
                
                $parMagasin[$magasinId]['total']++;
                if ($alerte->quantite_disponible == 0) {
                    $parMagasin[$magasinId]['ruptures']++;
                } else {
                    $parMagasin[$magasinId]['stock_bas']++;
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total' => $alertes->count(),
                    'ruptures' => $alertes->where('quantite_disponible', 0)->count(),
                    'stock_bas' => $alertes->where('quantite_disponible', '>', 0)->count(),
                    'par_magasin' => array_values($parMagasin)
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [
                    'total' => 0,
                    'ruptures' => 0,
                    'stock_bas' => 0,
                    'par_magasin' => []
                ]
            ], 500);
        }
    }
}