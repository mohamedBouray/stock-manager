<?php
// app/Http/Controllers/Magasinier/BonReceptionController.php

namespace App\Http\Controllers\Magasinier;

use App\Http\Controllers\Controller;
use App\Models\Admin\BonReception;
use App\Models\Admin\LigneBonReception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class BonReceptionController extends Controller
{

    /**
     * Liste des bons de réception pour le magasinier
     */
    public function index(Request $request)
    {
        try {
            // 🔥 CHARGER LES RELATIONS correctement
            $bons = BonReception::with([
                'commandeFournisseur',  // ← Relation avec commande
                'lignes.article'        // ← Relation avec lignes
            ])->get();
            
            // 🔥 Log pour debug
            \Log::info('Bons réception:', [
                'count' => $bons->count(),
                'first_bon' => $bons->first() ? [
                    'id' => $bons->first()->id,
                    'numero_bon' => $bons->first()->numero_bon,
                    'commande_id' => $bons->first()->commande_id,
                    'commande' => $bons->first()->commandeFournisseur
                ] : null
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $bons
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Erreur bons réception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'data' => [],
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Voir un bon de réception spécifique
     */
    public function show($id)
    {
        try {
            $bon = BonReception::with([
                'commandeFournisseur',
                'lignes.article'
            ])->findOrFail($id);
            
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


    
    /**
     * 🔥 EXPORT PDF du bon de réception
     */
    public function exportPDF($id)
    {
        try {
            $bon = BonReception::with(['commandeFournisseur', 'lignes.article'])
                ->findOrFail($id);
            
            $data = [
                'bon' => $bon,
                'date' => now(),
                'magasinier' => auth()->user()->name
            ];
            
            $pdf = Pdf::loadView('pdf.bon_reception', $data);
            return $pdf->download("bon_reception_{$bon->numero_bon}.pdf");
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * 🔥 STATISTIQUES des bons de réception
     */
    public function stats()
    {
        try {
            $query = BonReception::with('lignes');
            
            if (auth()->user()->magasin_id) {
                $query->whereHas('commandeFournisseur', function($q) {
                    $q->where('magasin_id', auth()->user()->magasin_id);
                });
            }
            
            $totalBons = $query->count();
            $totalArticles = $query->get()->sum(function($bon) {
                return $bon->lignes->sum('quantite_recue');
            });
            
            // Bons par mois
            $bonsParMois = BonReception::selectRaw('DATE_FORMAT(date_reception, "%Y-%m") as mois, COUNT(*) as total')
                ->groupBy('mois')
                ->orderBy('mois', 'desc')
                ->limit(6)
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_bons' => $totalBons,
                    'total_articles' => $totalArticles,
                    'bons_par_mois' => $bonsParMois
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }
}