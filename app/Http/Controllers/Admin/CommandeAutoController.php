<?php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Stock;
use App\Models\Admin\Article;
use App\Models\Admin\CommandeFournisseur;
use App\Models\Admin\LigneCommande;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommandeAutoController extends Controller
{
    // 🔄 Générer commandes automatiquement basées sur seuils
    public function generer()
    {
        $articlesEnAlerte = Stock::with(['article'])
            ->join('articles', 'stocks.article_id', '=', 'articles.id')
            ->whereColumn('stocks.quantite_disponible', '<=', 'articles.seuil_alerte')
            ->select('stocks.*')
            ->get();
            
        if ($articlesEnAlerte->isEmpty()) {
            return response()->json(['message' => 'Aucun article sous seuil']);
        }
        
        // Grouper par fournisseur (ici Ministère du Tourisme)
        $commandesParFournisseur = [];
        
        foreach ($articlesEnAlerte as $stock) {
            $fournisseur = 'Ministère du Tourisme';
            $quantiteACommander = $stock->article->seuil_alerte * 2;
            
            if (!isset($commandesParFournisseur[$fournisseur])) {
                $commandesParFournisseur[$fournisseur] = [];
            }
            
            $commandesParFournisseur[$fournisseur][] = [
                'article_id' => $stock->article_id,
                'quantite' => $quantiteACommander,
                'stock_actuel' => $stock->quantite_disponible
            ];
        }
        
        $commandesCrees = [];
        
        foreach ($commandesParFournisseur as $fournisseur => $lignes) {
            $commande = CommandeFournisseur::create([
                'numero_commande' => 'AUTO-' . date('Ymd') . '-' . rand(100, 999),
                'fournisseur' => $fournisseur,
                'date_commande' => now(),
                'statut' => 'envoyee'
            ]);
            
            foreach ($lignes as $ligne) {
                LigneCommande::create([
                    'commande_id' => $commande->id,
                    'article_id' => $ligne['article_id'],
                    'quantite_commandee' => $ligne['quantite'],
                    'quantite_livree' => 0
                ]);
            }
            
            $commandesCrees[] = $commande;
        }
        
        return response()->json([
            'message' => count($commandesCrees) . ' commande(s) générée(s)',
            'commandes' => $commandesCrees
        ]);
    }
    
    // ⚙️ Configurer les paramètres auto-commande
    public function configurer(Request $request)
    {
        $request->validate([
            'actif' => 'boolean',
            'seuil_multiplier' => 'integer|min:1|max:5',
            'frequence' => 'in:quotidien,hebdomadaire, mensuel'
        ]);
        
        foreach ($request->all() as $key => $value) {
            \App\Models\Admin\Setting::set('auto_commande_' . $key, $value, 'stock');
        }
        
        return response()->json(['message' => 'Configuration sauvegardée']);
    }
}