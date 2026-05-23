<?php
// app/Http/Controllers/Admin/ExportController.php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Article;
use App\Models\Admin\Stock;
use App\Models\Admin\Mouvement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use App\Models\Admin\CommandeFournisseur;

class ExportController extends Controller
{
    // 📤 Export articles vers CSV
    public function exportArticles()
    {
        try {
            $articles = Article::with(['categorie.famille'])->get();
            
            $filename = 'articles_' . date('Y-m-d') . '.csv';
            $handle = fopen('php://temp', 'w+');
            
            // En-têtes CSV
            fputcsv($handle, [
                'ID', 
                'Code Barre', 
                'Désignation', 
                'Description', 
                'Catégorie', 
                'Famille', 
                'Unité', 
                'Stock', 
                'Seuil Alerte', 
                'Statut',
                'Date création'
            ]);
            
            foreach ($articles as $article) {
                fputcsv($handle, [
                    $article->id,
                    $article->code_barre,
                    $article->designation,
                    $article->description ?? '',
                    $article->categorie->nom_categorie ?? '',
                    $article->categorie->famille->nom_famille ?? '',
                    $article->unite_mesure,
                    $article->quantite_stock ?? 0,
                    $article->seuil_alerte,
                    $article->statut,
                    $article->created_at->format('d/m/Y')
                ]);
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            return Response::make($csvContent, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // 📤 Export stocks vers CSV
    public function exportStocksCsv()
    {
        try {
            $stocks = Stock::with(['article', 'magasin'])->get();
            
            $filename = 'stocks_' . date('Y-m-d') . '.csv';
            $handle = fopen('php://temp', 'w+');
            
            // En-têtes CSV
            fputcsv($handle, [
                'Article ID',
                'Code Barre',
                'Désignation',
                'Magasin',
                'Quantité Disponible',
                'Quantité Réservée',
                'Emplacement',
                'Dernière mise à jour'
            ]);
            
            foreach ($stocks as $stock) {
                fputcsv($handle, [
                    $stock->article_id,
                    $stock->article->code_barre ?? '',
                    $stock->article->designation ?? '',
                    $stock->magasin->nom_magasin ?? '',
                    $stock->quantite_disponible,
                    $stock->quantite_reservee ?? 0,
                    $stock->emplacement_code ?? '',
                    $stock->updated_at->format('d/m/Y H:i')
                ]);
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            return Response::make($csvContent, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // 📤 Export mouvements vers Excel (CSV)
    public function exportMouvements(Request $request)
    {
        try {
            $query = Mouvement::with(['article', 'user', 'magasin']);
            
            if ($request->date_debut) {
                $query->whereDate('created_at', '>=', $request->date_debut);
            }
            if ($request->date_fin) {
                $query->whereDate('created_at', '<=', $request->date_fin);
            }
            
            $mouvements = $query->orderBy('created_at', 'desc')->limit(5000)->get();
            
            $filename = 'mouvements_' . date('Y-m-d') . '.csv';
            $handle = fopen('php://temp', 'w+');
            
            fputcsv($handle, [
                'ID', 'Type', 'Article', 'Quantité', 'Magasin', 
                'Stock Avant', 'Stock Après', 'Motif', 'Utilisateur', 'Date'
            ]);
            
            foreach ($mouvements as $m) {
                fputcsv($handle, [
                    $m->id,
                    $m->type == 'entree' ? 'ENTRÉE' : ($m->type == 'sortie' ? 'SORTIE' : 'AJUSTEMENT'),
                    $m->article->designation ?? '',
                    $m->quantite,
                    $m->magasin->nom_magasin ?? '',
                    $m->quantite_avant,
                    $m->quantite_apres,
                    $m->motif ?? '',
                    $m->user->name ?? '',
                    $m->created_at->format('d/m/Y H:i')
                ]);
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            return Response::make($csvContent, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // 📤 Export commandes fournisseurs
    public function exportCommandes(Request $request)
    {
        try {
            $commandes = CommandeFournisseur::with(['lignes.article'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            $filename = 'commandes_' . date('Y-m-d') . '.csv';
            $handle = fopen('php://temp', 'w+');
            
            fputcsv($handle, [
                'N° Commande', 'Fournisseur', 'Date', 'Statut', 
                'Total Articles', 'Date création'
            ]);
            
            foreach ($commandes as $c) {
                fputcsv($handle, [
                    $c->numero_commande,
                    $c->fournisseur,
                    $c->date_commande,
                    $c->statut,
                    $c->lignes->sum('quantite_commandee'),
                    $c->created_at->format('d/m/Y')
                ]);
            }
            
            rewind($handle);
            $csvContent = stream_get_contents($handle);
            fclose($handle);
            
            return Response::make($csvContent, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur: ' . $e->getMessage()
            ], 500);
        }
    }
}