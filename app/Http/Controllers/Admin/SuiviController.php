<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Stock;
use App\Models\Admin\Magasins;
use Illuminate\Http\Request;

class SuiviController extends Controller
{
    public function getSuiviData()
    {
        try {
            // 🔥 VERSION SIMPLE QUI FONCTIONNE À COUP SÛR
            $tousLesStocks = Stock::with(['article', 'magasin'])->get();
            
            // Filtrer les alertes
            $alertes = [];
            foreach ($tousLesStocks as $stock) {
                if ($stock->article && $stock->quantite_disponible <= $stock->article->seuil_alerte) {
                    $alertes[] = $stock;
                }
            }
            
            $magasins = Magasins::all();

            return response()->json([
                'alertes' => $alertes,
                'magasins' => $magasins
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur: ' . $e->getMessage(),
                'alertes' => [],
                'magasins' => []
            ]);
        }
    }
}