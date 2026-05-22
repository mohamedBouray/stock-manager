<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin\Mouvement;
use App\Models\Admin\Article;
use App\Models\Admin\Magasins;
use App\Models\User;

class MouvementSeeder extends Seeder
{
    public function run()
    {
        // Récupérer des IDs existants
        $article = Article::first();
        $magasin = Magasins::first();
        $user = User::first(); // Prendre n'importe quel utilisateur
        
        if (!$article) {
            $this->command->error('❌ Aucun article trouvé. Exécute d\'abord ArticleSeeder');
            return;
        }
        
        if (!$magasin) {
            $this->command->error('❌ Aucun magasin trouvé. Crée d\'abord un magasin');
            // Créer un magasin par défaut
            $magasin = Magasins::create([
                'nom_magasin' => 'Magasin Principal',
                'localisation' => 'ISTAHT Tanger'
            ]);
            $this->command->info('✅ Magasin Principal créé avec ID: ' . $magasin->id);
        }
        
        if (!$user) {
            $this->command->error('❌ Aucun utilisateur trouvé');
            return;
        }
        
        $this->command->info('📦 Article ID: ' . $article->id);
        $this->command->info('🏪 Magasin ID: ' . $magasin->id);
        $this->command->info('👤 User ID: ' . $user->id);
        
        // Récupérer le stock actuel de l'article
        $stockActuel = $article->quantite_stock ?? 100;
        
        $mouvements = [
            [
                'article_id' => $article->id,
                'magasin_id' => $magasin->id,
                'type' => 'entree',
                'quantite' => 50,
                'quantite_avant' => $stockActuel,
                'quantite_apres' => $stockActuel + 50,
                'motif' => 'Réception commande fournisseur',
                'reference' => 'CMD-001',
                'reference_type' => 'commande',
                'user_id' => $user->id,
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5),
            ],
            [
                'article_id' => $article->id,
                'magasin_id' => $magasin->id,
                'type' => 'sortie',
                'quantite' => 10,
                'quantite_avant' => $stockActuel + 50,
                'quantite_apres' => $stockActuel + 40,
                'motif' => 'Demande interne approuvée',
                'reference' => 'DEM-001',
                'reference_type' => 'demande',
                'user_id' => $user->id,
                'created_at' => now()->subDays(3),
                'updated_at' => now()->subDays(3),
            ],
            [
                'article_id' => $article->id,
                'magasin_id' => $magasin->id,
                'type' => 'entree',
                'quantite' => 20,
                'quantite_avant' => $stockActuel + 40,
                'quantite_apres' => $stockActuel + 60,
                'motif' => 'Retour de prêt',
                'reference' => 'RET-001',
                'reference_type' => 'retour',
                'user_id' => $user->id,
                'created_at' => now()->subDays(2),
                'updated_at' => now()->subDays(2),
            ],
            [
                'article_id' => $article->id,
                'magasin_id' => $magasin->id,
                'type' => 'ajustement',
                'quantite' => 5,
                'quantite_avant' => $stockActuel + 60,
                'quantite_apres' => $stockActuel + 55,
                'motif' => 'Correction après inventaire',
                'reference_type' => 'inventaire',
                'user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];
        
        foreach ($mouvements as $mouvement) {
            try {
                Mouvement::create($mouvement);
                $this->command->info('✅ Mouvement ajouté: ' . $mouvement['type'] . ' - ' . $mouvement['quantite']);
            } catch (\Exception $e) {
                $this->command->error('❌ Erreur: ' . $e->getMessage());
            }
        }
        
        $this->command->info('✅ ' . count($mouvements) . ' mouvements de stock ajoutés !');
        
        // Mettre à jour le stock final de l'article
        $article->quantite_stock = $stockActuel + 55;
        $article->save();
        $this->command->info('📦 Stock final de l\'article: ' . $article->quantite_stock);
    }
}