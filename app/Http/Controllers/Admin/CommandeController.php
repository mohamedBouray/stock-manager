<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use App\Models\Admin\CommandeFournisseur;
use App\Models\Admin\Article;
use App\Models\Admin\LigneCommande;
use App\Models\Admin\Stock;
use App\Models\Admin\BonReception;
use App\Models\Admin\LigneBonReception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Exception;

class CommandeController extends Controller
{
    /**
     * إنشاء طلبية جديدة مع معالجة المواد الجديدة والصور
     */
    public function store(Request $request)
    {
        $request->validate([
            'numero_commande' => 'required|string|unique:commandes_fournisseurs,numero_commande',
            'date_commande'   => 'required|date',
            'fournisseur'     => 'required|string',
            'lignes'          => 'required|string', // كتجي عبارة عن JSON String من React
        ]);
        $lignes = json_decode($request->input('lignes'), true);
        if (!is_array($lignes)) {
            return response()->json(['status' => 'error', 'message' => 'Format des lignes invalide.'], 400);
        }
        DB::beginTransaction();
        try {
            $commande = CommandeFournisseur::create([
                'numero_commande' => $request->input('numero_commande'),
                'fournisseur'     => $request->input('fournisseur'),
                'date_commande'   => $request->input('date_commande'),
                'statut'          => 'envoyee',
            ]);
            foreach ($lignes as $index => $ligne) {
                $articleId = $ligne['article_id'];
                if (isset($ligne['is_new_article']) && $ligne['is_new_article'] == true) {
                    $details = $ligne['details_article'];
                    $imageUrl = null;
                    $imageKey = $ligne['image_key'];
                    if ($imageKey && $request->hasFile($imageKey) && $request->file($imageKey)->isValid()) {
                        $file = $request->file($imageKey);
                        $fileName = 'article_' . $details['code_barre'] . '_' . time() . '.' . $file->getClientOriginalExtension();
                        $file->move(public_path('uploads'), $fileName);
                        $imageUrl = 'uploads/' . $fileName;
                    }
                    $newArticle = Article::create([
                        'code_barre'   => $details['code_barre'],
                        'designation'  => $details['designation'],
                        'description'  => $details['description'] ?? null,
                        'unite_mesure' => $details['unite_mesure'] ?? 'Pièce',
                        'image_url'    => $imageUrl,
                        'seuil_alerte' => $details['seuil_alerte'] ?? 5,
                        'statut'       => 'actif',
                    ]);
                    $articleId = $newArticle->id;
                }
                LigneCommande::create([
                    'commande_id'        => $commande->id,
                    'article_id'         => $articleId,
                    'quantite_commandee' => $ligne['quantite'],
                    'quantite_livree'    => 0,
                ]);
            }
            DB::commit();
            return response()->json([
                'status'  => 'success',
                'message' => '🎉 Commande et articles enregistrés avec succès dans Laravel !',
                'data'    => $commande->load('lignes.article')
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Erreur Enregistrement Commande: ' . $e->getMessage());

            return response()->json([
                'status'  => 'error',
                'message' => 'Erreur serveur lors de l\'enregistrement : ' . $e->getMessage()
            ], 500);
        }
    }
public function getCommandesEnAttente()
    {
        try {
            $commandes = CommandeFournisseur::with('lignes.article')
                ->whereIn('statut', ['envoyee', 'partiellement_livree'])
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json($commandes, 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur: ' . $e->getMessage()], 500);
        }
    }
   public function traiterCommande(Request $request, $id)
{
    // 🔥 AJOUTER LA VALIDATION DU MAGASIN
    $request->validate([
        'lignes' => 'required|array',
        'lignes.*.id' => 'required|exists:lignes_commande,id',
        'lignes.*.nouvelle_quantite' => 'required|integer|min:0',
        'magasin_id' => 'required|exists:magasins,id', // ← NOUVEAU
    ]);

    try {
        DB::beginTransaction();

        $commande = CommandeFournisseur::with('lignes')->findOrFail($id);
        $toutesLignesLivrees = true;
        $auMoinsUneReception = false;

        $bonReception = null;
        
        // 🔥 UTILISER LE MAGASIN CHOISI
        $magasinReceptionId = $request->magasin_id;

        foreach ($request->lignes as $ligneData) {
            $ligne = $commande->lignes->find($ligneData['id']);
            $nouvelleQte = $ligneData['nouvelle_quantite'];

            if ($ligne && $nouvelleQte > 0) {
                if (!$bonReception) {
                    $bonReception = BonReception::create([
                        'commande_id' => $commande->id,
                        'numero_bon' => 'BR-' . time() . '-' . rand(1000, 9000),
                        'date_reception' => now()->toDateString(),
                    ]);
                    $auMoinsUneReception = true;
                }

                $ligne->increment('quantite_livree', $nouvelleQte);
                $bonReception->lignes()->create([
                    'article_id' => $ligne->article_id,
                    'quantite_recue' => $nouvelleQte,
                ]);

                // 🔥 STOCK DANS LE MAGASIN CHOISI (plus 1 fixe)
                $stock = Stock::firstOrCreate(
                    ['article_id' => $ligne->article_id, 'magasin_id' => $magasinReceptionId],
                    ['quantite_disponible' => 0, 'quantite_reservee' => 0]
                );
                $stock->increment('quantite_disponible', $nouvelleQte);
            }
        }

        // Vérifier le statut de la commande
        foreach ($commande->lignes as $l) {
            if ($l->quantite_livree < $l->quantite_commandee) {
                $toutesLignesLivrees = false;
            }
        }

        if ($toutesLignesLivrees) {
            $commande->update(['statut' => 'livree_totalement']);
        } elseif ($auMoinsUneReception || $commande->statut === 'partiellement_livree') {
            $commande->update(['statut' => 'partiellement_livree']);
        }

        DB::commit();
        return response()->json([
            'message' => 'Réception enregistrée avec succès !',
            'bon_reception' => $bonReception ? $bonReception->load('lignes.article') : null
        ], 200);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['message' => 'Erreur lors du traitement: ' . $e->getMessage()], 500);
    }
}
    public function index(){
        $commandes = CommandeFournisseur::with([
            'lignes.article', 
            'bonsReceptions.lignes.article'
        ])->orderBy('created_at', 'desc')->get();

        return response()->json($commandes);
    }
}